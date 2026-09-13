from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class PayoutRequestCreate(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Amount to withdraw from available balance")


class FarmerPayoutResponse(BaseModel):
    id: str
    farmer_profile_id: str
    farmer_name: Optional[str] = None
    farmer_phone: Optional[str] = None
    payout_reference: str
    amount: Decimal
    currency: str
    status: str
    payment_method: str
    provider: str
    provider_payout_id: Optional[str] = None
    requested_at: datetime
    processed_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    failure_reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FarmerPayoutListResponse(BaseModel):
    items: List[FarmerPayoutResponse]
    total: int
    page: int
    page_size: int


class AdminPayoutUpdateRequest(BaseModel):
    status: str = Field(..., description="PROCESSING, COMPLETED, or FAILED")
    failure_reason: Optional[str] = Field(None, description="Required if status is FAILED")
    provider_payout_id: Optional[str] = None
