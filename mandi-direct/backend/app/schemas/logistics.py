from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Collection Points Schemas
# ---------------------------------------------------------------------------

class CollectionPointBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    address: str = Field(..., min_length=5)
    village: Optional[str] = None
    mandal: Optional[str] = None
    district: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., pattern=r"^\d{6}$")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_name: str = Field(..., min_length=2, max_length=150)
    contact_phone: str = Field(..., min_length=10, max_length=32)
    is_active: bool = True


class CollectionPointCreate(CollectionPointBase):
    pass


class CollectionPointUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    address: Optional[str] = Field(None, min_length=5)
    village: Optional[str] = None
    mandal: Optional[str] = None
    district: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    pincode: Optional[str] = Field(None, pattern=r"^\d{6}$")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_name: Optional[str] = Field(None, min_length=2, max_length=150)
    contact_phone: Optional[str] = Field(None, min_length=10, max_length=32)
    is_active: Optional[bool] = None


class CollectionPointResponse(CollectionPointBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CollectionPointListResponse(BaseModel):
    items: List[CollectionPointResponse]
    total: int


# ---------------------------------------------------------------------------
# Delivery Confirmation Schemas
# ---------------------------------------------------------------------------

class DeliveryConfirmationCreate(BaseModel):
    recipient_name: str = Field(..., min_length=2, max_length=150)
    confirmation_type: str = Field(default="MANUAL")
    notes: Optional[str] = None


class DeliveryConfirmationResponse(BaseModel):
    id: str
    order_id: str
    confirmed_by: str
    confirmation_type: str
    recipient_name: str
    notes: Optional[str] = None
    confirmed_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Order Logistics Schemas
# ---------------------------------------------------------------------------

class OrderLogisticsConfigureRequest(BaseModel):
    collection_type: Optional[str] = "COLLECTION_POINT"
    collection_point_id: Optional[str] = None
    assigned_agent_name: Optional[str] = None
    assigned_agent_phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    estimated_delivery_at: Optional[datetime] = None
    delivery_notes: Optional[str] = None


class SchedulePickupRequest(BaseModel):
    pickup_scheduled_at: datetime
    collection_point_id: Optional[str] = None
    assigned_agent_name: Optional[str] = None
    assigned_agent_phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    pickup_notes: Optional[str] = None


class CompletePickupRequest(BaseModel):
    notes: Optional[str] = None


class StartDeliveryRequest(BaseModel):
    estimated_delivery_at: Optional[datetime] = None
    notes: Optional[str] = None


class OrderLogisticsResponse(BaseModel):
    id: str
    order_id: str
    collection_type: str
    collection_point_id: Optional[str] = None
    collection_point: Optional[CollectionPointResponse] = None
    pickup_address: Optional[str] = None
    pickup_village: Optional[str] = None
    pickup_mandal: Optional[str] = None
    pickup_district: Optional[str] = None
    pickup_state: Optional[str] = None
    pickup_pincode: Optional[str] = None
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    delivery_address: Optional[str] = None
    delivery_village: Optional[str] = None
    delivery_mandal: Optional[str] = None
    delivery_district: Optional[str] = None
    delivery_state: Optional[str] = None
    delivery_pincode: Optional[str] = None
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    assigned_agent_name: Optional[str] = None
    assigned_agent_phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    pickup_scheduled_at: Optional[datetime] = None
    pickup_completed_at: Optional[datetime] = None
    delivery_started_at: Optional[datetime] = None
    delivery_completed_at: Optional[datetime] = None
    estimated_delivery_at: Optional[datetime] = None
    delivery_notes: Optional[str] = None
    delivery_confirmation: Optional[DeliveryConfirmationResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Logistics Admin Dashboard Schemas
# ---------------------------------------------------------------------------

class LogisticsDashboardStats(BaseModel):
    ready_for_pickup: int
    picked_up: int
    out_for_delivery: int
    delivered_today: int
    total_active_deliveries: int
    today_scheduled_pickups: int


class LogisticsFarmerSummary(BaseModel):
    farmer_profile_id: str
    farmer_name: str
    farm_name: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    phone: Optional[str] = None
    products: List[str]


class LogisticsOrderSummary(BaseModel):
    id: str
    order_number: str
    status: str
    total_amount: Decimal
    buyer_name: str
    buyer_phone: Optional[str] = None
    delivery_city: str
    delivery_state: str
    delivery_pincode: str
    farmers: List[LogisticsFarmerSummary]
    items_count: int
    logistics: Optional[OrderLogisticsResponse] = None
    created_at: datetime


class LogisticsDashboardResponse(BaseModel):
    stats: LogisticsDashboardStats
    orders: List[LogisticsOrderSummary]
    total_orders: int


# ---------------------------------------------------------------------------
# Buyer Logistics Booking & Partner Operations Schemas
# ---------------------------------------------------------------------------

class LogisticsBookingItem(BaseModel):
    order_id: str
    order_number: str
    product_name: str
    quantity: Decimal
    quantity_unit: str
    pickup_hub_name: str
    pickup_address: str
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    delivery_address: str
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    booking_status: str
    assigned_vehicle_id: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    created_at: datetime


class LogisticsBookingListResponse(BaseModel):
    items: List[LogisticsBookingItem]
    total: int


class AcceptBookingRequest(BaseModel):
    vehicle_id: str = Field(..., description="ID of the available vehicle to assign")


class UpdateBookingStatusRequest(BaseModel):
    status: str = Field(..., description="GOING_TO_COLLECTION, AT_COLLECTION, PRODUCT_LOADED, OUT_FOR_DELIVERY, ARRIVED_AT_DELIVERY, DELIVERED")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None


class UpdateBookingLocationRequest(BaseModel):
    latitude: float = Field(..., description="Current vehicle GPS latitude")
    longitude: float = Field(..., description="Current vehicle GPS longitude")

