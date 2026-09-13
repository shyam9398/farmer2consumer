from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class BuyerPreferenceBase(BaseModel):
    preferred_categories: List[str] = Field(
        default_factory=list,
        description="Preferred categories e.g. ['VEGETABLE', 'FRUIT', 'GRAIN']",
    )
    preferred_products: List[str] = Field(
        default_factory=list,
        description="Preferred crop names e.g. ['Tomato', 'Potato', 'Onion']",
    )
    preferred_varieties: List[str] = Field(
        default_factory=list,
        description="Preferred produce varieties e.g. ['Hybrid', 'Desi']",
    )
    preferred_quality_grades: List[str] = Field(
        default_factory=list,
        description="Preferred grades e.g. ['GRADE_A', 'PREMIUM']",
    )
    preferred_districts: List[str] = Field(
        default_factory=list,
        description="Preferred sourcing districts e.g. ['Krishna', 'Kolar']",
    )
    preferred_states: List[str] = Field(
        default_factory=list,
        description="Preferred sourcing states e.g. ['Andhra Pradesh', 'Karnataka']",
    )
    minimum_quantity: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Minimum preferred batch size in KG",
    )
    maximum_quantity: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Maximum preferred batch size in KG",
    )
    minimum_price: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Target floor price per KG in INR",
    )
    maximum_price: Optional[Decimal] = Field(
        default=None,
        ge=0,
        description="Target ceiling price per KG in INR",
    )

    @model_validator(mode="after")
    def validate_ranges(self) -> "BuyerPreferenceBase":
        if (
            self.minimum_quantity is not None
            and self.maximum_quantity is not None
            and self.minimum_quantity > self.maximum_quantity
        ):
            raise ValueError("minimum_quantity cannot exceed maximum_quantity")

        if (
            self.minimum_price is not None
            and self.maximum_price is not None
            and self.minimum_price > self.maximum_price
        ):
            raise ValueError("minimum_price cannot exceed maximum_price")

        return self


class BuyerPreferenceCreate(BuyerPreferenceBase):
    pass


class BuyerPreferenceUpdate(BuyerPreferenceBase):
    pass


class BuyerPreferenceResponse(BuyerPreferenceBase):
    id: str
    buyer_user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
