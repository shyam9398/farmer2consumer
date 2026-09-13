import io
from datetime import date, timedelta
import pytest
from app.models.enums import ProductCategory, ProduceStatus, QualityGrade, QuantityUnit, UserRole


@pytest.fixture
def farmer_user(create_test_user, db_session):
    """Create a verified FARMER profile with full name and phone."""
    profile = create_test_user(
        auth_user_id="auth-farmer-p4-001",
        email="ramesh.produce@mandidirect.in",
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
        auth_user_id="auth-farmer-p4-002",
        email="suresh.produce@mandidirect.in",
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
        auth_user_id="auth-buyer-p4-001",
        email="vikram.buyer@retailmandi.in",
        full_name="Vikram Agro Wholesale",
        role=UserRole.BUYER,
    )


@pytest.fixture
def farmer_with_complete_profile(client, farmer_user, make_auth_header):
    """Setup 100% complete farmer profile with a registered farm."""
    headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
    profile_payload = {
        "date_of_birth": "1985-06-15",
        "gender": "MALE",
        "address_line": "Survey 42, Farm Road",
        "village": "Kothur",
        "mandal": "Shadnagar",
        "district": "Ranga Reddy",
        "state": "Telangana",
        "pincode": "509216",
    }
    client.post("/api/v1/farmers/profile", headers=headers, json=profile_payload)

    farm_payload = {
        "farm_name": "Green Valley Organic Plot",
        "total_area": 4.5,
        "area_unit": "ACRE",
        "ownership_type": "OWNED",
        "soil_type": "BLACK",
        "irrigation_type": "BOREWELL",
        "primary_crops": ["Tomato", "Chilli", "Rice"],
        "village": "Kothur",
        "mandal": "Shadnagar",
        "district": "Ranga Reddy",
        "state": "Telangana",
        "pincode": "509216",
    }
    farm_res = client.post("/api/v1/farmers/farms", headers=headers, json=farm_payload)
    assert farm_res.status_code == 201
    return farm_res.json()


@pytest.fixture
def sample_produce_payload(farmer_with_complete_profile):
    """Standard valid payload for creating a produce lot."""
    today = date.today()
    return {
        "farm_id": farmer_with_complete_profile["id"],
        "product_name": "Organic Tomatoes",
        "category": "VEGETABLE",
        "variety": "Hybrid Roma",
        "description": "Freshly harvested ripe red tomatoes, crate packed.",
        "total_quantity": 500.0,
        "quantity_unit": "KG",
        "quality_grade": "GRADE_A",
        "harvest_date": today.isoformat(),
        "available_from": today.isoformat(),
        "available_until": (today + timedelta(days=14)).isoformat(),
        "expected_price": 28.50,
        "price_unit": "PER_KG",
        "minimum_order_quantity": 25.0,
    }


