from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.farmer import FarmResponse
from app.schemas.produce import ProduceImageResponse, ProduceResponse


class AdminDashboardStats(BaseModel):
    """Aggregate statistics for admin dashboard."""
    pending_farmers: int
    verified_farmers: int
    rejected_farmers: int
    total_farmers: int
    pending_produce: int
    approved_produce: int
    rejected_produce: int
    total_produce: int


class VerificationRecordResponse(BaseModel):
    """Auditable log record of an approval, rejection, or resubmission event."""
    id: str
    entity_type: str
    entity_id: str
    action: str
    previous_status: Optional[str] = None
    new_status: str
    admin_user_id: Optional[str] = None
    admin_name: Optional[str] = None
    admin_email: Optional[str] = None
    reason: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class VerificationRecordListResponse(BaseModel):
    items: List[VerificationRecordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class FarmerVerificationItem(BaseModel):
    id: Optional[str] = None
    farmer_id: str
    profile_id: str
    full_name: str
    phone: Optional[str] = None
    email: str
    profile_photo_url: Optional[str] = None
    village: str
    mandal: str
    district: str
    state: str
    pincode: str
    profile_completion_percentage: int
    farm_count: int
    verification_status: str
    verification_notes: Optional[str] = None
    verified_at: Optional[str] = None
    verified_by_name: Optional[str] = None
    created_at: str


class FarmerVerificationListResponse(BaseModel):
    items: List[FarmerVerificationItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class FarmerVerificationDetailResponse(BaseModel):
    farmer: FarmerVerificationItem
    farms: List[FarmResponse]
    history: List[VerificationRecordResponse]


class ProduceVerificationItem(BaseModel):
    id: Optional[str] = None
    produce_id: str
    product_name: str
    category: str
    variety: Optional[str] = None
    total_quantity: float
    quantity_unit: str
    quality_grade: str
    expected_price: float
    price_unit: str
    harvest_date: str
    farmer_id: str
    farmer_name: str
    farmer_status: str
    farm_id: str
    farm_name: str
    location: str
    image_count: int
    primary_image_url: Optional[str] = None
    status: str
    verification_notes: Optional[str] = None
    submitted_at: Optional[str] = None
    created_at: str


class ProduceVerificationListResponse(BaseModel):
    items: List[ProduceVerificationItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class ProduceVerificationDetailResponse(BaseModel):
    produce: ProduceResponse
    farmer_id: str
    farmer_name: str
    farmer_verification_status: str
    farmer_location: str
    farm: FarmResponse
    images: List[ProduceImageResponse]
    history: List[VerificationRecordResponse]


class VerificationDecisionRequest(BaseModel):
    """Optional note when approving an entity."""
    notes: Optional[str] = None
    note: Optional[str] = None


class VerificationRejectRequest(BaseModel):
    """Mandatory explanation when rejecting an entity."""
    reason: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        description="Mandatory clear explanation why the submission was rejected.",
    )
