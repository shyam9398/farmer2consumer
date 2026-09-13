from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_optional_current_user
from app.models.profile import Profile
from app.schemas.market_prices import MarketPriceListResponse
from app.services.market_price_service import market_price_service

router = APIRouter()


@router.get("", response_model=MarketPriceListResponse)
def get_market_prices(
    category: Optional[str] = Query(None, description="Category filter (grains, vegetables, fruits, spices, pulses, oilseeds)"),
    state: Optional[str] = Query(None, description="State filter"),
    district: Optional[str] = Query(None, description="District filter"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_optional_current_user),
):
    """
    Public / Farmer accessible endpoint returning verified APMC Mandi market price observations.
    Zero fake data: returns empty list if no observations found.
    """
    return market_price_service.get_market_prices(
        db, category=category, state=state, district=district, limit=limit
    )
