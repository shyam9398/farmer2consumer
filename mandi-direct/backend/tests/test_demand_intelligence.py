from datetime import datetime, timedelta, timezone
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.models.enums import (
    ConfidenceLevel,
    DemandLevel,
    DemandTrend,
    OrderStatus,
    ProduceStatus,
    SupplyDemandStatus,
    UserRole,
)
from app.models.farmer import FarmerProfile, Farm
from app.models.order import Order, OrderItem
from app.models.produce import ProduceListing
from app.models.profile import Profile
from app.services.demand_service import DemandIntelligenceService, StatisticalDemandAnalysis


class TestDemandIntelligenceUnit:
    def test_growth_percentage_calculation(self):
        assert StatisticalDemandAnalysis.calculate_growth_percentage(1250, 1000) == 25.0
        assert StatisticalDemandAnalysis.calculate_growth_percentage(800, 1000) == -20.0
        assert StatisticalDemandAnalysis.calculate_growth_percentage(100, 0) == 100.0
        assert StatisticalDemandAnalysis.calculate_growth_percentage(0, 0) is None

    def test_demand_score_and_levels(self):
        # High demand scenario
        high_score = StatisticalDemandAnalysis.compute_demand_score(
            order_count=20,
            quantity_sold=500.0,
            unique_buyers=10,
            sales_velocity=16.6,
            growth_pct=25.0,
            available_supply=200.0,
            period_days=30,
        )
        assert high_score >= 60
        assert StatisticalDemandAnalysis.map_demand_level(high_score, 20) in [
            DemandLevel.HIGH,
            DemandLevel.VERY_HIGH,
        ]

        # Zero data scenario
        zero_score = StatisticalDemandAnalysis.compute_demand_score(
            order_count=0,
            quantity_sold=0.0,
            unique_buyers=0,
            sales_velocity=0.0,
            growth_pct=None,
            available_supply=100.0,
            period_days=30,
        )
        assert zero_score == 0
        assert StatisticalDemandAnalysis.map_demand_level(zero_score, 0) == DemandLevel.INSUFFICIENT_DATA

    def test_demand_trend_mapping(self):
        assert StatisticalDemandAnalysis.map_demand_trend(15.0, 10) == DemandTrend.RISING
        assert StatisticalDemandAnalysis.map_demand_trend(-10.0, 10) == DemandTrend.FALLING
        assert StatisticalDemandAnalysis.map_demand_trend(2.0, 10) == DemandTrend.STABLE
        assert StatisticalDemandAnalysis.map_demand_trend(None, 0) == DemandTrend.INSUFFICIENT_DATA

    def test_supply_demand_status(self):
        assert (
            StatisticalDemandAnalysis.map_supply_demand_status(
                quantity_sold=500, available_supply=0, order_count=5
            )
            == SupplyDemandStatus.SUPPLY_SHORTAGE
        )
        assert (
            StatisticalDemandAnalysis.map_supply_demand_status(
                quantity_sold=300, available_supply=100, order_count=5
            )
            == SupplyDemandStatus.HIGH_DEMAND
        )
        assert (
            StatisticalDemandAnalysis.map_supply_demand_status(
                quantity_sold=0, available_supply=0, order_count=0
            )
            == SupplyDemandStatus.INSUFFICIENT_DATA
        )


