from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_roles
from app.models.enums import UserRole
from app.models.farmer import FarmerProfile
from app.models.profile import Profile
from app.schemas.payouts import (
    AdminPayoutUpdateRequest,
    FarmerPayoutListResponse,
    FarmerPayoutResponse,
    PayoutRequestCreate,
)
from app.services.payouts import payouts_service

farmer_payout_router = APIRouter()
admin_payout_router = APIRouter()


def _get_farmer_profile_or_404(db: Session, user: Profile) -> FarmerProfile:
    farmer_profile = db.query(FarmerProfile).filter(FarmerProfile.profile_id == user.id).first()
    if not farmer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not found. Please complete farmer profile registration.",
        )
    return farmer_profile


# Farmer Payout Endpoints
@farmer_payout_router.get("", response_model=FarmerPayoutListResponse)
def get_farmer_payouts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
):
    """
    Get payout history for the authenticated farmer.
    """
    farmer_profile = _get_farmer_profile_or_404(db, current_user)
    return payouts_service.get_farmer_payouts(
        db=db,
        farmer_profile_id=farmer_profile.id,
        page=page,
        page_size=page_size,
        status_filter=status,
    )


@farmer_payout_router.post("/request", response_model=FarmerPayoutResponse, status_code=status.HTTP_201_CREATED)
def request_payout(
    request_in: PayoutRequestCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
):
    """
    Request a payout disbursement from available balance.
    Validates amount > 0 and amount <= available_balance.
    """
    farmer_profile = _get_farmer_profile_or_404(db, current_user)
    return payouts_service.request_payout(
        db=db,
        farmer_profile=farmer_profile,
        request_in=request_in,
        user_profile_id=current_user.id,
    )


# Admin Payout Management Endpoints
@admin_payout_router.get("", response_model=FarmerPayoutListResponse)
def get_admin_payouts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status"),
    farmer_profile_id: Optional[str] = Query(None, description="Filter by specific farmer_profile_id"),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN)),
):
    """
    List payout requests across all farmers for Admin operations dashboard.
    """
    return payouts_service.get_admin_payouts(
        db=db,
        page=page,
        page_size=page_size,
        status_filter=status,
        farmer_profile_id=farmer_profile_id,
    )


@admin_payout_router.patch("/{payout_id}", response_model=FarmerPayoutResponse)
def update_admin_payout_status(
    payout_id: str,
    update_in: AdminPayoutUpdateRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.ADMIN)),
):
    """
    Admin updates payout status to PROCESSING, COMPLETED, or FAILED.
    Requires mandatory failure_reason if status is set to FAILED.
    """
    return payouts_service.update_payout_status(
        db=db,
        payout_id=payout_id,
        new_status=update_in.status,
        failure_reason=update_in.failure_reason,
        provider_payout_id=update_in.provider_payout_id,
        admin_user_id=current_user.id,
    )
