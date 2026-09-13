from datetime import date, timedelta
from decimal import Decimal
import pytest
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
from app.models.produce import ProduceListing


@pytest.fixture
def buyer_user(create_test_user, db_session):
    """Create a BUYER profile."""
    profile = create_test_user(
        auth_user_id="auth-buyer-p8-001",
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
    """Create a second BUYER profile for tenant isolation tests."""
    profile = create_test_user(
        auth_user_id="auth-buyer-p8-002",
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
    """Create a primary FARMER profile."""
    profile = create_test_user(
        auth_user_id="auth-farmer-p8-001",
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
    """Create a second FARMER profile for multi-farmer isolation."""
    profile = create_test_user(
        auth_user_id="auth-farmer-p8-002",
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
def setup_produce_environment(db_session, farmer_user_a, farmer_user_b):
    """Create farmer profiles, farms, and produce listings."""
    # Farmer A setup
    fp_a = FarmerProfile(
        profile_id=farmer_user_a.id,
        address_line="Farm Gate Road, Parcel 12",
        village="Narsapur",
        mandal="Narsapur",
        district="Medak",
        state="Telangana",
        pincode="502313",
    )
    db_session.add(fp_a)
    db_session.commit()
    db_session.refresh(fp_a)

    farm_a = Farm(
        farmer_profile_id=fp_a.id,
        farm_name="Reddy Organic Greens",
        total_area=Decimal("10.0"),
        area_unit="ACRE",
        ownership_type="OWNED",
        primary_crops=["Tomato", "Capsicum"],
        village="Narsapur",
        mandal="Narsapur",
        district="Medak",
        state="Telangana",
        pincode="502313",
    )
    db_session.add(farm_a)
    db_session.commit()
    db_session.refresh(farm_a)

    today = date.today()
    tomato = ProduceListing(
        farmer_profile_id=fp_a.id,
        farm_id=farm_a.id,
        product_name="Farm Fresh Red Tomatoes",
        category=ProductCategory.VEGETABLE.value,
        variety="Roma Hybrid",
        total_quantity=Decimal("500.00"),
        available_quantity=Decimal("500.00"),
        reserved_quantity=Decimal("0.00"),
        sold_quantity=Decimal("0.00"),
        quantity_unit=QuantityUnit.KG.value,
        quality_grade=QualityGrade.GRADE_A.value,
        harvest_date=today,
        available_from=today,
        available_until=today + timedelta(days=14),
        expected_price=Decimal("28.00"),
        price_unit=PriceUnit.PER_KG.value,
        minimum_order_quantity=Decimal("10.00"),
        status=ProduceStatus.LISTED.value,
    )
    draft_capsicum = ProduceListing(
        farmer_profile_id=fp_a.id,
        farm_id=farm_a.id,
        product_name="Draft Green Capsicum",
        category=ProductCategory.VEGETABLE.value,
        variety="California Wonder",
        total_quantity=Decimal("200.00"),
        available_quantity=Decimal("200.00"),
        reserved_quantity=Decimal("0.00"),
        sold_quantity=Decimal("0.00"),
        quantity_unit=QuantityUnit.KG.value,
        quality_grade=QualityGrade.GRADE_A.value,
        harvest_date=today,
        available_from=today,
        expected_price=Decimal("45.00"),
        price_unit=PriceUnit.PER_KG.value,
        minimum_order_quantity=Decimal("5.00"),
        status=ProduceStatus.DRAFT.value,
    )
    db_session.add_all([tomato, draft_capsicum])

    # Farmer B setup
    fp_b = FarmerProfile(
        profile_id=farmer_user_b.id,
        address_line="Paddy Fields Road, Plot 5",
        village="Kothur",
        mandal="Shadnagar",
        district="Ranga Reddy",
        state="Telangana",
        pincode="509216",
    )
    db_session.add(fp_b)
    db_session.commit()
    db_session.refresh(fp_b)

    farm_b = Farm(
        farmer_profile_id=fp_b.id,
        farm_name="Krishna Valley Paddy",
        total_area=Decimal("15.0"),
        area_unit="ACRE",
        ownership_type="OWNED",
        primary_crops=["Rice"],
        village="Kothur",
        mandal="Shadnagar",
        district="Ranga Reddy",
        state="Telangana",
        pincode="509216",
    )
    db_session.add(farm_b)
    db_session.commit()
    db_session.refresh(farm_b)

    rice = ProduceListing(
        farmer_profile_id=fp_b.id,
        farm_id=farm_b.id,
        product_name="Sona Masoori Rice",
        category=ProductCategory.GRAIN.value,
        variety="BPT 5204",
        total_quantity=Decimal("1000.00"),
        available_quantity=Decimal("1000.00"),
        reserved_quantity=Decimal("0.00"),
        sold_quantity=Decimal("0.00"),
        quantity_unit=QuantityUnit.KG.value,
        quality_grade=QualityGrade.PREMIUM.value,
        harvest_date=today,
        available_from=today,
        expected_price=Decimal("42.00"),
        price_unit=PriceUnit.PER_KG.value,
        minimum_order_quantity=Decimal("25.00"),
        status=ProduceStatus.LISTED.value,
    )
    db_session.add(rice)
    db_session.commit()

    return {
        "farmer_a": farmer_user_a,
        "farmer_profile_a": fp_a,
        "tomato": tomato,
        "draft_capsicum": draft_capsicum,
        "farmer_b": farmer_user_b,
        "farmer_profile_b": fp_b,
        "rice": rice,
    }


# ==============================================================================
# 1. Shopping Cart Tests
# ==============================================================================

def test_buyer_cart_lifecycle(client, buyer_user, setup_produce_environment, make_auth_header):
    """Test cart initialization, adding items, updating quantities, and clearing cart."""
    headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email)
    tomato = setup_produce_environment["tomato"]

    # 1. Initial cart is empty
    res = client.get("/api/v1/buyer/cart", headers=headers)
    assert res.status_code == 200
    cart_data = res.json()
    assert cart_data["item_count"] == 0
    assert Decimal(str(cart_data["subtotal"])) == Decimal("0.00")

    # 2. Add listed produce to cart
    add_payload = {"produce_listing_id": tomato.id, "quantity": 50.0}
    res = client.post("/api/v1/buyer/cart/items", json=add_payload, headers=headers)
    assert res.status_code == 200
    cart_data = res.json()
    assert cart_data["item_count"] == 1
    assert cart_data["items"][0]["produce_listing_id"] == tomato.id
    assert Decimal(str(cart_data["items"][0]["quantity"])) == Decimal("50.0")
    # Subtotal = 50 * 28 = 1400.00
    assert Decimal(str(cart_data["subtotal"])) == Decimal("1400.00")

    item_id = cart_data["items"][0]["id"]

    # 3. Adding same product increments quantity
    res = client.post("/api/v1/buyer/cart/items", json={"produce_listing_id": tomato.id, "quantity": 25.0}, headers=headers)
    assert res.status_code == 200
    cart_data = res.json()
    assert cart_data["item_count"] == 1
    assert Decimal(str(cart_data["items"][0]["quantity"])) == Decimal("75.0")
    # Subtotal = 75 * 28 = 2100.00
    assert Decimal(str(cart_data["subtotal"])) == Decimal("2100.00")

    # 4. Update quantity directly
    res = client.patch(f"/api/v1/buyer/cart/items/{item_id}", json={"quantity": 100.0}, headers=headers)
    assert res.status_code == 200
    cart_data = res.json()
    assert Decimal(str(cart_data["items"][0]["quantity"])) == Decimal("100.0")
    assert Decimal(str(cart_data["subtotal"])) == Decimal("2800.00")

    # 5. Remove item
    res = client.delete(f"/api/v1/buyer/cart/items/{item_id}", headers=headers)
    assert res.status_code == 200
    cart_data = res.json()
    assert cart_data["item_count"] == 0
    assert Decimal(str(cart_data["subtotal"])) == Decimal("0.00")


def test_cart_validations_and_guards(client, buyer_user, setup_produce_environment, make_auth_header):
    """Test stock limits, negative quantities, unlisted products, and tenant security."""
    headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email)
    tomato = setup_produce_environment["tomato"]
    draft_capsicum = setup_produce_environment["draft_capsicum"]

    # 1. Cannot add unlisted (DRAFT) produce
    res = client.post(
        "/api/v1/buyer/cart/items",
        json={"produce_listing_id": draft_capsicum.id, "quantity": 10.0},
        headers=headers,
    )
    assert res.status_code == 400
    assert "cannot be added to cart as it is currently DRAFT" in res.json()["detail"]

    # 2. Cannot add non-positive quantity
    res = client.post(
        "/api/v1/buyer/cart/items",
        json={"produce_listing_id": tomato.id, "quantity": 0},
        headers=headers,
    )
    assert res.status_code in (400, 422)

    res = client.post(
        "/api/v1/buyer/cart/items",
        json={"produce_listing_id": tomato.id, "quantity": -10},
        headers=headers,
    )
    assert res.status_code in (400, 422)

    # 3. Cannot request more than available stock (500 KG available)
    res = client.post(
        "/api/v1/buyer/cart/items",
        json={"produce_listing_id": tomato.id, "quantity": 550.0},
        headers=headers,
    )
    assert res.status_code == 400
    assert "exceeds currently available stock" in res.json()["detail"]


# ==============================================================================
# 2. Delivery Address Tests
# ==============================================================================

def test_buyer_address_crud_and_security(client, buyer_user, buyer_user_b, make_auth_header):
    """Test address creation, validation, default toggling, and cross-buyer isolation."""
    headers_a = make_auth_header(buyer_user.auth_user_id, buyer_user.email)
    headers_b = make_auth_header(buyer_user_b.auth_user_id, buyer_user_b.email)

    address_payload = {
        "full_name": "Rajesh Kumar",
        "phone": "+919876543210",
        "address_line1": "Warehouse 4A, APMC Yard",
        "address_line2": "Opposite Gate 2",
        "district": "Hyderabad",
        "state": "Telangana",
        "pincode": "500034",
        "is_default": True,
    }

    # 1. Invalid pincode rejected
    invalid_pin = {**address_payload, "pincode": "123"}
    res = client.post("/api/v1/buyer/addresses", json=invalid_pin, headers=headers_a)
    assert res.status_code == 422

    # 2. Invalid phone rejected
    invalid_phone = {**address_payload, "phone": "abcdef"}
    res = client.post("/api/v1/buyer/addresses", json=invalid_phone, headers=headers_a)
    assert res.status_code == 422

    # 3. Create valid address
    res = client.post("/api/v1/buyer/addresses", json=address_payload, headers=headers_a)
    assert res.status_code == 201
    addr_a = res.json()
    assert addr_a["full_name"] == "Rajesh Kumar"
    assert addr_a["is_default"] is True
    addr_a_id = addr_a["id"]

    # 4. Cross-buyer isolation: Buyer B cannot update or delete Buyer A's address
    res = client.put(
        f"/api/v1/buyer/addresses/{addr_a_id}",
        json={"full_name": "Hacker Attacker"},
        headers=headers_b,
    )
    assert res.status_code == 404

    res = client.delete(f"/api/v1/buyer/addresses/{addr_a_id}", headers=headers_b)
    assert res.status_code == 404


# ==============================================================================
# 3. Order Placement, Financials & Anti-Overselling Tests
# ==============================================================================

def test_order_creation_success_and_invariants(
    client, db_session, buyer_user, setup_produce_environment, make_auth_header
):
    """
    Test complete order placement:
    - Multi-farmer cart (Tomato + Rice)
    - Authoritative DB price snapshot (frontend cannot manipulate price)
    - Inventory decrements
    - Order number generation (MD-YYYYMMDD-XXXXX)
    - Status initialized to PENDING
    - Cart cleared
    """
    headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email)
    tomato = setup_produce_environment["tomato"]
    rice = setup_produce_environment["rice"]

    # 1. Create delivery address
    addr_payload = {
        "full_name": "Rajesh Kumar",
        "phone": "+919876543210",
        "address_line1": "Plot 18, Commercial Market Complex",
        "district": "Hyderabad",
        "state": "Telangana",
        "pincode": "500034",
    }
    addr_res = client.post("/api/v1/buyer/addresses", json=addr_payload, headers=headers)
    address_id = addr_res.json()["id"]

    # 2. Add 100 KG Tomato (₹28/KG = ₹2,800) and 50 KG Rice (₹42/KG = ₹2,100)
    client.post(
        "/api/v1/buyer/cart/items",
        json={"produce_listing_id": tomato.id, "quantity": 100.0},
        headers=headers,
    )
    client.post(
        "/api/v1/buyer/cart/items",
        json={"produce_listing_id": rice.id, "quantity": 50.0},
        headers=headers,
    )

    # 3. Place order
    order_payload = {
        "delivery_address_id": address_id,
        "buyer_notes": "Please package in 25kg gunny bags.",
    }
    res = client.post("/api/v1/buyer/orders", json=order_payload, headers=headers)
    assert res.status_code == 201
    order_data = res.json()

    assert order_data["order_number"].startswith("MD-")
    assert order_data["status"] == OrderStatus.PENDING.value
    assert order_data["payment_status"] == PaymentStatus.PENDING.value

    # Financial precision: Subtotal = 2,800 + 2,100 = 4,900.00
    assert Decimal(str(order_data["subtotal"])) == Decimal("4900.00")
    assert Decimal(str(order_data["delivery_fee"])) == Decimal("0.00")
    assert Decimal(str(order_data["total_amount"])) == Decimal("4900.00")
    assert len(order_data["items"]) == 2

    # Verify inventory was decremented in database
    db_session.refresh(tomato)
    db_session.refresh(rice)
    assert Decimal(tomato.available_quantity) == Decimal("400.00")
    assert Decimal(tomato.sold_quantity) == Decimal("100.00")
    assert Decimal(rice.available_quantity) == Decimal("950.00")
    assert Decimal(rice.sold_quantity) == Decimal("50.00")

    # Verify cart was cleared
    cart_res = client.get("/api/v1/buyer/cart", headers=headers)
    assert cart_res.json()["item_count"] == 0

    # Verify order appears in buyer's order history
    orders_res = client.get("/api/v1/buyer/orders", headers=headers)
    assert orders_res.status_code == 200
    assert len(orders_res.json()) >= 1
    assert orders_res.json()[0]["order_number"] == order_data["order_number"]


def test_concurrency_overselling_protection(
    client, db_session, buyer_user, setup_produce_environment, make_auth_header
):
    """
    Test atomic anti-overselling protection:
    If inventory is 100 KG and buyer orders 70 KG, then another order for 50 KG fails with 409 Conflict.
    """
    headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email)
    tomato = setup_produce_environment["tomato"]

    # Set available stock to exactly 100 KG
    tomato.available_quantity = Decimal("100.00")
    db_session.add(tomato)
    db_session.commit()

    # Address
    addr_res = client.post(
        "/api/v1/buyer/addresses",
        json={
            "full_name": "Rajesh Kumar",
            "phone": "+919876543210",
            "address_line1": "Warehouse 1",
            "district": "Hyderabad",
            "state": "Telangana",
            "pincode": "500034",
        },
        headers=headers,
    )
    addr_id = addr_res.json()["id"]

    # Order 1: 70 KG
    client.post(
        "/api/v1/buyer/cart/items",
        json={"produce_listing_id": tomato.id, "quantity": 70.0},
        headers=headers,
    )
    res1 = client.post(
        "/api/v1/buyer/orders",
        json={"delivery_address_id": addr_id},
        headers=headers,
    )
    assert res1.status_code == 201
    db_session.refresh(tomato)
    assert Decimal(tomato.available_quantity) == Decimal("30.00")

    # Order 2: Try ordering 50 KG (only 30 KG remains)
    # Simulate cart having 50 KG added previously or concurrently
    client.post(
        "/api/v1/buyer/cart/items",
        json={"produce_listing_id": tomato.id, "quantity": 30.0},
        headers=headers,
    )
    # Manually update cart quantity to 50 KG to simulate concurrent conflict
    from app.models.cart import CartItem, ShoppingCart
    cart = db_session.query(ShoppingCart).filter_by(buyer_user_id=buyer_user.id).first()
    cart_item = db_session.query(CartItem).filter_by(cart_id=cart.id).first()
    cart_item.quantity = Decimal("50.00")
    db_session.add(cart_item)
    db_session.commit()

    res2 = client.post(
        "/api/v1/buyer/orders",
        json={"delivery_address_id": addr_id},
        headers=headers,
    )
    assert res2.status_code == 409
    assert "is no longer available" in res2.json()["detail"]

    # Stock must NEVER become negative
    res_check = client.get(f"/api/v1/marketplace/products/{tomato.id}")
    assert res_check.status_code == 200
    assert Decimal(str(res_check.json()["available_quantity"])) == Decimal("30.00")


