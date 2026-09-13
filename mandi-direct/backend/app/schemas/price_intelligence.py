from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class PriceSourceType(str, Enum):
    MANDI_DIRECT_TRANSACTION = "MANDI_DIRECT_TRANSACTION"
    GOVERNMENT_DATA = "GOVERNMENT_DATA"
    EXTERNAL_API = "EXTERNAL_API"
    ADMIN_IMPORT = "ADMIN_IMPORT"
    OTHER = "OTHER"


class PriceTrend(str, Enum):
    RISING = "RISING"
    FALLING = "FALLING"
    STABLE = "STABLE"
    VOLATILE = "VOLATILE"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class ConfidenceLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ExpectedPriceComparisonState(str, Enum):
    BELOW = "BELOW"
    WITHIN = "WITHIN"
    ABOVE = "ABOVE"
    NOT_SPECIFIED = "NOT_SPECIFIED"


class MatchLevel(str, Enum):
    EXACT_FULL = "PRODUCT_VARIETY_QUALITY_LOCATION"
    VARIETY_QUALITY = "PRODUCT_VARIETY_QUALITY"
    QUALITY_ONLY = "PRODUCT_QUALITY"
    PRODUCT_ONLY = "PRODUCT_ONLY"
    CATEGORY_ONLY = "CATEGORY_ONLY"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


# --- Price Observation CRUD Schemas ---

