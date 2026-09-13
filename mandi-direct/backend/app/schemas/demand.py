from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.enums import ConfidenceLevel, DemandLevel, DemandTrend, SupplyDemandStatus


class ProductDemandResponse(BaseModel):
    product_name: str
    category: Optional[str] = "VEGETABLE"
    demand_score: int = Field(..., ge=0, le=100, description="Normalized demand score 0-100")
    demand_level: DemandLevel
    trend: DemandTrend
    recent_quantity_sold: float = Field(..., description="Quantity sold in selected period")
    quantity_unit: str = "KG"
    order_count: int = Field(..., description="Number of orders placed")
    unique_buyers: int = Field(..., description="Distinct buyers count")
    sales_velocity_per_day: float = Field(..., description="Quantity sold per day")
    demand_growth_percentage: Optional[float] = Field(None, description="Growth % vs previous period")
    available_supply: float = Field(..., description="Current active marketplace supply")
    supply_demand_status: SupplyDemandStatus
    confidence: ConfidenceLevel
    explanation: str
    matching_scope: str = "Global marketplace orders"
    period_days: int = 30
    generated_at: datetime


class DemandSummaryResponse(BaseModel):
    period_days: int = 30
    total_orders: int
    total_quantity_sold: float
    total_unique_buyers: int
    top_demanded_products: List[ProductDemandResponse]
    generated_at: datetime


class DemandHistoryPoint(BaseModel):
    date: str
    order_count: int
    quantity_sold: float
    unique_buyers: int
    sales_velocity: float
    demand_score: int
    trend: DemandTrend


class DemandHistoryResponse(BaseModel):
    product_name: Optional[str] = None
    period_days: int = 30
    points: List[DemandHistoryPoint]
    generated_at: datetime


class RegionalDemandItem(BaseModel):
    state: str
    district: Optional[str] = None
    product_name: Optional[str] = None
    order_count: int
    quantity_sold: float
    unique_buyers: int
    demand_level: DemandLevel
    demand_score: int


class RegionalDemandResponse(BaseModel):
    period_days: int = 30
    regions: List[RegionalDemandItem]
    generated_at: datetime


class DemandRecommendationItem(BaseModel):
    product_name: str
    category: str
    demand_score: int
    demand_level: DemandLevel
    trend: DemandTrend
    available_supply: float
    recommendation_reason: str


class DemandRecommendationsResponse(BaseModel):
    period_days: int = 30
    recommendations: List[DemandRecommendationItem]
    generated_at: datetime


class PriceDemandCombinedInsight(BaseModel):
    product_name: str
    reference_price: Optional[float] = None
    target_price: Optional[float] = None
    price_trend: Optional[str] = None
    demand_score: int
    demand_level: DemandLevel
    demand_trend: DemandTrend
    supply_demand_status: SupplyDemandStatus
    combined_insight: str
    generated_at: datetime
