from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class MarketPriceItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    commodity: str
    category: str
    variety: Optional[str] = None
    market: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    modal_price: Decimal
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    price_unit: str = "PER_KG"
    reported_date: date
    source_name: str


class MarketPriceListResponse(BaseModel):
    items: List[MarketPriceItem]
    total: int
    category: Optional[str] = None
