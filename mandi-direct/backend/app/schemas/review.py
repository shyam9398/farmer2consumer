from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class FarmerReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Star rating from 1 to 5")
    comment: Optional[str] = Field(None, max_length=1000, description="Constructive feedback")


class FarmerReviewItemResponse(BaseModel):
    id: str
    order_id: str
    order_item_id: str
    rating: int
    comment: Optional[str] = None
    buyer_display_name: str = Field(..., description="Public safe masked buyer name (e.g. Ramesh K.)")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FarmerRatingSummaryResponse(BaseModel):
    farmer_profile_id: str
    average_rating: float = Field(..., description="Calculated average rating e.g. 4.6")
    total_reviews: int = Field(..., description="Total count of verified reviews")
    rating_distribution: Dict[str, int] = Field(
        default_factory=dict,
        description="Count of reviews per star 1-5"
    )
    recent_reviews: List[FarmerReviewItemResponse] = Field(default_factory=list)
