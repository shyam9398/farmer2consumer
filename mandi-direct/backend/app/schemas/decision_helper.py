from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DecisionHelperRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Natural requirement query e.g. '100 KG rice' or 'Fresh Tomato'")
    product_name: Optional[str] = Field(None, description="Explicit parsed product name if known")
    required_quantity: Optional[Decimal] = Field(None, gt=0, description="Desired quantity e.g. 100")
    quantity_unit: Optional[str] = Field("KG", description="KG, QUINTAL, TON")
    buyer_lat: Optional[float] = Field(None, description="Buyer latitude coordinate")
    buyer_lng: Optional[float] = Field(None, description="Buyer longitude coordinate")
    max_distance_km: Optional[float] = Field(None, description="Filter radius in kilometers")


class DecisionHelperItem(BaseModel):
    produce_id: str
    product_name: str
    category: str
    expected_price: Decimal
    price_unit: str
    available_quantity: Decimal
    quantity_unit: str
    harvest_date: Optional[date] = None
    days_since_harvest: Optional[int] = None
    farmer_profile_id: str
    farmer_name: str
    farmer_rating: float = Field(0.0, description="Genuine database aggregated rating")
    farmer_total_reviews: int = Field(0, description="Verified reviews count")
    location: str = Field(..., description="Public safe city / district location")
    distance_km: Optional[float] = Field(None, description="Calculated distance in KM from buyer")
    availability_status: str = Field(..., description="AVAILABLE, LOW_STOCK, SOLD_OUT")
    image_url: Optional[str] = None
    score: float = Field(..., description="Deterministic ranking score")
    explanation: str = Field(..., description="Fact-based justification for ranking")

    model_config = ConfigDict(from_attributes=True)


class DecisionHelperResponse(BaseModel):
    parsed_product: str
    parsed_quantity: Optional[Decimal] = None
    recommendations: List[DecisionHelperItem]
    total_matches: int
