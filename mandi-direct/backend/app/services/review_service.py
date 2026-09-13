from typing import Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.order import Order, OrderItem
from app.models.review import FarmerReview
from app.models.farmer import FarmerProfile
from app.schemas.review import (
    FarmerRatingSummaryResponse,
    FarmerReviewCreate,
    FarmerReviewItemResponse,
)


def _mask_buyer_name(full_name: Optional[str]) -> str:
    """Mask buyer name for public safety e.g. 'Ramesh Kumar' -> 'Ramesh K.'"""
    if not full_name:
        return "Verified Buyer"
    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0]
    return f"{parts[0]} {parts[-1][0]}."


class ReviewService:
    def submit_review(
        self,
        db: Session,
        order_id: str,
        order_item_id: str,
        buyer_user_id: str,
        review_in: FarmerReviewCreate,
    ) -> FarmerReview:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order '{order_id}' not found.",
            )

        if order.buyer_user_id != buyer_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only review items from your own orders.",
            )

        if order.status != "DELIVERED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Reviews can only be submitted for delivered orders (Current status: '{order.status}').",
            )

        order_item = (
            db.query(OrderItem)
            .filter(OrderItem.id == order_item_id, OrderItem.order_id == order_id)
            .first()
        )
        if not order_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order item '{order_item_id}' not found on order '{order_id}'.",
            )

        # Check for duplicate review
        existing = (
            db.query(FarmerReview)
            .filter(
                FarmerReview.buyer_user_id == buyer_user_id,
                FarmerReview.order_item_id == order_item_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already submitted a review for this order item.",
            )

        review = FarmerReview(
            farmer_profile_id=order_item.farmer_profile_id,
            buyer_user_id=buyer_user_id,
            order_id=order_id,
            order_item_id=order_item_id,
            rating=review_in.rating,
            comment=review_in.comment.strip() if review_in.comment else None,
        )
        db.add(review)
        db.commit()
        db.refresh(review)
        return review

    def get_farmer_rating_summary(
        self, db: Session, farmer_profile_id: str
    ) -> FarmerRatingSummaryResponse:
        farmer = (
            db.query(FarmerProfile)
            .filter(FarmerProfile.id == farmer_profile_id)
            .first()
        )
        if not farmer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farmer profile '{farmer_profile_id}' not found.",
            )

        reviews = (
            db.query(FarmerReview)
            .filter(FarmerReview.farmer_profile_id == farmer_profile_id)
            .order_by(FarmerReview.created_at.desc())
            .all()
        )

        total_reviews = len(reviews)
        if total_reviews == 0:
            return FarmerRatingSummaryResponse(
                farmer_profile_id=farmer_profile_id,
                average_rating=0.0,
                total_reviews=0,
                rating_distribution={"1": 0, "2": 0, "3": 0, "4": 0, "5": 0},
                recent_reviews=[],
            )

        distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        total_stars = 0
        for r in reviews:
            total_stars += r.rating
            key = str(r.rating)
            distribution[key] = distribution.get(key, 0) + 1

        avg = round(total_stars / total_reviews, 2)

        recent_items = []
        for r in reviews[:10]:
            buyer_name = _mask_buyer_name(r.buyer.full_name if r.buyer else None)
            recent_items.append(
                FarmerReviewItemResponse(
                    id=r.id,
                    order_id=r.order_id,
                    order_item_id=r.order_item_id,
                    rating=r.rating,
                    comment=r.comment,
                    buyer_display_name=buyer_name,
                    created_at=r.created_at,
                )
            )

        return FarmerRatingSummaryResponse(
            farmer_profile_id=farmer_profile_id,
            average_rating=avg,
            total_reviews=total_reviews,
            rating_distribution=distribution,
            recent_reviews=recent_items,
        )


review_service = ReviewService()
