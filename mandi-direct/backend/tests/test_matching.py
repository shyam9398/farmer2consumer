from datetime import date, timedelta
from decimal import Decimal
import pytest

from app.models.address import BuyerAddress
from app.models.buyer_preference import BuyerPreference
from app.models.enums import (
    ConfidenceLevel,
    MatchLevel,
    OrderStatus,
    PaymentStatus,
    PriceUnit,
    ProduceStatus,
    ProductCategory,
    QualityGrade,
    QuantityUnit,
    UserRole,
)
from app.models.farmer import Farm, FarmerProfile
from app.models.order import Order, OrderItem
from app.models.produce import ProduceListing
from app.services.matching_service import smart_matching_service


@pytest.fixture
def buyer_user(create_test_user, db_session):
    """Create a test BUYER profile."""
    profile = create_test_user(
        auth_user_id="auth-buyer-p13-001",
        email="buyer.test@mandidirect.in",
        full_name="Krishna Wholesale Co",
        role=UserRole.BUYER,
    )
    return profile


@pytest.fixture
def buyer_user_b(create_test_user, db_session):
    """Create a second test BUYER profile."""
    profile = create_test_user(
        auth_user_id="auth-buyer-p13-002",
        email="buyer.secondary@mandidirect.in",
        full_name="Godavari Mart",
        role=UserRole.BUYER,
    )
    return profile


@pytest.fixture
def farmer_user(create_test_user, db_session):
    """Create a test FARMER profile with farm."""
    profile = create_test_user(
        auth_user_id="auth-farmer-p13-001",
        email="farmer.test@mandidirect.in",
        full_name="Venkatesh Rao",
        role=UserRole.FARMER,
    )
    farmer_prof = FarmerProfile(
        profile_id=profile.id,
        address_line="Main Road",
        village="Nuzvid",
        mandal="Nuzvid",
        district="Krishna",
        state="Andhra Pradesh",
        pincode="521201",
        verification_status="VERIFIED",
    )
    db_session.add(farmer_prof)
    db_session.commit()
    db_session.refresh(farmer_prof)

    farm = Farm(
        farmer_profile_id=farmer_prof.id,
        farm_name="Green Meadows",
        total_area=Decimal("5.0"),
        area_unit="ACRE",
        village="Nuzvid",
        mandal="Nuzvid",
        district="Krishna",
        state="Andhra Pradesh",
        pincode="521201",
    )
    db_session.add(farm)
    db_session.commit()
    db_session.refresh(farm)

    profile.farmer_profile = farmer_prof
    farmer_prof.farms = [farm]
    return profile


@pytest.fixture
def farmer_user_b(create_test_user, db_session):
    """Create second FARMER profile."""
    profile = create_test_user(
        auth_user_id="auth-farmer-p13-002",
        email="farmer.b@mandidirect.in",
        full_name="Balaram Naidu",
        role=UserRole.FARMER,
    )
    farmer_prof = FarmerProfile(
        profile_id=profile.id,
        address_line="Hill Road",
        village="Kolar Village",
        mandal="Kolar Mandal",
        district="Kolar",
        state="Karnataka",
        pincode="563101",
        verification_status="VERIFIED",
    )
    db_session.add(farmer_prof)
    db_session.commit()
    db_session.refresh(farmer_prof)

    farm = Farm(
        farmer_profile_id=farmer_prof.id,
        farm_name="Sunrise Orchard",
        total_area=Decimal("10.0"),
        area_unit="ACRE",
        village="Kolar Village",
        mandal="Kolar Mandal",
        district="Kolar",
        state="Karnataka",
        pincode="563101",
    )
    db_session.add(farm)
    db_session.commit()
    db_session.refresh(farm)
    return profile


