import pytest
from decimal import Decimal
from fastapi import status
from app.models.enums import OrderStatus, PaymentStatus, UserRole
from app.models.farmer import FarmerProfile
from app.models.logistics import CollectionPoint
from app.models.notification import Notification
from app.models.order import Order, OrderItem
from app.models.vehicle import Vehicle


def test_buyer_logistics_and_live_tracking_flow(client, db_session, create_test_user, make_auth_header):
    # 1. Setup users
    buyer = create_test_user(
        auth_user_id="auth-buyer-log-1",
        email="buyer.logistics@mandidirect.in",
        full_name="Anand Reddy",
        role=UserRole.BUYER,
    )
    logistics_user = create_test_user(
        auth_user_id="auth-log-partner-1",
        email="partner.log@mandidirect.in",
        full_name="QuickMandi Logistics",
        role=UserRole.LOGISTICS,
    )
    farmer_user = create_test_user(
        auth_user_id="auth-farmer-log-1",
        email="farmer.log@mandidirect.in",
        full_name="Gopala Rao",
        role=UserRole.FARMER,
    )
    farmer_profile = FarmerProfile(
        profile_id=farmer_user.id,
        address_line="Paddy Field Road",
        village="Tenali",
        mandal="Tenali",
        district="Guntur",
        state="Andhra Pradesh",
        pincode="522201",
    )
    db_session.add(farmer_profile)

    # 2. Setup collection point
    hub = CollectionPoint(
        name="Tenali Village Aggregation Hub",
        address="Near Main APMC Market, Tenali",
        district="Guntur",
        state="Andhra Pradesh",
        pincode="522201",
        latitude=16.2437,
        longitude=80.6400,
        contact_name="Srinivas",
        contact_phone="+919876543200",
        is_active=True,
    )
    db_session.add(hub)

    # 3. Setup logistics vehicle
    vehicle = Vehicle(
        logistics_user_id=logistics_user.id,
        vehicle_number="AP 07 TJ 1122",
        vehicle_type="PICKUP_VAN",
        capacity=Decimal("1200.0"),
        availability_status="AVAILABLE",
    )
    db_session.add(vehicle)

    # 4. Setup order
    order = Order(
        order_number="MD-2026-LOG-TEST",
        buyer_user_id=buyer.id,
        status=OrderStatus.PENDING.value,
        payment_status=PaymentStatus.PAID.value,
        subtotal=Decimal("3000.00"),
        delivery_fee=Decimal("150.00"),
        total_amount=Decimal("3150.00"),
        delivery_address_snapshot={
            "street_address": "Flat 402, Green Towers",
            "district": "Vijayawada",
            "state": "Andhra Pradesh",
            "pincode": "520002",
            "latitude": 16.5062,
            "longitude": 80.6480,
        },
    )
    db_session.add(order)
    db_session.flush()

    item = OrderItem(
        order_id=order.id,
        produce_listing_id="sample-produce-p1",
        farmer_profile_id=farmer_profile.id,
        product_name="Kurnool Sona Rice",
        quantity=Decimal("100"),
        quantity_unit="KG",
        unit_price=Decimal("30.00"),
        subtotal=Decimal("3000.00"),
    )
    db_session.add(item)
    db_session.commit()

    buyer_header = make_auth_header(buyer.auth_user_id, buyer.email)
    logistics_header = make_auth_header(logistics_user.auth_user_id, logistics_user.email)

    # 5. Buyer books logistics
    res_book = client.post(f"/api/v1/orders/{order.id}/book-logistics", headers=buyer_header)
    assert res_book.status_code == status.HTTP_200_OK, res_book.text
    book_data = res_book.json()
    assert book_data["order_id"] == order.id

    # 6. Logistics user lists bookings
    res_bookings = client.get("/api/v1/logistics/bookings", headers=logistics_header)
    assert res_bookings.status_code == status.HTTP_200_OK
    bookings = res_bookings.json()["items"]
    assert any(b["order_id"] == order.id for b in bookings)

    # 7. Logistics user accepts booking and assigns vehicle
    accept_payload = {"vehicle_id": vehicle.id}
    res_accept = client.post(f"/api/v1/logistics/bookings/{order.id}/accept", json=accept_payload, headers=logistics_header)
    assert res_accept.status_code == status.HTTP_200_OK
    assert res_accept.json()["vehicle_number"] == "AP 07 TJ 1122"

    # Verify vehicle availability changed to ASSIGNED
    db_session.refresh(vehicle)
    assert vehicle.availability_status == "ASSIGNED"

    # 8. Milestone status update: AT_COLLECTION
    status_payload = {"status": "AT_COLLECTION", "latitude": 16.2437, "longitude": 80.6400}
    res_status = client.post(f"/api/v1/logistics/bookings/{order.id}/status", json=status_payload, headers=logistics_header)
    assert res_status.status_code == status.HTTP_200_OK

    # Verify notification created for buyer
    notifs = db_session.query(Notification).filter(Notification.recipient_user_id == buyer.id).all()
    assert len(notifs) >= 1
    assert any("Hub" in n.title or "hub" in n.message.lower() for n in notifs)

    # 9. Broadcast live vehicle coordinates
    loc_payload = {"latitude": 16.3500, "longitude": 80.6440}
    res_loc = client.post(f"/api/v1/logistics/bookings/{order.id}/location", json=loc_payload, headers=logistics_header)
    assert res_loc.status_code == status.HTTP_200_OK
    assert res_loc.json()["latitude"] == 16.3500