class TestDemandIntelligenceEndpoints:
    @pytest.fixture(autouse=True)
    def setup_demand_data(self, db_session):
        now = datetime.now(timezone.utc)

        # Setup Farmer Profile & Farm
        farmer_user = Profile(
            id="user-farmer-100",
            auth_user_id="auth-farmer-100",
            email="farmer100@example.com",
            full_name="Demand Farmer",
            role=UserRole.FARMER.value,
        )
        db_session.add(farmer_user)
        db_session.commit()

        farmer_prof = FarmerProfile(
            id="fp-100",
            profile_id="user-farmer-100",
            address_line="123 Farm Road",
            village="Kolar Village",
            mandal="Kolar Mandal",
            district="Kolar",
            state="Karnataka",
            pincode="563101",
        )
        db_session.add(farmer_prof)

        farm = Farm(
            id="farm-100",
            farmer_profile_id="fp-100",
            farm_name="Green Valley",
            total_area=Decimal("10.0"),
            area_unit="ACRE",
            address_line="Kolar Road",
            village="Kolar",
            mandal="Kolar",
            district="Kolar",
            state="Karnataka",
            pincode="563101",
        )
        db_session.add(farm)

        # Create Produce Listing (Available supply)
        produce = ProduceListing(
            id="prod-tomato-1",
            farmer_profile_id="fp-100",
            farm_id="farm-100",
            product_name="Tomato",
            category="VEGETABLE",
            total_quantity=Decimal("1000.0"),
            available_quantity=Decimal("500.0"),
            sold_quantity=Decimal("500.0"),
            quantity_unit="KG",
            expected_price=Decimal("30.0"),
            harvest_date=now.date(),
            available_from=now.date(),
            status=ProduceStatus.LISTED.value,
        )
        db_session.add(produce)

        # Create Buyer Profiles
        buyer1 = Profile(
            id="user-buyer-1",
            auth_user_id="auth-buyer-1",
            email="buyer1@example.com",
            full_name="Buyer One",
            role=UserRole.BUYER.value,
        )
        buyer2 = Profile(
            id="user-buyer-2",
            auth_user_id="auth-buyer-2",
            email="buyer2@example.com",
            full_name="Buyer Two",
            role=UserRole.BUYER.value,
        )
        db_session.add_all([buyer1, buyer2])
        db_session.commit()

        # Create Valid Orders (Delivered & Accepted)
        order1 = Order(
            id="ord-101",
            order_number="MD-2026-101",
            buyer_user_id="user-buyer-1",
            status=OrderStatus.DELIVERED.value,
            subtotal=Decimal("6000.0"),
            delivery_fee=Decimal("100.0"),
            total_amount=Decimal("6100.0"),
            delivery_address_snapshot={"state": "Karnataka", "district": "Bangalore Urban"},
            created_at=now - timedelta(days=5),
        )
        item1 = OrderItem(
            id="item-101",
            order_id="ord-101",
            produce_listing_id="prod-tomato-1",
            farmer_profile_id="fp-100",
            product_name="Tomato",
            quantity=Decimal("200.0"),
            quantity_unit="KG",
            unit_price=Decimal("30.0"),
            subtotal=Decimal("6000.0"),
        )

        order2 = Order(
            id="ord-102",
            order_number="MD-2026-102",
            buyer_user_id="user-buyer-2",
            status=OrderStatus.ACCEPTED.value,
            subtotal=Decimal("9000.0"),
            delivery_fee=Decimal("150.0"),
            total_amount=Decimal("9150.0"),
            delivery_address_snapshot={"state": "Karnataka", "district": "Mysore"},
            created_at=now - timedelta(days=12),
        )
        item2 = OrderItem(
            id="item-102",
            order_id="ord-102",
            produce_listing_id="prod-tomato-1",
            farmer_profile_id="fp-100",
            product_name="Tomato",
            quantity=Decimal("300.0"),
            quantity_unit="KG",
            unit_price=Decimal("30.0"),
            subtotal=Decimal("9000.0"),
        )

        # Cancelled Order (Must be EXCLUDED from demand)
        order_cancelled = Order(
            id="ord-103-cancelled",
            order_number="MD-2026-103",
            buyer_user_id="user-buyer-1",
            status=OrderStatus.CANCELLED.value,
            subtotal=Decimal("15000.0"),
            delivery_fee=Decimal("0.0"),
            total_amount=Decimal("15000.0"),
            delivery_address_snapshot={"state": "Karnataka", "district": "Kolar"},
            created_at=now - timedelta(days=2),
        )
        item_cancelled = OrderItem(
            id="item-103-cancelled",
            order_id="ord-103-cancelled",
            produce_listing_id="prod-tomato-1",
            farmer_profile_id="fp-100",
            product_name="Tomato",
            quantity=Decimal("500.0"),
            quantity_unit="KG",
            unit_price=Decimal("30.0"),
            subtotal=Decimal("15000.0"),
        )

        db_session.add_all([order1, item1, order2, item2, order_cancelled, item_cancelled])
        db_session.commit()

        # Add Admin profile for admin test
        admin_user = Profile(
            id="user-admin-100",
            auth_user_id="auth-admin-100",
            email="admin100@example.com",
            full_name="Demand Admin",
            role=UserRole.ADMIN.value,
        )
        db_session.add(admin_user)
        db_session.commit()

    def test_unauthenticated_request_fails(self, client: TestClient):
        res = client.get("/api/v1/demand-intelligence/summary")
        assert res.status_code == 401

    def test_farmer_demand_summary(self, client: TestClient, make_auth_header):
        headers = make_auth_header("auth-farmer-100", "farmer100@example.com")
        res = client.get("/api/v1/demand-intelligence/summary?period_days=30", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total_orders"] == 2  # Excludes cancelled order!
        assert data["total_quantity_sold"] == 500.0
        assert data["total_unique_buyers"] == 2
        assert len(data["top_demanded_products"]) >= 1

    def test_product_demand_detail(self, client: TestClient, make_auth_header):
        headers = make_auth_header("auth-farmer-100", "farmer100@example.com")
        res = client.get("/api/v1/demand-intelligence/products/Tomato?period_days=30", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["product_name"] == "Tomato"
        assert data["order_count"] == 2
        assert data["recent_quantity_sold"] == 500.0
        assert data["unique_buyers"] == 2
        assert data["demand_score"] > 0
        assert data["demand_level"] != "INSUFFICIENT_DATA"

    def test_regional_demand(self, client: TestClient, make_auth_header):
        headers = make_auth_header("auth-farmer-100", "farmer100@example.com")
        res = client.get("/api/v1/demand-intelligence/regional?period_days=30", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert len(data["regions"]) >= 1

    def test_combined_price_demand_insight(self, client: TestClient, make_auth_header):
        headers = make_auth_header("auth-farmer-100", "farmer100@example.com")
        res = client.get("/api/v1/demand-intelligence/combined-insight/Tomato", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["product_name"] == "Tomato"
        assert "combined_insight" in data
        assert len(data["combined_insight"]) > 10

    def test_admin_demand_summary(self, client: TestClient, make_auth_header):
        headers = make_auth_header("auth-admin-100", "admin100@example.com")
        res = client.get("/api/v1/admin/demand-intelligence/summary", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total_orders"] >= 2

    def test_non_admin_cannot_access_admin_endpoint(self, client: TestClient, make_auth_header):
        headers = make_auth_header("auth-farmer-100", "farmer100@example.com")
        res = client.get("/api/v1/admin/demand-intelligence/summary", headers=headers)
        assert res.status_code == 403

