from datetime import date, timedelta
from decimal import Decimal
import pytest
from app.models.enums import ProductCategory, ProduceStatus, QualityGrade, QuantityUnit, UserRole, VerificationStatus
from app.models.farmer import Farm, FarmerProfile
from app.models.produce import ProduceImage, ProduceListing


@pytest.fixture
def admin_user(create_test_user):
    return create_test_user(
        auth_user_id="auth-admin-mp-001",
        email="admin.marketplace@mandidirect.in",
        full_name="Admin Officer",
        role=UserRole.ADMIN,
    )


@pytest.fixture
def farmer_user(create_test_user, db_session):
    profile = create_test_user(
        auth_user_id="auth-farmer-mp-001",
        email="farmer.ravi@mandidirect.in",
        full_name="Ravi Kumar",
        role=UserRole.FARMER,
    )
    profile.phone = "+919876543210"
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture
def setup_marketplace_farmer_and_produce(client, db_session, farmer_user, admin_user, make_auth_header):
    """
    Creates a verified farmer with a farm parcel and multiple produce listings
    in different statuses (LISTED, DRAFT, PENDING, REJECTED, EXPIRED, SOLD_OUT).
    """
    farmer_header = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
    
    # 1. Create Farmer Profile
    profile_payload = {
        "date_of_birth": "1988-04-10",
        "gender": "MALE",
        "address_line": "Plot 12, Farm Gate Road",
        "village": "Vijayawada Rural",
        "mandal": "Vijayawada",
        "district": "Krishna",
        "state": "Andhra Pradesh",
        "pincode": "520001",
    }
    client.post("/api/v1/farmers/profile", headers=farmer_header, json=profile_payload)
    
    # Verify farmer profile
    fp = db_session.query(FarmerProfile).filter(FarmerProfile.profile_id == farmer_user.id).first()
    fp.verification_status = VerificationStatus.VERIFIED.value
    db_session.commit()

    # 2. Create Farm
    farm_payload = {
        "farm_name": "Krishna River Farms",
        "total_area": 5.0,
        "area_unit": "ACRE",
        "ownership_type": "OWNED",
        "soil_type": "BLACK",
        "irrigation_type": "CANAL",
        "primary_crops": ["Tomato", "Chilli", "Rice"],
        "village": "Vijayawada Rural",
        "mandal": "Vijayawada",
        "district": "Krishna",
        "state": "Andhra Pradesh",
        "pincode": "520001",
    }
    farm_res = client.post("/api/v1/farmers/farms", headers=farmer_header, json=farm_payload)
    assert farm_res.status_code == 201
    farm_data = farm_res.json()
    farm_id = farm_data["id"]

    today = date.today()

    # 3. Create Produce Listings directly in DB
    # 3a. LISTED Tomatoes (Eligible)
    tomato = ProduceListing(
        farmer_profile_id=fp.id,
        farm_id=farm_id,
        product_name="Farm Fresh Tomatoes",
        category=ProductCategory.VEGETABLE.value,
        variety="Hybrid Roma",
        description="Freshly harvested juicy tomatoes straight from the vine.",
        total_quantity=Decimal("500.00"),
        available_quantity=Decimal("500.00"),
        reserved_quantity=Decimal("0.00"),
        sold_quantity=Decimal("0.00"),
        quantity_unit=QuantityUnit.KG.value,
        quality_grade=QualityGrade.GRADE_A.value,
        harvest_date=today - timedelta(days=2),
        available_from=today - timedelta(days=1),
        available_until=today + timedelta(days=10),
        expected_price=Decimal("28.00"),
        price_unit="PER_KG",
        minimum_order_quantity=Decimal("10.00"),
        status=ProduceStatus.LISTED.value,
    )
    db_session.add(tomato)
    db_session.flush()

    # Add image to tomato
    img1 = ProduceImage(
        produce_listing_id=tomato.id,
        storage_path=f"produce/{tomato.id}/photo1.jpg",
        image_url="https://supabase.co/storage/v1/object/public/produce-images/photo1.jpg",
        public_url="https://supabase.co/storage/v1/object/public/produce-images/photo1.jpg",
        file_name="photo1.jpg",
        mime_type="image/jpeg",
        is_primary=True,
        display_order=0,
    )
    img2 = ProduceImage(
        produce_listing_id=tomato.id,
        storage_path=f"produce/{tomato.id}/photo2.jpg",
        image_url="https://supabase.co/storage/v1/object/public/produce-images/photo2.jpg",
        public_url="https://supabase.co/storage/v1/object/public/produce-images/photo2.jpg",
        file_name="photo2.jpg",
        mime_type="image/jpeg",
        is_primary=False,
        display_order=1,
    )
    db_session.add(img1)
    db_session.add(img2)

    # 3b. LISTED Basmati Rice (Eligible, higher price)
    rice = ProduceListing(
        farmer_profile_id=fp.id,
        farm_id=farm_id,
        product_name="Premium Basmati Rice",
        category=ProductCategory.GRAIN.value,
        variety="1121 Pusa",
        description="Aromatic long grain basmati rice, naturally aged.",
        total_quantity=Decimal("2000.00"),
        available_quantity=Decimal("2000.00"),
        reserved_quantity=Decimal("0.00"),
        sold_quantity=Decimal("0.00"),
        quantity_unit=QuantityUnit.KG.value,
        quality_grade=QualityGrade.PREMIUM.value,
        harvest_date=today - timedelta(days=20),
        available_from=today - timedelta(days=5),
        available_until=today + timedelta(days=60),
        expected_price=Decimal("85.00"),
        price_unit="PER_KG",
        minimum_order_quantity=Decimal("50.00"),
        status=ProduceStatus.LISTED.value,
    )
    db_session.add(rice)

    # 3c. DRAFT Produce (Must NOT appear)
    draft_prod = ProduceListing(
        farmer_profile_id=fp.id,
        farm_id=farm_id,
        product_name="Draft Green Chillies",
        category=ProductCategory.SPICE.value,
        variety="Guntur Hot",
        description="Draft listing under preparation.",
        total_quantity=Decimal("100.00"),
        available_quantity=Decimal("100.00"),
        reserved_quantity=Decimal("0.00"),
        sold_quantity=Decimal("0.00"),
        quantity_unit=QuantityUnit.KG.value,
        quality_grade=QualityGrade.GRADE_B.value,
        harvest_date=today,
        available_from=today,
        available_until=today + timedelta(days=7),
        expected_price=Decimal("45.00"),
        price_unit="PER_KG",
        minimum_order_quantity=Decimal("5.00"),
        status=ProduceStatus.DRAFT.value,
    )
    db_session.add(draft_prod)

    # 3d. PENDING_VERIFICATION Produce (Must NOT appear)
    pending_prod = ProduceListing(
        farmer_profile_id=fp.id,
        farm_id=farm_id,
        product_name="Pending Red Onions",
        category=ProductCategory.VEGETABLE.value,
        variety="Nasik Red",
        description="Under verification by administration.",
        total_quantity=Decimal("800.00"),
        available_quantity=Decimal("800.00"),
        reserved_quantity=Decimal("0.00"),
        sold_quantity=Decimal("0.00"),
        quantity_unit=QuantityUnit.KG.value,
        quality_grade=QualityGrade.GRADE_A.value,
        harvest_date=today,
        available_from=today,
        available_until=today + timedelta(days=14),
        expected_price=Decimal("32.00"),
        price_unit="PER_KG",
        minimum_order_quantity=Decimal("20.00"),
        status=ProduceStatus.PENDING_VERIFICATION.value,
    )
    db_session.add(pending_prod)

    # 3e. REJECTED Produce (Must NOT appear)
    rejected_prod = ProduceListing(
        farmer_profile_id=fp.id,
        farm_id=farm_id,
        product_name="Rejected Mango Lot",
        category=ProductCategory.FRUIT.value,
        variety="Banganapalli",
        description="Poor quality photos, rejected.",
        total_quantity=Decimal("300.00"),
        available_quantity=Decimal("300.00"),
        reserved_quantity=Decimal("0.00"),
        sold_quantity=Decimal("0.00"),
        quantity_unit=QuantityUnit.KG.value,
        quality_grade=QualityGrade.GRADE_C.value,
        harvest_date=today,
        available_from=today,
        available_until=today + timedelta(days=5),
        expected_price=Decimal("60.00"),
        price_unit="PER_KG",
        minimum_order_quantity=Decimal("10.00"),
        status=ProduceStatus.REJECTED.value,
    )
    db_session.add(rejected_prod)

    # 3f. EXPIRED Produce (Must NOT appear)
    expired_prod = ProduceListing(
        farmer_profile_id=fp.id,
        farm_id=farm_id,
        product_name="Expired Spinach",
        category=ProductCategory.VEGETABLE.value,
        variety="Palak",
        description="Expired yesterday.",
        total_quantity=Decimal("50.00"),
        available_quantity=Decimal("50.00"),
        reserved_quantity=Decimal("0.00"),
        sold_quantity=Decimal("0.00"),
        quantity_unit=QuantityUnit.KG.value,
        quality_grade=QualityGrade.GRADE_A.value,
        harvest_date=today - timedelta(days=10),
        available_from=today - timedelta(days=8),
        available_until=today - timedelta(days=1),  # Expired
        expected_price=Decimal("20.00"),
        price_unit="PER_KG",
        minimum_order_quantity=Decimal("5.00"),
        status=ProduceStatus.LISTED.value,
    )
    db_session.add(expired_prod)

    # 3g. SOLD OUT Produce (available_quantity == 0, Must NOT appear)
    sold_out_prod = ProduceListing(
        farmer_profile_id=fp.id,
        farm_id=farm_id,
        product_name="Sold Out Potatoes",
        category=ProductCategory.VEGETABLE.value,
        variety="Jyoti",
        description="Completely sold out.",
        total_quantity=Decimal("1000.00"),
        available_quantity=Decimal("0.00"),  # Sold out
        reserved_quantity=Decimal("0.00"),
        sold_quantity=Decimal("1000.00"),
        quantity_unit=QuantityUnit.KG.value,
        quality_grade=QualityGrade.GRADE_A.value,
        harvest_date=today - timedelta(days=15),
        available_from=today - timedelta(days=10),
        available_until=today + timedelta(days=10),
        expected_price=Decimal("22.00"),
        price_unit="PER_KG",
        minimum_order_quantity=Decimal("100.00"),
        status=ProduceStatus.LISTED.value,
    )
    db_session.add(sold_out_prod)

    db_session.commit()
    db_session.refresh(tomato)
    db_session.refresh(rice)
    db_session.refresh(draft_prod)

    return {
        "farmer": farmer_user,
        "farmer_profile": fp,
        "farm_id": farm_id,
        "tomato_id": tomato.id,
        "rice_id": rice.id,
        "draft_id": draft_prod.id,
        "pending_id": pending_prod.id,
        "rejected_id": rejected_prod.id,
        "expired_id": expired_prod.id,
        "sold_out_id": sold_out_prod.id,
    }


