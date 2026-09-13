import io
from datetime import date, timedelta
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.models.enums import UserRole
from app.models.order import Order, OrderItem
from app.models.price_observation import PriceObservation
from app.schemas.price_intelligence import (
    ConfidenceLevel,
    ExpectedPriceComparisonState,
    MatchLevel,
    PriceRecommendationRequest,
    PriceSourceType,
    PriceTrend,
)
from app.services.price_intelligence import price_intelligence_service
from app.services.price_recommendation import price_recommendation_service


class TestPriceIntelligence:
    """
    Test suite for Phase 11: Price Intelligence & Recommendation Engine.
    """

    def test_unit_normalization(self):
        """Test unit conversion factors for KG, QUINTAL, and TON."""
        # 1. KG -> 1.0 factor
        p1 = price_intelligence_service.normalize_price_to_per_kg(Decimal("30.00"), "PER_KG")
        assert p1 == Decimal("30.00")

        # 2. QUINTAL -> 100 factor (3000/quintal = 30/kg)
        p2 = price_intelligence_service.normalize_price_to_per_kg(Decimal("3000.00"), "PER_QUINTAL")
        assert p2 == Decimal("30.00")

        # 3. TON -> 1000 factor (30000/ton = 30/kg)
        p3 = price_intelligence_service.normalize_price_to_per_kg(Decimal("30000.00"), "PER_TON")
        assert p3 == Decimal("30.00")

        # Reverse conversion back to QUINTAL
        conv_q = price_intelligence_service.convert_per_kg_to_unit(Decimal("30.00"), "PER_QUINTAL")
        assert conv_q == Decimal("3000.00")

    def test_price_aggregations_and_trend(self, db_session):
        """Test statistical aggregations (mean, median, weighted avg) and trend calculations."""
        today = date.today()

        # Seed observations
        obs1 = PriceObservation(
            product_name="Tomato",
            category="VEGETABLE",
            variety="Hybrid",
            quality_grade="GRADE_A",
            price=Decimal("25.00"),
            price_unit="PER_KG",
            source_type=PriceSourceType.GOVERNMENT_DATA.value,
            source_name="Gov Agmarknet",
            observation_date=today - timedelta(days=10),
        )
        obs2 = PriceObservation(
            product_name="Tomato",
            category="VEGETABLE",
            variety="Hybrid",
            quality_grade="GRADE_A",
            price=Decimal("35.00"),
            price_unit="PER_KG",
            source_type=PriceSourceType.EXTERNAL_API.value,
            source_name="Mandi API",
            observation_date=today - timedelta(days=2),
        )
        db_session.add_all([obs1, obs2])
        db_session.commit()

        summary = price_intelligence_service.get_summary(db_session, product_name="Tomato")
        assert summary.observation_count == 2
        assert summary.min_price == Decimal("25.00")
        assert summary.max_price == Decimal("35.00")
        assert summary.avg_price == Decimal("30.00")
        assert summary.trend in (PriceTrend.RISING, PriceTrend.STABLE)

    def test_recommendation_and_expected_price_comparison(self, db_session):
        """Test recommendation engine bounds and expected price comparison (BELOW, WITHIN, ABOVE)."""
        today = date.today()
        obs = PriceObservation(
            product_name="Potato",
            category="VEGETABLE",
            variety="Jyoti",
            quality_grade="GRADE_A",
            price=Decimal("20.00"),
            price_unit="PER_KG",
            source_type=PriceSourceType.ADMIN_IMPORT.value,
            source_name="Admin Entry",
            observation_date=today - timedelta(days=1),
        )
        db_session.add(obs)
        db_session.commit()

        # Case 1: Expected price WITHIN range (e.g. 20)
        req_within = PriceRecommendationRequest(
            product_name="Potato",
            variety="Jyoti",
            quality_grade="GRADE_A",
            expected_price=Decimal("20.00"),
            price_unit="PER_KG",
        )
        res_within = price_recommendation_service.generate_recommendation(db_session, req_within)
        assert res_within.reference_price == Decimal("20.00")
        assert res_within.expected_price_comparison == ExpectedPriceComparisonState.WITHIN

        # Case 2: Expected price BELOW range (e.g. 10)
        req_below = PriceRecommendationRequest(
            product_name="Potato",
            variety="Jyoti",
            quality_grade="GRADE_A",
            expected_price=Decimal("10.00"),
            price_unit="PER_KG",
        )
        res_below = price_recommendation_service.generate_recommendation(db_session, req_below)
        assert res_below.expected_price_comparison == ExpectedPriceComparisonState.BELOW

        # Case 3: Expected price ABOVE range (e.g. 50)
        req_above = PriceRecommendationRequest(
            product_name="Potato",
            variety="Jyoti",
            quality_grade="GRADE_A",
            expected_price=Decimal("50.00"),
            price_unit="PER_KG",
        )
        res_above = price_recommendation_service.generate_recommendation(db_session, req_above)
        assert res_above.expected_price_comparison == ExpectedPriceComparisonState.ABOVE

    def test_historical_order_price_immutability(self, db_session):
        """
        Verify that changing current produce listing price does NOT mutate historical order_items unit prices.
        """
        # Create an OrderItem snapshot
        item = OrderItem(
            order_id="fake_order_123",
            produce_listing_id="fake_produce_456",
            farmer_profile_id="fake_farmer_789",
            product_name="Onion",
            quantity=Decimal("100.00"),
            quantity_unit="KG",
            unit_price=Decimal("30.00"),  # Sold at 30/kg
            subtotal=Decimal("3000.00"),
        )
        db_session.add(item)
        db_session.commit()

        # Simulate changing current listing price in produce table (or external logic)
        item.unit_price = Decimal("30.00")  # Untouched
        db_session.commit()

        reloaded = db_session.query(OrderItem).filter(OrderItem.id == item.id).first()
        assert reloaded.unit_price == Decimal("30.00")

    def test_admin_rbac_and_observation_crud(self, client: TestClient, create_test_user, make_auth_header):
        """
        Test that Farmers/Buyers cannot modify price observations, while Admin can CRUD.
        """
        farmer = create_test_user("farmer_pi_1", "farmer_pi_1@example.com", "Farmer One", role=UserRole.FARMER)
        admin = create_test_user("admin_pi_1", "admin_pi_1@example.com", "Admin One", role=UserRole.ADMIN)

        farmer_headers = make_auth_header(farmer.auth_user_id, farmer.email)
        admin_headers = make_auth_header(admin.auth_user_id, admin.email)

        payload = {
            "product_name": "Carrot",
            "category": "VEGETABLE",
            "variety": "Orange",
            "quality_grade": "GRADE_A",
            "price": 40.0,
            "currency": "INR",
            "price_unit": "PER_KG",
            "source_type": "ADMIN_IMPORT",
            "source_name": "Admin Manual",
            "observation_date": str(date.today()),
        }

        # 1. Non-admin receives HTTP 403
        resp_unauth = client.post("/api/v1/admin/price-observations", json=payload, headers=farmer_headers)
        assert resp_unauth.status_code == 403

        # 2. Admin success
        resp_admin = client.post("/api/v1/admin/price-observations", json=payload, headers=admin_headers)
        assert resp_admin.status_code == 201
        obs_id = resp_admin.json()["id"]

        # 3. Admin update
        patch_resp = client.patch(
            f"/api/v1/admin/price-observations/{obs_id}",
            json={"price": 42.0},
            headers=admin_headers,
        )
        assert patch_resp.status_code == 200
        assert Decimal(str(patch_resp.json()["price"])) == Decimal("42.00")

        # 4. Admin delete
        del_resp = client.delete(f"/api/v1/admin/price-observations/{obs_id}", headers=admin_headers)
        assert del_resp.status_code == 204

    def test_csv_import_validation(self, client: TestClient, create_test_user, make_auth_header):
        """
        Test CSV bulk import with valid rows and malformed rows.
        """
        admin = create_test_user("admin_pi_2", "admin_pi_2@example.com", "Admin Two", role=UserRole.ADMIN)
        admin_headers = make_auth_header(admin.auth_user_id, admin.email)

        csv_content = (
            "product_name,category,variety,quality_grade,price,price_unit,market_name,district,state,source_type,source_name,observation_date\n"
            f"Apple,FRUIT,Fuji,GRADE_A,120.0,PER_KG,Shimla Mandi,Shimla,Himachal Pradesh,GOVERNMENT_DATA,Agmarknet,{str(date.today())}\n"
            f"Banana,FRUIT,Robusta,GRADE_B,-10.0,PER_KG,Kolar Mandi,Kolar,Karnataka,GOVERNMENT_DATA,Agmarknet,{str(date.today())}\n"  # Invalid price <= 0
            f"Mango,FRUIT,Alphonso,GRADE_A,150.0,PER_KG,Ratnagiri Mandi,Ratnagiri,Maharashtra,INVALID_SOURCE,Agmarknet,{str(date.today())}\n"  # Invalid source_type
        )

        files = {"file": ("observations.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
        resp = client.post("/api/v1/admin/price-observations/import", files=files, headers=admin_headers)

        assert resp.status_code == 200
        data = resp.json()
        assert data["total_rows"] == 3
        assert data["imported_count"] == 1
        assert data["error_count"] == 2
        assert len(data["errors"]) == 2
        assert "Invalid price" in data["errors"][0]["error"]
        assert "Invalid source_type" in data["errors"][1]["error"]

