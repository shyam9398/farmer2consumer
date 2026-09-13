from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_db, require_roles
from app.models.enums import UserRole
from app.models.farmer import FarmerProfile
from app.models.profile import Profile
from app.schemas.earnings import (
    FarmerEarningDetailResponse,
    FarmerEarningsListResponse,
    FarmerEarningsSummaryResponse,
)
from app.services.earnings import earnings_service

router = APIRouter()


def _get_farmer_profile_or_404(db: Session, user: Profile) -> FarmerProfile:
    farmer_profile = db.query(FarmerProfile).filter(FarmerProfile.profile_id == user.id).first()
    if not farmer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer profile not found. Please complete farmer profile registration.",
        )
    return farmer_profile


@router.get("/summary", response_model=FarmerEarningsSummaryResponse)
def get_farmer_earnings_summary(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
):
    """
    Get aggregated financial summary (total gross, net, pending, available balance, total paid, order count)
    for the authenticated farmer.
    """
    farmer_profile = _get_farmer_profile_or_404(db, current_user)
    return earnings_service.get_farmer_earnings_summary(db, farmer_profile.id)


@router.get("", response_model=FarmerEarningsListResponse)
def get_farmer_earnings_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="EXPECTED, PENDING_SETTLEMENT, AVAILABLE, PAID, CANCELLED, REFUNDED"),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    product: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
):
    """
    Get paginated history of line-item earnings earned by the authenticated farmer.
    Supports filtering by status, date range, and produce product name.
    """
    farmer_profile = _get_farmer_profile_or_404(db, current_user)
    return earnings_service.get_farmer_earnings_list(
        db=db,
        farmer_profile_id=farmer_profile.id,
        page=page,
        page_size=page_size,
        status_filter=status,
        date_from=date_from,
        date_to=date_to,
        product=product,
    )


@router.get("/{earning_id}", response_model=FarmerEarningDetailResponse)
def get_farmer_earning_detail(
    earning_id: str,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.FARMER)),
):
    """
    Get detailed financial breakdown of a specific earning record.
    Strictly isolated: farmer can only view their own earning records.
    """
    farmer_profile = _get_farmer_profile_or_404(db, current_user)
    return earnings_service.get_farmer_earning_detail(
        db=db,
        farmer_profile_id=farmer_profile.id,
        earning_id=earning_id,
    )
