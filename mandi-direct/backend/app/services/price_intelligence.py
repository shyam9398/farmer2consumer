import statistics
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.enums import OrderStatus, PriceUnit, QuantityUnit
from app.models.order import Order, OrderItem
from app.models.price_observation import PriceObservation
from app.schemas.price_intelligence import (
    ConfidenceLevel,
    MatchLevel,
    PriceHistoryPoint,
    PriceHistoryResponse,
    PriceIntelligenceSummary,
    PriceObservationCreate,
    PriceObservationResponse,
    PriceObservationUpdate,
    PriceSourceType,
    PriceTrend,
    RegionalPriceItem,
    RegionalPriceResponse,
)


class NormalizedObservation:
    """Internal helper representing a normalized price observation in INR/KG."""
    def __init__(
        self,
        id: str,
        product_name: str,
        category: str,
        variety: Optional[str],
        quality_grade: Optional[str],
        price_per_kg: Decimal,
        quantity_kg: Decimal,
        market_name: Optional[str],
        district: Optional[str],
        state: Optional[str],
        source_type: str,
        source_name: str,
        observation_date: date,
    ):
        self.id = id
        self.product_name = product_name
        self.category = category
        self.variety = variety
        self.quality_grade = quality_grade
        self.price_per_kg = price_per_kg
        self.quantity_kg = quantity_kg
        self.market_name = market_name
        self.district = district
        self.state = state
        self.source_type = source_type
        self.source_name = source_name
        self.observation_date = observation_date


