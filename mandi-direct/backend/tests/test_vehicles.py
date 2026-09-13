import pytest
from decimal import Decimal
from fastapi import status
from app.models.profile import Profile
from app.models.vehicle import Vehicle


def test_vehicle_management_lifecycle(client, db_session, make_auth_header):
    # 1. Setup logistics user
    logistics_user = Profile(
        auth_user_id="auth-logistics-test-1",
        email="logistics_test@mandidirect.in",
        full_name="Fleet Manager",
        phone="+919876543299",
        role="LOGISTICS",
        status="ACTIVE",
    )
    db_session.add(logistics_user)
    db_session.commit()

    # 2. Register a new vehicle
    headers = make_auth_header(logistics_user.auth_user_id, logistics_user.email)
    payload = {
        "vehicle_number": "AP 39 TX 9999",
        "vehicle_type": "MINI_TRUCK",
        "capacity": 1500.0,
    }
    res = client.post("/api/v1/logistics/vehicles", json=payload, headers=headers)
    assert res.status_code == status.HTTP_201_CREATED, res.text
    v_data = res.json()
    v_id = v_data["id"]
    assert v_data["vehicle_number"] == "AP 39 TX 9999"
    assert v_data["availability_status"] == "AVAILABLE"

    # 3. Duplicate vehicle number must fail
    res_dup = client.post("/api/v1/logistics/vehicles", json=payload, headers=headers)
    assert res_dup.status_code == status.HTTP_409_CONFLICT

    # 4. List vehicles
    res_list = client.get("/api/v1/logistics/vehicles", headers=headers)
    assert res_list.status_code == status.HTTP_200_OK
    data = res_list.json()
    assert data["total"] >= 1
    assert any(item["id"] == v_id for item in data["items"])

    # 5. Update vehicle status and coordinates
    patch_payload = {
        "availability_status": "ON_DELIVERY",
        "current_latitude": 16.5062,
        "current_longitude": 80.6480,
    }
    res_patch = client.patch(f"/api/v1/logistics/vehicles/{v_id}", json=patch_payload, headers=headers)
    assert res_patch.status_code == status.HTTP_200_OK
    assert res_patch.json()["availability_status"] == "ON_DELIVERY"
    assert res_patch.json()["current_latitude"] == 16.5062