def test_marketplace_visibility_rules(client, setup_marketplace_farmer_and_produce):
    """Only LISTED, non-expired, available produce must appear in marketplace queries."""
    res = client.get("/api/v1/marketplace/products")
    assert res.status_code == 200
    data = res.json()

    assert "items" in data
    assert "total" in data
    assert data["total"] == 2  # Only Tomatoes and Basmati Rice

    product_names = [item["product_name"] for item in data["items"]]
    assert "Farm Fresh Tomatoes" in product_names
    assert "Premium Basmati Rice" in product_names

    # Hidden statuses must NEVER appear
    assert "Draft Green Chillies" not in product_names
    assert "Pending Red Onions" not in product_names
    assert "Rejected Mango Lot" not in product_names
    assert "Expired Spinach" not in product_names
    assert "Sold Out Potatoes" not in product_names

    for item in data["items"]:
        assert item["status"] == "LISTED"
        assert item["available_quantity"] > 0


def test_marketplace_search(client, setup_marketplace_farmer_and_produce):
    """Server-side multi-attribute search across product name, variety, description, and location."""
    # Search by crop name
    res = client.get("/api/v1/marketplace/products?search=tomato")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["product_name"] == "Farm Fresh Tomatoes"

    # Search by variety
    res = client.get("/api/v1/marketplace/products?search=1121")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["product_name"] == "Premium Basmati Rice"

    # Search by district/location
    res = client.get("/api/v1/marketplace/products?search=Krishna")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2

    # Non-existent search
    res = client.get("/api/v1/marketplace/products?search=NonExistentFruitXYZ")
    assert res.status_code == 200
    assert res.json()["total"] == 0


