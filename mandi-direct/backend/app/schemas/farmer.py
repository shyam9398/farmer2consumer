from datetime import date, datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field, field_validator
from app.models.enums import (
    AreaUnit,
    Gender,
    IrrigationType,
    OwnershipType,
    SoilType,
    VerificationStatus,
)


def validate_indian_pincode(v: Optional[str]) -> Optional[str]:
    """Validate standard 6-digit Indian PIN code format."""
    if v is None:
        return v
    v_clean = v.strip()
    import re
    if not re.match(r"^[1-9][0-9]{5}$", v_clean):
        raise ValueError("Pincode must be a valid 6-digit Indian postal code (e.g. 500001).")
    return v_clean


# ------------------------------------------------------------------------------
# Farmer Profile Schemas
# ------------------------------------------------------------------------------

class FarmerProfileCreate(BaseModel):
    """Schema for creating farmer-specific profile details."""
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    profile_photo_url: Optional[str] = None
    address_line: str = Field(..., min_length=3, max_length=500, description="Street / Door / Landmark")
    village: str = Field(..., min_length=2, max_length=100)
    mandal: str = Field(..., min_length=2, max_length=100, description="Tehsil / Taluka / Mandal")
    district: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., min_length=6, max_length=10)

    @field_validator("pincode")
    @classmethod
    def check_pincode(cls, v: str) -> str:
        return validate_indian_pincode(v) or v


class FarmerProfileUpdate(BaseModel):
    """Schema for updating farmer personal and agricultural demographic fields."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    profile_photo_url: Optional[str] = None
    address_line: Optional[str] = Field(None, min_length=3, max_length=500)
    village: Optional[str] = Field(None, min_length=2, max_length=100)
    mandal: Optional[str] = Field(None, min_length=2, max_length=100)
    district: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    pincode: Optional[str] = Field(None, min_length=6, max_length=10)

    @field_validator("pincode")
    @classmethod
    def check_pincode(cls, v: Optional[str]) -> Optional[str]:
        return validate_indian_pincode(v)


class FarmerProfileResponse(BaseModel):
    """Output schema for farmer profile details with completion and verification status."""
    id: str
    profile_id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    profile_photo_url: Optional[str] = None
    address_line: str
    village: str
    mandal: str
    district: str
    state: str
    pincode: str
    verification_status: VerificationStatus
    verification_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    profile_completion_pct: int = 0
    is_profile_complete: bool = False

    class Config:
        from_attributes = True


# ------------------------------------------------------------------------------
# Farm Schemas
# ------------------------------------------------------------------------------

class FarmCreate(BaseModel):
    """Schema for registering a new farm parcel."""
    farm_name: str = Field(..., min_length=2, max_length=150, description="e.g. Green Acres North")
    total_area: float = Field(..., gt=0, description="Total land area (must be positive)")
    area_unit: AreaUnit = Field(default=AreaUnit.ACRE)
    ownership_type: OwnershipType = Field(default=OwnershipType.OWNED)
    soil_type: Optional[SoilType] = None
    irrigation_type: Optional[IrrigationType] = None
    primary_crops: List[str] = Field(default_factory=list, description="Crops cultivated, e.g. ['Tomato', 'Paddy']")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    address_line: Optional[str] = Field(None, max_length=500)
    village: str = Field(..., min_length=2, max_length=100)
    mandal: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., min_length=6, max_length=10)

    @field_validator("pincode")
    @classmethod
    def check_pincode(cls, v: str) -> str:
        return validate_indian_pincode(v) or v

    @field_validator("total_area")
    @classmethod
    def check_positive_area(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Total area must be strictly greater than zero.")
        return round(v, 2)


class FarmUpdate(BaseModel):
    """Schema for updating an existing farm."""
    farm_name: Optional[str] = Field(None, min_length=2, max_length=150)
    total_area: Optional[float] = Field(None, gt=0)
    area_unit: Optional[AreaUnit] = None
    ownership_type: Optional[OwnershipType] = None
    soil_type: Optional[SoilType] = None
    irrigation_type: Optional[IrrigationType] = None
    primary_crops: Optional[List[str]] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    address_line: Optional[str] = Field(None, max_length=500)
    village: Optional[str] = Field(None, min_length=2, max_length=100)
    mandal: Optional[str] = Field(None, min_length=2, max_length=100)
    district: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    pincode: Optional[str] = Field(None, min_length=6, max_length=10)

    @field_validator("pincode")
    @classmethod
    def check_pincode(cls, v: Optional[str]) -> Optional[str]:
        return validate_indian_pincode(v)

    @field_validator("total_area")
    @classmethod
    def check_positive_area(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            if v <= 0:
                raise ValueError("Total area must be strictly greater than zero.")
            return round(v, 2)
        return v


class FarmResponse(BaseModel):
    """Output schema for farm parcel records."""
    id: str
    farmer_profile_id: str
    farm_name: str
    total_area: float
    area_unit: AreaUnit
    ownership_type: OwnershipType
    soil_type: Optional[SoilType] = None
    irrigation_type: Optional[IrrigationType] = None
    primary_crops: List[str] = Field(default_factory=list)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address_line: Optional[str] = None
    village: str
    mandal: str
    district: str
    state: str
    pincode: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ------------------------------------------------------------------------------
# Dashboard Summary & Completion Schemas
# ------------------------------------------------------------------------------

class ProfileCompletionInfo(BaseModel):
    """Detailed completion progress and checklist."""
    completion_percentage: int
    is_complete: bool
    missing_fields: List[str]
    has_profile: bool
    has_farms: bool
    message: str


class FarmerDashboardSummary(BaseModel):
    """Aggregated metrics for the Farmer Dashboard."""
    farmer_name: str
    email: str
    verification_status: VerificationStatus
    verification_notes: Optional[str] = None
    profile_completion_pct: int
    is_profile_complete: bool
    missing_fields: List[str]
    total_farms: int
    total_farm_area_acres: float
    primary_crops: List[str]
    ready_for_produce: bool
    total_produce_listings: int = 0
    active_produce_listings: int = 0
