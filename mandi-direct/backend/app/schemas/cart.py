from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class CartItemAddRequest(BaseModel):
    produce_listing_id: str = Field(..., description="ID of the LISTED produce to purchase")
    quantity: Decimal = Field(..., gt=0, description="Positive decimal quantity requested")


class CartItemUpdateRequest(BaseModel):
    quantity: Decimal = Field(..., gt=0, description="Updated positive decimal quantity")


class CartProductInfo(BaseModel):
    id: str
    product_name: str
    category: str
    variety: Optional[str] = None
    expected_price: Decimal
    price_unit: str
    quantity_unit: str
    available_quantity: Decimal
    minimum_order_quantity: Decimal
    primary_image_url: Optional[str] = None
    status: str
    farmer_name: str
    farmer_location: str


class CartItemResponse(BaseModel):
    id: str
    cart_id: str
    produce_listing_id: str
    quantity: Decimal
    product: CartProductInfo
    subtotal: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: str
    buyer_user_id: str
    items: List[CartItemResponse]
    item_count: int
    subtotal: Decimal
    delivery_fee: Decimal = Decimal("0.00")
    total_amount: Decimal

    class Config:
        from_attributes = True
