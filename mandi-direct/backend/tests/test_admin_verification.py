import io
from datetime import date, timedelta
import pytest
from app.models.enums import ProductCategory, ProduceStatus, QualityGrade, QuantityUnit, UserRole, VerificationStatus
from app.models.farmer import Farm, FarmerProfile
from app.models.produce import ProduceImage, ProduceListing


@pytest.fixture
def admin_user(create_test_user, db_session):
    """Create an ADMIN user profile."""
    profile = create_test_user(
        auth_user_id="auth-admin-p6-001",
        email="admin.officer@mandidirect.gov.in",
        full_name="Rajesh Sharma (Agriculture Officer)",
        role=UserRole.ADMIN,
    )
    profile.phone = "+919811122233"
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture
def farmer_user(create_test_user, db_session):
    """Create a FARMER profile."""
    profile = create_test_user(
        auth_user_id="auth-farmer-p6-001",
        email="ramesh.p6@mandidirect.in",
        full_name="Ramesh Patel",
        role=UserRole.FARMER,
    )
    profile.phone = "+919876543210"
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture
def buyer_user(create_test_user):
    """Create a BUYER profile."""
    return create_test_user(
        auth_user_id="auth-buyer-p6-001",
        email="vikram.buyer@retailmandi.in",
        full_name="Vikram Agro Wholesale",
        role=UserRole.BUYER,
    )


@pytest.fixture
def farmer_with_entities(client, farmer_user, make_auth_header, db_session):
    """Setup a farmer with complete profile, farm, and a produce listing with photo."""
    headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)

    # 1. Complete farmer profile
    profile_payload = {
        "date_of_birth": "1985-06-15",
        "gender": "MALE",
        "address_line": "Survey 42, Green Farm Road",
        "village": "Kothur",
        "mandal": "Shadnagar",
        "district": "Ranga Reddy",
        "state": "Telangana",
        "pincode": "509216",
    }
    prof_res = client.post("/api/v1/farmers/profile", json=profile_payload, headers=headers)
    assert prof_res.status_code in (200, 201)

    # 2. Add farm parcel
    farm_payload = {
        "farm_name": "Kothur Sunrise Acres",
        "total_area": 5.5,
        "area_unit": "ACRE",
        "ownership_type": "OWNED",
        "soil_type": "RED",
        "irrigation_type": "BOREWELL",
        "primary_crops": ["Tomato", "Paddy"],
        "village": "Kothur",
        "mandal": "Shadnagar",
        "district": "Ranga Reddy",
        "state": "Telangana",
        "pincode": "509216",
    }
    farm_res = client.post("/api/v1/farmers/farms", json=farm_payload, headers=headers)
    assert farm_res.status_code == 201
    farm_id = farm_res.json()["id"]

    # 3. Create produce draft
    produce_payload = {
        "product_name": "Sona Masoori Paddy",
        "category": ProductCategory.GRAIN.value,
        "variety": "BPT 5204",
        "farm_id": farm_id,
        "harvest_date": (date.today() - timedelta(days=2)).isoformat(),
        "available_from": (date.today() + timedelta(days=1)).isoformat(),
        "total_quantity": 500.0,
        "quantity_unit": QuantityUnit.QUINTAL.value,
        "minimum_order_quantity": 10.0,
        "expected_price": 2800.0,
        "quality_grade": QualityGrade.GRADE_A.value,
        "description": "Premium organic paddy harvested from irrigated fields.",
    }
    produce_res = client.post("/api/v1/farmers/produce", json=produce_payload, headers=headers)
    produce_id = produce_res.json()["id"]

    # 4. Upload photo
    fake_image_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00" + b"\x00" * 100
    client.post(
        f"/api/v1/farmers/produce/{produce_id}/images",
        files={"file": ("paddy.jpg", io.BytesIO(fake_image_bytes), "image/jpeg")},
        headers=headers,
    )

    farmer_profile = db_session.query(FarmerProfile).filter_by(profile_id=farmer_user.id).first()

    return {
        "farmer_profile_id": farmer_profile.id,
        "farm_id": farm_id,
        "produce_id": produce_id,
        "headers": headers,
    }


