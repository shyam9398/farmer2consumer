from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class MarketplaceFarmerSummary(BaseModel):
    id: str
    name: str
    is_verified: bool = True
    verification_status: str = "VERIFIED"


class MarketplaceLocationSummary(BaseModel):
    village: str
    mandal: str
    district: str
    state: str


class MarketplaceImageItem(BaseModel):
    id: str
    image_url: str
    public_url: Optional[str] = None
    is_primary: bool = False
    display_order: int = 0
    sort_order: int = 0

    model_config = ConfigDict(from_attributes=True)


class MarketplaceFarmDetail(BaseModel):
    id: str
    farm_name: str
    total_area: float
    area_unit: str = "ACRE"
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None
    village: str
    mandal: str
    district: str
    state: str


class MarketplaceFarmerDetail(BaseModel):
    id: str
    name: str
    is_verified: bool = True
    verification_status: str = "VERIFIED"
    member_since: Optional[str] = None


class MarketplaceTransparentPricing(BaseModel):
    farmer_price: float
    price_unit: str
    traditional_benchmark_price: Optional[float] = None
    potential_savings: Optional[float] = None
    notes: Optional[str] = "Direct farm gate price without intermediary commission"


class MarketplaceProductSummaryResponse(BaseModel):
    """Safe public summary for discovery cards in the marketplace."""
    id: str
    product_name: str
    category: str
    variety: Optional[str] = None
    description: Optional[str] = None
    total_quantity: float
    available_quantity: float
    quantity_unit: str
    quality_grade: str
    price: float
    expected_price: float
    price_unit: str
    harvest_date: str
    available_from: str
    available_until: Optional[str] = None
    minimum_order_quantity: float
    status: str
    primary_image_url: Optional[str] = None
    image_count: int = 0
    farmer: MarketplaceFarmerSummary
    location: MarketplaceLocationSummary

    model_config = ConfigDict(from_attributes=True)


class MarketplaceProductDetailResponse(BaseModel):
    """Safe public product detail with full specs, gallery, farm & farmer info."""
    id: str
    product_name: str
    category: str
    variety: Optional[str] = None
    description: Optional[str] = None
    total_quantity: float
    available_quantity: float
    quantity_unit: str
    quality_grade: str
    price: float
    expected_price: float
    price_unit: str
    harvest_date: str
    available_from: str
    available_until: Optional[str] = None
    minimum_order_quantity: float
    status: str
    primary_image_url: Optional[str] = None
    images: List[MarketplaceImageItem] = Field(default_factory=list)
    farmer: MarketplaceFarmerDetail
    farm: MarketplaceFarmDetail
    location: MarketplaceLocationSummary
    transparent_pricing: MarketplaceTransparentPricing

    model_config = ConfigDict(from_attributes=True)


class MarketplaceProductListResponse(BaseModel):
    """Server-side paginated response for marketplace product discovery."""
    items: List[MarketplaceProductSummaryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
