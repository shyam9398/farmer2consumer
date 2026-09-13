from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class VehicleCreate(BaseModel):
    vehicle_number: str = Field(..., min_length=4, max_length=32, description="Registration number, e.g. AP 39 TX 1234")
    vehicle_type: str = Field(..., min_length=2, max_length=64, description="MINI_TRUCK, PICKUP_VAN, TRACTOR_TRAILER, HEAVY_TRUCK")
    capacity: Decimal = Field(..., gt=0, description="Payload capacity in KG")


class VehicleUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    capacity: Optional[Decimal] = None
    availability_status: Optional[str] = Field(None, description="AVAILABLE, ASSIGNED, ON_DELIVERY, INACTIVE")
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None


class VehicleResponse(BaseModel):
    id: str
    logistics_user_id: str
    vehicle_number: str
    vehicle_type: str
    capacity: Decimal
    availability_status: str
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VehicleListResponse(BaseModel):
    items: List[VehicleResponse]
    total: int
