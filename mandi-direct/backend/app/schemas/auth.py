from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.enums import UserRole, UserStatus


class ProfileCreateRequest(BaseModel):
    """
    Schema for initial profile setup after Supabase Auth registration.
    
    Security rule: ADMIN cannot be self-selected.
    """
    full_name: str = Field(..., min_length=2, max_length=150, example="Ramesh Kumar")
    phone: Optional[str] = Field(None, max_length=20, example="+919876543210")
    role: UserRole = Field(
        default=UserRole.FARMER,
        description="Desired operational role: FARMER, BUYER, FPO, LOGISTICS",
    )

    @field_validator("role")
    @classmethod
    def prevent_admin_self_assignment(cls, v: UserRole) -> UserRole:
        if v == UserRole.ADMIN:
            raise ValueError("ADMIN role cannot be self-assigned through public registration.")
        return v


class ProfileUpdateRequest(BaseModel):
    """Schema for updating personal profile fields."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone: Optional[str] = Field(None, max_length=20)


class ProfileResponse(BaseModel):
    """
    Comprehensive user profile response.
    
    Contains backend-verified role from PostgreSQL database.
    """
    id: str
    auth_user_id: str
    full_name: str
    phone: Optional[str] = None
    email: str
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenPayload(BaseModel):
    """Extracted payload from Supabase JWT."""
    sub: str = Field(..., description="Supabase auth.users UUID")
    email: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[Union[int, float]] = None
