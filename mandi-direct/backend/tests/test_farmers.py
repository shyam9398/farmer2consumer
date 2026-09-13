import io
import pytest
from app.models.enums import UserRole


@pytest.fixture
def farmer_user(create_test_user, db_session):
    """Create a verified FARMER profile with full name and phone."""
    profile = create_test_user(
        auth_user_id="auth-farmer-001",
        email="ramesh.farmer@mandidirect.in",
        full_name="Ramesh Kumar",
        role=UserRole.FARMER,
    )
    profile.phone = "+919876543210"
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture
def farmer_two_user(create_test_user, db_session):
    """Create a second distinct FARMER profile."""
    profile = create_test_user(
        auth_user_id="auth-farmer-002",
        email="suresh.farmer@mandidirect.in",
        full_name="Suresh Patel",
        role=UserRole.FARMER,
    )
    profile.phone = "+919876543211"
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


@pytest.fixture
def buyer_user(create_test_user):
    """Create a BUYER profile."""
    return create_test_user(
        auth_user_id="auth-buyer-001",
        email="vikram.buyer@retailmandi.in",
        full_name="Vikram Agro Wholesale",
        role=UserRole.BUYER,
    )


@pytest.fixture
def farmer_with_profile(client, farmer_user, make_auth_header):
    """Fixture ensuring the farmer profile exists in the DB."""
    headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
    payload = {
        "date_of_birth": "1985-06-15",
        "gender": "MALE",
        "address_line": "Survey 42, Farm Road",
        "village": "Kothur",
        "mandal": "Shadnagar",
        "district": "Ranga Reddy",
        "state": "Telangana",
        "pincode": "509216",
    }
    res = client.post("/api/v1/farmers/profile", headers=headers, json=payload)
    assert res.status_code in (200, 201)
    return res.json()


@pytest.fixture
def farmer_with_farm(client, farmer_user, farmer_with_profile, make_auth_header):
    """Fixture ensuring farmer has at least one registered farm."""
    headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
    payload = {
        "farm_name": "Green Valley Organic Plot",
        "total_area": 4.5,
        "area_unit": "ACRE",
        "ownership_type": "OWNED",
        "soil_type": "BLACK",
        "irrigation_type": "BOREWELL",
        "primary_crops": ["Tomato", "Chilli", "Rice"],
        "latitude": 17.1524,
        "longitude": 78.2911,
        "address_line": "Near Old Canal Bridge",
        "village": "Kothur",
        "mandal": "Shadnagar",
        "district": "Ranga Reddy",
        "state": "Telangana",
        "pincode": "509216",
    }
    res = client.post("/api/v1/farmers/farms", headers=headers, json=payload)
    assert res.status_code == 201
    return res.json()


