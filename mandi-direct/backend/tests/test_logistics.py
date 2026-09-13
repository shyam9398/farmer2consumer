from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import pytest
from app.models.address import BuyerAddress
from app.models.enums import (
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
from app.models.logistics import CollectionPoint, OrderLogistics
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.produce import ProduceListing


def auth_header_for(make_auth_header, user):
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    return make_auth_header(user.auth_user_id, user.email, role_val)


@pytest.fixture
def buyer_user(create_test_user, db_session):
    profile = create_test_user(
        auth_user_id="auth-buyer-log-001",
        email="buyer.raj@mandidirect.in",
        full_name="Raj Wholesale Mart",
        role=UserRole.BUYER,
    )
    profile.phone = "+919876500001"
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture
def buyer_user_b(create_test_user, db_session):
    profile = create_test_user(
        auth_user_id="auth-buyer-log-002",
        email="buyer.amit@mandidirect.in",
        full_name="Amit Retail Store",
        role=UserRole.BUYER,
    )
    profile.phone = "+919876500002"
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture
def farmer_user_a(create_test_user, db_session):
    profile = create_test_user(
        auth_user_id="auth-farmer-log-001",
        email="farmer.suresh@mandidirect.in",
        full_name="Suresh Reddy",
        role=UserRole.FARMER,
    )
    profile.phone = "+919876500010"
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture
def farmer_user_b(create_test_user, db_session):
    profile = create_test_user(
        auth_user_id="auth-farmer-log-002",
        email="farmer.naresh@mandidirect.in",
        full_name="Naresh Rao",
        role=UserRole.FARMER,
    )
    profile.phone = "+919876500020"
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture
def admin_user(create_test_user, db_session):
    profile = create_test_user(
        auth_user_id="auth-admin-log-001",
        email="admin.logistics@mandidirect.in",
        full_name="Super Admin",
        role=UserRole.ADMIN,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture
def setup_logistics_environment(db_session, farmer_user_a, farmer_user_b, buyer_user):
    # Farmer A
    fp_a = FarmerProfile(
        profile_id=farmer_user_a.id,
        address_line="Farm Gate Road",
        village="Narsapur",
        mandal="Narsapur",
        district="Medak",
        state="Telangana",
        pincode="502313",
    )
    db_session.add(fp_a)
    db_session.flush()

    farm_a = Farm(
        farmer_profile_id=fp_a.id,
        farm_name="Reddy Organic Farms",
        total_area=Decimal("12.5"),
        area_unit="ACRE",
        ownership_type="OWNED",
        village="Narsapur",
        mandal="Narsapur",
        district="Medak",
        state="Telangana",
        pincode="502313",
    )
    db_session.add(farm_a)
    db_session.flush()

    today = date.today()
    produce_a = ProduceListing(
        farmer_profile_id=fp_a.id,
        farm_id=farm_a.id,
        product_name="Desi Tomatoes",
        category=ProductCategory.VEGETABLE.value,
        variety="Vaishnavi Special",
        quality_grade=QualityGrade.GRADE_A.value,
        total_quantity=Decimal("500.00"),
        available_quantity=Decimal("500.00"),
        reserved_quantity=Decimal("0.00"),
        sold_quantity=Decimal("0.00"),
        quantity_unit=QuantityUnit.KG.value,
        expected_price=Decimal("28.00"),
        price_unit=PriceUnit.PER_KG.value,
        minimum_order_quantity=Decimal("10.00"),
        harvest_date=today,
        available_from=today,
        available_until=today + timedelta(days=14),
        status=ProduceStatus.LISTED.value,
    )
    db_session.add(produce_a)

    # Farmer B
    fp_b = FarmerProfile(
        profile_id=farmer_user_b.id,
        address_line="Kalyani Road",
        village="Toopran",
        mandal="Toopran",
        district="Medak",
        state="Telangana",
        pincode="502334",
    )
    db_session.add(fp_b)
    db_session.flush()

    farm_b = Farm(
        farmer_profile_id=fp_b.id,
        farm_name="Naresh Agri Estate",
        total_area=Decimal("8.0"),
        area_unit="ACRE",
        ownership_type="OWNED",
        village="Toopran",
        mandal="Toopran",
        district="Medak",
        state="Telangana",
        pincode="502334",
    )
    db_session.add(farm_b)
    db_session.flush()

    produce_b = ProduceListing(
        farmer_profile_id=fp_b.id,
        farm_id=farm_b.id,
        product_name="Red Onions",
        category=ProductCategory.VEGETABLE.value,
        variety="Nashik Red",
        quality_grade=QualityGrade.GRADE_A.value,
        total_quantity=Decimal("300.00"),
        available_quantity=Decimal("300.00"),
        reserved_quantity=Decimal("0.00"),
        sold_quantity=Decimal("0.00"),
        quantity_unit=QuantityUnit.KG.value,
        expected_price=Decimal("35.00"),
        price_unit=PriceUnit.PER_KG.value,
        minimum_order_quantity=Decimal("10.00"),
        harvest_date=today,
        available_from=today,
        available_until=today + timedelta(days=14),
        status=ProduceStatus.LISTED.value,
    )
    db_session.add(produce_b)

    # Buyer Address
    addr = BuyerAddress(
        buyer_user_id=buyer_user.id,
        full_name="Raj Wholesale Mart",
        phone="+919876500001",
        address_line1="Shop 42, Bowenpally Market Yard",
        village="Bowenpally",
        mandal="Secunderabad",
        district="Hyderabad",
        state="Telangana",
        pincode="500011",
        is_default=True,
    )
    db_session.add(addr)

    # Collection Point
    cp = CollectionPoint(
        name="Medak Central FPO Aggregation Hub",
        description="FPO aggregation and cold storage hub",
        address="Plot 5, Industrial Area, Medak",
        village="Medak Town",
        mandal="Medak",
        district="Medak",
        state="Telangana",
        pincode="502110",
        contact_name="Ramesh Sharma",
        contact_phone="+919440011223",
        is_active=True,
    )
    db_session.add(cp)

    db_session.commit()
    return {
        "farmer_profile_a": fp_a,
        "farmer_profile_b": fp_b,
        "produce_a": produce_a,
        "produce_b": produce_b,
        "buyer_address": addr,
        "collection_point": cp,
    }


def create_sample_order(db_session, buyer_user, setup_env, multi_farmer: bool = True):
    """Helper to construct a DB order with multi-farmer or single farmer items."""
    fp_a = setup_env["farmer_profile_a"]
    fp_b = setup_env["farmer_profile_b"]
    prod_a = setup_env["produce_a"]
    prod_b = setup_env["produce_b"]
    addr = setup_env["buyer_address"]
    cp = setup_env["collection_point"]

    items = [
        OrderItem(
            produce_listing_id=prod_a.id,
            farmer_profile_id=fp_a.id,
            product_name=prod_a.product_name,
            quantity=Decimal("100.00"),
            quantity_unit="KG",
            unit_price=Decimal("28.00"),
            subtotal=Decimal("2800.00"),
        )
    ]
    if multi_farmer:
        items.append(
            OrderItem(
                produce_listing_id=prod_b.id,
                farmer_profile_id=fp_b.id,
                product_name=prod_b.product_name,
                quantity=Decimal("50.00"),
                quantity_unit="KG",
                unit_price=Decimal("35.00"),
                subtotal=Decimal("1750.00"),
            )
        )

    subtotal = sum(i.subtotal for i in items)
    order = Order(
        order_number=f"MD-TEST-{datetime.now().strftime('%f')}",
        buyer_user_id=buyer_user.id,
        status=OrderStatus.PENDING.value,
        payment_status=PaymentStatus.PENDING.value,
        subtotal=subtotal,
        delivery_fee=Decimal("0.00"),
        total_amount=subtotal,
        delivery_address_id=addr.id,
        delivery_address_snapshot={
            "full_name": addr.full_name,
            "phone": addr.phone,
            "address_line1": addr.address_line1,
            "district": addr.district,
            "state": addr.state,
            "pincode": addr.pincode,
        },
        items=items,
    )
    db_session.add(order)
    db_session.flush()

    history = OrderStatusHistory(
        order_id=order.id,
        previous_status=None,
        new_status=OrderStatus.PENDING.value,
        changed_by=buyer_user.id,
        reason="Order placed.",
    )
    db_session.add(history)

    logistics = OrderLogistics(
        order_id=order.id,
        collection_type="COLLECTION_POINT",
        collection_point_id=cp.id,
        pickup_address=cp.address,
        pickup_district=cp.district,
        pickup_state=cp.state,
        pickup_pincode=cp.pincode,
        delivery_address=addr.address_line1,
        delivery_district=addr.district,
        delivery_state=addr.state,
        delivery_pincode=addr.pincode,
    )
    db_session.add(logistics)

    db_session.commit()
    db_session.refresh(order)
    return order


# ==============================================================================
# 21 Test Scenarios
# ==============================================================================

class TestLogisticsWorkflow:
    def test_1_farmer_can_see_own_order(self, client, make_auth_header, farmer_user_a, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment, multi_farmer=True)
        headers = auth_header_for(make_auth_header, farmer_user_a)

        response = client.get("/api/v1/farmer/orders", headers=headers)
        assert response.status_code == 200
        orders = response.json()
        assert len(orders) >= 1
        assert any(o["id"] == order.id for o in orders)

    def test_2_farmer_cannot_see_another_farmers_items(self, client, make_auth_header, farmer_user_a, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment, multi_farmer=True)
        headers = auth_header_for(make_auth_header, farmer_user_a)

        response = client.get(f"/api/v1/farmer/orders/{order.id}", headers=headers)
        assert response.status_code == 200
        data = response.json()

        # Farmer A should ONLY see Tomatoes (not Onions)
        assert len(data["items"]) == 1
        assert data["items"][0]["product_name"] == "Desi Tomatoes"
        assert Decimal(str(data["farmer_subtotal"])) == Decimal("2800.00")

    def test_3_buyer_can_see_own_order_logistics(self, client, make_auth_header, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        headers = auth_header_for(make_auth_header, buyer_user)

        response = client.get(f"/api/v1/orders/{order.id}/logistics", headers=headers)
        assert response.status_code == 200
        logistics = response.json()
        assert logistics["order_id"] == order.id
        assert logistics["collection_point"]["name"] == "Medak Central FPO Aggregation Hub"

    def test_4_buyer_cannot_access_another_buyers_logistics(self, client, make_auth_header, buyer_user, buyer_user_b, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        headers_b = auth_header_for(make_auth_header, buyer_user_b)

        response = client.get(f"/api/v1/orders/{order.id}/logistics", headers=headers_b)
        assert response.status_code == 403

    def test_5_unauthenticated_cannot_access_farmer_orders(self, client):
        response = client.get("/api/v1/farmer/orders")
        assert response.status_code == 401

    def test_6_farmer_accept_order_works(self, client, make_auth_header, farmer_user_a, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        headers = auth_header_for(make_auth_header, farmer_user_a)

        response = client.patch(
            f"/api/v1/farmer/orders/{order.id}/status",
            headers=headers,
            json={"status": "ACCEPTED", "reason": "Farmer accepted lot fulfillment"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ACCEPTED"

    def test_7_farmer_reject_order_works_with_reason(self, client, make_auth_header, farmer_user_a, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        headers = auth_header_for(make_auth_header, farmer_user_a)

        response = client.patch(
            f"/api/v1/farmer/orders/{order.id}/status",
            headers=headers,
            json={"status": "REJECTED", "reason": "Unexpected frost damage on tomato crops."},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "REJECTED"

    def test_8_rejection_without_reason_fails(self, client, make_auth_header, farmer_user_a, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        headers = auth_header_for(make_auth_header, farmer_user_a)

        response = client.patch(
            f"/api/v1/farmer/orders/{order.id}/status",
            headers=headers,
            json={"status": "REJECTED", "reason": ""},
        )
        assert response.status_code in [400, 422]

    def test_9_accepted_to_preparing_works(self, client, make_auth_header, farmer_user_a, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        headers = auth_header_for(make_auth_header, farmer_user_a)

        # Transition to ACCEPTED first
        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=headers, json={"status": "ACCEPTED"})
        # Now mark PREPARING
        res = client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=headers, json={"status": "PREPARING"})
        assert res.status_code == 200
        assert res.json()["status"] == "PREPARING"

    def test_10_preparing_to_ready_for_pickup_works(self, client, make_auth_header, farmer_user_a, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        headers = auth_header_for(make_auth_header, farmer_user_a)

        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=headers, json={"status": "ACCEPTED"})
        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=headers, json={"status": "PREPARING"})
        res = client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=headers, json={"status": "READY_FOR_PICKUP"})
        assert res.status_code == 200
        assert res.json()["status"] == "READY_FOR_PICKUP"

    def test_11_cannot_jump_pending_to_delivered(self, client, make_auth_header, admin_user, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        headers = auth_header_for(make_auth_header, admin_user)

        # Attempting delivery confirmation while still PENDING must fail
        res = client.post(
            f"/api/v1/admin/orders/{order.id}/delivery/complete",
            headers=headers,
            json={"recipient_name": "Rajesh Kumar", "confirmation_type": "MANUAL"},
        )
        assert res.status_code == 400

    def test_12_ready_for_pickup_to_picked_up_via_admin(self, client, make_auth_header, farmer_user_a, admin_user, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        f_headers = auth_header_for(make_auth_header, farmer_user_a)
        a_headers = auth_header_for(make_auth_header, admin_user)

        # Advance to READY_FOR_PICKUP
        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=f_headers, json={"status": "ACCEPTED"})
        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=f_headers, json={"status": "PREPARING"})
        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=f_headers, json={"status": "READY_FOR_PICKUP"})

        # Admin schedules pickup
        future_time = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
        res_sched = client.post(
            f"/api/v1/admin/orders/{order.id}/pickup/schedule",
            headers=a_headers,
            json={"pickup_scheduled_at": future_time, "assigned_agent_name": "Vijay Driver", "vehicle_number": "TS08EA1234"},
        )
        assert res_sched.status_code == 200

        # Admin completes pickup
        res_complete = client.post(
            f"/api/v1/admin/orders/{order.id}/pickup/complete",
            headers=a_headers,
            json={"notes": "Loaded 150 KG produce into truck #TS08EA1234"},
        )
        assert res_complete.status_code == 200
        assert res_complete.json()["pickup_completed_at"] is not None

        # Verify order status in DB
        db_session.refresh(order)
        assert order.status == "PICKED_UP"

    def test_13_picked_up_to_out_for_delivery(self, client, make_auth_header, farmer_user_a, admin_user, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        f_headers = auth_header_for(make_auth_header, farmer_user_a)
        a_headers = auth_header_for(make_auth_header, admin_user)

        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=f_headers, json={"status": "ACCEPTED"})
        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=f_headers, json={"status": "PREPARING"})
        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=f_headers, json={"status": "READY_FOR_PICKUP"})
        client.post(f"/api/v1/admin/orders/{order.id}/pickup/complete", headers=a_headers, json={})

        res_dispatch = client.post(
            f"/api/v1/admin/orders/{order.id}/delivery/start",
            headers=a_headers,
            json={"notes": "Departed Medak Aggregation Hub for Hyderabad buyer."},
        )
        assert res_dispatch.status_code == 200
        assert res_dispatch.json()["delivery_started_at"] is not None

        db_session.refresh(order)
        assert order.status == "OUT_FOR_DELIVERY"

    def test_14_out_for_delivery_to_delivered_with_confirmation(self, client, make_auth_header, farmer_user_a, admin_user, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        f_headers = auth_header_for(make_auth_header, farmer_user_a)
        a_headers = auth_header_for(make_auth_header, admin_user)

        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=f_headers, json={"status": "ACCEPTED"})
        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=f_headers, json={"status": "PREPARING"})
        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=f_headers, json={"status": "READY_FOR_PICKUP"})
        client.post(f"/api/v1/admin/orders/{order.id}/pickup/complete", headers=a_headers, json={})
        client.post(f"/api/v1/admin/orders/{order.id}/delivery/start", headers=a_headers, json={})

        res_delivered = client.post(
            f"/api/v1/admin/orders/{order.id}/delivery/complete",
            headers=a_headers,
            json={"recipient_name": "Raj Wholesale Warehouse Mgr", "confirmation_type": "MANUAL", "notes": "Handover verified in good condition."},
        )
        assert res_delivered.status_code == 200
        assert res_delivered.json()["delivery_completed_at"] is not None
        assert res_delivered.json()["delivery_confirmation"]["recipient_name"] == "Raj Wholesale Warehouse Mgr"

        db_session.refresh(order)
        assert order.status == "DELIVERED"

    def test_15_cannot_mark_delivered_before_pickup(self, client, make_auth_header, admin_user, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        a_headers = auth_header_for(make_auth_header, admin_user)

        res = client.post(
            f"/api/v1/admin/orders/{order.id}/delivery/complete",
            headers=a_headers,
            json={"recipient_name": "Raj", "confirmation_type": "MANUAL"},
        )
        assert res.status_code == 400

    def test_16_duplicate_pickup_completion_fails_with_409(self, client, make_auth_header, farmer_user_a, admin_user, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        f_headers = auth_header_for(make_auth_header, farmer_user_a)
        a_headers = auth_header_for(make_auth_header, admin_user)

        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=f_headers, json={"status": "ACCEPTED"})
        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=f_headers, json={"status": "PREPARING"})
        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=f_headers, json={"status": "READY_FOR_PICKUP"})

        # First pickup succeeds
        res1 = client.post(f"/api/v1/admin/orders/{order.id}/pickup/complete", headers=a_headers, json={})
        assert res1.status_code == 200

        # Second pickup attempts conflict
        res2 = client.post(f"/api/v1/admin/orders/{order.id}/pickup/complete", headers=a_headers, json={})
        assert res2.status_code == 409

    def test_17_admin_collection_point_crud(self, client, make_auth_header, admin_user):
        headers = auth_header_for(make_auth_header, admin_user)

        # Create
        res_create = client.post(
            "/api/v1/admin/collection-points",
            headers=headers,
            json={
                "name": "Narsapur Farmer Producer Aggregation Point",
                "description": "FPO storage facility",
                "address": "Gajwel Highway Junction",
                "village": "Narsapur",
                "district": "Medak",
                "state": "Telangana",
                "pincode": "502313",
                "contact_name": "Venkat Rao",
                "contact_phone": "+919876543210",
                "is_active": True,
            },
        )
        assert res_create.status_code == 201
        point_id = res_create.json()["id"]

        # Read
        res_get = client.get(f"/api/v1/admin/collection-points/{point_id}", headers=headers)
        assert res_get.status_code == 200
        assert res_get.json()["name"] == "Narsapur Farmer Producer Aggregation Point"

        # Update
        res_put = client.put(
            f"/api/v1/admin/collection-points/{point_id}",
            headers=headers,
            json={"contact_name": "Venkat Rao Senior"},
        )
        assert res_put.status_code == 200
        assert res_put.json()["contact_name"] == "Venkat Rao Senior"

        # Delete
        res_del = client.delete(f"/api/v1/admin/collection-points/{point_id}", headers=headers)
        assert res_del.status_code == 204

    def test_18_non_admin_cannot_create_collection_point(self, client, make_auth_header, farmer_user_a, buyer_user):
        f_headers = auth_header_for(make_auth_header, farmer_user_a)
        b_headers = auth_header_for(make_auth_header, buyer_user)

        body = {
            "name": "Unauthorized Hub",
            "address": "Some road",
            "district": "Medak",
            "state": "Telangana",
            "pincode": "502313",
            "contact_name": "Test",
            "contact_phone": "+919000000000",
        }
        res_f = client.post("/api/v1/admin/collection-points", headers=f_headers, json=body)
        assert res_f.status_code == 403

        res_b = client.post("/api/v1/admin/collection-points", headers=b_headers, json=body)
        assert res_b.status_code == 403

    def test_19_logistics_information_persists(self, client, make_auth_header, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        headers = auth_header_for(make_auth_header, buyer_user)

        res = client.get(f"/api/v1/buyer/orders/{order.id}", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["logistics"] is not None
        assert data["logistics"]["collection_point"]["name"] == "Medak Central FPO Aggregation Hub"

    def test_20_status_history_created_for_transitions(self, client, make_auth_header, farmer_user_a, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment)
        f_headers = auth_header_for(make_auth_header, farmer_user_a)

        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=f_headers, json={"status": "ACCEPTED", "reason": "Confirmed produce lots"})
        client.patch(f"/api/v1/farmer/orders/{order.id}/status", headers=f_headers, json={"status": "PREPARING", "reason": "Harvesting and cleaning"})

        db_session.refresh(order)
        statuses = [h.new_status for h in order.status_history]
        assert "PENDING" in statuses
        assert "ACCEPTED" in statuses
        assert "PREPARING" in statuses

    def test_21_multi_farmer_order_isolation(self, client, make_auth_header, farmer_user_a, farmer_user_b, buyer_user, setup_logistics_environment, db_session):
        order = create_sample_order(db_session, buyer_user, setup_logistics_environment, multi_farmer=True)

        headers_a = auth_header_for(make_auth_header, farmer_user_a)
        res_a = client.get(f"/api/v1/farmer/orders/{order.id}", headers=headers_a)
        assert res_a.status_code == 200
        items_a = res_a.json()["items"]
        assert len(items_a) == 1
        assert items_a[0]["product_name"] == "Desi Tomatoes"

        headers_b = auth_header_for(make_auth_header, farmer_user_b)
        res_b = client.get(f"/api/v1/farmer/orders/{order.id}", headers=headers_b)
        assert res_b.status_code == 200
        items_b = res_b.json()["items"]
        assert len(items_b) == 1
        assert items_b[0]["product_name"] == "Red Onions"
