from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, require_roles
from app.models.enums import UserRole
from app.models.profile import Profile
from app.schemas.demand import (
    DemandHistoryResponse,
    DemandRecommendationsResponse,
    DemandSummaryResponse,
    PriceDemandCombinedInsight,
    ProductDemandResponse,
    RegionalDemandResponse,
)
from app.services.demand_service import DemandIntelligenceService

router = APIRouter()
admin_router = APIRouter()


@router.get(
    "/summary",
    response_model=DemandSummaryResponse,
    summary="Get aggregated marketplace demand summary",
)
def get_demand_summary(
    period_days: int = Query(30, ge=1, le=365, description="Time window in days (7, 30, 90)"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_active_user),
):
    service = DemandIntelligenceService(db)
    farmer_id = current_user.id if current_user.role == UserRole.FARMER.value else None
    return service.get_demand_summary(period_days=period_days, limit=limit, farmer_profile_id=farmer_id)


@router.get(
    "/products/{product_name}",
    response_model=ProductDemandResponse,
    summary="Get detailed demand analysis for a specific product",
)
def get_product_demand(
    product_name: str,
    period_days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_active_user),
):
    service = DemandIntelligenceService(db)
    farmer_id = current_user.id if current_user.role == UserRole.FARMER.value else None
    return service.get_product_demand(product_name, period_days=period_days, farmer_profile_id=farmer_id)


@router.get(
    "/history",
    response_model=DemandHistoryResponse,
    summary="Get historical daily demand trends",
)
def get_demand_history(
    product_name: Optional[str] = Query(None),
    period_days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_active_user),
):
    service = DemandIntelligenceService(db)
    farmer_id = current_user.id if current_user.role == UserRole.FARMER.value else None
    return service.get_demand_history(
        product_name=product_name, period_days=period_days, farmer_profile_id=farmer_id
    )


@router.get(
    "/regional",
    response_model=RegionalDemandResponse,
    summary="Get regional demand distribution by state/district",
)
def get_regional_demand(
    product_name: Optional[str] = Query(None),
    period_days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_active_user),
):
    service = DemandIntelligenceService(db)
    return service.get_regional_demand(product_name=product_name, period_days=period_days)


@router.get(
    "/recommendations",
    response_model=DemandRecommendationsResponse,
    summary="Get top product demand recommendations for farmers",
)
def get_demand_recommendations(
    period_days: int = Query(30, ge=1, le=365),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_active_user),
):
    service = DemandIntelligenceService(db)
    return service.get_demand_recommendations(period_days=period_days, limit=limit)


@router.get(
    "/combined-insight/{product_name}",
    response_model=PriceDemandCombinedInsight,
    summary="Get unified Price + Demand Intelligence decision support",
)
def get_price_demand_combined_insight(
    product_name: str,
    period_days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_active_user),
):
    service = DemandIntelligenceService(db)
    return service.get_price_demand_combined_insight(product_name, period_days=period_days)


# ==========================================
# ADMIN ENDPOINTS
# ==========================================

@admin_router.get(
    "/summary",
    response_model=DemandSummaryResponse,
    summary="[Admin] Get national platform demand summary",
)
def get_admin_demand_summary(
    period_days: int = Query(30, ge=1, le=365),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    service = DemandIntelligenceService(db)
    return service.get_demand_summary(period_days=period_days, limit=limit, farmer_profile_id=None)


@admin_router.get(
    "/regional",
    response_model=RegionalDemandResponse,
    summary="[Admin] Get nationwide regional demand distribution",
)
def get_admin_regional_demand(
    product_name: Optional[str] = Query(None),
    period_days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    admin_user: Profile = Depends(require_roles(UserRole.ADMIN.value)),
):
    service = DemandIntelligenceService(db)
    return service.get_regional_demand(product_name=product_name, period_days=period_days)
