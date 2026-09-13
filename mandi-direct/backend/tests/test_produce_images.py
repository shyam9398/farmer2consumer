import io
from datetime import date, timedelta
import pytest
from app.models.enums import ProduceStatus, QualityGrade, QuantityUnit, UserRole


@pytest.fixture
def farmer_user(create_test_user, db_session):
    """Create a verified FARMER profile with full name and phone."""
    profile = create_test_user(
        auth_user_id="auth-farmer-img-001",
        email="ramesh.img@mandidirect.in",
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
        auth_user_id="auth-farmer-img-002",
        email="suresh.img@mandidirect.in",
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
        auth_user_id="auth-buyer-img-001",
        email="vikram.img@retailmandi.in",
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
def sample_produce(client, farmer_user, farmer_with_complete_profile, make_auth_header):
    """Standard valid draft produce lot."""
    headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
    today = date.today()
    payload = {
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
    res = client.post("/api/v1/farmers/produce", headers=headers, json=payload)
    assert res.status_code == 201
    return res.json()


# Helpers to generate dummy valid image bytes
def make_jpeg_bytes(length: int = 50) -> bytes:
    header = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00"
    return header + b"\x00" * max(0, length - len(header))


def make_png_bytes() -> bytes:
    # Minimal 1x1 PNG
    return (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
        b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
        b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4"
        b"\x00\x00\x00\x00IEND\xaeB`\x82"
    )


def make_webp_bytes() -> bytes:
    # Valid RIFF WEBP header with VP8 chunk
    header = (
        b"RIFF\x24\x00\x00\x00WEBPVP8 \x18\x00\x00\x00"
        b"\x30\x01\x00\x9d\x01\x2a\x0a\x00\x0a\x00"
    )
    return header + b"\x00" * 10


class TestProduceMediaManagement:
    """Comprehensive test suite for Phase 5: Product Photos & Media Management."""

    def test_upload_produce_image_jpeg(
        self, client, farmer_user, sample_produce, make_auth_header
    ):
        """Upload valid JPEG image and verify metadata response."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        f_bytes = make_jpeg_bytes(100)
        res = client.post(
            f"/api/v1/farmers/produce/{sample_produce['id']}/images",
            headers=headers,
            files={"file": ("tomatoes_front.jpg", io.BytesIO(f_bytes), "image/jpeg")},
        )
        assert res.status_code == 201
        data = res.json()
        assert data["file_name"] == "tomatoes_front.jpg"
        assert data["mime_type"] == "image/jpeg"
        assert data["file_size"] == len(f_bytes)
        assert data["is_primary"] is True
        assert data["display_order"] == 0
        assert data["public_url"].startswith("http") or data["public_url"].startswith("/")
        assert sample_produce["id"] in data["storage_path"]

    def test_upload_produce_image_png_and_webp(
        self, client, farmer_user, sample_produce, make_auth_header
    ):
        """Upload PNG and WEBP images, checking dimension parsing and order."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)

        # PNG upload (should get 1x1 dimensions)
        png_bytes = make_png_bytes()
        res_png = client.post(
            f"/api/v1/farmers/produce/{sample_produce['id']}/images",
            headers=headers,
            files={"file": ("field.png", io.BytesIO(png_bytes), "image/png")},
        )
        assert res_png.status_code == 201
        data_png = res_png.json()
        assert data_png["mime_type"] == "image/png"
        assert data_png["width"] == 1
        assert data_png["height"] == 1
        assert data_png["is_primary"] is True

        # WEBP upload as second image
        webp_bytes = make_webp_bytes()
        res_webp = client.post(
            f"/api/v1/farmers/produce/{sample_produce['id']}/images",
            headers=headers,
            files={"file": ("crate.webp", io.BytesIO(webp_bytes), "image/webp")},
        )
        assert res_webp.status_code == 201
        data_webp = res_webp.json()
        assert data_webp["mime_type"] == "image/webp"
        assert data_webp["is_primary"] is False
        assert data_webp["display_order"] == 1

    def test_list_produce_images_ordered(
        self, client, farmer_user, sample_produce, make_auth_header
    ):
        """GET /produce/{id}/images retrieves all photos ordered by display_order ASC."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        produce_id = sample_produce["id"]

        for i in range(3):
            client.post(
                f"/api/v1/farmers/produce/{produce_id}/images",
                headers=headers,
                files={"file": (f"img_{i}.jpg", io.BytesIO(make_jpeg_bytes(40 + i)), "image/jpeg")},
            )

        res = client.get(f"/api/v1/farmers/produce/{produce_id}/images", headers=headers)
        assert res.status_code == 200
        images = res.json()
        assert len(images) == 3
        assert images[0]["display_order"] == 0
        assert images[0]["is_primary"] is True
        assert images[1]["display_order"] == 1
        assert images[2]["display_order"] == 2

    def test_set_primary_photo_post_and_patch(
        self, client, farmer_user, sample_produce, make_auth_header
    ):
        """Designate a photo as primary using both POST and PATCH, enforcing single primary."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        produce_id = sample_produce["id"]

        ids = []
        for i in range(3):
            r = client.post(
                f"/api/v1/farmers/produce/{produce_id}/images",
                headers=headers,
                files={"file": (f"img_{i}.jpg", io.BytesIO(make_jpeg_bytes(40 + i)), "image/jpeg")},
            )
            ids.append(r.json()["id"])

        # Switch primary to image 1 using POST
        res_post = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images/{ids[1]}/primary",
            headers=headers,
        )
        assert res_post.status_code == 200
        assert res_post.json()["is_primary"] is True

        # Verify only image 1 is primary
        list_res = client.get(f"/api/v1/farmers/produce/{produce_id}/images", headers=headers)
        all_imgs = list_res.json()
        primaries = [img for img in all_imgs if img["is_primary"]]
        assert len(primaries) == 1
        assert primaries[0]["id"] == ids[1]

        # Switch primary to image 2 using PATCH
        res_patch = client.patch(
            f"/api/v1/farmers/produce/{produce_id}/images/{ids[2]}/primary",
            headers=headers,
        )
        assert res_patch.status_code == 200
        assert res_patch.json()["is_primary"] is True

    def test_reorder_produce_images(
        self, client, farmer_user, sample_produce, make_auth_header
    ):
        """PATCH /produce/{id}/images/reorder successfully updates display_order."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        produce_id = sample_produce["id"]

        ids = []
        for i in range(3):
            r = client.post(
                f"/api/v1/farmers/produce/{produce_id}/images",
                headers=headers,
                files={"file": (f"img_{i}.jpg", io.BytesIO(make_jpeg_bytes(40 + i)), "image/jpeg")},
            )
            ids.append(r.json()["id"])

        # Reorder to [ids[2], ids[0], ids[1]]
        new_order = [ids[2], ids[0], ids[1]]
        res = client.patch(
            f"/api/v1/farmers/produce/{produce_id}/images/reorder",
            headers=headers,
            json={"image_ids": new_order},
        )
        assert res.status_code == 200
        reordered = res.json()
        assert len(reordered) == 3
        assert reordered[0]["id"] == ids[2]
        assert reordered[0]["display_order"] == 0
        assert reordered[1]["id"] == ids[0]
        assert reordered[1]["display_order"] == 1
        assert reordered[2]["id"] == ids[1]
        assert reordered[2]["display_order"] == 2

    def test_reorder_invalid_ids_returns_400(
        self, client, farmer_user, sample_produce, make_auth_header
    ):
        """Reordering with missing or mismatched IDs fails with HTTP 400."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        produce_id = sample_produce["id"]

        client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("img1.jpg", io.BytesIO(make_jpeg_bytes(40)), "image/jpeg")},
        )

        res = client.patch(
            f"/api/v1/farmers/produce/{produce_id}/images/reorder",
            headers=headers,
            json={"image_ids": ["00000000-0000-0000-0000-000000000000"]},
        )
        assert res.status_code == 400

    def test_delete_non_primary_image(
        self, client, farmer_user, sample_produce, make_auth_header
    ):
        """Deleting a non-primary image leaves the primary intact."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        produce_id = sample_produce["id"]

        r1 = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("primary.jpg", io.BytesIO(make_jpeg_bytes(40)), "image/jpeg")},
        )
        r2 = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("secondary.jpg", io.BytesIO(make_jpeg_bytes(41)), "image/jpeg")},
        )
        id1 = r1.json()["id"]
        id2 = r2.json()["id"]

        del_res = client.delete(
            f"/api/v1/farmers/produce/{produce_id}/images/{id2}",
            headers=headers,
        )
        assert del_res.status_code == 200

        list_res = client.get(f"/api/v1/farmers/produce/{produce_id}/images", headers=headers)
        images = list_res.json()
        assert len(images) == 1
        assert images[0]["id"] == id1
        assert images[0]["is_primary"] is True

    def test_delete_primary_image_auto_promotes_next(
        self, client, farmer_user, sample_produce, make_auth_header
    ):
        """Deleting the primary image promotes the next remaining image to primary."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        produce_id = sample_produce["id"]

        r1 = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("first.jpg", io.BytesIO(make_jpeg_bytes(40)), "image/jpeg")},
        )
        r2 = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("second.jpg", io.BytesIO(make_jpeg_bytes(41)), "image/jpeg")},
        )
        id1 = r1.json()["id"]
        id2 = r2.json()["id"]

        # Delete the primary image (first)
        del_res = client.delete(
            f"/api/v1/farmers/produce/{produce_id}/images/{id1}",
            headers=headers,
        )
        assert del_res.status_code == 200

        # Verify second image was promoted to primary
        list_res = client.get(f"/api/v1/farmers/produce/{produce_id}/images", headers=headers)
        images = list_res.json()
        assert len(images) == 1
        assert images[0]["id"] == id2
        assert images[0]["is_primary"] is True

    def test_max_five_images_limit(
        self, client, farmer_user, sample_produce, make_auth_header
    ):
        """Listing cannot have more than 5 images (400 Bad Request on 6th)."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        produce_id = sample_produce["id"]

        for i in range(5):
            r = client.post(
                f"/api/v1/farmers/produce/{produce_id}/images",
                headers=headers,
                files={"file": (f"img_{i}.jpg", io.BytesIO(make_jpeg_bytes(40 + i)), "image/jpeg")},
            )
            assert r.status_code == 201

        # 6th upload must fail
        r6 = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("img_5.jpg", io.BytesIO(make_jpeg_bytes(50)), "image/jpeg")},
        )
        assert r6.status_code == 400
        assert "5 photos" in r6.json()["detail"]

    def test_reject_file_size_exceeding_10mb(
        self, client, farmer_user, sample_produce, make_auth_header
    ):
        """Files exceeding 10MB are rejected with HTTP 413."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        produce_id = sample_produce["id"]

        oversized_bytes = b"\xff\xd8\xff" + b"A" * (10 * 1024 * 1024 + 1024)
        res = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("huge.jpg", io.BytesIO(oversized_bytes), "image/jpeg")},
        )
        assert res.status_code == 413
        assert "10MB" in res.json()["detail"]

    def test_reject_invalid_media_types(
        self, client, farmer_user, sample_produce, make_auth_header
    ):
        """Unsupported extensions (PDF, SVG, TXT) are rejected with HTTP 415."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        produce_id = sample_produce["id"]

        res_pdf = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("invoice.pdf", io.BytesIO(b"%PDF-1.4..."), "application/pdf")},
        )
        assert res_pdf.status_code == 415

        res_svg = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("vector.svg", io.BytesIO(b"<svg></svg>"), "image/svg+xml")},
        )
        assert res_svg.status_code == 415

    def test_reject_spoofed_magic_bytes(
        self, client, farmer_user, sample_produce, make_auth_header
    ):
        """File claiming to be JPEG but containing text is rejected with HTTP 415."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        produce_id = sample_produce["id"]

        fake_jpeg = b"This is not a real JPEG file content."
        res = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("spoof.jpg", io.BytesIO(fake_jpeg), "image/jpeg")},
        )
        assert res.status_code == 415
        assert "File signature does not match" in res.json()["detail"]

    def test_state_lock_no_upload_when_pending_verification(
        self, client, farmer_user, sample_produce, make_auth_header
    ):
        """Upload is blocked once lot is submitted for verification (HTTP 400)."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        produce_id = sample_produce["id"]

        # Upload 1 photo so we can submit
        client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("img1.jpg", io.BytesIO(make_jpeg_bytes(40)), "image/jpeg")},
        )

        # Submit lot
        sub_res = client.post(f"/api/v1/farmers/produce/{produce_id}/submit", headers=headers)
        assert sub_res.status_code == 200
        assert sub_res.json()["status"] == ProduceStatus.PENDING_VERIFICATION.value

        # Now attempt to upload another photo
        res = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("img2.jpg", io.BytesIO(make_jpeg_bytes(40)), "image/jpeg")},
        )
        assert res.status_code == 400
        assert "Only DRAFT or REJECTED" in res.json()["detail"]

    def test_submit_requires_at_least_one_image(
        self, client, farmer_user, sample_produce, make_auth_header
    ):
        """Submitting a draft with 0 photos fails with HTTP 400."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        produce_id = sample_produce["id"]

        # 0 photos submitted
        sub_fail = client.post(f"/api/v1/farmers/produce/{produce_id}/submit", headers=headers)
        assert sub_fail.status_code == 400
        assert "At least one photo" in sub_fail.json()["detail"]

        # Upload photo and try again
        client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers,
            files={"file": ("img1.jpg", io.BytesIO(make_jpeg_bytes(40)), "image/jpeg")},
        )
        sub_ok = client.post(f"/api/v1/farmers/produce/{produce_id}/submit", headers=headers)
        assert sub_ok.status_code == 200
        assert sub_ok.json()["status"] == ProduceStatus.PENDING_VERIFICATION.value

    def test_cross_tenant_isolation(
        self, client, farmer_user, farmer_two_user, sample_produce, make_auth_header
    ):
        """Farmer B cannot access or modify Farmer A's photos."""
        headers_a = make_auth_header(farmer_user.auth_user_id, farmer_user.email)
        headers_b = make_auth_header(farmer_two_user.auth_user_id, farmer_two_user.email)
        produce_id = sample_produce["id"]

        # Farmer A uploads a photo
        up_res = client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers_a,
            files={"file": ("photo_a.jpg", io.BytesIO(make_jpeg_bytes(40)), "image/jpeg")},
        )
        img_id = up_res.json()["id"]

        # Farmer B tries to list Farmer A's images
        assert client.get(f"/api/v1/farmers/produce/{produce_id}/images", headers=headers_b).status_code == 404

        # Farmer B tries to upload to Farmer A's produce
        assert client.post(
            f"/api/v1/farmers/produce/{produce_id}/images",
            headers=headers_b,
            files={"file": ("hacked.jpg", io.BytesIO(make_jpeg_bytes(40)), "image/jpeg")},
        ).status_code == 404

        # Farmer B tries to delete Farmer A's photo
        assert client.delete(
            f"/api/v1/farmers/produce/{produce_id}/images/{img_id}",
            headers=headers_b,
        ).status_code == 404

        # Farmer B tries to set primary
        assert client.post(
            f"/api/v1/farmers/produce/{produce_id}/images/{img_id}/primary",
            headers=headers_b,
        ).status_code == 404
