from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.enums import ConfidenceLevel, MatchLevel


class MatchSignal(BaseModel):
    signal_type: str = Field(..., description="CATEGORY, PRODUCT, VARIETY, QUALITY, LOCATION, QUANTITY, PRICE, PURCHASE_HISTORY")
    signal_name: str
    matched: bool
    points_awarded: float
    max_points: float
    description: str


class MatchResult(BaseModel):
    match_score: float = Field(..., ge=0, le=100, description="Deterministic match score out of 100")
    match_level: MatchLevel
    confidence: ConfidenceLevel
    explanation: str
    matched_signals: List[MatchSignal] = Field(default_factory=list)
    unmatched_signals: List[MatchSignal] = Field(default_factory=list)
    generated_at: datetime


class BuyerSafeInfo(BaseModel):
    buyer_id: str
    display_name: str
    buyer_type: str = "Verified Buyer"
    district: Optional[str] = None
    state: Optional[str] = None
    preferred_categories: List[str] = Field(default_factory=list)
    interested_products: List[str] = Field(default_factory=list)
    verified_purchases_count: int = 0


class FarmerProduceSafeInfo(BaseModel):
    produce_id: str
    product_name: str
    category: str
    variety: Optional[str] = None
    quality_grade: str
    expected_price: float
    price_unit: str
    available_quantity: float
    quantity_unit: str
    primary_image_url: Optional[str] = None
    village: Optional[str] = None
    mandal: Optional[str] = None
    district: str
    state: str
    farmer_id: str
    farmer_name: str
    is_verified_farmer: bool
    demand_level: Optional[str] = None
    demand_trend: Optional[str] = None


class BuyerMatchResult(BaseModel):
    buyer: BuyerSafeInfo
    produce: FarmerProduceSafeInfo
    match: MatchResult


class ProductMatchResult(BaseModel):
    produce: FarmerProduceSafeInfo
    match: MatchResult


class FarmerBuyerMatchesResponse(BaseModel):
    items: List[BuyerMatchResult]
    total: int
    page: int
    page_size: int
    total_pages: int
    high_match_count: int = 0
    generated_at: datetime


class BuyerProductMatchesResponse(BaseModel):
    items: List[ProductMatchResult]
    total: int
    page: int
    page_size: int
    total_pages: int
    generated_at: datetime


class ProduceBuyerMatchesResponse(BaseModel):
    produce: FarmerProduceSafeInfo
    items: List[BuyerMatchResult]
    total: int
    page: int
    page_size: int
    total_pages: int
    high_match_count: int = 0
    generated_at: datetime
