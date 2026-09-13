from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class FarmerEarningItemResponse(BaseModel):
    id: str
    farmer_profile_id: str
    order_id: str
    order_number: str
    order_item_id: str
    product_name: str
    quantity: Decimal
    quantity_unit: str
    unit_price: Decimal
    gross_amount: Decimal
    platform_fee: Decimal
    logistics_fee: Decimal
    other_deductions: Decimal
    net_amount: Decimal
    currency: str
    status: str
    earned_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FarmerEarningDetailResponse(FarmerEarningItemResponse):
    order_date: datetime
    delivery_date: Optional[datetime] = None
    buyer_name: Optional[str] = None
    buyer_notes: Optional[str] = None
    settlement_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None


class FarmerEarningsSummaryResponse(BaseModel):
    total_gross: Decimal = Field(default=Decimal("0.00"))
    total_deductions: Decimal = Field(default=Decimal("0.00"))
    total_net: Decimal = Field(default=Decimal("0.00"))
    pending_settlement: Decimal = Field(default=Decimal("0.00"))
    available_balance: Decimal = Field(default=Decimal("0.00"))
    total_paid: Decimal = Field(default=Decimal("0.00"))
    total_orders: int = 0
    delivered_orders: int = 0
    total_quantity_sold: Decimal = Field(default=Decimal("0.00"))
    produce_sold_qty: Decimal = Field(default=Decimal("0.00"))
    total_sales: Decimal = Field(default=Decimal("0.00"))
    estimated_additional_earnings: Decimal = Field(default=Decimal("0.00"))


class FarmerEarningsListResponse(BaseModel):
    items: List[FarmerEarningItemResponse]
    total: int
    page: int
    page_size: int
