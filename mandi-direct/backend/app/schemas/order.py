from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.enums import OrderStatus, PaymentStatus
from app.schemas.logistics import OrderLogisticsResponse


class OrderCreateRequest(BaseModel):
    delivery_address_id: str = Field(..., description="ID of saved delivery address belonging to the authenticated buyer")
    buyer_notes: Optional[str] = Field(None, max_length=1000, description="Optional delivery or packing notes")


class OrderStatusUpdateRequest(BaseModel):
    status: OrderStatus = Field(..., description="Target order status")
    reason: Optional[str] = Field(None, max_length=500, description="Reason for status transition or rejection")


class OrderCancelRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500, description="Cancellation reason")


class OrderItemResponse(BaseModel):
    id: str
    order_id: str
    produce_listing_id: str
    farmer_profile_id: str
    product_name: str
    quantity: Decimal
    quantity_unit: str
    unit_price: Decimal
    subtotal: Decimal
    primary_image_url: Optional[str] = None
    farmer_name: Optional[str] = None

    class Config:
        from_attributes = True


class OrderStatusHistoryResponse(BaseModel):
    id: str
    order_id: str
    previous_status: Optional[str] = None
    new_status: str
    changed_by: str
    actor_name: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BuyerOrderSummaryResponse(BaseModel):
    id: str
    order_number: str
    status: str
    payment_status: str
    subtotal: Decimal
    delivery_fee: Decimal
    total_amount: Decimal
    items_count: int
    first_product_name: str
    first_product_image: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BuyerOrderDetailResponse(BaseModel):
    id: str
    order_number: str
    status: str
    payment_status: str
    subtotal: Decimal
    delivery_fee: Decimal
    total_amount: Decimal
    delivery_address_snapshot: Dict[str, Any]
    buyer_notes: Optional[str] = None
    items: List[OrderItemResponse]
    status_history: List[OrderStatusHistoryResponse]
    logistics: Optional[OrderLogisticsResponse] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FarmerOrderItemResponse(BaseModel):
    id: str
    produce_listing_id: str
    product_name: str
    variety: Optional[str] = None
    quality_grade: Optional[str] = None
    quantity: Decimal
    quantity_unit: str
    unit_price: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


class FarmerOrderSummaryResponse(BaseModel):
    id: str
    order_number: str
    status: str
    created_at: datetime
    items_count: int
    product_names: Optional[List[str]] = []
    farmer_subtotal: Decimal
    buyer_name: str
    delivery_district: str
    delivery_state: str
    collection_point_name: Optional[str] = None

    class Config:
        from_attributes = True


class FarmerOrderDetailResponse(BaseModel):
    id: str
    order_number: str
    status: str
    created_at: datetime
    buyer_name: str
    buyer_phone: Optional[str] = None
    delivery_address: Dict[str, Any]
    buyer_notes: Optional[str] = None
    items: List[FarmerOrderItemResponse]
    farmer_subtotal: Decimal
    status_history: List[OrderStatusHistoryResponse]
    logistics: Optional[OrderLogisticsResponse] = None

    class Config:
        from_attributes = True


class FarmerOrderStatsResponse(BaseModel):
    pending: int = 0
    accepted: int = 0
    preparing: int = 0
    ready_for_pickup: int = 0
    picked_up: int = 0
    out_for_delivery: int = 0
    delivered: int = 0
    rejected: int = 0
    cancelled: int = 0
    total_requiring_action: int = 0
