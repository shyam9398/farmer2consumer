from datetime import datetime, timezone
from decimal import Decimal
import pytest
from fastapi import HTTPException
from app.models.enums import OrderStatus, PayoutStatus, UserRole
from app.models.farmer import FarmerProfile
from app.models.earnings import FarmerEarning, FarmerPayout, FinancialAuditLog
from app.models.order import Order, OrderItem
from app.services.earnings import earnings_service
from app.services.payouts import payouts_service


def create_sample_delivered_order(db_session, buyer_user, farmer_profile, order_num="MD-TEST-1001"):
    order = Order(
        order_number=order_num,
        buyer_user_id=buyer_user.id,
        status=OrderStatus.DELIVERED.value,
        payment_status="PAID",
        subtotal=Decimal("2800.00"),
        delivery_fee=Decimal("100.00"),
        total_amount=Decimal("2900.00"),
        delivery_address_snapshot={"address": "123 Farm Way"},
    )
    db_session.add(order)
    db_session.flush()

    item = OrderItem(
        order_id=order.id,
        produce_listing_id="dummy-produce-id",
        farmer_profile_id=farmer_profile.id,
        product_name="Tomatoes",
        quantity=Decimal("100.00"),
        quantity_unit="KG",
        unit_price=Decimal("28.00"),
        subtotal=Decimal("2800.00"),
    )
    db_session.add(item)
    db_session.commit()
    return order, item