class PriceIntelligenceService:
    """
    Core engine for price unit normalization, market price observations,
    Mandi Direct transaction extraction, aggregation, trend analysis, and regional statistics.
    """

    @staticmethod
    def normalize_price_to_per_kg(price: Decimal, unit_str: str) -> Decimal:
        """
        Converts a price in PER_KG, PER_QUINTAL, or PER_TON to INR per KG using Decimal arithmetic.
        1 KG = 1 KG
        1 QUINTAL = 100 KG  (price_per_kg = price / 100)
        1 TON = 1000 KG    (price_per_kg = price / 1000)
        """
        if not price or price <= 0:
            return Decimal("0.00")

        u = str(unit_str).upper().replace("PER_", "").strip()
        if u in ("QUINTAL", "QTL"):
            factor = Decimal("100")
        elif u in ("TON", "TONNE", "MT"):
            factor = Decimal("1000")
        else:
            factor = Decimal("1")

        price_per_kg = price / factor
        return price_per_kg.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def convert_per_kg_to_unit(price_per_kg: Decimal, unit_str: str) -> Decimal:
        """
        Converts an INR per KG price to the requested unit (PER_KG, PER_QUINTAL, PER_TON).
        """
        if not price_per_kg or price_per_kg <= 0:
            return Decimal("0.00")

        u = str(unit_str).upper().replace("PER_", "").strip()
        if u in ("QUINTAL", "QTL"):
            factor = Decimal("100")
        elif u in ("TON", "TONNE", "MT"):
            factor = Decimal("1000")
        else:
            factor = Decimal("1")

        converted_price = price_per_kg * factor
        return converted_price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def normalize_quantity_to_kg(qty: Decimal, unit_str: str) -> Decimal:
        """
        Normalizes any quantity to KG.
        """
        u = str(unit_str).upper().replace("PER_", "").strip()
        if u in ("QUINTAL", "QTL"):
            factor = Decimal("100")
        elif u in ("TON", "TONNE", "MT"):
            factor = Decimal("1000")
        else:
            factor = Decimal("1")

        return (qty * factor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def get_all_normalized_observations(
        self,
        db: Session,
        product_name: Optional[str] = None,
        category: Optional[str] = None,
        variety: Optional[str] = None,
        quality_grade: Optional[str] = None,
        district: Optional[str] = None,
        state: Optional[str] = None,
        days_back: int = 90,
    ) -> List[NormalizedObservation]:
        """
        Retrieves price observations from both:
        1. External/Admin `price_observations` table
        2. Mandi Direct completed/delivered `order_items` transactions (historical immutability preserved)
        """
        cutoff_date = date.today() - timedelta(days=days_back)
        results: List[NormalizedObservation] = []

        # 1. Fetch from price_observations table
        query = db.query(PriceObservation).filter(PriceObservation.observation_date >= cutoff_date)
        if product_name:
            query = query.filter(func.lower(PriceObservation.product_name) == product_name.lower().strip())
        if category:
            query = query.filter(func.lower(PriceObservation.category) == category.lower().strip())
        if variety:
            query = query.filter(func.lower(PriceObservation.variety) == variety.lower().strip())
        if quality_grade and quality_grade != "UNGRADED":
            query = query.filter(PriceObservation.quality_grade == quality_grade)
        if state:
            query = query.filter(func.lower(PriceObservation.state) == state.lower().strip())
        if district:
            query = query.filter(func.lower(PriceObservation.district) == district.lower().strip())

        obs_records = query.all()
        for obs in obs_records:
            price_kg = self.normalize_price_to_per_kg(obs.price, obs.price_unit)
            results.append(
                NormalizedObservation(
                    id=obs.id,
                    product_name=obs.product_name,
                    category=obs.category,
                    variety=obs.variety,
                    quality_grade=obs.quality_grade,
                    price_per_kg=price_kg,
                    quantity_kg=Decimal("100"),  # Default observation weight
                    market_name=obs.market_name,
                    district=obs.district,
                    state=obs.state,
                    source_type=obs.source_type,
                    source_name=obs.source_name,
                    observation_date=obs.observation_date,
                )
            )

        # 2. Extract historical delivered transactions from order_items
        order_query = (
            db.query(OrderItem, Order)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(Order.status == OrderStatus.DELIVERED.value)
            .filter(func.date(Order.created_at) >= cutoff_date)
        )
        if product_name:
            order_query = order_query.filter(func.lower(OrderItem.product_name) == product_name.lower().strip())

        items_orders = order_query.all()
        for item, order in items_orders:
            # Extract state/district from snapshot if available
            snapshot = order.delivery_address_snapshot or {}
            item_state = snapshot.get("state")
            item_district = snapshot.get("district")

            if state and item_state and item_state.lower().strip() != state.lower().strip():
                continue
            if district and item_district and item_district.lower().strip() != district.lower().strip():
                continue

            price_kg = self.normalize_price_to_per_kg(item.unit_price, item.quantity_unit)
            qty_kg = self.normalize_quantity_to_kg(item.quantity, item.quantity_unit)
            obs_dt = order.created_at.date() if isinstance(order.created_at, datetime) else date.today()

            results.append(
                NormalizedObservation(
                    id=f"tx_{item.id}",
                    product_name=item.product_name,
                    category="AGRICULTURE",
                    variety=None,
                    quality_grade=None,
                    price_per_kg=price_kg,
                    quantity_kg=qty_kg,
                    market_name="Mandi Direct Exchange",
                    district=item_district,
                    state=item_state,
                    source_type=PriceSourceType.MANDI_DIRECT_TRANSACTION.value,
                    source_name="Mandi Direct Platform Order",
                    observation_date=obs_dt,
                )
            )

        return results

    def calculate_trend(self, observations: List[NormalizedObservation]) -> PriceTrend:
        """
        Calculates price trend by comparing recent 7-day average vs previous 7-day average (days 8-14).
        Threshold: 3% shift.
        """
        if len(observations) < 2:
            return PriceTrend.INSUFFICIENT_DATA

        today = date.today()
        d7_cutoff = today - timedelta(days=7)
        d14_cutoff = today - timedelta(days=14)

        recent_7d = [o.price_per_kg for o in observations if o.observation_date >= d7_cutoff]
        prev_7d = [o.price_per_kg for o in observations if d14_cutoff <= o.observation_date < d7_cutoff]

        if not recent_7d or not prev_7d:
            # Fall back to splitting all observations in half chronologically if recent windows are sparse
            sorted_obs = sorted(observations, key=lambda x: x.observation_date)
            mid = len(sorted_obs) // 2
            prev_7d = [o.price_per_kg for o in sorted_obs[:mid]]
            recent_7d = [o.price_per_kg for o in sorted_obs[mid:]]

        if not recent_7d or not prev_7d:
            return PriceTrend.STABLE

        avg_recent = sum(recent_7d) / Decimal(len(recent_7d))
        avg_prev = sum(prev_7d) / Decimal(len(prev_7d))

        if avg_prev <= 0:
            return PriceTrend.STABLE

        pct_change = ((avg_recent - avg_prev) / avg_prev) * Decimal("100")

        # Check volatility
        all_prices = [float(o.price_per_kg) for o in observations]
        if len(all_prices) >= 4:
            stdev = statistics.stdev(all_prices)
            mean_p = statistics.mean(all_prices)
            if mean_p > 0 and (stdev / mean_p) > 0.25:
                return PriceTrend.VOLATILE

        if pct_change > Decimal("3.0"):
            return PriceTrend.RISING
        elif pct_change < Decimal("-3.0"):
            return PriceTrend.FALLING
        else:
            return PriceTrend.STABLE

    def calculate_confidence(
        self,
        observations: List[NormalizedObservation],
        match_level: MatchLevel,
        has_verified_sources: bool = False,
    ) -> ConfidenceLevel:
        """
        Calculates confidence score (LOW, MEDIUM, HIGH) based on observation count, recency, and match level.
        """
        count = len(observations)
        if count < 3 or match_level == MatchLevel.CATEGORY_ONLY:
            return ConfidenceLevel.LOW

        recent_cutoff = date.today() - timedelta(days=14)
        has_recent = any(o.observation_date >= recent_cutoff for o in observations)

        if count >= 10 and match_level in (MatchLevel.EXACT_FULL, MatchLevel.VARIETY_QUALITY) and has_recent:
            return ConfidenceLevel.HIGH

        if count >= 5 and has_recent:
            return ConfidenceLevel.MEDIUM

        return ConfidenceLevel.LOW

    def get_summary(
        self,
        db: Session,
        product_name: str,
        variety: Optional[str] = None,
        quality_grade: Optional[str] = None,
    ) -> PriceIntelligenceSummary:
        """
        Generates a summary of price intelligence for a specific produce item.
        """
        obs = self.get_all_normalized_observations(
            db, product_name=product_name, variety=variety, quality_grade=quality_grade, days_back=90
        )

        if not obs:
            return PriceIntelligenceSummary(
                product_name=product_name,
                category="AGRICULTURE",
                variety=variety,
                quality_grade=quality_grade,
                trend=PriceTrend.INSUFFICIENT_DATA,
                confidence=ConfidenceLevel.LOW,
                observation_count=0,
                sources=[],
            )

        prices = [o.price_per_kg for o in obs]
        latest_obs = max(obs, key=lambda x: x.observation_date)

        # Quantity-weighted average calculation
        total_value = sum(o.price_per_kg * o.quantity_kg for o in obs)
        total_qty = sum(o.quantity_kg for o in obs)
        weighted_avg = (total_value / total_qty).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if total_qty > 0 else (sum(prices) / Decimal(len(prices))).quantize(Decimal("0.01"))

        simple_avg = (sum(prices) / Decimal(len(prices))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        sorted_prices = sorted(prices)
        n = len(sorted_prices)
        median_price = sorted_prices[n // 2] if n % 2 == 1 else ((sorted_prices[n // 2 - 1] + sorted_prices[n // 2]) / Decimal("2")).quantize(Decimal("0.01"))

        # Time window moving averages
        today = date.today()
        d7_prices = [o.price_per_kg for o in obs if o.observation_date >= today - timedelta(days=7)]
        d30_prices = [o.price_per_kg for o in obs if o.observation_date >= today - timedelta(days=30)]
        d90_prices = prices

        avg_7d = (sum(d7_prices) / Decimal(len(d7_prices))).quantize(Decimal("0.01")) if d7_prices else None
        avg_30d = (sum(d30_prices) / Decimal(len(d30_prices))).quantize(Decimal("0.01")) if d30_prices else None
        avg_90d = (sum(d90_prices) / Decimal(len(d90_prices))).quantize(Decimal("0.01")) if d90_prices else None

        trend = self.calculate_trend(obs)
        match_level = MatchLevel.EXACT_FULL if (variety and quality_grade) else MatchLevel.PRODUCT_ONLY
        confidence = self.calculate_confidence(obs, match_level)
        unique_sources = sorted(list({o.source_name for o in obs}))

        return PriceIntelligenceSummary(
            product_name=product_name,
            category=obs[0].category if obs else "AGRICULTURE",
            variety=variety,
            quality_grade=quality_grade,
            latest_price=latest_obs.price_per_kg,
            min_price=min(prices),
            max_price=max(prices),
            avg_price=simple_avg,
            median_price=median_price,
            weighted_avg_price=weighted_avg,
            avg_7d=avg_7d,
            avg_30d=avg_30d,
            avg_90d=avg_90d,
            trend=trend,
            confidence=confidence,
            observation_count=len(obs),
            sources=unique_sources,
        )

    def get_history(
        self,
        db: Session,
        product_name: str,
        variety: Optional[str] = None,
        quality_grade: Optional[str] = None,
        days_back: int = 30,
    ) -> PriceHistoryResponse:
        """
        Aggregates daily historical price trend points for charting.
        """
        obs = self.get_all_normalized_observations(
            db, product_name=product_name, variety=variety, quality_grade=quality_grade, days_back=days_back
        )
        end_date = date.today()
        start_date = end_date - timedelta(days=days_back)

        if not obs:
            return PriceHistoryResponse(
                product_name=product_name,
                variety=variety,
                quality_grade=quality_grade,
                start_date=start_date,
                end_date=end_date,
                history=[],
                total_observations=0,
                trend=PriceTrend.INSUFFICIENT_DATA,
            )

        # Group by observation_date
        by_date: Dict[date, List[NormalizedObservation]] = {}
        for o in obs:
            by_date.setdefault(o.observation_date, []).append(o)

        history_points: List[PriceHistoryPoint] = []
        for d in sorted(by_date.keys()):
            day_obs = by_date[d]
            d_prices = [o.price_per_kg for o in day_obs]
            avg_p = (sum(d_prices) / Decimal(len(d_prices))).quantize(Decimal("0.01"))
            sources = sorted(list({o.source_type for o in day_obs}))

            history_points.append(
                PriceHistoryPoint(
                    observation_date=d,
                    avg_price_per_kg=avg_p,
                    min_price_per_kg=min(d_prices),
                    max_price_per_kg=max(d_prices),
                    observation_count=len(day_obs),
                    source_types=sources,
                )
            )

        all_prices = [o.price_per_kg for o in obs]
        overall_avg = (sum(all_prices) / Decimal(len(all_prices))).quantize(Decimal("0.01"))
        trend = self.calculate_trend(obs)

        return PriceHistoryResponse(
            product_name=product_name,
            variety=variety,
            quality_grade=quality_grade,
            start_date=start_date,
            end_date=end_date,
            history=history_points,
            total_observations=len(obs),
            overall_avg_per_kg=overall_avg,
            overall_min_per_kg=min(all_prices),
            overall_max_per_kg=max(all_prices),
            trend=trend,
        )

    def get_regional_prices(
        self,
        db: Session,
        product_name: str,
        variety: Optional[str] = None,
        quality_grade: Optional[str] = None,
        district: Optional[str] = None,
        state: Optional[str] = None,
    ) -> RegionalPriceResponse:
        """
        Generates a comparative regional breakdown: District vs State vs Mandi Direct platform orders.
        """
        all_obs = self.get_all_normalized_observations(
            db, product_name=product_name, variety=variety, quality_grade=quality_grade, days_back=90
        )

        if not all_obs:
            return RegionalPriceResponse(
                product_name=product_name,
                variety=variety,
                quality_grade=quality_grade,
                district=district,
                state=state,
                overall_range_text="Regional comparison unavailable due to insufficient data.",
                has_sufficient_data=False,
            )

        # District Filter
        district_obs = [o for o in all_obs if district and o.district and o.district.lower().strip() == district.lower().strip()]
        state_obs = [o for o in all_obs if state and o.state and o.state.lower().strip() == state.lower().strip()]
        mandi_obs = [o for o in all_obs if o.source_type == PriceSourceType.MANDI_DIRECT_TRANSACTION.value]

        def _make_item(name: str, type_str: str, items: List[NormalizedObservation]) -> RegionalPriceItem:
            if not items:
                return RegionalPriceItem(
                    region_type=type_str,
                    region_name=name,
                    observation_count=0,
                    status_message="Regional comparison unavailable due to insufficient data.",
                )
            prices = [i.price_per_kg for i in items]
            avg_p = (sum(prices) / Decimal(len(prices))).quantize(Decimal("0.01"))
            return RegionalPriceItem(
                region_type=type_str,
                region_name=name,
                avg_price_per_kg=avg_p,
                min_price_per_kg=min(prices),
                max_price_per_kg=max(prices),
                observation_count=len(items),
                status_message=f"{len(items)} observations recorded.",
            )

        dist_item = _make_item(district or "Local District", "DISTRICT", district_obs) if district else None
        state_item = _make_item(state or "State", "STATE", state_obs) if state else None
        mandi_item = _make_item("Mandi Direct Platform", "MANDI_DIRECT_TRANSACTION", mandi_obs)

        all_prices = [o.price_per_kg for o in all_obs]
        overall_range = f"₹{min(all_prices)}–₹{max(all_prices)}/kg"

        return RegionalPriceResponse(
            product_name=product_name,
            variety=variety,
            quality_grade=quality_grade,
            district=district,
            state=state,
            district_reference=dist_item,
            state_reference=state_item,
            mandi_direct_reference=mandi_item,
            overall_range_text=overall_range,
            has_sufficient_data=len(all_obs) >= 1,
        )


price_intelligence_service = PriceIntelligenceService()