def test_marketplace_filters(client, setup_marketplace_farmer_and_produce):
    """Filters by category, quality grade, price range, and location."""
    # Filter by category
    res = client.get("/api/v1/marketplace/products?category=VEGETABLE")
    assert res.status_code == 200
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["product_name"] == "Farm Fresh Tomatoes"

    # Filter by quality grade
    res = client.get("/api/v1/marketplace/products?quality_grade=PREMIUM")
    assert res.status_code == 200
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["product_name"] == "Premium Basmati Rice"

    # Filter by price range
    res = client.get("/api/v1/marketplace/products?min_price=20&max_price=50")
    assert res.status_code == 200
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["product_name"] == "Farm Fresh Tomatoes"

    # Filter by district
    res = client.get("/api/v1/marketplace/products?district=Krishna")
    assert res.status_code == 200
    assert res.json()["total"] == 2

    # Filter by wrong district
    res = client.get("/api/v1/marketplace/products?district=Guntur")
    assert res.status_code == 200
    assert res.json()["total"] == 0


def test_marketplace_sorting(client, setup_marketplace_farmer_and_produce):
    """Sorting by price ascending, price descending, and harvest date."""
    # Price ascending (Tomato ₹28, Rice ₹85)
    res = client.get("/api/v1/marketplace/products?sort=price_asc")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 2
    assert items[0]["price"] == 28.0
    assert items[1]["price"] == 85.0

    # Price descending
    res = client.get("/api/v1/marketplace/products?sort=price_desc")
    assert res.status_code == 200
    items = res.json()["items"]
    assert items[0]["price"] == 85.0
    assert items[1]["price"] == 28.0


