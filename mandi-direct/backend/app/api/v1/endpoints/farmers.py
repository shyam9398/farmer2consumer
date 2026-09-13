from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_roles
from app.models.enums import UserRole
from app.models.profile import Profile
from app.schemas.common import MessageResponse
from app.schemas.farmer import (
    FarmCreate,
    FarmResponse,
    FarmUpdate,
    FarmerDashboardSummary,
    FarmerProfileCreate,
    FarmerProfileResponse,
    FarmerProfileUpdate,
)
from app.services.farmer import farmer_service

router = APIRouter(tags=["Farmer Operations"])


# ------------------------------------------------------------------------------
# Farmer Profile Endpoints
# ------------------------------------------------------------------------------

@router.get(
    "/profile",
    response_model=FarmerProfileResponse,
    summary="Get Farmer Profile",
    description="Retrieve the authenticated farmer's profile, including address and verification status.",
)
def get_farmer_profile(
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> FarmerProfileResponse:
    return farmer_service.get_profile(db, current_user)


@router.post(
    "/profile",
    response_model=FarmerProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Farmer Profile",
    description="Initial creation of farmer profile after registration.",
)
def create_farmer_profile(
    payload: FarmerProfileCreate,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> FarmerProfileResponse:
    return farmer_service.create_profile(db, current_user, payload)


@router.put(
    "/profile",
    response_model=FarmerProfileResponse,
    summary="Update Farmer Profile",
    description="Update personal demographic and agricultural address information.",
)
def update_farmer_profile(
    payload: FarmerProfileUpdate,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> FarmerProfileResponse:
    return farmer_service.update_profile(db, current_user, payload)


@router.post(
    "/profile/photo",
    response_model=FarmerProfileResponse,
    summary="Upload Farmer Profile Photo",
    description="Upload avatar to Supabase Storage ('farmer-profiles' bucket). Validates JPEG, PNG, WEBP <= 5MB.",
)
async def upload_farmer_photo(
    file: UploadFile = File(...),
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> FarmerProfileResponse:
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file uploaded.",
        )
    return farmer_service.upload_photo(
        db,
        current_user=current_user,
        file_bytes=file_bytes,
        filename=file.filename or "profile.jpg",
        content_type=file.content_type or "image/jpeg",
    )


# ------------------------------------------------------------------------------
# Farm Management Endpoints
# ------------------------------------------------------------------------------

@router.get(
    "/farms",
    response_model=List[FarmResponse],
    summary="List Farmer's Farms",
    description="Retrieve all farms belonging exclusively to the authenticated farmer.",
)
def list_farms(
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> List[FarmResponse]:
    return farmer_service.get_farms(db, current_user)


@router.post(
    "/farms",
    response_model=FarmResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Farm Parcel",
    description="Register a new farm under the authenticated farmer's profile.",
)
def create_farm(
    payload: FarmCreate,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> FarmResponse:
    return farmer_service.create_farm(db, current_user, payload)


@router.get(
    "/farms/{farm_id}",
    response_model=FarmResponse,
    summary="Get Farm Details",
    description="Retrieve specific farm. Returns 404 if not found or unauthorized.",
)
def get_farm(
    farm_id: str,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> FarmResponse:
    return farmer_service.get_farm_by_id(db, current_user, farm_id)


@router.put(
    "/farms/{farm_id}",
    response_model=FarmResponse,
    summary="Update Farm Details",
    description="Update a farm parcel. Verifies ownership; returns 404 if unauthorized.",
)
def update_farm(
    farm_id: str,
    payload: FarmUpdate,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> FarmResponse:
    return farmer_service.update_farm(db, current_user, farm_id, payload)


@router.delete(
    "/farms/{farm_id}",
    response_model=MessageResponse,
    summary="Delete Farm Parcel",
    description="Delete a farm parcel. Verifies ownership; returns 404 if unauthorized.",
)
def delete_farm(
    farm_id: str,
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> MessageResponse:
    farmer_service.delete_farm(db, current_user, farm_id)
    return MessageResponse(message="Farm successfully deleted.")


# ------------------------------------------------------------------------------
# Dashboard Summary & Profile Completion
# ------------------------------------------------------------------------------

@router.get(
    "/summary",
    response_model=FarmerDashboardSummary,
    summary="Farmer Dashboard Summary",
    description="Aggregated summary metrics including profile completion, total farm acreage, crops, and verification status.",
)
def get_farmer_summary(
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
    db: Session = Depends(get_db),
) -> FarmerDashboardSummary:
    return farmer_service.get_dashboard_summary(db, current_user)