class TestFarmerProfileAndFarms:
    """Test suite for Phase 3: Farmer Profile and Farm Management."""

    def test_unauthenticated_user_cannot_access_farmer_endpoints(self, client):
        """Unauthenticated requests must be rejected with HTTP 401."""
        assert client.get("/api/v1/farmers/profile").status_code == 401
        assert client.get("/api/v1/farmers/farms").status_code == 401
        assert client.post("/api/v1/farmers/farms", json={}).status_code == 401

    def test_buyer_cannot_access_farmer_endpoints(
        self, client, buyer_user, make_auth_header
    ):
        """Users with BUYER role must be rejected with HTTP 403 Forbidden."""
        headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email)

        assert client.get("/api/v1/farmers/profile", headers=headers).status_code == 403
        assert client.get("/api/v1/farmers/farms", headers=headers).status_code == 403
        assert (
            client.post(
                "/api/v1/farmers/profile",
                headers=headers,
                json={
                    "address_line": "123 Market Rd",
                    "village": "Kothur",
                    "mandal": "Shadnagar",
                    "district": "Ranga Reddy",
                    "state": "Telangana",
                    "pincode": "509216",
                },
            ).status_code
            == 403
        )

    def test_farmer_can_create_profile(
        self, client, farmer_user, make_auth_header
    ):
        """Farmer can successfully register profile details."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)

        payload = {
            "date_of_birth": "1985-06-15",
            "gender": "MALE",
            "address_line": "Survey 42, Farm Road",
            "village": "Kothur",
            "mandal": "Shadnagar",
            "district": "Ranga Reddy",
            "state": "Telangana",
            "pincode": "509216",
        }
        res = client.post("/api/v1/farmers/profile", headers=headers, json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["full_name"] == "Ramesh Kumar"
        assert data["village"] == "Kothur"
        assert data["verification_status"] == "PENDING"
        assert data["pincode"] == "509216"
        # Phone is present + 6 address fields = 80% completion (0 farms)
        assert data["profile_completion_pct"] == 80
        assert data["is_profile_complete"] is False

    def test_farmer_cannot_create_duplicate_profile(
        self, client, farmer_user, farmer_with_profile, make_auth_header
    ):
        """Attempting to POST /profile when one already exists returns HTTP 409 Conflict."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        payload = {
            "address_line": "Duplicate Address",
            "village": "Kothur",
            "mandal": "Shadnagar",
            "district": "Ranga Reddy",
            "state": "Telangana",
            "pincode": "509216",
        }
        res = client.post("/api/v1/farmers/profile", headers=headers, json=payload)
        assert res.status_code == 409

    def test_farmer_can_retrieve_own_profile(
        self, client, farmer_user, farmer_with_profile, make_auth_header
    ):
        """Farmer can retrieve their own profile details."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        res = client.get("/api/v1/farmers/profile", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == farmer_user.email
        assert data["district"] == "Ranga Reddy"

    def test_farmer_can_update_own_profile(
        self, client, farmer_user, farmer_with_profile, make_auth_header
    ):
        """Farmer can update address and phone."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        update_payload = {
            "full_name": "Ramesh K. Patel",
            "phone": "+919876543210",
            "address_line": "Survey 42 & 43, Main Farm Road",
            "village": "New Kothur",
        }
        res = client.put("/api/v1/farmers/profile", headers=headers, json=update_payload)
        assert res.status_code == 200
        data = res.json()
        assert data["full_name"] == "Ramesh K. Patel"
        assert data["phone"] == "+919876543210"
        assert data["village"] == "New Kothur"

    def test_farmer_can_create_farm(
        self, client, farmer_user, farmer_with_profile, make_auth_header
    ):
        """Farmer can create a farm parcel with crops and coordinates."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        payload = {
            "farm_name": "Green Valley Organic Plot",
            "total_area": 4.5,
            "area_unit": "ACRE",
            "ownership_type": "OWNED",
            "soil_type": "BLACK",
            "irrigation_type": "BOREWELL",
            "primary_crops": ["Tomato", "Chilli", "Rice"],
            "latitude": 17.1524,
            "longitude": 78.2911,
            "address_line": "Near Old Canal Bridge",
            "village": "Kothur",
            "mandal": "Shadnagar",
            "district": "Ranga Reddy",
            "state": "Telangana",
            "pincode": "509216",
        }
        res = client.post("/api/v1/farmers/farms", headers=headers, json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["farm_name"] == "Green Valley Organic Plot"
        assert data["total_area"] == 4.5
        assert "Tomato" in data["primary_crops"]
        assert data["id"] is not None

    def test_profile_completion_reaches_100_percent_after_adding_farm(
        self, client, farmer_user, farmer_with_farm, make_auth_header
    ):
        """Once farmer has personal info and at least 1 farm, profile reaches 100%."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        res = client.get("/api/v1/farmers/profile", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["profile_completion_pct"] == 100
        assert data["is_profile_complete"] is True

        summary_res = client.get("/api/v1/farmers/summary", headers=headers)
        assert summary_res.status_code == 200
        summary_data = summary_res.json()
        assert summary_data["ready_for_produce"] is True
        assert summary_data["total_farms"] == 1
        assert summary_data["total_farm_area_acres"] == 4.5

    def test_farmer_can_retrieve_own_farms(
        self, client, farmer_user, farmer_with_farm, make_auth_header
    ):
        """Farmer can view all their farms."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        res = client.get("/api/v1/farmers/farms", headers=headers)
        assert res.status_code == 200
        farms = res.json()
        assert len(farms) >= 1
        assert farms[0]["farm_name"] == "Green Valley Organic Plot"

    def test_farmer_can_update_own_farm(
        self, client, farmer_user, farmer_with_farm, make_auth_header
    ):
        """Farmer can update farm area and soil type."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        farm_id = farmer_with_farm["id"]

        update_payload = {
            "farm_name": "Green Valley Organic Agro Hub",
            "total_area": 5.25,
            "soil_type": "RED",
        }
        res = client.put(
            f"/api/v1/farmers/farms/{farm_id}",
            headers=headers,
            json=update_payload,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["farm_name"] == "Green Valley Organic Agro Hub"
        assert data["total_area"] == 5.25
        assert data["soil_type"] == "RED"

    def test_farmer_cannot_access_another_farmers_farm(
        self, client, farmer_user, farmer_two_user, farmer_with_farm, make_auth_header
    ):
        """Farmer B cannot view, update, or delete Farmer A's farm (returns 404)."""
        headers_farmer_b = make_auth_header(farmer_two_user.auth_user_id, farmer_two_user.email)

        # Setup profile for Farmer B
        client.post(
            "/api/v1/farmers/profile",
            headers=headers_farmer_b,
            json={
                "address_line": "Survey 99, North Gate",
                "village": "Nandigama",
                "mandal": "Patancheru",
                "district": "Sangareddy",
                "state": "Telangana",
                "pincode": "502319",
            },
        )

        farm_a_id = farmer_with_farm["id"]

        # Farmer B attempts GET on Farmer A's farm -> 404
        res_get = client.get(f"/api/v1/farmers/farms/{farm_a_id}", headers=headers_farmer_b)
        assert res_get.status_code == 404

        # Farmer B attempts PUT on Farmer A's farm -> 404
        res_put = client.put(
            f"/api/v1/farmers/farms/{farm_a_id}",
            headers=headers_farmer_b,
            json={"farm_name": "Hacked Farm Name"},
        )
        assert res_put.status_code == 404

        # Farmer B attempts DELETE on Farmer A's farm -> 404
        res_del = client.delete(f"/api/v1/farmers/farms/{farm_a_id}", headers=headers_farmer_b)
        assert res_del.status_code == 404

    def test_invalid_farm_data_is_rejected(
        self, client, farmer_user, farmer_with_profile, make_auth_header
    ):
        """Validation errors: zero/negative area, invalid unit, missing name."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)

        # Area <= 0
        res_neg = client.post(
            "/api/v1/farmers/farms",
            headers=headers,
            json={
                "farm_name": "Invalid Plot",
                "total_area": -2.0,
                "village": "Kothur",
                "mandal": "Shadnagar",
                "district": "Ranga Reddy",
                "state": "Telangana",
                "pincode": "509216",
            },
        )
        assert res_neg.status_code == 422

        # Invalid area unit
        res_unit = client.post(
            "/api/v1/farmers/farms",
            headers=headers,
            json={
                "farm_name": "Invalid Plot",
                "total_area": 5.0,
                "area_unit": "SQUARE_FEET",  # Only ACRE or HECTARE allowed
                "village": "Kothur",
                "mandal": "Shadnagar",
                "district": "Ranga Reddy",
                "state": "Telangana",
                "pincode": "509216",
            },
        )
        assert res_unit.status_code == 422

    def test_invalid_coordinates_are_rejected(
        self, client, farmer_user, farmer_with_profile, make_auth_header
    ):
        """Latitude must be between -90 and 90, Longitude between -180 and 180."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        res = client.post(
            "/api/v1/farmers/farms",
            headers=headers,
            json={
                "farm_name": "Invalid Coords Plot",
                "total_area": 5.0,
                "latitude": 95.0,  # Invalid!
                "longitude": 78.0,
                "village": "Kothur",
                "mandal": "Shadnagar",
                "district": "Ranga Reddy",
                "state": "Telangana",
                "pincode": "509216",
            },
        )
        assert res.status_code == 422

    def test_invalid_pincode_is_rejected(
        self, client, farmer_user, farmer_with_profile, make_auth_header
    ):
        """Pincode must be a 6-digit number."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        res = client.post(
            "/api/v1/farmers/farms",
            headers=headers,
            json={
                "farm_name": "Invalid Pincode Plot",
                "total_area": 5.0,
                "village": "Kothur",
                "mandal": "Shadnagar",
                "district": "Ranga Reddy",
                "state": "Telangana",
                "pincode": "123",  # Invalid!
            },
        )
        assert res.status_code == 422

    def test_farmer_can_upload_photo(
        self, client, farmer_user, farmer_with_profile, make_auth_header
    ):
        """Farmer can upload JPEG/PNG avatar photo."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        fake_image_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00"

        files = {"file": ("avatar.jpg", io.BytesIO(fake_image_bytes), "image/jpeg")}
        res = client.post(
            "/api/v1/farmers/profile/photo",
            headers=headers,
            files=files,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["profile_photo_url"] is not None

    def test_farmer_can_delete_own_farm(
        self, client, farmer_user, farmer_with_farm, make_auth_header
    ):
        """Farmer can delete a farm and it disappears from farm list."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        farm_id = farmer_with_farm["id"]

        del_res = client.delete(f"/api/v1/farmers/farms/{farm_id}", headers=headers)
        assert del_res.status_code == 200

        # Verify it's gone
        get_res = client.get(f"/api/v1/farmers/farms/{farm_id}", headers=headers)
        assert get_res.status_code == 404

        farms_after = client.get("/api/v1/farmers/farms", headers=headers).json()
        assert not any(f["id"] == farm_id for f in farms_after)