def test_marketplace_pagination(client, setup_marketplace_farmer_and_produce):
    """Server-side pagination with page and page_size."""
    res = client.get("/api/v1/marketplace/products?page=1&page_size=1")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["total"] == 2
    assert data["page"] == 1
    assert data["page_size"] == 1
    assert data["total_pages"] == 2

    res_page_2 = client.get("/api/v1/marketplace/products?page=2&page_size=1")
    assert res_page_2.status_code == 200
    data_page_2 = res_page_2.json()
    assert len(data_page_2["items"]) == 1
    assert data_page_2["page"] == 2
    assert data_page_2["items"][0]["id"] != data["items"][0]["id"]


def test_marketplace_product_detail(client, setup_marketplace_farmer_and_produce):
    """Public product detail returns complete buyer-safe data and images."""
    tomato_id = setup_marketplace_farmer_and_produce["tomato_id"]
    res = client.get(f"/api/v1/marketplace/products/{tomato_id}")
    assert res.status_code == 200
    data = res.json()

    assert data["id"] == tomato_id
    assert data["product_name"] == "Farm Fresh Tomatoes"
    assert data["price"] == 28.0
    assert data["price_unit"] == "PER_KG"
    assert data["available_quantity"] == 500.0

    # Image gallery
    assert len(data["images"]) == 2
    assert data["images"][0]["is_primary"] is True
    assert data["primary_image_url"] is not None

    # Safe Farmer Information
    assert data["farmer"]["name"] == "Ravi Kumar"
    assert data["farmer"]["is_verified"] is True

    # Safe Farm Information
    assert data["farm"]["farm_name"] == "Krishna River Farms"
    assert data["farm"]["district"] == "Krishna"
    assert data["farm"]["state"] == "Andhra Pradesh"

    # Transparent Pricing
    assert data["transparent_pricing"]["farmer_price"] == 28.0
    assert data["transparent_pricing"]["price_unit"] == "PER_KG"


def test_marketplace_product_detail_not_found(client, setup_marketplace_farmer_and_produce):
    """Unavailable, draft, pending, or rejected products return 404."""
    draft_id = setup_marketplace_farmer_and_produce["draft_id"]
    res = client.get(f"/api/v1/marketplace/products/{draft_id}")
    assert res.status_code == 404
    assert "Product Not Available" in res.json()["detail"]

    pending_id = setup_marketplace_farmer_and_produce["pending_id"]
    res_pending = client.get(f"/api/v1/marketplace/products/{pending_id}")
    assert res_pending.status_code == 404

    # Non-existent UUID
    res_unknown = client.get("/api/v1/marketplace/products/00000000-0000-0000-0000-000000000000")
    assert res_unknown.status_code == 404