def test_admin_rbac_protection(client, admin_user, farmer_user, buyer_user, make_auth_header):
    """Verify admin endpoints reject unauthenticated, buyer, and farmer users."""
    url = "/api/v1/admin/dashboard/stats"

    # Unauthenticated
    res = client.get(url)
    assert res.status_code == 401

    # Farmer role
    farmer_headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
    res = client.get(url, headers=farmer_headers)
    assert res.status_code == 403

    # Buyer role
    buyer_headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email)
    res = client.get(url, headers=buyer_headers)
    assert res.status_code == 403

    # Admin role
    admin_headers = make_auth_header(admin_user.auth_user_id, admin_user.email)
    res = client.get(url, headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "pending_farmers" in data
    assert "pending_produce" in data


def test_farmer_verification_workflow(client, admin_user, farmer_with_entities, make_auth_header):
    """Test full farmer review lifecycle: pending list -> inspect -> reject -> re-approve."""
    admin_headers = make_auth_header(admin_user.auth_user_id, admin_user.email)
    farmer_id = farmer_with_entities["farmer_profile_id"]

    # 1. Farmer should appear in pending list
    res = client.get("/api/v1/admin/farmers/verification?status=PENDING", headers=admin_headers)
    assert res.status_code == 200
    farmers_list = res.json()["items"]
    assert any(f["id"] == farmer_id for f in farmers_list)

    # 2. Get verification detail
    res = client.get(f"/api/v1/admin/farmers/{farmer_id}/verification", headers=admin_headers)
    assert res.status_code == 200
    detail = res.json()
    assert detail["farmer"]["id"] == farmer_id
    assert detail["farmer"]["full_name"] == "Ramesh Patel"
    assert len(detail["farms"]) >= 1
    assert detail["farmer"]["verification_status"] == VerificationStatus.PENDING.value

    # 3. Reject without reason or with short reason (< 5 chars) fails with 422
    res = client.post(
        f"/api/v1/admin/farmers/{farmer_id}/reject",
        json={"reason": "bad"},
        headers=admin_headers,
    )
    assert res.status_code == 422

    # 4. Reject with valid explanation
    res = client.post(
        f"/api/v1/admin/farmers/{farmer_id}/reject",
        json={"reason": "Aadhaar and land ownership survey document records mismatch."},
        headers=admin_headers,
    )
    assert res.status_code == 200
    assert res.json()["farmer"]["verification_status"] == VerificationStatus.REJECTED.value

    # 5. Approve farmer profile
    res = client.post(
        f"/api/v1/admin/farmers/{farmer_id}/approve",
        json={"note": "Documents verified against state land records portal."},
        headers=admin_headers,
    )
    assert res.status_code == 200
    approved_detail = res.json()
    assert approved_detail["farmer"]["verification_status"] == VerificationStatus.VERIFIED.value
    assert approved_detail["farmer"]["verified_at"] is not None
    assert approved_detail["farmer"]["verified_by_name"] == admin_user.full_name

    # 6. Audit records generated
    audit_records = approved_detail["history"]
    assert len(audit_records) >= 2
    actions = [rec["action"] for rec in audit_records]
    assert "REJECT" in actions
    assert "APPROVE" in actions


def test_produce_verification_workflow(client, admin_user, farmer_with_entities, make_auth_header):
    """Test produce verification lifecycle including farmer status check, rejection, and resubmission."""
    admin_headers = make_auth_header(admin_user.auth_user_id, admin_user.email)
    farmer_headers = farmer_with_entities["headers"]
    farmer_id = farmer_with_entities["farmer_profile_id"]
    produce_id = farmer_with_entities["produce_id"]

    # 1. Submit produce for verification by farmer
    submit_res = client.post(f"/api/v1/farmers/produce/{produce_id}/submit", headers=farmer_headers)
    assert submit_res.status_code == 200
    assert submit_res.json()["status"] == ProduceStatus.PENDING_VERIFICATION.value

    # 2. Admin attempts to approve while farmer is still PENDING -> Should fail with 400
    res = client.post(f"/api/v1/admin/produce/{produce_id}/approve", headers=admin_headers)
    assert res.status_code == 400
    assert "farmer profile is verified" in res.json()["detail"].lower()

    # 3. Approve farmer first
    client.post(f"/api/v1/admin/farmers/{farmer_id}/approve", headers=admin_headers)

    # 4. Inspect produce verification detail
    res = client.get(f"/api/v1/admin/produce/{produce_id}/verification", headers=admin_headers)
    assert res.status_code == 200
    produce_detail = res.json()
    assert produce_detail["produce"]["id"] == produce_id
    assert produce_detail["produce"]["product_name"] == "Sona Masoori Paddy"
    assert len(produce_detail["images"]) >= 1
    assert produce_detail["farmer_verification_status"] == VerificationStatus.VERIFIED.value

    # 5. Reject produce with reason
    res = client.post(
        f"/api/v1/admin/produce/{produce_id}/reject",
        json={"reason": "Produce moisture content appears too high from packaging; please upload fresh lot photos."},
        headers=admin_headers,
    )
    assert res.status_code == 200
    assert res.json()["produce"]["status"] == ProduceStatus.REJECTED.value

    # 6. Farmer resubmits rejected produce
    resubmit_res = client.post(f"/api/v1/farmers/produce/{produce_id}/submit", headers=farmer_headers)
    assert resubmit_res.status_code == 200
    assert resubmit_res.json()["status"] == ProduceStatus.PENDING_VERIFICATION.value

    # 7. Admin approves produce
    res = client.post(
        f"/api/v1/admin/produce/{produce_id}/approve",
        json={"note": "Fresh lot photos inspected and approved for direct market listing."},
        headers=admin_headers,
    )
    assert res.status_code == 200
    assert res.json()["produce"]["status"] == ProduceStatus.APPROVED.value

    # 8. Check audit trail for produce has REJECT, RESUBMIT, and APPROVE
    res = client.get(f"/api/v1/admin/produce/{produce_id}/verification", headers=admin_headers)
    actions = [r["action"] for r in res.json()["history"]]
    assert "REJECT" in actions
    assert "RESUBMIT" in actions
    assert "APPROVE" in actions


def test_verification_history_endpoint(client, admin_user, farmer_with_entities, make_auth_header):
    """Test global verification history pagination and filtering."""
    admin_headers = make_auth_header(admin_user.auth_user_id, admin_user.email)
    farmer_id = farmer_with_entities["farmer_profile_id"]

    # Perform an approval
    client.post(
        f"/api/v1/admin/farmers/{farmer_id}/approve",
        json={"note": "Initial onboarding verification."},
        headers=admin_headers,
    )

    # Fetch global history
    res = client.get("/api/v1/admin/verification-history", headers=admin_headers)
    assert res.status_code == 200
    history = res.json()
    assert history["total"] >= 1
    assert len(history["items"]) >= 1

    # Filter by entity_type
    farmer_hist = client.get("/api/v1/admin/verification-history?entity_type=FARMER", headers=admin_headers)
    assert farmer_hist.status_code == 200
    assert all(item["entity_type"] == "FARMER" for item in farmer_hist.json()["items"])

    # Filter by action
    approve_hist = client.get("/api/v1/admin/verification-history?action=APPROVE", headers=admin_headers)
    assert approve_hist.status_code == 200
    assert all(item["action"] == "APPROVE" for item in approve_hist.json()["items"])
