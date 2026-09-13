from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, require_roles
from app.models.enums import NotificationType, UserRole
from app.models.profile import Profile
from app.repositories.buyer_preference import buyer_preference_repository
from app.schemas.buyer_preference import (
    BuyerPreferenceResponse,
    BuyerPreferenceUpdate,
)
from app.schemas.matching import (
    BuyerProductMatchesResponse,
    FarmerBuyerMatchesResponse,
    ProduceBuyerMatchesResponse,
    ProductMatchResult,
)
from app.services.matching_service import smart_matching_service
from app.services.notification_service import notification_service

router = APIRouter()


# ==============================================================================
# Buyer Preferences Endpoints (Section 4)
# ==============================================================================

@router.get(
    "/buyer/preferences",
    response_model=BuyerPreferenceResponse,
    summary="Get Current Buyer Preferences",
    description="Fetch procurement preferences for the authenticated buyer.",
)
def get_buyer_preferences(
    current_user: Profile = Depends(require_roles(UserRole.BUYER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> BuyerPreferenceResponse:
    pref = buyer_preference_repository.get_by_buyer_id(db, current_user.id)
    if not pref:
        # Return default empty preference structure
        return BuyerPreferenceResponse(
            id=f"temp-{current_user.id}",
            buyer_user_id=current_user.id,
            preferred_categories=[],
            preferred_products=[],
            preferred_varieties=[],
            preferred_quality_grades=[],
            preferred_districts=[],
            preferred_states=[],
            minimum_quantity=None,
            maximum_quantity=None,
            minimum_price=None,
            maximum_price=None,
            created_at=current_user.created_at,
            updated_at=current_user.updated_at,
        )
    return BuyerPreferenceResponse.model_validate(pref)


@router.put(
    "/buyer/preferences",
    response_model=BuyerPreferenceResponse,
    summary="Update Buyer Preferences",
    description="Save or update procurement criteria for the authenticated buyer.",
)
def update_buyer_preferences(
    payload: BuyerPreferenceUpdate,
    current_user: Profile = Depends(require_roles(UserRole.BUYER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> BuyerPreferenceResponse:
    pref = buyer_preference_repository.upsert_preferences(db, current_user.id, payload)

    # Phase 14: Notify buyer if high-confidence product matches exist
    try:
        matches_resp = smart_matching_service.get_buyer_matching_products(db, current_user.id)
        if matches_resp.matches and any(m.match_level in ["HIGH", "VERY_HIGH"] for m in matches_resp.matches):
            notification_service.create_notification(
                db,
                recipient_user_id=current_user.id,
                type=NotificationType.MATCHING,
                title="New Product Match",
                message="Products matching your procurement preferences are available in the marketplace.",
                entity_type="MATCH",
                action_url="/marketplace",
            )
            db.commit()
    except Exception:
        pass

    return BuyerPreferenceResponse.model_validate(pref)



# ==============================================================================
# Buyer Matching Endpoints (Section 11 & 13)
# ==============================================================================

@router.get(
    "/buyer/matching/products",
    response_model=BuyerProductMatchesResponse,
    summary="Get Matched Produce Listings for Buyer",
    description="Return marketplace listings scored and ranked for the authenticated buyer.",
)
def get_buyer_matching_products(
    category: Optional[str] = Query(None, description="Category filter"),
    product_name: Optional[str] = Query(None, description="Product search filter"),
    variety: Optional[str] = Query(None, description="Variety filter"),
    quality_grade: Optional[str] = Query(None, description="Grade filter"),
    district: Optional[str] = Query(None, description="District filter"),
    state: Optional[str] = Query(None, description="State filter"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum match score"),
    match_level: Optional[str] = Query(None, description="Match level: VERY_HIGH, HIGH, MODERATE, LOW, VERY_LOW"),
    sort: Optional[str] = Query("highest_match", description="Sort order: highest_match, newest, price_asc, price_desc, quantity_desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Profile = Depends(require_roles(UserRole.BUYER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> BuyerProductMatchesResponse:
    return smart_matching_service.get_buyer_product_matches(
        db,
        buyer_user_id=current_user.id,
        category=category,
        product_name=product_name,
        variety=variety,
        quality_grade=quality_grade,
        district=district,
        state=state,
        min_score=min_score,
        match_level=match_level,
        sort=sort,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/buyer/matching/products/{produce_id}",
    response_model=ProductMatchResult,
    summary="Get Match Result for a Specific Product",
    description="Evaluate explainable match score between authenticated buyer and specified listing.",
)
def get_buyer_single_product_match(
    produce_id: str = Path(..., description="The unique produce listing ID"),
    current_user: Profile = Depends(require_roles(UserRole.BUYER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> ProductMatchResult:
    try:
        return smart_matching_service.get_single_product_match_for_buyer(
            db, buyer_user_id=current_user.id, produce_id=produce_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# ==============================================================================
# Farmer Matching Endpoints (Section 10 & 12)
# ==============================================================================

@router.get(
    "/farmer/matching/buyers",
    response_model=FarmerBuyerMatchesResponse,
    summary="Get Matching Buyers for Farmer's Produce",
    description="Discover prospective wholesale buyers matched to authenticated farmer's active produce.",
)
def get_farmer_buyer_matches(
    produce_id: Optional[str] = Query(None, description="Filter by specific produce listing ID"),
    district: Optional[str] = Query(None, description="Buyer district filter"),
    state: Optional[str] = Query(None, description="Buyer state filter"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum match score"),
    match_level: Optional[str] = Query(None, description="Match level"),
    sort: Optional[str] = Query("highest_match", description="Sort order: highest_match, product, location"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Profile = Depends(require_roles(UserRole.FARMER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> FarmerBuyerMatchesResponse:
    farmer_profile = current_user.farmer_profile
    if not farmer_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Farmer profile not initialized. Please complete farmer profile setup.",
        )

    return smart_matching_service.get_farmer_buyer_matches(
        db,
        farmer_profile_id=farmer_profile.id,
        produce_id=produce_id,
        district=district,
        state=state,
        min_score=min_score,
        match_level=match_level,
        sort=sort,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/farmer/matching/buyers/{produce_id}",
    response_model=ProduceBuyerMatchesResponse,
    summary="Get Matching Buyers for a Specific Produce Lot",
    description="Find buyers matched to a specific produce listing owned by the farmer.",
)
def get_produce_specific_buyer_matches(
    produce_id: str = Path(..., description="Produce listing ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Profile = Depends(require_roles(UserRole.FARMER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> ProduceBuyerMatchesResponse:
    farmer_profile = current_user.farmer_profile
    if not farmer_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Farmer profile not initialized.",
        )

    try:
        return smart_matching_service.get_produce_buyer_matches(
            db,
            produce_id=produce_id,
            farmer_profile_id=farmer_profile.id,
            page=page,
            page_size=page_size,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Produce listing not found or not owned by this farmer.",
        )
