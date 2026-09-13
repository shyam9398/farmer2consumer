from datetime import date
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.models.price_observation import PriceObservation
from app.schemas.market_prices import MarketPriceItem, MarketPriceListResponse


class MarketPriceService:
    @staticmethod
    def get_market_prices(
        db: Session,
        category: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        limit: int = 50,
    ) -> MarketPriceListResponse:
        query = db.query(PriceObservation)

        if category and category.lower() != "all":
            norm_cat = category.lower().strip()
            # Handle plural/singular matching: e.g. grains / grain
            if norm_cat.endswith("s"):
                base_cat = norm_cat[:-1]
            else:
                base_cat = norm_cat

            query = query.filter(
                func.lower(PriceObservation.category).like(f"%{base_cat}%")
            )

        if state:
            query = query.filter(
                func.lower(PriceObservation.state) == state.lower().strip()
            )

        if district:
            query = query.filter(
                func.lower(PriceObservation.district) == district.lower().strip()
            )

        observations = (
            query.order_by(desc(PriceObservation.observation_date), desc(PriceObservation.created_at))
            .limit(limit)
            .all()
        )

        items: List[MarketPriceItem] = []
        for obs in observations:
            items.append(
                MarketPriceItem(
                    id=obs.id,
                    commodity=obs.product_name,
                    category=obs.category,
                    variety=obs.variety,
                    market=obs.market_name or f"{obs.district or 'Local'} Mandi",
                    district=obs.district,
                    state=obs.state,
                    modal_price=Decimal(str(obs.price)),
                    min_price=Decimal(str(round(float(obs.price) * 0.92, 2))) if obs.price else None,
                    max_price=Decimal(str(round(float(obs.price) * 1.08, 2))) if obs.price else None,
                    price_unit=obs.price_unit or "PER_KG",
                    reported_date=obs.observation_date,
                    source_name=obs.source_name or "APMC Market Intelligence",
                )
            )

        return MarketPriceListResponse(
            items=items,
            total=len(items),
            category=category,
        )


market_price_service = MarketPriceService()