@pytest.fixture
def active_produce(farmer_user, db_session):
    """Create a verified LISTED produce lot."""
    farm = farmer_user.farmer_profile.farms[0]
    produce = ProduceListing(
        farmer_profile_id=farmer_user.farmer_profile.id,
        farm_id=farm.id,
        product_name="Tomato",
        category=ProductCategory.VEGETABLE.value,
        variety="Hybrid Vaishnavi",
        description="Fresh farm grade tomatoes",
        total_quantity=Decimal("500.0"),
        available_quantity=Decimal("300.0"),
        reserved_quantity=Decimal("0.0"),
        sold_quantity=Decimal("200.0"),
        quantity_unit=QuantityUnit.KG.value,
        quality_grade=QualityGrade.GRADE_A.value,
        harvest_date=date.today() - timedelta(days=2),
        available_from=date.today() - timedelta(days=1),
        available_until=date.today() + timedelta(days=10),
        expected_price=Decimal("28.00"),
        price_unit=PriceUnit.PER_KG.value,
        minimum_order_quantity=Decimal("50.0"),
        status=ProduceStatus.LISTED.value,
    )
    db_session.add(produce)
    db_session.commit()
    db_session.refresh(produce)
    return produce


class TestSmartMatchingEngine:
    """Unit tests for deterministic scoring, signals, thresholds, and calculations."""

    def test_1_exact_product_match(self, db_session, active_produce, buyer_user):
        """Exact product match awards 35 points."""
        pref = BuyerPreference(
            buyer_user_id=buyer_user.id,
            preferred_products=["Tomato"],
            preferred_categories=["VEGETABLE"],
        )
        res = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, pref)
        prod_signal = next(s for s in res.matched_signals if s.signal_type == "PRODUCT")
        assert prod_signal.matched is True
        assert prod_signal.points_awarded == 35.0

    def test_2_category_only_match(self, db_session, active_produce, buyer_user):
        """When product does not match preferred products, category still scores."""
        pref = BuyerPreference(
            buyer_user_id=buyer_user.id,
            preferred_products=["Potato"],
            preferred_categories=["VEGETABLE"],
        )
        res = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, pref)
        cat_signal = next(s for s in res.matched_signals if s.signal_type == "CATEGORY")
        assert cat_signal.matched is True
        assert cat_signal.points_awarded == 15.0
        prod_signal = next(s for s in res.unmatched_signals if s.signal_type == "PRODUCT")
        assert prod_signal.matched is False

    def test_3_variety_match_and_mismatch(self, db_session, active_produce, buyer_user):
        """Test variety match full points vs mismatch."""
        # Match
        pref_match = BuyerPreference(
            buyer_user_id=buyer_user.id,
            preferred_varieties=["Hybrid Vaishnavi"],
        )
        res_m = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, pref_match)
        var_s = next(s for s in res_m.matched_signals if s.signal_type == "VARIETY")
        assert var_s.points_awarded == 10.0

        # Mismatch
        pref_mismatch = BuyerPreference(
            buyer_user_id=buyer_user.id,
            preferred_varieties=["Desi Country"],
        )
        res_d = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, pref_mismatch)
        var_un = next(s for s in res_d.unmatched_signals if s.signal_type == "VARIETY")
        assert var_un.points_awarded == 0.0

    def test_4_quality_match_and_neutral(self, db_session, active_produce, buyer_user):
        """Test grade match vs neutral no preference."""
        # Match
        pref_qual = BuyerPreference(
            buyer_user_id=buyer_user.id,
            preferred_quality_grades=["GRADE_A"],
        )
        res = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, pref_qual)
        q_sig = next(s for s in res.matched_signals if s.signal_type == "QUALITY")
        assert q_sig.points_awarded == 10.0

        # Neutral
        res_neutral = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, None)
        q_neu = next(s for s in res_neutral.matched_signals if s.signal_type == "QUALITY")
        assert q_neu.points_awarded == 5.0

    def test_5_district_and_state_match(self, db_session, active_produce, buyer_user):
        """District match awards 10 pts, same state awards 6 pts, different state 0 pts."""
        # District match
        pref_dist = BuyerPreference(buyer_user_id=buyer_user.id, preferred_districts=["Krishna"])
        res_dist = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, pref_dist)
        loc_d = next(s for s in res_dist.matched_signals if s.signal_type == "LOCATION")
        assert loc_d.points_awarded == 10.0

        # State match
        pref_state = BuyerPreference(buyer_user_id=buyer_user.id, preferred_states=["Andhra Pradesh"])
        res_state = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, pref_state)
        loc_s = next(s for s in res_state.matched_signals if s.signal_type == "LOCATION")
        assert loc_s.points_awarded == 6.0

        # Mismatch state
        pref_other = BuyerPreference(buyer_user_id=buyer_user.id, preferred_states=["Punjab"])
        res_other = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, pref_other)
        loc_un = next(s for s in res_other.unmatched_signals if s.signal_type == "LOCATION")
        assert loc_un.points_awarded == 0.0

    def test_6_quantity_compatibility(self, db_session, active_produce, buyer_user):
        """Quantity range compatibility tests."""
        # Produce available_quantity = 300.0 KG
        # Fit inside range [100, 500] -> 10 pts
        pref_fit = BuyerPreference(
            buyer_user_id=buyer_user.id,
            minimum_quantity=Decimal("100"),
            maximum_quantity=Decimal("500"),
        )
        res_fit = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, pref_fit)
        q_fit = next(s for s in res_fit.matched_signals if s.signal_type == "QUANTITY")
        assert q_fit.points_awarded == 10.0

        # Below minimum [500, 1000] -> partial lot score
        pref_under = BuyerPreference(
            buyer_user_id=buyer_user.id,
            minimum_quantity=Decimal("500"),
            maximum_quantity=Decimal("1000"),
        )
        res_under = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, pref_under)
        q_under = next(s for s in res_under.unmatched_signals if s.signal_type == "QUANTITY")
        assert q_under.points_awarded == 4.0

    def test_7_price_compatibility(self, db_session, active_produce, buyer_user):
        """Produce price = 28.00 / KG."""
        # Inside target range [20, 35] -> 5 pts
        pref_prc = BuyerPreference(
            buyer_user_id=buyer_user.id,
            minimum_price=Decimal("20.00"),
            maximum_price=Decimal("35.00"),
        )
        res = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, pref_prc)
        p_sig = next(s for s in res.matched_signals if s.signal_type == "PRICE")
        assert p_sig.points_awarded == 5.0

    def test_8_purchase_history_signals(self, db_session, active_produce, buyer_user):
        """Delivered orders count towards purchase interest; cancelled orders do not."""
        # Delivered order
        order_delivered = Order(
            order_number="MD-TEST-ORD-01",
            buyer_user_id=buyer_user.id,
            status=OrderStatus.DELIVERED.value,
            payment_status=PaymentStatus.PAID.value,
            subtotal=Decimal("1000.00"),
            delivery_fee=Decimal("50.00"),
            total_amount=Decimal("1050.00"),
            delivery_address_snapshot={"district": "Krishna", "state": "Andhra Pradesh"},
        )
        db_session.add(order_delivered)
        db_session.commit()

        item = OrderItem(
            order_id=order_delivered.id,
            produce_listing_id=active_produce.id,
            farmer_profile_id=active_produce.farmer_profile_id,
            product_name=active_produce.product_name,
            quantity=Decimal("50.0"),
            quantity_unit="KG",
            unit_price=Decimal("28.00"),
            subtotal=Decimal("1400.00"),
        )
        db_session.add(item)
        db_session.commit()

        res_single = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, None)
        h_sig = next(s for s in res_single.matched_signals if s.signal_type == "PURCHASE_HISTORY")
        assert h_sig.points_awarded >= 3.0

        # Add second delivered order -> repeated purchase
        order_delivered_2 = Order(
            order_number="MD-TEST-ORD-02",
            buyer_user_id=buyer_user.id,
            status=OrderStatus.DELIVERED.value,
            payment_status=PaymentStatus.PAID.value,
            subtotal=Decimal("1000.00"),
            delivery_fee=Decimal("50.00"),
            total_amount=Decimal("1050.00"),
            delivery_address_snapshot={"district": "Krishna"},
        )
        db_session.add(order_delivered_2)
        db_session.commit()
        item2 = OrderItem(
            order_id=order_delivered_2.id,
            produce_listing_id=active_produce.id,
            farmer_profile_id=active_produce.farmer_profile_id,
            product_name=active_produce.product_name,
            quantity=Decimal("50.0"),
            quantity_unit="KG",
            unit_price=Decimal("28.00"),
            subtotal=Decimal("1400.00"),
        )
        db_session.add(item2)
        db_session.commit()

        res_repeat = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, None)
        h_sig2 = next(s for s in res_repeat.matched_signals if s.signal_type == "PURCHASE_HISTORY")
        assert h_sig2.points_awarded == 5.0

    def test_9_cancelled_rejected_orders_ignored(self, db_session, active_produce, buyer_user_b):
        """Cancelled or rejected orders must NOT count as purchase interest."""
        cancelled_order = Order(
            order_number="MD-CANCELLED-01",
            buyer_user_id=buyer_user_b.id,
            status=OrderStatus.CANCELLED.value,
            payment_status=PaymentStatus.REFUNDED.value,
            subtotal=Decimal("500.00"),
            delivery_fee=Decimal("0.00"),
            total_amount=Decimal("500.00"),
            delivery_address_snapshot={"district": "Krishna"},
        )
        db_session.add(cancelled_order)
        db_session.commit()
        item = OrderItem(
            order_id=cancelled_order.id,
            produce_listing_id=active_produce.id,
            farmer_profile_id=active_produce.farmer_profile_id,
            product_name=active_produce.product_name,
            quantity=Decimal("20.0"),
            quantity_unit="KG",
            unit_price=Decimal("28.00"),
            subtotal=Decimal("560.00"),
        )
        db_session.add(item)
        db_session.commit()

        res = smart_matching_service.calculate_match(db_session, active_produce, buyer_user_b, None)
        hist_un = next(s for s in res.unmatched_signals if s.signal_type == "PURCHASE_HISTORY")
        assert hist_un.points_awarded == 0.0

    def test_10_deterministic_output_and_bounds(self, db_session, active_produce, buyer_user):
        """Scores must always be strictly between 0 and 100, and fully deterministic."""
        pref = BuyerPreference(
            buyer_user_id=buyer_user.id,
            preferred_products=["Tomato"],
            preferred_categories=["VEGETABLE"],
            preferred_varieties=["Hybrid Vaishnavi"],
            preferred_quality_grades=["GRADE_A"],
            preferred_districts=["Krishna"],
            preferred_states=["Andhra Pradesh"],
            minimum_quantity=Decimal("100"),
            maximum_quantity=Decimal("500"),
            minimum_price=Decimal("20.00"),
            maximum_price=Decimal("35.00"),
        )
        res1 = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, pref)
        res2 = smart_matching_service.calculate_match(db_session, active_produce, buyer_user, pref)

        assert 0.0 <= res1.match_score <= 100.0
        assert res1.match_score == res2.match_score
        assert res1.match_level == MatchLevel.VERY_HIGH
        assert res1.confidence == ConfidenceLevel.HIGH
        assert "High match" in res1.explanation or "Very High match" in res1.explanation