class TestProduceLifecycleAndSecurity:
    """Comprehensive test suite for Phase 4: Add Produce & Produce Management."""

    def test_unauthenticated_cannot_access_produce_endpoints(self, client):
        """Unauthenticated requests must be rejected with HTTP 401."""
        assert client.get("/api/v1/farmers/produce").status_code == 401
        assert client.post("/api/v1/farmers/produce", json={}).status_code == 401
        assert client.get("/api/v1/farmers/produce/stats").status_code == 401

    def test_buyer_cannot_access_produce_endpoints(
        self, client, buyer_user, make_auth_header
    ):
        """Users with BUYER role must receive HTTP 403 Forbidden."""
        headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email)
        assert client.get("/api/v1/farmers/produce", headers=headers).status_code == 403
        assert client.post("/api/v1/farmers/produce", headers=headers, json={}).status_code == 403

    def test_farmer_with_incomplete_profile_cannot_create_produce(
        self, client, farmer_user, make_auth_header
    ):
        """Farmer without 100% profile score must be blocked with HTTP 403."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        payload = {
            "farm_id": "dummy-farm-id",
            "product_name": "Tomato",
            "category": "VEGETABLE",
            "total_quantity": 100.0,
            "harvest_date": "2026-09-08",
            "available_from": "2026-09-08",
            "expected_price": 20.0,
        }
        res = client.post("/api/v1/farmers/produce", headers=headers, json=payload)
        assert res.status_code == 403
        assert "complete" in res.json()["detail"].lower()

    def test_farmer_cannot_create_produce_with_unowned_farm(
        self, client, farmer_user, farmer_with_complete_profile, make_auth_header
    ):
        """Farmer cannot attach produce to an unowned farm ID."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        today = date.today()
        payload = {
            "farm_id": "00000000-0000-0000-0000-000000000000",
            "product_name": "Potatoes",
            "category": "VEGETABLE",
            "total_quantity": 200.0,
            "quantity_unit": "KG",
            "quality_grade": "UNGRADED",
            "harvest_date": today.isoformat(),
            "available_from": today.isoformat(),
            "expected_price": 18.0,
            "minimum_order_quantity": 10.0,
        }
        res = client.post("/api/v1/farmers/produce", headers=headers, json=payload)
        assert res.status_code == 400
        assert "farm" in res.json()["detail"].lower()

    def test_create_produce_draft_success(
        self, client, farmer_user, sample_produce_payload, make_auth_header
    ):
        """Farmer successfully creates a produce lot in DRAFT status."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        res = client.post("/api/v1/farmers/produce", headers=headers, json=sample_produce_payload)
        assert res.status_code == 201
        data = res.json()

        assert data["product_name"] == "Organic Tomatoes"
        assert data["category"] == "VEGETABLE"
        assert data["status"] == "DRAFT"
        assert float(data["total_quantity"]) == 500.0
        assert float(data["available_quantity"]) == 500.0
        assert float(data["reserved_quantity"]) == 0.0
        assert float(data["sold_quantity"]) == 0.0
        assert float(data["expected_price"]) == 28.50
        assert data["farm_name"] == "Green Valley Organic Plot"
        assert len(data["images"]) == 0

    def test_produce_schema_validation(
        self, client, farmer_user, sample_produce_payload, make_auth_header
    ):
        """Validation errors on invalid quantities and date ranges."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)

        # 1. Negative total quantity
        bad_qty = dict(sample_produce_payload, total_quantity=-50)
        res = client.post("/api/v1/farmers/produce", headers=headers, json=bad_qty)
        assert res.status_code == 422

        # 2. MOQ > total quantity
        bad_moq = dict(sample_produce_payload, minimum_order_quantity=600.0)
        res = client.post("/api/v1/farmers/produce", headers=headers, json=bad_moq)
        assert res.status_code == 422

        # 3. available_until < available_from
        bad_dates = dict(
            sample_produce_payload,
            available_from="2026-09-15",
            available_until="2026-09-10",
        )
        res = client.post("/api/v1/farmers/produce", headers=headers, json=bad_dates)
        assert res.status_code == 422

    def test_list_produce_with_filters_and_search(
        self, client, farmer_user, sample_produce_payload, make_auth_header
    ):
        """List produce lots with category, status filters, and search query."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)

        # Create vegetable produce
        client.post("/api/v1/farmers/produce", headers=headers, json=sample_produce_payload)

        # Create grain produce
        grain_payload = dict(
            sample_produce_payload,
            product_name="Basmati Rice",
            category="GRAIN",
            variety="Pusa 1121",
            total_quantity=1000.0,
            quantity_unit="QUINTAL",
            expected_price=4200.0,
            price_unit="PER_QUINTAL",
            minimum_order_quantity=10.0,
        )
        client.post("/api/v1/farmers/produce", headers=headers, json=grain_payload)

        # 1. List all
        res = client.get("/api/v1/farmers/produce", headers=headers)
        assert res.status_code == 200
        assert res.json()["total"] >= 2

        # 2. Filter by category
        res_cat = client.get("/api/v1/farmers/produce?category=GRAIN", headers=headers)
        assert res_cat.status_code == 200
        assert all(item["category"] == "GRAIN" for item in res_cat.json()["items"])

        # 3. Search query
        res_search = client.get("/api/v1/farmers/produce?search=Basmati", headers=headers)
        assert res_search.status_code == 200
        assert res_search.json()["total"] >= 1
        assert "Basmati" in res_search.json()["items"][0]["product_name"]

    def test_patch_produce_draft(
        self, client, farmer_user, sample_produce_payload, make_auth_header
    ):
        """Updating DRAFT produce updates fields and adjusts available_quantity."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        create_res = client.post(
            "/api/v1/farmers/produce", headers=headers, json=sample_produce_payload
        )
        produce_id = create_res.json()["id"]

        update_payload = {
            "expected_price": 32.0,
            "total_quantity": 750.0,
            "variety": "Desi Organic Heirloom",
        }
        patch_res = client.patch(
            f"/api/v1/farmers/produce/{produce_id}", headers=headers, json=update_payload
        )
        assert patch_res.status_code == 200
        data = patch_res.json()
        assert float(data["expected_price"]) == 32.0
        assert float(data["total_quantity"]) == 750.0
        assert float(data["available_quantity"]) == 750.0
        assert data["variety"] == "Desi Organic Heirloom"

    def test_tenant_isolation_cross_farmer_produce(
        self, client, farmer_user, farmer_two_user, sample_produce_payload, make_auth_header
    ):
        """Farmer 2 cannot view, edit, or submit Farmer 1's produce."""
        h1 = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        h2 = make_auth_header(farmer_two_user.auth_user_id, farmer_two_user.email)

        create_res = client.post("/api/v1/farmers/produce", headers=h1, json=sample_produce_payload)
        produce_id = create_res.json()["id"]

        # Farmer 2 GET
        assert client.get(f"/api/v1/farmers/produce/{produce_id}", headers=h2).status_code == 404
        # Farmer 2 PATCH
        assert (
            client.patch(
                f"/api/v1/farmers/produce/{produce_id}",
                headers=h2,
                json={"expected_price": 10.0},
            ).status_code
            == 404
        )
        # Farmer 2 SUBMIT
        assert (
            client.post(f"/api/v1/farmers/produce/{produce_id}/submit", headers=h2).status_code
            == 404
        )
        # Farmer 2 DELETE
        assert (
            client.delete(f"/api/v1/farmers/produce/{produce_id}", headers=h2).status_code == 404
        )

    def test_image_upload_primary_and_deletion(
        self, client, farmer_user, sample_produce_payload, make_auth_header
    ):
        """Upload produce photos, set primary, and delete photo."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        create_res = client.post(
            "/api/v1/farmers/produce", headers=headers, json=sample_produce_payload
        )
        produce_id = create_res.json()["id"]

        # Upload first image -> should automatically become is_primary=True
        img1_file = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb")
        upload1_res = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("photo1.jpg", img1_file, "image/jpeg")},
        )
        assert upload1_res.status_code == 201
        img1_data = upload1_res.json()
        assert img1_data["is_primary"] is True
        img1_id = img1_data["id"]

        # Upload second image -> is_primary=False
        img2_file = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01")
        upload2_res = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("photo2.png", img2_file, "image/png")},
        )
        assert upload2_res.status_code == 201
        img2_data = upload2_res.json()
        assert img2_data["is_primary"] is False
        img2_id = img2_data["id"]

        # Set image 2 as primary
        primary_res = client.patch(
            f"/api/v1/farmers/produce/{produce_id}/images/{img2_id}/primary",
            headers=headers,
        )
        assert primary_res.status_code == 200
        assert primary_res.json()["is_primary"] is True

        # Verify produce detail reflects primary image
        detail_res = client.get(f"/api/v1/farmers/produce/{produce_id}", headers=headers)
        assert detail_res.status_code == 200
        assert len(detail_res.json()["images"]) == 2
        assert detail_res.json()["primary_image_url"] == img2_data["image_url"]

        # Delete image 1
        del_res = client.delete(
            f"/api/v1/farmers/produce/{produce_id}/images/{img1_id}",
            headers=headers,
        )
        assert del_res.status_code == 200

        detail_after_del = client.get(f"/api/v1/farmers/produce/{produce_id}", headers=headers)
        assert len(detail_after_del.json()["images"]) == 1

    def test_max_five_photos_enforced(
        self, client, farmer_user, sample_produce_payload, make_auth_header
    ):
        """Uploading more than 5 photos is rejected with HTTP 400."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        create_res = client.post(
            "/api/v1/farmers/produce", headers=headers, json=sample_produce_payload
        )
        produce_id = create_res.json()["id"]

        for i in range(5):
            f = io.BytesIO(b"\xff\xd8\xff\xe0" + bytes([i]))
            res = client.post(
                f"/api/v1/farmers/produce/{produce_id}/images",
                headers=headers,
                files={"file": (f"img_{i}.jpg", f, "image/jpeg")},
            )
            assert res.status_code == 201

        # 6th upload must fail
        f_extra = io.BytesIO(b"\xff\xd8\xff\xe0extra")
        res_extra = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("extra.jpg", f_extra, "image/jpeg")},
        )
        assert res_extra.status_code == 400
        assert "5 photos" in res_extra.json()["detail"].lower()

    def test_submit_for_verification_requires_photo(
        self, client, farmer_user, sample_produce_payload, make_auth_header
    ):
        """Submitting produce lot with zero photos is rejected."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        create_res = client.post(
            "/api/v1/farmers/produce", headers=headers, json=sample_produce_payload
        )
        produce_id = create_res.json()["id"]

        submit_res = client.post(
            f"/api/v1/farmers/produce/{produce_id}/submit", headers=headers
        )
        assert submit_res.status_code == 400
        assert "photo" in submit_res.json()["detail"].lower()

    def test_submit_for_verification_and_state_lock(
        self, client, farmer_user, sample_produce_payload, make_auth_header
    ):
        """
        After uploading a photo, lot transitions to PENDING_VERIFICATION.
        Modifying or deleting PENDING_VERIFICATION lot is strictly blocked.
        """
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        create_res = client.post(
            "/api/v1/farmers/produce", headers=headers, json=sample_produce_payload
        )
        produce_id = create_res.json()["id"]

        # Upload 1 photo
        img_file = io.BytesIO(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01")
        client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("lot.jpg", img_file, "image/jpeg")},
        )

        # Submit
        submit_res = client.post(
            f"/api/v1/farmers/produce/{produce_id}/submit", headers=headers
        )
        assert submit_res.status_code == 200
        submitted_data = submit_res.json()
        assert submitted_data["status"] == "PENDING_VERIFICATION"
        assert submitted_data["submitted_at"] is not None

        # Cannot edit pending lot
        patch_res = client.patch(
            f"/api/v1/farmers/produce/{produce_id}",
            headers=headers,
            json={"expected_price": 40.0},
        )
        assert patch_res.status_code == 400
        assert "only draft or rejected" in patch_res.json()["detail"].lower()

        # Cannot delete pending lot
        del_res = client.delete(f"/api/v1/farmers/produce/{produce_id}", headers=headers)
        assert del_res.status_code == 400
        assert "only draft" in del_res.json()["detail"].lower()

    def test_delete_draft_produce_success(
        self, client, farmer_user, sample_produce_payload, make_auth_header
    ):
        """Farmer can delete a DRAFT produce lot."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        create_res = client.post(
            "/api/v1/farmers/produce", headers=headers, json=sample_produce_payload
        )
        produce_id = create_res.json()["id"]

        del_res = client.delete(f"/api/v1/farmers/produce/{produce_id}", headers=headers)
        assert del_res.status_code == 200

        # Verify not found
        assert client.get(f"/api/v1/farmers/produce/{produce_id}", headers=headers).status_code == 404

    def test_produce_summary_stats(
        self, client, farmer_user, sample_produce_payload, make_auth_header
    ):
        """Produce stats endpoint returns aggregate counts."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        res = client.get("/api/v1/farmers/produce/stats", headers=headers)
        assert res.status_code == 200
        stats = res.json()
        assert "total_listings" in stats
        assert "draft_count" in stats
        assert "pending_count" in stats
        assert "approved_count" in stats

    def test_reference_crops_endpoint(self, client):
        """Public crops reference catalog returns standard agricultural items."""
        res = client.get("/api/v1/reference/crops")
        assert res.status_code == 200
        crops = res.json()
        assert len(crops) >= 15
        crop_names = [c["name"] for c in crops]
        assert "Tomato" in crop_names
        assert "Basmati Rice" in crop_names
        assert "Wheat" in crop_names
