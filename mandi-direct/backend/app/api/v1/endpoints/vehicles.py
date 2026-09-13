from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_roles
from app.models.enums import UserRole
from app.models.profile import Profile
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleListResponse,
    VehicleResponse,
    VehicleUpdate,
)
from app.services.vehicle_service import vehicle_service

router = APIRouter(prefix="/logistics/vehicles", tags=["Logistics Vehicles"])


@router.get(
    "",
    response_model=VehicleListResponse,
    summary="List delivery fleet vehicles (Logistics / Admin)",
)
def list_vehicles(
    availability_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.LOGISTICS.value, UserRole.ADMIN.value)),
):
    user_id = current_user.id if current_user.role == UserRole.LOGISTICS.value else None
    items = vehicle_service.list_vehicles(
        db, logistics_user_id=user_id, availability_status=availability_status
    )
    return VehicleListResponse(items=[VehicleResponse.model_validate(v) for v in items], total=len(items))


@router.post(
    "",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new delivery vehicle (Logistics only)",
)
def create_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.LOGISTICS.value)),
):
    vehicle = vehicle_service.create_vehicle(db, current_user.id, vehicle_in)
    return VehicleResponse.model_validate(vehicle)


@router.patch(
    "/{vehicle_id}",
    response_model=VehicleResponse,
    summary="Update vehicle availability or coordinates (Logistics only)",
)
def update_vehicle(
    vehicle_id: str,
    vehicle_in: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.LOGISTICS.value, UserRole.ADMIN.value)),
):
    user_id = current_user.id if current_user.role == UserRole.LOGISTICS.value else None
    vehicle = vehicle_service.update_vehicle(db, vehicle_id, vehicle_in, logistics_user_id=user_id)
    return VehicleResponse.model_validate(vehicle)