def test_marketplace_security_data_leakage(client, setup_marketplace_farmer_and_produce):
    """Verify private farmer data is never returned in marketplace API responses."""
    tomato_id = setup_marketplace_farmer_and_produce["tomato_id"]
    res = client.get(f"/api/v1/marketplace/products/{tomato_id}")
    data = res.json()

    # Convert response dictionary to string for comprehensive pattern checks
    raw_response_str = str(data)

    # Must NOT expose private details
    assert "+919876543210" not in raw_response_str  # Phone
    assert "farmer.ravi@mandidirect.in" not in raw_response_str  # Email
    assert "Plot 12, Farm Gate Road" not in raw_response_str  # Private address line
    assert "520001" not in raw_response_str  # Pincode
    assert "auth_user_id" not in raw_response_str
    assert "verification_notes" not in raw_response_str


def test_produce_publish_flow(client, db_session, setup_marketplace_farmer_and_produce, admin_user, make_auth_header):
    """Full lifecycle: Farmer creates DRAFT -> submits -> Admin approves -> Farmer publishes -> LISTED in marketplace."""
    farmer = setup_marketplace_farmer_and_produce["farmer"]
    farmer_header = make_auth_header(farmer.auth_user_id, farmer.email)
    admin_header = make_auth_header(admin_user.auth_user_id, admin_user.email)
    farm_id = setup_marketplace_farmer_and_produce["farm_id"]

    today = date.today()
    produce_payload = {
        "farm_id": farm_id,
        "product_name": "Organic Alphonso Mangoes",
        "category": "FRUIT",
        "variety": "Ratnagiri King",
        "description": "Premium export grade sweet mangoes.",
        "total_quantity": 250.0,
        "quantity_unit": "KG",
        "quality_grade": "PREMIUM",
        "harvest_date": today.isoformat(),
        "available_from": today.isoformat(),
        "available_until": (today + timedelta(days=20)).isoformat(),
        "expected_price": 120.0,
        "price_unit": "PER_KG",
        "minimum_order_quantity": 5.0,
    }

    # 1. Create produce (DRAFT)
    res_create = client.post("/api/v1/farmers/produce", headers=farmer_header, json=produce_payload)
    assert res_create.status_code == 201
    produce_id = res_create.json()["id"]

    # 2. Cannot publish DRAFT produce (must be APPROVED)
    res_pub_draft = client.post(f"/api/v1/farmers/produce/{produce_id}/publish", headers=farmer_header)
    assert res_pub_draft.status_code == 400
    assert "APPROVED" in res_pub_draft.json()["detail"]

    # 3. Add image and submit
    img = ProduceImage(
        produce_listing_id=produce_id,
        storage_path=f"produce/{produce_id}/photo.jpg",
        image_url="https://supabase.co/photo.jpg",
        public_url="https://supabase.co/photo.jpg",
        file_name="mango.jpg",
        is_primary=True,
    )
    db_session.add(img)
    db_session.commit()

    res_sub = client.post(f"/api/v1/farmers/produce/{produce_id}/submit", headers=farmer_header)
    assert res_sub.status_code == 200
    assert res_sub.json()["status"] == "PENDING_VERIFICATION"

    # 4. Admin Approves Produce
    res_app = client.post(f"/api/v1/admin/produce/{produce_id}/approve", headers=admin_header)
    assert res_app.status_code == 200
    assert res_app.json()["produce"]["status"] == "APPROVED"

    # 5. Not yet in marketplace (it is APPROVED, not yet LISTED)
    res_mp_before = client.get(f"/api/v1/marketplace/products/{produce_id}")
    assert res_mp_before.status_code == 404

    # 6. Farmer publishes to marketplace
    res_pub = client.post(f"/api/v1/farmers/produce/{produce_id}/publish", headers=farmer_header)
    assert res_pub.status_code == 200
    assert res_pub.json()["status"] == "LISTED"

    # 7. Now accessible in marketplace!
    res_mp_after = client.get(f"/api/v1/marketplace/products/{produce_id}")
    assert res_mp_after.status_code == 200
    assert res_mp_after.json()["product_name"] == "Organic Alphonso Mangoes"
    assert res_mp_after.json()["status"] == "LISTED"
