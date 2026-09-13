import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class BuyerAddressBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, description="Recipient full name")
    phone: str = Field(..., description="Contact phone number (10 digits or +91 format)")
    address_line1: str = Field(..., min_length=5, max_length=500, description="Street / Door / Area")
    address_line2: Optional[str] = Field(None, max_length=500)
    village: Optional[str] = Field(None, max_length=100)
    mandal: Optional[str] = Field(None, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., description="6-digit Indian PIN code")
    landmark: Optional[str] = Field(None, max_length=150)
    is_default: bool = Field(False)

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: str) -> str:
        clean = v.strip()
        if not re.match(r"^[1-9][0-9]{5}$", clean):
            raise ValueError("Pincode must be a valid 6-digit Indian Postal PIN code.")
        return clean

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        clean = v.strip().replace(" ", "").replace("-", "")
        if not re.match(r"^(\+91)?[6-9]\d{9}$", clean):
            raise ValueError("Phone number must be a valid 10-digit Indian mobile number.")
        return clean


class BuyerAddressCreate(BuyerAddressBase):
    pass


class BuyerAddressUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone: Optional[str] = None
    address_line1: Optional[str] = Field(None, min_length=5, max_length=500)
    address_line2: Optional[str] = None
    village: Optional[str] = None
    mandal: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    landmark: Optional[str] = None
    is_default: Optional[bool] = None

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip()
            if not re.match(r"^[1-9][0-9]{5}$", clean):
                raise ValueError("Pincode must be a valid 6-digit Indian Postal PIN code.")
            return clean
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip().replace(" ", "").replace("-", "")
            if not re.match(r"^(\+91)?[6-9]\d{9}$", clean):
                raise ValueError("Phone number must be a valid 10-digit Indian mobile number.")
            return clean
        return v


class BuyerAddressResponse(BuyerAddressBase):
    id: str
    buyer_user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