@pytest.fixture
def buyer_user(create_test_user, db_session):
    profile = create_test_user(
        auth_user_id="auth-buyer-earn-001",
        email="buyer.earn@mandidirect.in",
        full_name="Earn Buyer Mart",
        role=UserRole.BUYER,
    )
    profile.phone = "+919876500099"
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture
def admin_user(create_test_user, db_session):
    profile = create_test_user(
        auth_user_id="auth-admin-earn-001",
        email="admin.earn@mandidirect.in",
        full_name="Admin Financial Controller",
        role=UserRole.ADMIN,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture
def farmer_user_and_profile(create_test_user, db_session):
    profile = create_test_user(
        auth_user_id="auth-farmer-earn-001",
        email="farmer.earn@mandidirect.in",
        full_name="Ramesh Earn Farmer",
        role=UserRole.FARMER,
    )
    profile.phone = "+919876500088"
    db_session.add(profile)
    db_session.flush()

    farmer_prof = FarmerProfile(
        profile_id=profile.id,
        address_line="123 Green Acres",
        village="Kishanpur",
        mandal="Mandal Green",
        district="Guntur",
        state="Andhra Pradesh",
        pincode="522001",
    )
    db_session.add(farmer_prof)
    db_session.commit()
    db_session.refresh(profile)
    db_session.refresh(farmer_prof)
    return profile, farmer_prof


class TestPhase10FarmerEarningsAndPayouts:

    def test_1_delivered_order_creates_earnings(self, db_session, admin_user, farmer_user_and_profile, buyer_user):
        _, farmer_profile = farmer_user_and_profile
        order, item = create_sample_delivered_order(db_session, buyer_user, farmer_profile, "MD-EARN-1")

        earnings = earnings_service.create_earnings_for_delivered_order(
            db_session, order, admin_user.id
        )
        db_session.commit()

        assert len(earnings) == 1
        earning = earnings[0]
        assert earning.gross_amount == Decimal("2800.00")
        assert earning.net_amount == Decimal("2800.00")
        assert earning.status == "PENDING_SETTLEMENT"

    def test_2_duplicate_delivery_idempotent(self, db_session, admin_user, farmer_user_and_profile, buyer_user):
        _, farmer_profile = farmer_user_and_profile
        order, _ = create_sample_delivered_order(db_session, buyer_user, farmer_profile, "MD-EARN-2")

        # First call
        earnings1 = earnings_service.create_earnings_for_delivered_order(db_session, order, admin_user.id)
        db_session.commit()

        # Second call
        earnings2 = earnings_service.create_earnings_for_delivered_order(db_session, order, admin_user.id)
        db_session.commit()

        assert len(earnings1) == 1
        assert len(earnings2) == 1

        total_records = db_session.query(FarmerEarning).filter(FarmerEarning.order_id == order.id).count()
        assert total_records == 1

    def test_3_farmer_earnings_summary(self, db_session, admin_user, farmer_user_and_profile, buyer_user):
        _, farmer_profile = farmer_user_and_profile
        order, _ = create_sample_delivered_order(db_session, buyer_user, farmer_profile, "MD-EARN-3")
        earnings_service.create_earnings_for_delivered_order(db_session, order, admin_user.id)
        db_session.commit()

        summary = earnings_service.get_farmer_earnings_summary(db_session, farmer_profile.id)
        assert summary.total_gross == Decimal("2800.00")
        assert summary.total_net == Decimal("2800.00")
        assert summary.available_balance == Decimal("2800.00")

    def test_4_payout_request_validation(self, db_session, admin_user, farmer_user_and_profile, buyer_user):
        user, farmer_profile = farmer_user_and_profile
        order, _ = create_sample_delivered_order(db_session, buyer_user, farmer_profile, "MD-EARN-4")
        earnings_service.create_earnings_for_delivered_order(db_session, order, admin_user.id)
        db_session.commit()

        # 1. Negative amount should fail
        with pytest.raises(HTTPException):
            payouts_service.request_payout(
                db_session,
                farmer_profile,
                type("Req", (), {"amount": Decimal("-500.00")})(),
                user.id,
            )

        # 2. Amount > available balance should fail
        with pytest.raises(HTTPException):
            payouts_service.request_payout(
                db_session,
                farmer_profile,
                type("Req", (), {"amount": Decimal("5000.00")})(),
                user.id,
            )

        # 3. Valid payout request
        payout = payouts_service.request_payout(
            db_session,
            farmer_profile,
            type("Req", (), {"amount": Decimal("1000.00")})(),
            user.id,
        )
        assert payout.amount == Decimal("1000.00")
        assert payout.status == PayoutStatus.PENDING.value

        # Balance after payout request should decrease by 1000
        summary_after = earnings_service.get_farmer_earnings_summary(db_session, farmer_profile.id)
        assert summary_after.available_balance == Decimal("1800.00")

    def test_5_admin_process_and_complete_payout(self, db_session, admin_user, farmer_user_and_profile, buyer_user):
        user, farmer_profile = farmer_user_and_profile
        order, _ = create_sample_delivered_order(db_session, buyer_user, farmer_profile, "MD-EARN-5")
        earnings_service.create_earnings_for_delivered_order(db_session, order, admin_user.id)
        db_session.commit()

        payout = payouts_service.request_payout(
            db_session,
            farmer_profile,
            type("Req", (), {"amount": Decimal("1000.00")})(),
            user.id,
        )

        # Admin processes payout
        res = payouts_service.update_payout_status(
            db=db_session,
            payout_id=payout.id,
            new_status="PROCESSING",
            failure_reason=None,
            provider_payout_id="TXN-123456",
            admin_user_id=admin_user.id,
        )
        assert res.status == "PROCESSING"

        # Admin completes payout
        res = payouts_service.update_payout_status(
            db=db_session,
            payout_id=payout.id,
            new_status="COMPLETED",
            failure_reason=None,
            provider_payout_id="TXN-123456",
            admin_user_id=admin_user.id,
        )
        assert res.status == "COMPLETED"

    def test_6_audit_log_created(self, db_session, admin_user, farmer_user_and_profile, buyer_user):
        user, farmer_profile = farmer_user_and_profile
        order, _ = create_sample_delivered_order(db_session, buyer_user, farmer_profile, "MD-EARN-6")
        earnings_service.create_earnings_for_delivered_order(db_session, order, admin_user.id)
        db_session.commit()

        payouts_service.request_payout(
            db_session,
            farmer_profile,
            type("Req", (), {"amount": Decimal("500.00")})(),
            user.id,
        )

        logs = db_session.query(FinancialAuditLog).all()
        assert len(logs) >= 2

    def test_7_multi_farmer_order_isolation(self, db_session, admin_user, farmer_user_and_profile, buyer_user):
        _, farmer_a = farmer_user_and_profile

        # Create second farmer
        from app.models.profile import Profile
        p2 = Profile(
            auth_user_id="farmer-b-auth-id-999",
            email="farmerb.earn@example.com",
            full_name="Farmer B Earn",
            phone="+919876543999",
            role=UserRole.FARMER.value,
        )
        db_session.add(p2)
        db_session.flush()

        farmer_b = FarmerProfile(
            profile_id=p2.id,
            address_line="Farm B St",
            village="Village B",
            mandal="Mandal B",
            district="District B",
            state="State B",
            pincode="500002",
        )
        db_session.add(farmer_b)
        db_session.flush()

        # Multi-farmer order: Item 1 -> Farmer A, Item 2 -> Farmer B
        multi_order = Order(
            order_number="MD-MULTI-FARMER-2002",
            buyer_user_id=buyer_user.id,
            status=OrderStatus.OUT_FOR_DELIVERY.value,
            payment_status="PAID",
            subtotal=Decimal("4550.00"),
            delivery_fee=Decimal("100.00"),
            total_amount=Decimal("4650.00"),
            delivery_address_snapshot={"address": "Multi Dest"},
        )
        db_session.add(multi_order)
        db_session.flush()

        item_a = OrderItem(
            order_id=multi_order.id,
            produce_listing_id="dummy-a",
            farmer_profile_id=farmer_a.id,
            product_name="Tomatoes",
            quantity=Decimal("100.00"),
            quantity_unit="KG",
            unit_price=Decimal("28.00"),
            subtotal=Decimal("2800.00"),
        )
        item_b = OrderItem(
            order_id=multi_order.id,
            produce_listing_id="dummy-b",
            farmer_profile_id=farmer_b.id,
            product_name="Onions",
            quantity=Decimal("50.00"),
            quantity_unit="KG",
            unit_price=Decimal("35.00"),
            subtotal=Decimal("1750.00"),
        )
        db_session.add_all([item_a, item_b])
        db_session.commit()

        earnings_service.create_earnings_for_delivered_order(db_session, multi_order, admin_user.id)
        db_session.commit()

        # Verify Farmer A earnings
        list_a = earnings_service.get_farmer_earnings_list(db_session, farmer_a.id)
        for item in list_a.items:
            assert item.farmer_profile_id == farmer_a.id

        # Verify Farmer B earnings
        list_b = earnings_service.get_farmer_earnings_list(db_session, farmer_b.id)
        assert len(list_b.items) == 1
        assert list_b.items[0].product_name == "Onions"
        assert list_b.items[0].gross_amount == Decimal("1750.00")
