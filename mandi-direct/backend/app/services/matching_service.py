from datetime import datetime, timezone
from decimal import Decimal
import math
from typing import Any, Dict, List, Optional, Set, Tuple
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.models.address import BuyerAddress
from app.models.buyer_preference import BuyerPreference
from app.models.cart import CartItem, ShoppingCart
from app.models.enums import (
    ConfidenceLevel,
    DemandLevel,
    MatchLevel,
    OrderStatus,
    ProduceStatus,
)
from app.models.farmer import Farm, FarmerProfile
from app.models.order import Order, OrderItem
from app.models.produce import ProduceImage, ProduceListing
from app.models.profile import Profile
from app.repositories.buyer_preference import buyer_preference_repository
from app.schemas.matching import (
    BuyerMatchResult,
    BuyerProductMatchesResponse,
    BuyerSafeInfo,
    FarmerBuyerMatchesResponse,
    FarmerProduceSafeInfo,
    MatchResult,
    MatchSignal,
    ProduceBuyerMatchesResponse,
    ProductMatchResult,
)


# ==============================================================================
# Centralized Configuration & Deterministic Weights (Section 6 & 8)
# ==============================================================================

MATCH_WEIGHTS: Dict[str, float] = {
    "PRODUCT_MATCH": 35.0,
    "CATEGORY_MATCH": 15.0,
    "VARIETY_MATCH": 10.0,
    "QUALITY_MATCH": 10.0,
    "LOCATION_MATCH": 10.0,
    "QUANTITY_COMPATIBILITY": 10.0,
    "PRICE_COMPATIBILITY": 5.0,
    "PURCHASE_HISTORY": 5.0,
}

MATCH_LEVEL_THRESHOLDS: List[Tuple[MatchLevel, float, float]] = [
    (MatchLevel.VERY_HIGH, 80.0, 100.0),
    (MatchLevel.HIGH, 60.0, 79.99),
    (MatchLevel.MODERATE, 40.0, 59.99),
    (MatchLevel.LOW, 20.0, 39.99),
    (MatchLevel.VERY_LOW, 0.0, 19.99),
]