class PriceObservationBase(BaseModel):
    product_name: str = Field(..., max_length=150, example="Tomato")
    category: str = Field(default="VEGETABLE", max_length=50)
    variety: Optional[str] = Field(default=None, max_length=100, example="Hybrid")
    quality_grade: Optional[str] = Field(default="UNGRADED", max_length=30, example="GRADE_A")
    price: Decimal = Field(..., gt=0, description="Observed price per specified price_unit")
    currency: str = Field(default="INR", max_length=10)
    price_unit: str = Field(default="PER_KG", max_length=20, example="PER_KG")
    market_name: Optional[str] = Field(default=None, max_length=150, example="Azadpur Mandi")
    district: Optional[str] = Field(default=None, max_length=100, example="Kolar")
    state: Optional[str] = Field(default=None, max_length=100, example="Karnataka")
    source_type: PriceSourceType = Field(..., description="Source of observation")
    source_name: str = Field(..., max_length=150, example="Agmarknet Portal")
    source_reference: Optional[str] = Field(default=None, max_length=255)
    observation_date: date = Field(..., example="2026-09-10")

    @field_validator("price")

    def validate_positive_price(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Price must be strictly greater than 0")
        return v.quantize(Decimal("0.01"))


class PriceObservationCreate(PriceObservationBase):
    pass


class PriceObservationUpdate(BaseModel):
    product_name: Optional[str] = Field(default=None, max_length=150)
    category: Optional[str] = Field(default=None, max_length=50)
    variety: Optional[str] = Field(default=None, max_length=100)
    quality_grade: Optional[str] = Field(default=None, max_length=30)
    price: Optional[Decimal] = Field(default=None, gt=0)
    currency: Optional[str] = Field(default=None, max_length=10)
    price_unit: Optional[str] = Field(default=None, max_length=20)
    market_name: Optional[str] = Field(default=None, max_length=150)
    district: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    source_type: Optional[PriceSourceType] = None
    source_name: Optional[str] = Field(default=None, max_length=150)
    source_reference: Optional[str] = Field(default=None, max_length=255)
    observation_date: Optional[date] = None


class PriceObservationResponse(PriceObservationBase):
    id: str
    price_per_kg: Decimal = Field(..., description="Normalized price in INR per KG")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PriceObservationListResponse(BaseModel):
    items: List[PriceObservationResponse]
    total: int
    page: int
    size: int
    pages: int


# --- CSV Import Schemas ---

class CSVImportRowError(BaseModel):
    row_number: int
    error: str
    raw_data: Optional[dict] = None


class CSVImportResponse(BaseModel):
    total_rows: int
    imported_count: int
    error_count: int
    errors: List[CSVImportRowError]


# --- Price Intelligence Summary & History Schemas ---

class PriceIntelligenceSummary(BaseModel):
    product_name: str
    category: str
    variety: Optional[str] = None
    quality_grade: Optional[str] = None
    latest_price: Optional[Decimal] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    avg_price: Optional[Decimal] = None
    median_price: Optional[Decimal] = None
    weighted_avg_price: Optional[Decimal] = None
    avg_7d: Optional[Decimal] = None
    avg_30d: Optional[Decimal] = None
    avg_90d: Optional[Decimal] = None
    trend: PriceTrend
    confidence: ConfidenceLevel
    observation_count: int
    sources: List[str]
    disclaimer: str = "Price Intelligence provides market guidance based on available data and is not a guaranteed selling price."


class PriceHistoryPoint(BaseModel):
    observation_date: date
    avg_price_per_kg: Decimal
    min_price_per_kg: Decimal
    max_price_per_kg: Decimal
    observation_count: int
    source_types: List[str]


class PriceHistoryResponse(BaseModel):
    product_name: str
    variety: Optional[str] = None
    quality_grade: Optional[str] = None
    start_date: date
    end_date: date
    history: List[PriceHistoryPoint]
    total_observations: int
    overall_avg_per_kg: Optional[Decimal] = None
    overall_min_per_kg: Optional[Decimal] = None
    overall_max_per_kg: Optional[Decimal] = None
    trend: PriceTrend


# --- Regional Price Schemas ---

class RegionalPriceItem(BaseModel):
    region_type: str = Field(..., description="DISTRICT | STATE | MANDI_DIRECT_TRANSACTION | ALL")
    region_name: str
    avg_price_per_kg: Optional[Decimal] = None
    min_price_per_kg: Optional[Decimal] = None
    max_price_per_kg: Optional[Decimal] = None
    observation_count: int
    status_message: str


class RegionalPriceResponse(BaseModel):
    product_name: str
    variety: Optional[str] = None
    quality_grade: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    district_reference: Optional[RegionalPriceItem] = None
    state_reference: Optional[RegionalPriceItem] = None
    mandi_direct_reference: Optional[RegionalPriceItem] = None
    overall_range_text: str
    has_sufficient_data: bool


# --- Recommendation Schemas ---

class PriceRecommendationRequest(BaseModel):
    product_name: str = Field(..., max_length=150, example="Tomato")
    category: Optional[str] = Field(default=None, max_length=50)
    variety: Optional[str] = Field(default=None, max_length=100)
    quality_grade: Optional[str] = Field(default=None, max_length=30)
    district: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    expected_price: Optional[Decimal] = Field(default=None, gt=0, description="Farmer's proposed price per price_unit")
    price_unit: str = Field(default="PER_KG", max_length=20, example="PER_KG")


class PriceRecommendationResponse(BaseModel):
    product_name: str
    variety: Optional[str] = None
    quality_grade: Optional[str] = None
    reference_price: Decimal = Field(..., description="Calculated market reference price per KG")
    recommended_min_price: Decimal = Field(..., description="Recommended fair range floor per KG")
    recommended_target_price: Decimal = Field(..., description="Suggested target price per KG")
    recommended_max_price: Decimal = Field(..., description="Recommended fair range ceiling per KG")
    
    # Original unit converted prices (for display in farmer's selected unit e.g. PER_QUINTAL)
    display_unit: str
    display_reference_price: Decimal
    display_min_price: Decimal
    display_target_price: Decimal
    display_max_price: Decimal

    trend: PriceTrend
    confidence: ConfidenceLevel
    match_level: MatchLevel
    observation_count: int
    data_sources: List[str]
    explanation: str
    
    expected_price_comparison: ExpectedPriceComparisonState
    comparison_message: str
    
    disclaimer: str = "Price Intelligence provides market guidance based on available data and is not a guaranteed selling price."
    generated_at: datetime
