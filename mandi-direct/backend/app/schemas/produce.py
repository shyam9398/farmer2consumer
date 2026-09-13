from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, model_validator
from app.models.enums import (
    PriceUnit,
    ProduceStatus,
    ProductCategory,
    QualityGrade,
    QuantityUnit,
)


class ProduceImageResponse(BaseModel):
    """Schema representing an uploaded produce photo with Phase 5 media metadata."""
    id: str
    produce_listing_id: str
    storage_path: str
    image_url: str
    public_url: Optional[str] = None
    file_name: str
    mime_type: str
    file_size: int
    width: Optional[int] = None
    height: Optional[int] = None
    is_primary: bool
    display_order: int
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProduceImageReorderRequest(BaseModel):
    """Schema for custom ordering of produce photos."""
    image_ids: List[str] = Field(..., min_length=1, description="Ordered list of image IDs")


class ProduceCreate(BaseModel):
    """Schema for creating a new produce lot (initially saved as DRAFT)."""
    farm_id: str = Field(..., description="ID of the farm parcel where crop was grown")
    product_name: str = Field(..., min_length=2, max_length=150, description="Crop name, e.g., Tomato, Basmati Rice")
    category: ProductCategory = Field(..., description="Agricultural commodity group")
    variety: Optional[str] = Field(None, max_length=100, description="e.g. Sona Masoori, Alphonso, Desi")
    description: Optional[str] = Field(None, max_length=2000, description="Lot condition, packaging, harvest details")

    total_quantity: Decimal = Field(..., gt=0, decimal_places=2, max_digits=12, description="Total harvest volume")
    quantity_unit: QuantityUnit = Field(default=QuantityUnit.KG, description="KG, QUINTAL, or TON")

    quality_grade: QualityGrade = Field(default=QualityGrade.UNGRADED, description="Farmer self-declared grade")

    harvest_date: date = Field(..., description="Date of harvest")
    available_from: date = Field(..., description="Start date available for fulfillment")
    available_until: Optional[date] = Field(None, description="Lot expiry/shelf life threshold")

    expected_price: Decimal = Field(..., gt=0, decimal_places=2, max_digits=10, description="Expected price per unit")
    price_unit: PriceUnit = Field(default=PriceUnit.PER_KG, description="PER_KG, PER_QUINTAL, or PER_TON")
    minimum_order_quantity: Decimal = Field(
        default=Decimal("1.00"),
        gt=0,
        decimal_places=2,
        max_digits=12,
        description="Minimum order size required for purchase",
    )

    @model_validator(mode="after")
    def validate_quantities_and_dates(self) -> "ProduceCreate":
        if self.minimum_order_quantity > self.total_quantity:
            raise ValueError("Minimum order quantity cannot exceed total produce quantity.")
        if self.available_until and self.available_until < self.available_from:
            raise ValueError("Available until date must be on or after available from date.")
        return self


class ProduceUpdate(BaseModel):
    """Schema for modifying a DRAFT or REJECTED produce lot."""
    farm_id: Optional[str] = None
    product_name: Optional[str] = Field(None, min_length=2, max_length=150)
    category: Optional[ProductCategory] = None
    variety: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)

    total_quantity: Optional[Decimal] = Field(None, gt=0, decimal_places=2, max_digits=12)
    quantity_unit: Optional[QuantityUnit] = None

    quality_grade: Optional[QualityGrade] = None

    harvest_date: Optional[date] = None
    available_from: Optional[date] = None
    available_until: Optional[date] = None

    expected_price: Optional[Decimal] = Field(None, gt=0, decimal_places=2, max_digits=10)
    price_unit: Optional[PriceUnit] = None
    minimum_order_quantity: Optional[Decimal] = Field(None, gt=0, decimal_places=2, max_digits=12)

    @model_validator(mode="after")
    def validate_update_constraints(self) -> "ProduceUpdate":
        if (
            self.minimum_order_quantity is not None
            and self.total_quantity is not None
            and self.minimum_order_quantity > self.total_quantity
        ):
            raise ValueError("Minimum order quantity cannot exceed total produce quantity.")
        if (
            self.available_until is not None
            and self.available_from is not None
            and self.available_until < self.available_from
        ):
            raise ValueError("Available until date must be on or after available from date.")
        return self


class ProduceResponse(BaseModel):
    """Full detail view of a produce listing with images and joined metadata."""
    id: str
    farmer_profile_id: str
    farm_id: str
    farm_name: Optional[str] = None

    product_name: str
    category: ProductCategory
    variety: Optional[str] = None
    description: Optional[str] = None

    total_quantity: Decimal
    available_quantity: Decimal
    reserved_quantity: Decimal
    sold_quantity: Decimal
    quantity_unit: QuantityUnit

    quality_grade: QualityGrade

    harvest_date: date
    available_from: date
    available_until: Optional[date] = None

    expected_price: Decimal
    price_unit: PriceUnit
    minimum_order_quantity: Decimal

    status: ProduceStatus
    verification_notes: Optional[str] = None
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime

    images: List[ProduceImageResponse] = []
    primary_image_url: Optional[str] = None

    model_config = {"from_attributes": True}


class ProduceListResponse(BaseModel):
    """Paginated collection of produce listings."""
    items: List[ProduceResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ProduceSummaryStats(BaseModel):
    """Summary dashboard counters for farmer produce management."""
    total_listings: int = 0
    draft_count: int = 0
    pending_count: int = 0
    approved_count: int = 0
    listed_count: int = 0
    partially_sold_count: int = 0
    sold_out_count: int = 0
    rejected_count: int = 0
    archived_count: int = 0


class CropReferenceItem(BaseModel):
    """Standardized crop item for autocomplete and categorization."""
    name: str
    category: ProductCategory
    varieties: List[str]
    standard_unit: QuantityUnit