class SmartMatchingService:
    """
    Deterministic, explainable matching engine connecting Farmers with wholesale Buyers.
    Calculates relevance scores (0-100) using real produce, preferences, location,
    and verified purchase transaction history.
    """

    @staticmethod
    def get_match_level(score: float, has_any_signal: bool = True) -> MatchLevel:
        if not has_any_signal and score == 0:
            return MatchLevel.INSUFFICIENT_DATA
        for level, min_val, max_val in MATCH_LEVEL_THRESHOLDS:
            if min_val <= score <= max_val:
                return level
        return MatchLevel.VERY_LOW

    @staticmethod
    def _get_primary_image_url(images: List[ProduceImage]) -> Optional[str]:
        if not images:
            return None
        primary = next((img for img in images if img.is_primary), None)
        if primary:
            return primary.public_url or primary.image_url
        first = images[0]
        return first.public_url or first.image_url

    def build_produce_safe_info(
        self, produce: ProduceListing, demand_level: Optional[str] = None, demand_trend: Optional[str] = None
    ) -> FarmerProduceSafeInfo:
        farm = produce.farm
        farmer_profile = produce.farmer_profile
        profile = farmer_profile.profile if farmer_profile else None
        farmer_name = profile.full_name if profile else "Verified Farmer"
        is_verified = (farmer_profile.verification_status == "VERIFIED") if farmer_profile else False

        return FarmerProduceSafeInfo(
            produce_id=produce.id,
            product_name=produce.product_name,
            category=produce.category,
            variety=produce.variety,
            quality_grade=produce.quality_grade,
            expected_price=float(produce.expected_price),
            price_unit=produce.price_unit,
            available_quantity=float(produce.available_quantity),
            quantity_unit=produce.quantity_unit,
            primary_image_url=self._get_primary_image_url(produce.images or []),
            village=farm.village if farm else None,
            mandal=farm.mandal if farm else None,
            district=farm.district if farm else "",
            state=farm.state if farm else "",
            farmer_id=farmer_profile.id if farmer_profile else "",
            farmer_name=farmer_name,
            is_verified_farmer=is_verified,
            demand_level=demand_level,
            demand_trend=demand_trend,
        )

    def build_buyer_safe_info(
        self,
        buyer_profile: Profile,
        preferences: Optional[BuyerPreference],
        default_address: Optional[BuyerAddress] = None,
        verified_purchases_count: int = 0,
    ) -> BuyerSafeInfo:
        # Safe display name
        display_name = buyer_profile.full_name or "Verified Wholesale Buyer"
        district = None
        state = None

        if preferences and preferences.preferred_districts:
            district = ", ".join(preferences.preferred_districts[:2])
        elif default_address:
            district = default_address.district

        if preferences and preferences.preferred_states:
            state = ", ".join(preferences.preferred_states[:2])
        elif default_address:
            state = default_address.state

        pref_cats = preferences.preferred_categories if preferences else []
        pref_prods = preferences.preferred_products if preferences else []

        return BuyerSafeInfo(
            buyer_id=buyer_profile.id,
            display_name=display_name,
            buyer_type="Wholesale Buyer",
            district=district,
            state=state,
            preferred_categories=pref_cats or [],
            interested_products=pref_prods or [],
            verified_purchases_count=verified_purchases_count,
        )

    # ==========================================================================
    # Scoring Core
    # ==========================================================================

    def calculate_match(
        self,
        db: Session,
        produce: ProduceListing,
        buyer_profile: Profile,
        preferences: Optional[BuyerPreference],
        default_address: Optional[BuyerAddress] = None,
    ) -> MatchResult:
        """
        Calculates deterministic match score out of 100 with matched & unmatched signals.
        """
        now = datetime.now(timezone.utc)
        matched_signals: List[MatchSignal] = []
        unmatched_signals: List[MatchSignal] = []
        confirmed_evidence_count = 0
        score = 0.0

        farm = produce.farm
        prod_name_lower = produce.product_name.lower().strip()
        prod_cat_upper = produce.category.upper().strip()
        farm_district_lower = farm.district.lower().strip() if farm and farm.district else ""
        farm_state_lower = farm.state.lower().strip() if farm and farm.state else ""

        # ----------------------------------------------------------------------
        # 1. PRODUCT MATCH (max 35 pts)
        # ----------------------------------------------------------------------
        max_prod_pts = MATCH_WEIGHTS["PRODUCT_MATCH"]
        pref_products = [p.lower().strip() for p in (preferences.preferred_products or []) if p] if preferences else []

        # Check purchase history for this product name
        past_product_purchases = (
            db.query(OrderItem)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(
                Order.buyer_user_id == buyer_profile.id,
                Order.status == OrderStatus.DELIVERED.value,
                OrderItem.product_name.ilike(f"%{produce.product_name}%"),
            )
            .count()
        )

        if pref_products:
            confirmed_evidence_count += 1
            if any(p in prod_name_lower or prod_name_lower in p for p in pref_products):
                score += max_prod_pts
                matched_signals.append(
                    MatchSignal(
                        signal_type="PRODUCT",
                        signal_name="Product Name Match",
                        matched=True,
                        points_awarded=max_prod_pts,
                        max_points=max_prod_pts,
                        description=f"Listing '{produce.product_name}' matches preferred products.",
                    )
                )
            else:
                unmatched_signals.append(
                    MatchSignal(
                        signal_type="PRODUCT",
                        signal_name="Product Name Not in Preferences",
                        matched=False,
                        points_awarded=0.0,
                        max_points=max_prod_pts,
                        description=f"Listing '{produce.product_name}' is not in buyer's preferred products list.",
                    )
                )
        elif past_product_purchases > 0:
            # Buyer has purchased this specific product before
            confirmed_evidence_count += 1
            awarded = 25.0
            score += awarded
            matched_signals.append(
                MatchSignal(
                    signal_type="PRODUCT",
                    signal_name="Repeated Product Purchase History",
                    matched=True,
                    points_awarded=awarded,
                    max_points=max_prod_pts,
                    description=f"Buyer has previously completed {past_product_purchases} orders for '{produce.product_name}'.",
                )
            )
        else:
            # No product preference specified
            unmatched_signals.append(
                MatchSignal(
                    signal_type="PRODUCT",
                    signal_name="No Product Preference Specified",
                    matched=False,
                    points_awarded=0.0,
                    max_points=max_prod_pts,
                    description="Buyer has not configured specific preferred crop names.",
                )
            )

        # ----------------------------------------------------------------------
        # 2. CATEGORY MATCH (max 15 pts)
        # ----------------------------------------------------------------------
        max_cat_pts = MATCH_WEIGHTS["CATEGORY_MATCH"]
        pref_categories = [c.upper().strip() for c in (preferences.preferred_categories or []) if c] if preferences else []

        if pref_categories:
            confirmed_evidence_count += 1
            if prod_cat_upper in pref_categories:
                score += max_cat_pts
                matched_signals.append(
                    MatchSignal(
                        signal_type="CATEGORY",
                        signal_name="Category Match",
                        matched=True,
                        points_awarded=max_cat_pts,
                        max_points=max_cat_pts,
                        description=f"Category '{produce.category}' matches buyer's procurement category.",
                    )
                )
            else:
                unmatched_signals.append(
                    MatchSignal(
                        signal_type="CATEGORY",
                        signal_name="Category Mismatch",
                        matched=False,
                        points_awarded=0.0,
                        max_points=max_cat_pts,
                        description=f"Listing category '{produce.category}' is not in buyer's preferred categories.",
                    )
                )
        else:
            unmatched_signals.append(
                MatchSignal(
                    signal_type="CATEGORY",
                    signal_name="No Category Preference",
                    matched=False,
                    points_awarded=0.0,
                    max_points=max_cat_pts,
                    description="Buyer has not set specific category preferences.",
                )
            )

        # ----------------------------------------------------------------------
        # 3. VARIETY MATCH (max 10 pts)
        # ----------------------------------------------------------------------
        max_var_pts = MATCH_WEIGHTS["VARIETY_MATCH"]
        pref_varieties = [v.lower().strip() for v in (preferences.preferred_varieties or []) if v] if preferences else []
        prod_variety = produce.variety.lower().strip() if produce.variety else ""

        if pref_varieties:
            confirmed_evidence_count += 1
            if prod_variety and any(v in prod_variety or prod_variety in v for v in pref_varieties):
                score += max_var_pts
                matched_signals.append(
                    MatchSignal(
                        signal_type="VARIETY",
                        signal_name="Variety Match",
                        matched=True,
                        points_awarded=max_var_pts,
                        max_points=max_var_pts,
                        description=f"Produce variety '{produce.variety}' matches buyer's preference.",
                    )
                )
            elif not prod_variety:
                unmatched_signals.append(
                    MatchSignal(
                        signal_type="VARIETY",
                        signal_name="Listing Missing Variety",
                        matched=False,
                        points_awarded=0.0,
                        max_points=max_var_pts,
                        description="Produce lot does not specify variety.",
                    )
                )
            else:
                unmatched_signals.append(
                    MatchSignal(
                        signal_type="VARIETY",
                        signal_name="Variety Mismatch",
                        matched=False,
                        points_awarded=0.0,
                        max_points=max_var_pts,
                        description=f"Variety '{produce.variety}' differs from buyer preferences.",
                    )
                )
        else:
            # Buyer has no variety preference: neutral partial
            awarded = 5.0 if produce.variety else 3.0
            score += awarded
            matched_signals.append(
                MatchSignal(
                    signal_type="VARIETY",
                    signal_name="Neutral Variety Requirement",
                    matched=True,
                    points_awarded=awarded,
                    max_points=max_var_pts,
                    description="Buyer has no variety restrictions.",
                )
            )

        # ----------------------------------------------------------------------
        # 4. QUALITY GRADE MATCH (max 10 pts)
        # ----------------------------------------------------------------------
        max_qual_pts = MATCH_WEIGHTS["QUALITY_MATCH"]
        pref_grades = [g.upper().strip() for g in (preferences.preferred_quality_grades or []) if g] if preferences else []
        prod_grade = produce.quality_grade.upper().strip()

        if pref_grades:
            confirmed_evidence_count += 1
            if prod_grade in pref_grades:
                score += max_qual_pts
                matched_signals.append(
                    MatchSignal(
                        signal_type="QUALITY",
                        signal_name="Quality Grade Match",
                        matched=True,
                        points_awarded=max_qual_pts,
                        max_points=max_qual_pts,
                        description=f"Produce grade '{produce.quality_grade}' matches buyer quality criteria.",
                    )
                )
            else:
                # Lower compatibility for different grade
                awarded = 2.0
                score += awarded
                unmatched_signals.append(
                    MatchSignal(
                        signal_type="QUALITY",
                        signal_name="Quality Grade Different",
                        matched=False,
                        points_awarded=awarded,
                        max_points=max_qual_pts,
                        description=f"Listing grade '{produce.quality_grade}' is not in preferred grades {pref_grades}.",
                    )
                )
        else:
            # Neutral quality requirement
            awarded = 5.0
            score += awarded
            matched_signals.append(
                MatchSignal(
                    signal_type="QUALITY",
                    signal_name="Neutral Quality Requirement",
                    matched=True,
                    points_awarded=awarded,
                    max_points=max_qual_pts,
                    description="Buyer accepts any verified quality grade.",
                )
            )

        # ----------------------------------------------------------------------
        # 5. LOCATION MATCH (max 10 pts)
        # ----------------------------------------------------------------------
        max_loc_pts = MATCH_WEIGHTS["LOCATION_MATCH"]
        buyer_districts = [d.lower().strip() for d in (preferences.preferred_districts or []) if d] if preferences else []
        buyer_states = [s.lower().strip() for s in (preferences.preferred_states or []) if s] if preferences else []

        # Fallback to default address if preferences lacked location
        if not buyer_districts and default_address and default_address.district:
            buyer_districts = [default_address.district.lower().strip()]
        if not buyer_states and default_address and default_address.state:
            buyer_states = [default_address.state.lower().strip()]

        if farm_district_lower and buyer_districts and any(d in farm_district_lower or farm_district_lower in d for d in buyer_districts):
            confirmed_evidence_count += 1
            score += max_loc_pts
            matched_signals.append(
                MatchSignal(
                    signal_type="LOCATION",
                    signal_name="District Match",
                    matched=True,
                    points_awarded=max_loc_pts,
                    max_points=max_loc_pts,
                    description=f"Farm district '{farm.district}' matches buyer preferred location.",
                )
            )
        elif farm_state_lower and buyer_states and any(s in farm_state_lower or farm_state_lower in s for s in buyer_states):
            confirmed_evidence_count += 1
            awarded = 6.0
            score += awarded
            matched_signals.append(
                MatchSignal(
                    signal_type="LOCATION",
                    signal_name="State Match",
                    matched=True,
                    points_awarded=awarded,
                    max_points=max_loc_pts,
                    description=f"Farm state '{farm.state}' matches buyer state, enabling regional transit.",
                )
            )
        elif not buyer_districts and not buyer_states:
            unmatched_signals.append(
                MatchSignal(
                    signal_type="LOCATION",
                    signal_name="No Location Preference",
                    matched=False,
                    points_awarded=0.0,
                    max_points=max_loc_pts,
                    description="Buyer has not specified location or saved default delivery address.",
                )
            )
        else:
            unmatched_signals.append(
                MatchSignal(
                    signal_type="LOCATION",
                    signal_name="Interstate Distance",
                    matched=False,
                    points_awarded=0.0,
                    max_points=max_loc_pts,
                    description=f"Farm is in {farm.district or 'unknown'}, outside buyer's preferred geography.",
                )
            )

        # ----------------------------------------------------------------------
        # 6. QUANTITY COMPATIBILITY (max 10 pts)
        # ----------------------------------------------------------------------
        max_qty_pts = MATCH_WEIGHTS["QUANTITY_COMPATIBILITY"]
        avail_qty = float(produce.available_quantity)
        min_q = float(preferences.minimum_quantity) if (preferences and preferences.minimum_quantity is not None) else None
        max_q = float(preferences.maximum_quantity) if (preferences and preferences.maximum_quantity is not None) else None

        if min_q is not None and max_q is not None:
            confirmed_evidence_count += 1
            if min_q <= avail_qty <= max_q:
                score += max_qty_pts
                matched_signals.append(
                    MatchSignal(
                        signal_type="QUANTITY",
                        signal_name="Quantity Range Fit",
                        matched=True,
                        points_awarded=max_qty_pts,
                        max_points=max_qty_pts,
                        description=f"Available lot ({avail_qty:g} {produce.quantity_unit}) fits buyer preferred range ({min_q:g}–{max_q:g} {produce.quantity_unit}).",
                    )
                )
            elif avail_qty > max_q:
                awarded = 8.0
                score += awarded
                matched_signals.append(
                    MatchSignal(
                        signal_type="QUANTITY",
                        signal_name="Sufficient Inventory",
                        matched=True,
                        points_awarded=awarded,
                        max_points=max_qty_pts,
                        description=f"Listing has {avail_qty:g} {produce.quantity_unit}, exceeding buyer's max request of {max_q:g}.",
                    )
                )
            elif avail_qty >= (0.5 * min_q):
                awarded = 4.0
                score += awarded
                unmatched_signals.append(
                    MatchSignal(
                        signal_type="QUANTITY",
                        signal_name="Partial Lot Size",
                        matched=False,
                        points_awarded=awarded,
                        max_points=max_qty_pts,
                        description=f"Available {avail_qty:g} {produce.quantity_unit} is below buyer's minimum {min_q:g} {produce.quantity_unit}.",
                    )
                )
            else:
                unmatched_signals.append(
                    MatchSignal(
                        signal_type="QUANTITY",
                        signal_name="Quantity Too Small",
                        matched=False,
                        points_awarded=1.0,
                        max_points=max_qty_pts,
                        description=f"Lot size {avail_qty:g} is far below buyer minimum threshold {min_q:g}.",
                    )
                )
        elif min_q is not None:
            confirmed_evidence_count += 1
            if avail_qty >= min_q:
                score += max_qty_pts
                matched_signals.append(
                    MatchSignal(
                        signal_type="QUANTITY",
                        signal_name="Meets Minimum Order",
                        matched=True,
                        points_awarded=max_qty_pts,
                        max_points=max_qty_pts,
                        description=f"Lot quantity {avail_qty:g} meets buyer's minimum {min_q:g}.",
                    )
                )
            else:
                score += 3.0
                unmatched_signals.append(
                    MatchSignal(
                        signal_type="QUANTITY",
                        signal_name="Below Minimum Order",
                        matched=False,
                        points_awarded=3.0,
                        max_points=max_qty_pts,
                        description=f"Lot size {avail_qty:g} is less than buyer's minimum {min_q:g}.",
                    )
                )
        else:
            awarded = 5.0
            score += awarded
            matched_signals.append(
                MatchSignal(
                    signal_type="QUANTITY",
                    signal_name="Neutral Quantity",
                    matched=True,
                    points_awarded=awarded,
                    max_points=max_qty_pts,
                    description="Buyer has no fixed order volume constraint.",
                )
            )

        # ----------------------------------------------------------------------
        # 7. PRICE COMPATIBILITY (max 5 pts)
        # ----------------------------------------------------------------------
        max_prc_pts = MATCH_WEIGHTS["PRICE_COMPATIBILITY"]
        unit_price = float(produce.expected_price)
        min_p = float(preferences.minimum_price) if (preferences and preferences.minimum_price is not None) else None
        max_p = float(preferences.maximum_price) if (preferences and preferences.maximum_price is not None) else None

        if min_p is not None and max_p is not None:
            confirmed_evidence_count += 1
            if min_p <= unit_price <= max_p:
                score += max_prc_pts
                matched_signals.append(
                    MatchSignal(
                        signal_type="PRICE",
                        signal_name="Budget Target Fit",
                        matched=True,
                        points_awarded=max_prc_pts,
                        max_points=max_prc_pts,
                        description=f"Farmer price ₹{unit_price:g} is within buyer target range (₹{min_p:g}–₹{max_p:g}).",
                    )
                )
            elif unit_price <= (1.15 * max_p) and unit_price >= (0.85 * min_p):
                awarded = 3.0
                score += awarded
                matched_signals.append(
                    MatchSignal(
                        signal_type="PRICE",
                        signal_name="Near Budget Range",
                        matched=True,
                        points_awarded=awarded,
                        max_points=max_prc_pts,
                        description=f"Price ₹{unit_price:g} is within 15% of buyer budget.",
                    )
                )
            else:
                unmatched_signals.append(
                    MatchSignal(
                        signal_type="PRICE",
                        signal_name="Outside Budget Target",
                        matched=False,
                        points_awarded=0.0,
                        max_points=max_prc_pts,
                        description=f"Price ₹{unit_price:g} is outside buyer's preferred price range.",
                    )
                )
        elif max_p is not None:
            confirmed_evidence_count += 1
            if unit_price <= max_p:
                score += max_prc_pts
                matched_signals.append(
                    MatchSignal(
                        signal_type="PRICE",
                        signal_name="Below Max Budget",
                        matched=True,
                        points_awarded=max_prc_pts,
                        max_points=max_prc_pts,
                        description=f"Price ₹{unit_price:g} is at or below buyer ceiling ₹{max_p:g}.",
                    )
                )
            elif unit_price <= (1.15 * max_p):
                awarded = 2.5
                score += awarded
                matched_signals.append(
                    MatchSignal(
                        signal_type="PRICE",
                        signal_name="Slightly Above Ceiling",
                        matched=True,
                        points_awarded=awarded,
                        max_points=max_prc_pts,
                        description=f"Price ₹{unit_price:g} is close to buyer ceiling ₹{max_p:g}.",
                    )
                )
            else:
                unmatched_signals.append(
                    MatchSignal(
                        signal_type="PRICE",
                        signal_name="Above Max Budget",
                        matched=False,
                        points_awarded=0.0,
                        max_points=max_prc_pts,
                        description=f"Price ₹{unit_price:g} exceeds buyer ceiling ₹{max_p:g}.",
                    )
                )
        else:
            awarded = 3.0
            score += awarded
            matched_signals.append(
                MatchSignal(
                    signal_type="PRICE",
                    signal_name="Neutral Price Filter",
                    matched=True,
                    points_awarded=awarded,
                    max_points=max_prc_pts,
                    description="Buyer has not specified a strict target procurement budget.",
                )
            )

        # ----------------------------------------------------------------------
        # 8. PURCHASE HISTORY / ACTIVE CART INTEREST (max 5 pts)
        # ----------------------------------------------------------------------
        max_hist_pts = MATCH_WEIGHTS["PURCHASE_HISTORY"]
        in_cart = (
            db.query(CartItem)
            .join(ShoppingCart, CartItem.cart_id == ShoppingCart.id)
            .filter(
                ShoppingCart.buyer_user_id == buyer_profile.id,
                CartItem.produce_listing_id == produce.id,
            )
            .first()
            is not None
        )

        if past_product_purchases >= 2:
            confirmed_evidence_count += 1
            score += max_hist_pts
            matched_signals.append(
                MatchSignal(
                    signal_type="PURCHASE_HISTORY",
                    signal_name="Repeat Purchase History",
                    matched=True,
                    points_awarded=max_hist_pts,
                    max_points=max_hist_pts,
                    description=f"Buyer has {past_product_purchases} completed delivered orders of '{produce.product_name}'.",
                )
            )
        elif past_product_purchases == 1:
            confirmed_evidence_count += 1
            awarded = 3.5
            score += awarded
            matched_signals.append(
                MatchSignal(
                    signal_type="PURCHASE_HISTORY",
                    signal_name="Previous Purchase History",
                    matched=True,
                    points_awarded=awarded,
                    max_points=max_hist_pts,
                    description=f"Buyer previously completed an order for '{produce.product_name}'.",
                )
            )
        elif in_cart:
            confirmed_evidence_count += 1
            awarded = 2.5
            score += awarded
            matched_signals.append(
                MatchSignal(
                    signal_type="PURCHASE_HISTORY",
                    signal_name="Current Cart Item",
                    matched=True,
                    points_awarded=awarded,
                    max_points=max_hist_pts,
                    description="Buyer currently has this produce in their active checkout cart.",
                )
            )
        else:
            unmatched_signals.append(
                MatchSignal(
                    signal_type="PURCHASE_HISTORY",
                    signal_name="No Prior Purchase History",
                    matched=False,
                    points_awarded=0.0,
                    max_points=max_hist_pts,
                    description=f"Buyer has not previously ordered '{produce.product_name}'.",
                )
            )

        # ----------------------------------------------------------------------
        # Final Score, Match Level, Confidence, & Factual Explanation
        # ----------------------------------------------------------------------
        final_score = round(min(100.0, max(0.0, score)), 1)
        has_any_signal = confirmed_evidence_count > 0 or preferences is not None
        match_level = self.get_match_level(final_score, has_any_signal=has_any_signal)

        # Confidence: strictly based on count of active verified evidence
        if confirmed_evidence_count >= 4:
            confidence = ConfidenceLevel.HIGH
        elif confirmed_evidence_count >= 2:
            confidence = ConfidenceLevel.MEDIUM
        else:
            confidence = ConfidenceLevel.LOW

        explanation = self._build_explanation(
            match_level=match_level,
            produce_name=produce.product_name,
            matched_signals=matched_signals,
            unmatched_signals=unmatched_signals,
        )

        return MatchResult(
            match_score=final_score,
            match_level=match_level,
            confidence=confidence,
            explanation=explanation,
            matched_signals=matched_signals,
            unmatched_signals=unmatched_signals,
            generated_at=now,
        )

    def _build_explanation(
        self,
        match_level: MatchLevel,
        produce_name: str,
        matched_signals: List[MatchSignal],
        unmatched_signals: List[MatchSignal],
    ) -> str:
        """
        Synthesizes human-understandable explanation from actual signals.
        Never uses fake AI claims or guaranteed sales predictions.
        """
        positives = [s.description for s in matched_signals if s.points_awarded > 0 and not s.signal_name.startswith("Neutral")]
        negatives = [s.description for s in unmatched_signals if not s.signal_name.startswith("No ")]

        level_str = match_level.value.replace("_", " ").title()

        if match_level in [MatchLevel.HIGH, MatchLevel.VERY_HIGH]:
            parts = [f"{level_str} match."]
            if positives:
                parts.append("Key reasons: " + "; ".join(positives[:3]) + ".")
            return " ".join(parts)
        elif match_level == MatchLevel.MODERATE:
            parts = [f"Moderate match."]
            if positives:
                parts.append("Positive factors: " + "; ".join(positives[:2]) + ".")
            if negatives:
                parts.append("Limitations: " + "; ".join(negatives[:2]) + ".")
            return " ".join(parts)
        else:
            parts = [f"{level_str} match for {produce_name}."]
            if negatives:
                parts.append("Mismatched criteria: " + "; ".join(negatives[:2]) + ".")
            elif positives:
                parts.append("Partial criteria: " + "; ".join(positives[:1]) + ".")
            else:
                parts.append("Buyer criteria and listing attributes differ.")
            return " ".join(parts)

    # ==========================================================================
    # Farmer Matching Queries (Farmer -> Buyers)
    # ==========================================================================

    def get_farmer_buyer_matches(
        self,
        db: Session,
        farmer_profile_id: str,
        produce_id: Optional[str] = None,
        district: Optional[str] = None,
        state: Optional[str] = None,
        min_score: Optional[float] = None,
        match_level: Optional[str] = None,
        sort: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> FarmerBuyerMatchesResponse:
        """
        Find best matching buyers for farmer's active eligible produce.
        """
        now = datetime.now(timezone.utc)
        page_size = min(100, max(1, page_size))
        page = max(1, page)

        # 1. Fetch farmer's eligible produce
        produce_query = (
            db.query(ProduceListing)
            .options(
                joinedload(ProduceListing.farm),
                joinedload(ProduceListing.images),
                joinedload(ProduceListing.farmer_profile).joinedload(FarmerProfile.profile),
            )
            .filter(
                ProduceListing.farmer_profile_id == farmer_profile_id,
                ProduceListing.status.in_([ProduceStatus.LISTED.value, ProduceStatus.APPROVED.value]),
                ProduceListing.available_quantity > 0,
                or_(
                    ProduceListing.available_until.is_(None),
                    ProduceListing.available_until >= func.current_date(),
                ),
            )
        )
        if produce_id:
            produce_query = produce_query.filter(ProduceListing.id == produce_id)

        farmer_produce_list = produce_query.all()
        if not farmer_produce_list:
            return FarmerBuyerMatchesResponse(
                items=[], total=0, page=page, page_size=page_size, total_pages=0, high_match_count=0, generated_at=now
            )

        # 2. Fetch candidate buyers (active buyers with preferences or recent orders)
        active_prefs = buyer_preference_repository.get_all_active_buyers_with_preferences(db)
        buyers_without_prefs = buyer_preference_repository.get_active_buyers_without_preferences(db, limit=30)

        # Build map of buyer default addresses
        buyer_ids = [p.buyer_user_id for p in active_prefs] + [u.id for u in buyers_without_prefs]
        default_addresses = {
            addr.buyer_user_id: addr
            for addr in db.query(BuyerAddress).filter(
                BuyerAddress.buyer_user_id.in_(buyer_ids), BuyerAddress.is_default == True
            ).all()
        }

        # Build candidate pairs and score them
        candidates: List[BuyerMatchResult] = []
        high_count = 0

        for prod in farmer_produce_list:
            prod_safe = self.build_produce_safe_info(prod)

            # Score against buyers with preferences
            for pref in active_prefs:
                buyer_user = pref.buyer
                if not buyer_user or buyer_user.status != "ACTIVE":
                    continue
                addr = default_addresses.get(pref.buyer_user_id)
                match_res = self.calculate_match(db, prod, buyer_user, pref, addr)

                # Filter by min_score or match_level if requested
                if min_score is not None and match_res.match_score < min_score:
                    continue
                if match_level and match_res.match_level.value != match_level.upper():
                    continue

                if district and pref.preferred_districts:
                    if not any(district.lower() in d.lower() for d in pref.preferred_districts):
                        continue
                if state and pref.preferred_states:
                    if not any(state.lower() in s.lower() for s in pref.preferred_states):
                        continue

                if match_res.match_level in [MatchLevel.HIGH, MatchLevel.VERY_HIGH]:
                    high_count += 1

                buyer_safe = self.build_buyer_safe_info(buyer_user, pref, addr)
                candidates.append(
                    BuyerMatchResult(
                        buyer=buyer_safe,
                        produce=prod_safe,
                        match=match_res,
                    )
                )

            # Score against buyers without preferences (fallback)
            for buyer_user in buyers_without_prefs:
                addr = default_addresses.get(buyer_user.id)
                match_res = self.calculate_match(db, prod, buyer_user, None, addr)

                if min_score is not None and match_res.match_score < min_score:
                    continue
                if match_level and match_res.match_level.value != match_level.upper():
                    continue

                if match_res.match_level in [MatchLevel.HIGH, MatchLevel.VERY_HIGH]:
                    high_count += 1

                buyer_safe = self.build_buyer_safe_info(buyer_user, None, addr)
                candidates.append(
                    BuyerMatchResult(
                        buyer=buyer_safe,
                        produce=prod_safe,
                        match=match_res,
                    )
                )

        # 3. Sort candidates
        sort_key = (sort or "highest_match").lower().strip()
        if sort_key == "product":
            candidates.sort(key=lambda x: x.produce.product_name)
        elif sort_key == "location":
            candidates.sort(key=lambda x: x.buyer.district or "")
        else:
            # Default: highest match score descending
            candidates.sort(key=lambda x: x.match.match_score, reverse=True)

        total = len(candidates)
        total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 0
        offset = (page - 1) * page_size
        items = candidates[offset : offset + page_size]

        return FarmerBuyerMatchesResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            high_match_count=high_count,
            generated_at=now,
        )

    def get_produce_buyer_matches(
        self,
        db: Session,
        produce_id: str,
        farmer_profile_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> ProduceBuyerMatchesResponse:
        """
        Specific match results for a single farmer produce lot.
        Verifies ownership and produce eligibility.
        """
        now = datetime.now(timezone.utc)
        produce = (
            db.query(ProduceListing)
            .options(
                joinedload(ProduceListing.farm),
                joinedload(ProduceListing.images),
                joinedload(ProduceListing.farmer_profile).joinedload(FarmerProfile.profile),
            )
            .filter(
                ProduceListing.id == produce_id,
                ProduceListing.farmer_profile_id == farmer_profile_id,
            )
            .first()
        )
        if not produce:
            raise ValueError("Produce listing not found or unauthorized.")

        res = self.get_farmer_buyer_matches(
            db,
            farmer_profile_id=farmer_profile_id,
            produce_id=produce_id,
            page=page,
            page_size=page_size,
        )

        prod_safe = self.build_produce_safe_info(produce)
        return ProduceBuyerMatchesResponse(
            produce=prod_safe,
            items=res.items,
            total=res.total,
            page=res.page,
            page_size=res.page_size,
            total_pages=res.total_pages,
            high_match_count=res.high_match_count,
            generated_at=now,
        )

    # ==========================================================================
    # Buyer Matching Queries (Buyer -> Products)
    # ==========================================================================

    def get_buyer_product_matches(
        self,
        db: Session,
        buyer_user_id: str,
        category: Optional[str] = None,
        product_name: Optional[str] = None,
        variety: Optional[str] = None,
        quality_grade: Optional[str] = None,
        district: Optional[str] = None,
        state: Optional[str] = None,
        min_score: Optional[float] = None,
        match_level: Optional[str] = None,
        sort: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> BuyerProductMatchesResponse:
        """
        Return farmer produce listings matched to the authenticated buyer's preferences.
        Strictly enforces marketplace visibility (LISTED, available_qty > 0, unexpired).
        """
        now = datetime.now(timezone.utc)
        page_size = min(100, max(1, page_size))
        page = max(1, page)

        buyer_user = db.query(Profile).filter(Profile.id == buyer_user_id).first()
        if not buyer_user:
            raise ValueError("Buyer profile not found.")

        preferences = buyer_preference_repository.get_by_buyer_id(db, buyer_user_id)
        default_address = (
            db.query(BuyerAddress)
            .filter(BuyerAddress.buyer_user_id == buyer_user_id, BuyerAddress.is_default == True)
            .first()
        )

        # Query eligible marketplace produce
        produce_query = (
            db.query(ProduceListing)
            .join(Farm, ProduceListing.farm_id == Farm.id)
            .options(
                joinedload(ProduceListing.farm),
                joinedload(ProduceListing.images),
                joinedload(ProduceListing.farmer_profile).joinedload(FarmerProfile.profile),
            )
            .filter(
                ProduceListing.status == ProduceStatus.LISTED.value,
                ProduceListing.available_quantity > 0,
                or_(
                    ProduceListing.available_until.is_(None),
                    ProduceListing.available_until >= func.current_date(),
                ),
            )
        )

        # Apply basic DB pre-filters if provided by query
        if category and category.upper() != "ALL":
            produce_query = produce_query.filter(ProduceListing.category == category.upper())
        if product_name and product_name.strip():
            produce_query = produce_query.filter(ProduceListing.product_name.ilike(f"%{product_name.strip()}%"))
        if quality_grade and quality_grade.upper() != "ALL":
            produce_query = produce_query.filter(ProduceListing.quality_grade == quality_grade.upper())
        if district and district.strip():
            produce_query = produce_query.filter(Farm.district.ilike(f"%{district.strip()}%"))
        if state and state.strip():
            produce_query = produce_query.filter(Farm.state.ilike(f"%{state.strip()}%"))

        candidate_produce = produce_query.all()
        scored_items: List[ProductMatchResult] = []

        for prod in candidate_produce:
            match_res = self.calculate_match(db, prod, buyer_user, preferences, default_address)

            if min_score is not None and match_res.match_score < min_score:
                continue
            if match_level and match_res.match_level.value != match_level.upper():
                continue
            if variety and prod.variety:
                if variety.lower() not in prod.variety.lower():
                    continue

            prod_safe = self.build_produce_safe_info(prod)
            scored_items.append(
                ProductMatchResult(
                    produce=prod_safe,
                    match=match_res,
                )
            )

        # Sort results
        sort_key = (sort or "highest_match").lower().strip()
        if sort_key == "newest":
            scored_items.sort(key=lambda x: x.produce.produce_id, reverse=True)
        elif sort_key == "price_asc":
            scored_items.sort(key=lambda x: x.produce.expected_price)
        elif sort_key == "price_desc":
            scored_items.sort(key=lambda x: x.produce.expected_price, reverse=True)
        elif sort_key == "quantity_desc":
            scored_items.sort(key=lambda x: x.produce.available_quantity, reverse=True)
        else:
            # Default: highest match score descending
            scored_items.sort(key=lambda x: x.match.match_score, reverse=True)

        total = len(scored_items)
        total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 0
        offset = (page - 1) * page_size
        items = scored_items[offset : offset + page_size]

        return BuyerProductMatchesResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            generated_at=now,
        )

    def get_single_product_match_for_buyer(
        self,
        db: Session,
        buyer_user_id: str,
        produce_id: str,
    ) -> ProductMatchResult:
        """Match result between authenticated buyer and a specific produce listing."""
        buyer_user = db.query(Profile).filter(Profile.id == buyer_user_id).first()
        if not buyer_user:
            raise ValueError("Buyer profile not found.")

        produce = (
            db.query(ProduceListing)
            .options(
                joinedload(ProduceListing.farm),
                joinedload(ProduceListing.images),
                joinedload(ProduceListing.farmer_profile).joinedload(FarmerProfile.profile),
            )
            .filter(
                ProduceListing.id == produce_id,
                ProduceListing.status == ProduceStatus.LISTED.value,
                ProduceListing.available_quantity > 0,
            )
            .first()
        )
        if not produce:
            raise ValueError("Produce listing not found or not available in marketplace.")

        preferences = buyer_preference_repository.get_by_buyer_id(db, buyer_user_id)
        default_address = (
            db.query(BuyerAddress)
            .filter(BuyerAddress.buyer_user_id == buyer_user_id, BuyerAddress.is_default == True)
            .first()
        )

        match_res = self.calculate_match(db, produce, buyer_user, preferences, default_address)
        prod_safe = self.build_produce_safe_info(produce)
        return ProductMatchResult(produce=prod_safe, match=match_res)


smart_matching_service = SmartMatchingService()
