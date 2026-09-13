from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.schemas.price_intelligence import (
    ConfidenceLevel,
    ExpectedPriceComparisonState,
    MatchLevel,
    PriceRecommendationRequest,
    PriceRecommendationResponse,
    PriceTrend,
)
from app.services.price_intelligence import (
    NormalizedObservation,
    price_intelligence_service,
)


class PriceRecommendationService:
    """
    Transparent statistical recommendation engine for farmer target pricing.
    Generates reference prices, fair price ranges, target price suggestions,
    trend signals, confidence scores, and expected-price comparisons.
    """

    def generate_recommendation(
        self, db: Session, req: PriceRecommendationRequest
    ) -> PriceRecommendationResponse:
        """
        Executes hierarchical matching, time-decay weighting, and statistical bounds calculation.
        """
        product_name = req.product_name.strip()
        variety = req.variety.strip() if req.variety else None
        quality = req.quality_grade.strip() if req.quality_grade else None
        district = req.district.strip() if req.district else None
        state = req.state.strip() if req.state else None

        # Fetch all candidate observations for this product within 90 days
        candidates = price_intelligence_service.get_all_normalized_observations(
            db, product_name=product_name, days_back=90
        )

        matched_obs, match_level = self._apply_hierarchical_matching(
            candidates, variety, quality, district, state
        )

        if not matched_obs:
            # Fallback if no matching observations exist at all
            default_ref = Decimal("25.00")
            display_ref = price_intelligence_service.convert_per_kg_to_unit(default_ref, req.price_unit)
            display_min = (display_ref * Decimal("0.85")).quantize(Decimal("0.01"))
            display_target = display_ref
            display_max = (display_ref * Decimal("1.15")).quantize(Decimal("0.01"))

            comp_state, comp_msg = self._compare_expected_price(
                req.expected_price, req.price_unit, default_ref * Decimal("0.85"), default_ref * Decimal("1.15")
            )

            return PriceRecommendationResponse(
                product_name=product_name,
                variety=variety,
                quality_grade=quality,
                reference_price=default_ref,
                recommended_min_price=(default_ref * Decimal("0.85")).quantize(Decimal("0.01")),
                recommended_target_price=default_ref,
                recommended_max_price=(default_ref * Decimal("1.15")).quantize(Decimal("0.01")),
                display_unit=req.price_unit,
                display_reference_price=display_ref,
                display_min_price=display_min,
                display_target_price=display_target,
                display_max_price=display_max,
                trend=PriceTrend.INSUFFICIENT_DATA,
                confidence=ConfidenceLevel.LOW,
                match_level=MatchLevel.INSUFFICIENT_DATA,
                observation_count=0,
                data_sources=[],
                explanation="No historical market observations found for this produce. Displaying baseline fallback guidance.",
                expected_price_comparison=comp_state,
                comparison_message=comp_msg,
                generated_at=datetime.now(timezone.utc),
            )

        # Time-decay weighted reference calculation
        reference_price_per_kg = self._calculate_time_weighted_price(matched_obs)

        # Fair price range & suggested target
        min_per_kg, target_per_kg, max_per_kg = self._calculate_range_and_target(
            matched_obs, reference_price_per_kg
        )

        # Trend & Confidence
        trend = price_intelligence_service.calculate_trend(matched_obs)
        confidence = price_intelligence_service.calculate_confidence(matched_obs, match_level)

        # Convert to display unit
        display_unit = req.price_unit or "PER_KG"
        disp_ref = price_intelligence_service.convert_per_kg_to_unit(reference_price_per_kg, display_unit)
        disp_min = price_intelligence_service.convert_per_kg_to_unit(min_per_kg, display_unit)
        disp_target = price_intelligence_service.convert_per_kg_to_unit(target_per_kg, display_unit)
        disp_max = price_intelligence_service.convert_per_kg_to_unit(max_per_kg, display_unit)

        # Compare expected price
        comp_state, comp_msg = self._compare_expected_price(
            req.expected_price, display_unit, disp_min, disp_max
        )

        # Data sources list
        sources = sorted(list({o.source_name for o in matched_obs}))

        # Generate human-friendly explanation
        explanation = self._generate_explanation(
            product_name, len(matched_obs), match_level, confidence, trend, disp_ref, display_unit
        )

        return PriceRecommendationResponse(
            product_name=product_name,
            variety=variety,
            quality_grade=quality,
            reference_price=reference_price_per_kg,
            recommended_min_price=min_per_kg,
            recommended_target_price=target_per_kg,
            recommended_max_price=max_per_kg,
            display_unit=display_unit,
            display_reference_price=disp_ref,
            display_min_price=disp_min,
            display_target_price=disp_target,
            display_max_price=disp_max,
            trend=trend,
            confidence=confidence,
            match_level=match_level,
            observation_count=len(matched_obs),
            data_sources=sources,
            explanation=explanation,
            expected_price_comparison=comp_state,
            comparison_message=comp_msg,
            generated_at=datetime.now(timezone.utc),
        )

    def _apply_hierarchical_matching(
        self,
        candidates: List[NormalizedObservation],
        variety: Optional[str],
        quality: Optional[str],
        district: Optional[str],
        state: Optional[str],
    ) -> Tuple[List[NormalizedObservation], MatchLevel]:
        """
        Filters candidates using hierarchical fallback:
        1. Product + Variety + Quality + Location
        2. Product + Variety + Quality
        3. Product + Quality
        4. Product only
        """
        if not candidates:
            return [], MatchLevel.INSUFFICIENT_DATA

        # Match 1: Full Exact Match (Variety + Quality + District/State)
        if variety and quality and quality != "UNGRADED":
            m1 = [
                o for o in candidates
                if o.variety and o.variety.lower().strip() == variety.lower().strip()
                and o.quality_grade and o.quality_grade == quality
                and (
                    (district and o.district and o.district.lower().strip() == district.lower().strip())
                    or (state and o.state and o.state.lower().strip() == state.lower().strip())
                )
            ]
            if len(m1) >= 2:
                return m1, MatchLevel.EXACT_FULL

        # Match 2: Variety + Quality
        if variety and quality and quality != "UNGRADED":
            m2 = [
                o for o in candidates
                if o.variety and o.variety.lower().strip() == variety.lower().strip()
                and o.quality_grade and o.quality_grade == quality
            ]
            if len(m2) >= 2:
                return m2, MatchLevel.VARIETY_QUALITY

        # Match 3: Quality Only
        if quality and quality != "UNGRADED":
            m3 = [o for o in candidates if o.quality_grade and o.quality_grade == quality]
            if len(m3) >= 2:
                return m3, MatchLevel.QUALITY_ONLY

        # Match 4: Product Only (Fallback)
        return candidates, MatchLevel.PRODUCT_ONLY

    def _calculate_time_weighted_price(self, observations: List[NormalizedObservation]) -> Decimal:
        """
        Applies recency time-decay weights:
        <= 7 days: weight 1.0
        8-30 days: weight 0.7
        31-90 days: weight 0.4
        """
        today = date.today()
        total_weighted_price = Decimal("0.00")
        total_weight = Decimal("0.00")

        for o in observations:
            age_days = (today - o.observation_date).days
            if age_days <= 7:
                w = Decimal("1.0")
            elif age_days <= 30:
                w = Decimal("0.7")
            else:
                w = Decimal("0.4")

            total_weighted_price += o.price_per_kg * w
            total_weight += w

        if total_weight <= 0:
            prices = [o.price_per_kg for o in observations]
            return sum(prices) / Decimal(len(prices))

        ref = total_weighted_price / total_weight
        return ref.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def _calculate_range_and_target(
        self, observations: List[NormalizedObservation], ref_price: Decimal
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """
        Calculates min range (floor), max range (ceiling), and target price based on reference price & trend.
        """
        prices = [o.price_per_kg for o in observations]
        min_obs = min(prices)
        max_obs = max(prices)

        # Statistical spread bounds (±12%)
        min_price = max(min_obs, (ref_price * Decimal("0.88")).quantize(Decimal("0.01")))
        max_price = min(max_obs, (ref_price * Decimal("1.12")).quantize(Decimal("0.01")))

        if min_price >= max_price:
            min_price = (ref_price * Decimal("0.90")).quantize(Decimal("0.01"))
            max_price = (ref_price * Decimal("1.10")).quantize(Decimal("0.01"))

        target_price = ref_price.quantize(Decimal("0.01"))
        return min_price, target_price, max_price

    def _compare_expected_price(
        self,
        expected_price: Optional[Decimal],
        display_unit: str,
        disp_min: Decimal,
        disp_max: Decimal,
    ) -> Tuple[ExpectedPriceComparisonState, str]:
        """
        Compares farmer's expected price against the fair range.
        """
        if not expected_price or expected_price <= 0:
            return ExpectedPriceComparisonState.NOT_SPECIFIED, "No expected price specified for comparison."

        u_label = display_unit.replace("PER_", "").lower()

        if expected_price < disp_min:
            return (
                ExpectedPriceComparisonState.BELOW,
                f"Your expected price (₹{expected_price}/{u_label}) is below the recent observed range (₹{disp_min}–₹{disp_max}/{u_label}). You may consider raising your target.",
            )
        elif expected_price > disp_max:
            return (
                ExpectedPriceComparisonState.ABOVE,
                f"Your expected price (₹{expected_price}/{u_label}) is above the recent observed range (₹{disp_min}–₹{disp_max}/{u_label}). High pricing might slow down buyer orders.",
            )
        else:
            return (
                ExpectedPriceComparisonState.WITHIN,
                f"Your expected price (₹{expected_price}/{u_label}) is within the recent observed range (₹{disp_min}–₹{disp_max}/{u_label}).",
            )

    def _generate_explanation(
        self,
        product_name: str,
        count: int,
        match_level: MatchLevel,
        confidence: ConfidenceLevel,
        trend: PriceTrend,
        disp_ref: Decimal,
        unit: str,
    ) -> str:
        """
        Generates clear human-readable explanation of recommendation logic.
        """
        u_label = unit.replace("PER_", "").lower()
        match_desc = {
            MatchLevel.EXACT_FULL: "exact product, variety, quality grade, and regional location matches",
            MatchLevel.VARIETY_QUALITY: "product, variety, and quality grade matches",
            MatchLevel.QUALITY_ONLY: "product and quality grade matches",
            MatchLevel.PRODUCT_ONLY: "general product category observations",
            MatchLevel.INSUFFICIENT_DATA: "historical baseline estimates",
        }.get(match_level, "product observations")

        return (
            f"Calculated from {count} recent market observations and transaction records using {match_desc}. "
            f"Price trend is currently {trend.value.lower()} with {confidence.value.lower()} confidence. "
            f"The reference market price is estimated at ₹{disp_ref}/{u_label}."
        )


price_recommendation_service = PriceRecommendationService()
