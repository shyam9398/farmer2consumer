from typing import Optional
from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.marketplace import (
    MarketplaceProductDetailResponse,
    MarketplaceProductListResponse,
)
from app.services.marketplace import marketplace_service

router = APIRouter(tags=["Marketplace Discovery"])


@router.get(
    "/products",
    response_model=MarketplaceProductListResponse,
    summary="Discover Verified Marketplace Produce",
    description=(
        "Public discovery endpoint for verified and listed produce. "
        "Strictly excludes DRAFT, PENDING, REJECTED, SOLD_OUT, or EXPIRED lots. "
        "Safe for unauthenticated buyers and visitors."
    ),
)
def list_marketplace_products(
    search: Optional[str] = Query(None, max_length=100, description="Search product name, variety, farm or location"),
    category: Optional[str] = Query(None, description="Category filter (VEGETABLE, FRUIT, GRAIN, PULSE, SPICE, OILSEED, OTHER)"),
    quality_grade: Optional[str] = Query(None, description="Quality grade filter (PREMIUM, GRADE_A, GRADE_B, GRADE_C, UNGRADED)"),
    farm_id: Optional[str] = Query(None, description="Filter by farm parcel ID"),
    district: Optional[str] = Query(None, max_length=100, description="District filter"),
    mandal: Optional[str] = Query(None, max_length=100, description="Mandal filter"),
    village: Optional[str] = Query(None, max_length=100, description="Village filter"),
    state: Optional[str] = Query(None, max_length=100, description="State filter"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price per unit"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price per unit"),
    min_quantity: Optional[float] = Query(None, ge=0, description="Minimum available quantity"),
    sort: Optional[str] = Query(None, description="Sort order: recommended, price_asc, price_desc, newest, harvest_date, quantity_desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> MarketplaceProductListResponse:
    return marketplace_service.list_products(
        db,
        search=search,
        category=category,
        quality_grade=quality_grade,
        farm_id=farm_id,
        district=district,
        mandal=mandal,
        village=village,
        state=state,
        min_price=min_price,
        max_price=max_price,
        min_quantity=min_quantity,
        sort=sort,
        page=page,
        page_size=page_size,
    )


from app.schemas.decision_helper import (
    DecisionHelperRequest,
    DecisionHelperResponse,
)
from app.services.decision_helper_service import decision_helper_service

@router.get(
    "/products/{produce_id}",
    response_model=MarketplaceProductDetailResponse,
    summary="Get Marketplace Product Details",
    description=(
        "Public endpoint returning full product specs, image gallery, transparent price comparison, "
        "and safe farmer and farm information. Returns 404 if product is not LISTED or has expired."
    ),
)
def get_marketplace_product_detail(
    produce_id: str = Path(..., description="The unique ID of the produce listing"),
    db: Session = Depends(get_db),
) -> MarketplaceProductDetailResponse:
    return marketplace_service.get_product_detail(db, produce_id=produce_id)


@router.post(
    "/decision-helper",
    response_model=DecisionHelperResponse,
    summary="Buyer Decision Helper: Ranked & Explained Farmer Produce Recommendations",
    description="Deterministic ranking based on quantity match, location proximity, price, freshness, and verified reviews.",
)
def buyer_decision_helper(
    req: DecisionHelperRequest,
    db: Session = Depends(get_db),
) -> DecisionHelperResponse:
    return decision_helper_service.recommend(db, req)

