import pytest
from sqlalchemy.exc import IntegrityError
from app.models.enums import UserRole, UserStatus
from app.models.profile import Profile


def test_unauthorized_user_receives_401(client):
    """
    Requirement 9: Unauthorized users must receive HTTP 401.
    """
    # Without Authorization header
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "detail" in response.json()

    # With invalid Bearer token
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert response.status_code == 401


def test_create_profile_success(client, make_auth_header):
    """
    Requirement 6: Implement POST /api/v1/auth/profile
    Registers a new user's profile with FARMER role.
    """
    auth_id = "supabase-user-uuid-101"
    email = "farmer.ramesh@mandidirect.in"
    headers = make_auth_header(auth_id, email)

    payload = {
        "full_name": "Ramesh Patel",
        "phone": "+919876543210",
        "role": "FARMER",
    }
    response = client.post("/api/v1/auth/profile", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["auth_user_id"] == auth_id
    assert data["email"] == email
    assert data["full_name"] == "Ramesh Patel"
    assert data["role"] == "FARMER"
    assert data["status"] == "ACTIVE"
    assert "id" in data


def test_cannot_self_assign_admin_role(client, make_auth_header):
    """
    Requirement 10: Never trust a role supplied by the frontend.
    Users cannot self-elevate to ADMIN through public profile registration.
    """
    auth_id = "supabase-user-uuid-102"
    email = "hacker@example.com"
    headers = make_auth_header(auth_id, email)

    payload = {
        "full_name": "Malicious User",
        "phone": "+919999999999",
        "role": "ADMIN",
    }
    # Schema validation rejects ADMIN on self-registration
    response = client.post("/api/v1/auth/profile", json=payload, headers=headers)
    assert response.status_code in (422, 403)


def test_get_auth_me(client, create_test_user, make_auth_header):
    """
    Requirement 6: Implement GET /api/v1/auth/me
    Loads profile and exposes current user with DB-verified role.
    """
    auth_id = "supabase-user-uuid-201"
    email = "buyer.anita@retailcorp.in"
    create_test_user(
        auth_user_id=auth_id,
        email=email,
        full_name="Anita Sharma",
        role=UserRole.BUYER,
    )

    headers = make_auth_header(auth_id, email)
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["auth_user_id"] == auth_id
    assert data["email"] == email
    assert data["role"] == "BUYER"
    assert data["full_name"] == "Anita Sharma"


def test_rbac_farmer_allowed_and_forbidden(client, create_test_user, make_auth_header):
    """
    Requirement 4, 8, 9:
    - Roles must be enforced on the backend.
    - Unauthorized users must receive HTTP 401.
    - Authenticated users without permission must receive HTTP 403.
    """
    farmer_auth_id = "farmer-uuid-301"
    farmer_email = "farmer.suresh@kisan.in"
    create_test_user(
        auth_user_id=farmer_auth_id,
        email=farmer_email,
        full_name="Suresh Kisan",
        role=UserRole.FARMER,
    )
    headers = make_auth_header(farmer_auth_id, farmer_email)

    # 1. FARMER accessing Farmer Dashboard -> 200 OK
    res_farmer = client.get("/api/v1/farmer/dashboard-stats", headers=headers)
    assert res_farmer.status_code == 200
    assert "active_crops_listed" in res_farmer.json()

    # 2. FARMER accessing Buyer Marketplace -> 403 Forbidden
    res_buyer = client.get("/api/v1/buyer/marketplace-preview", headers=headers)
    assert res_buyer.status_code == 403
    assert "forbidden" in res_buyer.json()["detail"].lower()

    # 3. FARMER accessing Admin Console -> 403 Forbidden
    res_admin = client.get("/api/v1/admin/system-overview", headers=headers)
    assert res_admin.status_code == 403
    assert "forbidden" in res_admin.json()["detail"].lower()


def test_rbac_buyer_access(client, create_test_user, make_auth_header):
    """BUYER accessing Buyer endpoint -> 200 OK; accessing Farmer endpoint -> 403."""
    buyer_auth_id = "buyer-uuid-401"
    buyer_email = "buyer.raj@freshmart.com"
    create_test_user(
        auth_user_id=buyer_auth_id,
        email=buyer_email,
        full_name="Rajesh Grocers",
        role=UserRole.BUYER,
    )
    headers = make_auth_header(buyer_auth_id, buyer_email)

    # BUYER accessing Buyer endpoint -> 200 OK
    res_buyer = client.get("/api/v1/buyer/marketplace-preview", headers=headers)
    assert res_buyer.status_code == 200
    assert "available_fresh_produce_lots" in res_buyer.json()

    # BUYER accessing Farmer endpoint -> 403 Forbidden
    res_farmer = client.get("/api/v1/farmer/dashboard-stats", headers=headers)
    assert res_farmer.status_code == 403


def test_rbac_admin_access(client, create_test_user, make_auth_header):
    """ADMIN accessing Admin endpoint -> 200 OK."""
    admin_auth_id = "admin-uuid-501"
    admin_email = "admin@mandidirect.gov.in"
    create_test_user(
        auth_user_id=admin_auth_id,
        email=admin_email,
        full_name="System Administrator",
        role=UserRole.ADMIN,
    )
    headers = make_auth_header(admin_auth_id, admin_email)

    res_admin = client.get("/api/v1/admin/system-overview", headers=headers)
    assert res_admin.status_code == 200
    assert "total_farmers" in res_admin.json()


def test_suspended_user_forbidden(client, create_test_user, make_auth_header):
    """Suspended user receives HTTP 403 Forbidden."""
    suspended_auth_id = "suspended-uuid-601"
    suspended_email = "badactor@example.com"
    create_test_user(
        auth_user_id=suspended_auth_id,
        email=suspended_email,
        full_name="Bad Actor",
        role=UserRole.FARMER,
        status=UserStatus.SUSPENDED,
    )
    headers = make_auth_header(suspended_auth_id, suspended_email)

    res = client.get("/api/v1/farmer/dashboard-stats", headers=headers)
    assert res.status_code == 403
    assert "suspended" in res.json()["detail"].lower()


def test_database_role_constraint(db_session):
    """
    Requirement 11: Add database constraints for valid roles.
    Direct SQL attempt to insert an invalid role must fail check constraint.
    """
    invalid_profile = Profile(
        auth_user_id="invalid-role-user",
        email="test@example.com",
        full_name="Invalid Role User",
        role="SUPER_HACKER_ROLE",  # Not in ('FARMER', 'BUYER', 'ADMIN', 'FPO', 'LOGISTICS')
        status="ACTIVE",
    )
    db_session.add(invalid_profile)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