class TestMatchingAPIsAndSecurity:
    """Integration & security tests for buyer preferences and farmer/buyer matching endpoints."""

    def test_11_buyer_preferences_crud(self, client, make_auth_header, buyer_user):
        """Buyer can get and update their own procurement preferences."""
        headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email, role="authenticated")

        # GET defaults
        res_get = client.get("/api/v1/buyer/preferences", headers=headers)
        assert res_get.status_code == 200
        data = res_get.json()
        assert data["buyer_user_id"] == buyer_user.id
        assert data["preferred_categories"] == []

        # PUT update
        payload = {
            "preferred_categories": ["VEGETABLE", "FRUIT"],
            "preferred_products": ["Tomato", "Chilli"],
            "preferred_varieties": ["Hybrid"],
            "preferred_quality_grades": ["GRADE_A"],
            "preferred_districts": ["Krishna"],
            "preferred_states": ["Andhra Pradesh"],
            "minimum_quantity": 100.0,
            "maximum_quantity": 500.0,
            "minimum_price": 20.0,
            "maximum_price": 40.0,
        }
        res_put = client.put("/api/v1/buyer/preferences", json=payload, headers=headers)
        assert res_put.status_code == 200
        updated = res_put.json()
        assert updated["preferred_products"] == ["Tomato", "Chilli"]
        assert float(updated["minimum_price"]) == 20.0

        # Verify persisted on re-fetch
        res_refetch = client.get("/api/v1/buyer/preferences", headers=headers)
        assert res_refetch.status_code == 200
        assert res_refetch.json()["preferred_districts"] == ["Krishna"]

    def test_12_preference_range_validation(self, client, make_auth_header, buyer_user):
        """Invalid min > max values fail with 422 Unprocessable Content."""
        headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email, role="authenticated")
        invalid_payload = {
            "minimum_price": 50.0,
            "maximum_price": 20.0,  # min > max
        }
        res = client.put("/api/v1/buyer/preferences", json=invalid_payload, headers=headers)
        assert res.status_code == 422

    def test_13_buyer_matching_products(self, client, make_auth_header, buyer_user, active_produce):
        """Buyer matching products discovery returns scored listings."""
        headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email, role="authenticated")
        res = client.get("/api/v1/buyer/matching/products", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert data["total"] >= 1
        item = data["items"][0]
        assert item["produce"]["product_name"] == "Tomato"
        assert item["match"]["match_score"] >= 0.0

    def test_14_single_product_buyer_match(self, client, make_auth_header, buyer_user, active_produce):
        """Single product match returns detailed signal breakdown."""
        headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email, role="authenticated")
        res = client.get(f"/api/v1/buyer/matching/products/{active_produce.id}", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["produce"]["produce_id"] == active_produce.id
        assert "matched_signals" in data["match"]
        assert "explanation" in data["match"]

    def test_15_farmer_buyer_matching(self, client, make_auth_header, farmer_user, active_produce, buyer_user):
        """Farmer matching discovers potential buyers safely."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email, role="authenticated")
        res = client.get("/api/v1/farmer/matching/buyers", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert "high_match_count" in data

    def test_16_produce_specific_matching(self, client, make_auth_header, farmer_user, active_produce):
        """Farmer produce specific match endpoint returns matching buyers."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email, role="authenticated")
        res = client.get(f"/api/v1/farmer/matching/buyers/{active_produce.id}", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["produce"]["produce_id"] == active_produce.id

    def test_17_farmer_cannot_access_other_farmer_produce(
        self, client, make_auth_header, farmer_user_b, active_produce
    ):
        """Farmer B cannot view matching for Farmer A's produce lot (403 Forbidden)."""
        headers_b = make_auth_header(farmer_user_b.auth_user_id, farmer_user_b.email, role="authenticated")
        res = client.get(f"/api/v1/farmer/matching/buyers/{active_produce.id}", headers=headers_b)
        assert res.status_code == 403

    def test_18_unauthenticated_blocked(self, client):
        """Unauthenticated requests are blocked with 401 Unauthorized."""
        assert client.get("/api/v1/buyer/preferences").status_code == 401
        assert client.get("/api/v1/buyer/matching/products").status_code == 401
        assert client.get("/api/v1/farmer/matching/buyers").status_code == 401

    def test_19_sold_out_and_expired_excluded(self, db_session, farmer_user, buyer_user):
        """Sold-out and expired lots are excluded from buyer matching."""
        farm = farmer_user.farmer_profile.farms[0]
        # Sold out lot
        sold_out = ProduceListing(
            farmer_profile_id=farmer_user.farmer_profile.id,
            farm_id=farm.id,
            product_name="Sold Out Onion",
            category="VEGETABLE",
            total_quantity=Decimal("100"),
            available_quantity=Decimal("0"),  # Sold out
            quantity_unit="KG",
            quality_grade="GRADE_A",
            harvest_date=date.today(),
            available_from=date.today(),
            expected_price=Decimal("20.00"),
            status=ProduceStatus.SOLD_OUT.value,
        )
        # Expired lot
        expired = ProduceListing(
            farmer_profile_id=farmer_user.farmer_profile.id,
            farm_id=farm.id,
            product_name="Expired Potato",
            category="VEGETABLE",
            total_quantity=Decimal("100"),
            available_quantity=Decimal("100"),
            quantity_unit="KG",
            quality_grade="GRADE_A",
            harvest_date=date.today() - timedelta(days=30),
            available_from=date.today() - timedelta(days=30),
            available_until=date.today() - timedelta(days=1),  # Expired yesterday
            expected_price=Decimal("15.00"),
            status=ProduceStatus.EXPIRED.value,
        )
        db_session.add_all([sold_out, expired])
        db_session.commit()

        res = smart_matching_service.get_buyer_product_matches(db_session, buyer_user_id=buyer_user.id)
        matched_ids = [item.produce.produce_id for item in res.items]
        assert sold_out.id not in matched_ids
        assert expired.id not in matched_ids
