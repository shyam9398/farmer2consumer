from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_db, require_roles
from app.models.enums import UserRole
from app.models.profile import Profile
from app.schemas.review import (
    FarmerRatingSummaryResponse,
    FarmerReviewCreate,
    FarmerReviewItemResponse,
)
from app.services.review_service import review_service, _mask_buyer_name

router = APIRouter(tags=["Farmer Reviews & Ratings"])


@router.post(
    "/orders/{order_id}/items/{item_id}/review",
    response_model=FarmerReviewItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a verified post-delivery review for produce (Buyer only)",
)
def submit_item_review(
    order_id: str,
    item_id: str,
    review_in: FarmerReviewCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_roles(UserRole.BUYER.value)),
):
    review = review_service.submit_review(
        db,
        order_id=order_id,
        order_item_id=item_id,
        buyer_user_id=current_user.id,
        review_in=review_in,
    )
    return FarmerReviewItemResponse(
        id=review.id,
        order_id=review.order_id,
        order_item_id=review.order_item_id,
        rating=review.rating,
        comment=review.comment,
        buyer_display_name=_mask_buyer_name(current_user.full_name),
        created_at=review.created_at,
    )


@router.get(
    "/farmers/{farmer_profile_id}/reviews",
    response_model=FarmerRatingSummaryResponse,
    summary="Get verified rating summary and reviews for a farmer profile (Public-safe)",
)
def get_farmer_reviews(
    farmer_profile_id: str,
    db: Session = Depends(get_db),
):
    return review_service.get_farmer_rating_summary(db, farmer_profile_id=farmer_profile_id)