def test_order_cancellation_restores_inventory(
    client, db_session, buyer_user, setup_produce_environment, make_auth_header
):
    """
    Test buyer order cancellation:
    PENDING order cancellation atomically restores inventory and flips SOLD_OUT back to LISTED.
    """
    headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email)
    tomato = setup_produce_environment["tomato"]

    # Set available quantity to exactly 50 KG
    tomato.available_quantity = Decimal("50.00")
    db_session.add(tomato)
    db_session.commit()

    # Address
    addr_res = client.post(
        "/api/v1/buyer/addresses",
        json={
            "full_name": "Rajesh Kumar",
            "phone": "+919876543210",
            "address_line1": "Warehouse 1",
            "district": "Hyderabad",
            "state": "Telangana",
            "pincode": "500034",
        },
        headers=headers,
    )
    addr_id = addr_res.json()["id"]

    # Order all 50 KG -> should trigger SOLD_OUT status
    client.post(
        "/api/v1/buyer/cart/items",
        json={"produce_listing_id": tomato.id, "quantity": 50.0},
        headers=headers,
    )
    res = client.post(
        "/api/v1/buyer/orders",
        json={"delivery_address_id": addr_id},
        headers=headers,
    )
    assert res.status_code == 201
    order_id = res.json()["id"]

    db_session.refresh(tomato)
    assert Decimal(tomato.available_quantity) == Decimal("0.00")
    assert tomato.status == ProduceStatus.SOLD_OUT.value

    # Cancel order
    cancel_res = client.post(
        f"/api/v1/buyer/orders/{order_id}/cancel",
        json={"reason": "Delivery requirement postponed."},
        headers=headers,
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == OrderStatus.CANCELLED.value

    # Verify inventory was restored and status flipped back to LISTED
    db_session.refresh(tomato)
    assert Decimal(tomato.available_quantity) == Decimal("50.00")
    assert tomato.status == ProduceStatus.LISTED.value


# ==============================================================================
# 4. Farmer Isolation and Status Actions Tests
# ==============================================================================

def test_farmer_order_isolation_and_status_transitions(
    client, db_session, buyer_user, setup_produce_environment, make_auth_header
):
    """
    Test that Farmer A only sees Farmer A's produce items and totals in multi-farmer orders,
    and can transition order status according to the state machine.
    """
    buyer_headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email)
    farmer_a = setup_produce_environment["farmer_a"]
    farmer_b = setup_produce_environment["farmer_b"]
    headers_fa = make_auth_header(farmer_a.auth_user_id, farmer_a.email)
    headers_fb = make_auth_header(farmer_b.auth_user_id, farmer_b.email)

    tomato = setup_produce_environment["tomato"]
    rice = setup_produce_environment["rice"]

    # 1. Place multi-farmer order: Tomato (Farmer A, ₹2800) + Rice (Farmer B, ₹2100)
    addr_res = client.post(
        "/api/v1/buyer/addresses",
        json={
            "full_name": "Rajesh Kumar",
            "phone": "+919876543210",
            "address_line1": "Warehouse 1",
            "district": "Hyderabad",
            "state": "Telangana",
            "pincode": "500034",
        },
        headers=buyer_headers,
    )
    addr_id = addr_res.json()["id"]

    client.post(
        "/api/v1/buyer/cart/items",
        json={"produce_listing_id": tomato.id, "quantity": 100.0},
        headers=buyer_headers,
    )
    client.post(
        "/api/v1/buyer/cart/items",
        json={"produce_listing_id": rice.id, "quantity": 50.0},
        headers=buyer_headers,
    )

    order_res = client.post(
        "/api/v1/buyer/orders",
        json={"delivery_address_id": addr_id},
        headers=buyer_headers,
    )
    order_id = order_res.json()["id"]

    # 2. Farmer A checks incoming orders
    res_fa = client.get("/api/v1/farmer/orders", headers=headers_fa)
    assert res_fa.status_code == 200
    orders_fa = res_fa.json()
    assert len(orders_fa) >= 1
    target_order_fa = [o for o in orders_fa if o["id"] == order_id][0]
    # Farmer A subtotal should ONLY be ₹2,800 (not ₹4,900)
    assert Decimal(str(target_order_fa["farmer_subtotal"])) == Decimal("2800.00")
    assert target_order_fa["items_count"] == 1

    # 3. Farmer A gets order details: must NOT see Farmer B's Rice
    detail_fa = client.get(f"/api/v1/farmer/orders/{order_id}", headers=headers_fa)
    assert detail_fa.status_code == 200
    data_fa = detail_fa.json()
    assert len(data_fa["items"]) == 1
    assert data_fa["items"][0]["product_name"] == "Farm Fresh Red Tomatoes"

    # 4. Farmer A updates status: PENDING -> ACCEPTED
    accept_res = client.patch(
        f"/api/v1/farmer/orders/{order_id}/status",
        json={"status": "ACCEPTED", "reason": "Harvesting scheduled for tomorrow."},
        headers=headers_fa,
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACCEPTED"

    # 5. Invalid transition rejected (e.g. ACCEPTED -> DELIVERED directly without logistics)
    invalid_trans = client.patch(
        f"/api/v1/farmer/orders/{order_id}/status",
        json={"status": "DELIVERED"},
        headers=headers_fa,
    )
    assert invalid_trans.status_code == 400
    assert "Cannot transition order" in invalid_trans.json()["detail"]
