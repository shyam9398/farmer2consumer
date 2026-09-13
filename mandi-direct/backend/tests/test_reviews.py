import pytest
from decimal import Decimal
from fastapi import status
from app.models.enums import OrderStatus, PaymentStatus, UserRole
from app.models.farmer import FarmerProfile
from app.models.order import Order, OrderItem


def test_farmer_reviews_and_ratings(client, db_session, create_test_user, make_auth_header):
    # 1. Create farmer and buyer users
    farmer_user = create_test_user(
        auth_user_id="auth-farmer-rev-1",
        email="farmer.rev@mandidirect.in",
        full_name="Venkatesh Rao",
        role=UserRole.FARMER,
    )
    farmer_profile = FarmerProfile(
        profile_id=farmer_user.id,
        address_line="Main Road",
        village="Tenali",
        mandal="Tenali",
        district="Guntur",
        state="Andhra Pradesh",
        pincode="522201",
    )
    db_session.add(farmer_profile)

    buyer_user = create_test_user(
        auth_user_id="auth-buyer-rev-1",
        email="buyer.rev@mandidirect.in",
        full_name="Ramesh Kumar",
        role=UserRole.BUYER,
    )
    db_session.commit()

    buyer_header = make_auth_header(buyer_user.auth_user_id, buyer_user.email)

    # 2. Create order in PENDING status
    order = Order(
        order_number="MD-2026-TEST-REV",
        buyer_user_id=buyer_user.id,
        status=OrderStatus.PENDING.value,
        payment_status=PaymentStatus.PAID.value,
        subtotal=Decimal("1500.00"),
        delivery_fee=Decimal("100.00"),
        total_amount=Decimal("1600.00"),
        delivery_address_snapshot={"district": "Guntur", "state": "Andhra Pradesh"},
    )
    db_session.add(order)
    db_session.flush()

    item = OrderItem(
        order_id=order.id,
        produce_listing_id="sample-produce-id",
        farmer_profile_id=farmer_profile.id,
        product_name="Organic Rice",
        quantity=Decimal("50"),
        quantity_unit="KG",
        unit_price=Decimal("30.00"),
        subtotal=Decimal("1500.00"),
    )
    db_session.add(item)
    db_session.commit()

    # 3. Attempting review on PENDING order must be rejected
    review_payload = {"rating": 5, "comment": "Excellent quality harvest!"}
    res_pending = client.post(
        f"/api/v1/orders/{order.id}/items/{item.id}/review",
        json=review_payload,
        headers=buyer_header,
    )
    assert res_pending.status_code == status.HTTP_400_BAD_REQUEST

    # 4. Advance order to DELIVERED
    order.status = OrderStatus.DELIVERED.value
    db_session.commit()

    # 5. Submit review successfully
    res_delivered = client.post(
        f"/api/v1/orders/{order.id}/items/{item.id}/review",
        json=review_payload,
        headers=buyer_header,
    )
    assert res_delivered.status_code == status.HTTP_201_CREATED, res_delivered.text
    rev_data = res_delivered.json()
    assert rev_data["rating"] == 5
    assert rev_data["buyer_display_name"] == "Ramesh K."

    # 6. Duplicate review for the same order item must be rejected (409)
    res_dup = client.post(
        f"/api/v1/orders/{order.id}/items/{item.id}/review",
        json=review_payload,
        headers=buyer_header,
    )
    assert res_dup.status_code == status.HTTP_409_CONFLICT

    # 7. Check public-safe farmer reviews summary
    res_summary = client.get(f"/api/v1/farmers/{farmer_profile.id}/reviews")
    assert res_summary.status_code == status.HTTP_200_OK
    summary_data = res_summary.json()
    assert summary_data["average_rating"] == 5.0
    assert summary_data["total_reviews"] == 1
    assert summary_data["rating_distribution"]["5"] == 1
    assert len(summary_data["recent_reviews"]) == 1
    assert summary_data["recent_reviews"][0]["buyer_display_name"] == "Ramesh K."
