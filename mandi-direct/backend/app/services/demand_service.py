from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import (
    ConfidenceLevel,
    DemandLevel,
    DemandTrend,
    OrderStatus,
    ProduceStatus,
    SupplyDemandStatus,
)
from app.models.order import Order, OrderItem
from app.models.produce import ProduceListing
from app.schemas.demand import (
    DemandHistoryPoint,
    DemandHistoryResponse,
    DemandRecommendationItem,
    DemandRecommendationsResponse,
    DemandSummaryResponse,
    PriceDemandCombinedInsight,
    ProductDemandResponse,
    RegionalDemandItem,
    RegionalDemandResponse,
)
from app.services.price_intelligence import price_intelligence_service


class StatisticalDemandAnalysis:
    """
    Statistical Demand Analysis engine for Mandi Direct.
    Uses real order transactions, active listings, and location metrics
    to compute deterministic demand scores, trends, and supply-demand ratios.
    """

    @staticmethod
    def calculate_growth_percentage(current: float, previous: float) -> Optional[float]:
        if previous <= 0:
            return 100.0 if current > 0 else None
        return round(((current - previous) / previous) * 100.0, 2)

    @staticmethod
    def compute_demand_score(
        order_count: int,
        quantity_sold: float,
        unique_buyers: int,
        sales_velocity: float,
        growth_pct: Optional[float],
        available_supply: float,
        period_days: int,
    ) -> int:
        if order_count == 0 and quantity_sold == 0:
            return 0

        # Sub-score 1: Volume & Velocity (30%)
        target_orders = max(1.0, period_days * 0.3)
        vol_score = min(100.0, (order_count / target_orders) * 50.0 + min(50.0, sales_velocity * 2.0))

        # Sub-score 2: Buyer Diversity (25%)
        buyer_score = min(100.0, unique_buyers * 20.0)

        # Sub-score 3: Growth (25%)
        if growth_pct is None:
            growth_score = 50.0
        else:
            growth_score = max(0.0, min(100.0, 50.0 + growth_pct * 0.5))

        # Sub-score 4: Supply Pressure (20%)
        if available_supply <= 0:
            supply_score = 100.0 if quantity_sold > 0 else 50.0
        else:
            ratio = quantity_sold / available_supply
            supply_score = min(100.0, ratio * 50.0)

        final_score = (
            0.30 * vol_score + 0.25 * buyer_score + 0.25 * growth_score + 0.20 * supply_score
        )
        return int(max(0, min(100, round(final_score))))

    @staticmethod
    def map_demand_level(score: int, order_count: int) -> DemandLevel:
        if order_count == 0 or score == 0:
            return DemandLevel.INSUFFICIENT_DATA
        if score <= 20:
            return DemandLevel.VERY_LOW
        if score <= 40:
            return DemandLevel.LOW
        if score <= 60:
            return DemandLevel.MODERATE
        if score <= 80:
            return DemandLevel.HIGH
        return DemandLevel.VERY_HIGH

    @staticmethod
    def map_demand_trend(growth_pct: Optional[float], order_count: int) -> DemandTrend:
        if order_count == 0 or growth_pct is None:
            return DemandTrend.INSUFFICIENT_DATA
        if growth_pct > 5.0:
            return DemandTrend.RISING
        if growth_pct < -5.0:
            return DemandTrend.FALLING
        return DemandTrend.STABLE

    @staticmethod
    def map_supply_demand_status(
        quantity_sold: float, available_supply: float, order_count: int
    ) -> SupplyDemandStatus:
        if order_count == 0 and available_supply == 0:
            return SupplyDemandStatus.INSUFFICIENT_DATA
        if available_supply == 0 and quantity_sold > 0:
            return SupplyDemandStatus.SUPPLY_SHORTAGE
        if order_count == 0:
            return SupplyDemandStatus.LOW_DEMAND
        ratio = quantity_sold / max(1.0, available_supply)
        if ratio >= 1.5:
            return SupplyDemandStatus.HIGH_DEMAND
        if ratio <= 0.4:
            return SupplyDemandStatus.LOW_DEMAND
        return SupplyDemandStatus.BALANCED

    @staticmethod
    def map_confidence(order_count: int, unique_buyers: int) -> ConfidenceLevel:
        if order_count >= 10 and unique_buyers >= 5:
            return ConfidenceLevel.HIGH
        if order_count >= 3 and unique_buyers >= 2:
            return ConfidenceLevel.MEDIUM
        return ConfidenceLevel.LOW

    @staticmethod
    def generate_explanation(
        product_name: str,
        demand_level: DemandLevel,
        demand_trend: DemandTrend,
        growth_pct: Optional[float],
        supply_status: SupplyDemandStatus,
        order_count: int,
    ) -> str:
        if order_count == 0 or demand_level == DemandLevel.INSUFFICIENT_DATA:
            return f"Not enough recent marketplace activity for {product_name} to generate a strong demand signal."

        parts = []
        if supply_status == SupplyDemandStatus.SUPPLY_SHORTAGE:
            parts.append("High buyer demand relative to zero active marketplace supply.")
        elif supply_status == SupplyDemandStatus.HIGH_DEMAND:
            parts.append("Demand appears strong relative to currently listed supply.")
        elif supply_status == SupplyDemandStatus.LOW_DEMAND:
            parts.append("Current listed supply is high relative to recent demand.")
        else:
            parts.append("Marketplace supply and demand are currently balanced.")

        if demand_trend == DemandTrend.RISING and growth_pct:
            parts.append(f"Recent order volume grew by approximately {abs(growth_pct):.1f}% over the period.")
        elif demand_trend == DemandTrend.FALLING and growth_pct:
            parts.append(f"Recent order volume decreased by approximately {abs(growth_pct):.1f}% over the period.")
        elif demand_trend == DemandTrend.STABLE:
            parts.append("Order volume remains steady.")

        return " ".join(parts)


class DemandIntelligenceService:
    def __init__(self, db: Session):
        self.db = db

    def _resolve_farmer_profile_id(self, farmer_id: Optional[str]) -> Optional[str]:
        if not farmer_id:
            return None
        from app.models.farmer import FarmerProfile
        from sqlalchemy import or_
        fp = self.db.execute(
            select(FarmerProfile.id).where(
                or_(FarmerProfile.id == farmer_id, FarmerProfile.profile_id == farmer_id)
            )
        ).scalar_one_or_none()
        return fp or farmer_id

    def _get_valid_order_ids_query(self, start_date: datetime, end_date: Optional[datetime] = None):
        stmt = select(Order.id).where(
            Order.status.not_in([OrderStatus.CANCELLED.value, OrderStatus.REJECTED.value]),
            Order.created_at >= start_date,
        )
        if end_date:
            stmt = stmt.where(Order.created_at < end_date)
        return stmt

    def get_product_demand(
        self, product_name: str, period_days: int = 30, farmer_profile_id: Optional[str] = None
    ) -> ProductDemandResponse:
        resolved_farmer_id = self._resolve_farmer_profile_id(farmer_profile_id)
        now = datetime.now(timezone.utc)
        current_start = now - timedelta(days=period_days)
        previous_start = current_start - timedelta(days=period_days)

        valid_order_ids_subq = self._get_valid_order_ids_query(current_start).scalar_subquery()

        # Current period metrics
        curr_stmt = (
            select(
                func.count(func.distinct(OrderItem.order_id)).label("order_count"),
                func.coalesce(func.sum(OrderItem.quantity), 0.0).label("quantity_sold"),
                func.count(func.distinct(Order.buyer_user_id)).label("unique_buyers"),
                func.max(OrderItem.quantity_unit).label("unit"),
            )
            .join(Order, OrderItem.order_id == Order.id)
            .where(
                OrderItem.order_id.in_(valid_order_ids_subq),
                func.lower(OrderItem.product_name) == product_name.lower(),
            )
        )
        if resolved_farmer_id:
            curr_stmt = curr_stmt.where(OrderItem.farmer_profile_id == resolved_farmer_id)

        curr_res = self.db.execute(curr_stmt).first()
        order_count = curr_res.order_count if curr_res else 0
        quantity_sold = float(curr_res.quantity_sold) if curr_res and curr_res.quantity_sold else 0.0
        unique_buyers = curr_res.unique_buyers if curr_res else 0
        unit = curr_res.unit if curr_res and curr_res.unit else "KG"

        # Previous period metrics
        prev_order_ids_subq = self._get_valid_order_ids_query(previous_start, current_start).scalar_subquery()
        prev_stmt = (
            select(func.coalesce(func.sum(OrderItem.quantity), 0.0).label("quantity_sold"))
            .join(Order, OrderItem.order_id == Order.id)
            .where(
                OrderItem.order_id.in_(prev_order_ids_subq),
                func.lower(OrderItem.product_name) == product_name.lower(),
            )
        )
        if resolved_farmer_id:
            prev_stmt = prev_stmt.where(OrderItem.farmer_profile_id == resolved_farmer_id)
        prev_res = self.db.execute(prev_stmt).first()
        prev_qty = float(prev_res.quantity_sold) if prev_res and prev_res.quantity_sold else 0.0

        # Available supply
        supply_stmt = select(
            func.coalesce(func.sum(ProduceListing.available_quantity), 0.0).label("supply"),
            func.max(ProduceListing.category).label("category"),
        ).where(
            func.lower(ProduceListing.product_name) == product_name.lower(),
            ProduceListing.status.in_([ProduceStatus.APPROVED.value, ProduceStatus.LISTED.value, ProduceStatus.PARTIALLY_SOLD.value]),
        )
        supply_res = self.db.execute(supply_stmt).first()
        available_supply = float(supply_res.supply) if supply_res and supply_res.supply else 0.0
        category = supply_res.category if supply_res and supply_res.category else "VEGETABLE"

        sales_velocity = round(quantity_sold / float(period_days), 2)
        growth_pct = StatisticalDemandAnalysis.calculate_growth_percentage(quantity_sold, prev_qty)
        demand_score = StatisticalDemandAnalysis.compute_demand_score(
            order_count=order_count,
            quantity_sold=quantity_sold,
            unique_buyers=unique_buyers,
            sales_velocity=sales_velocity,
            growth_pct=growth_pct,
            available_supply=available_supply,
            period_days=period_days,
        )
        demand_level = StatisticalDemandAnalysis.map_demand_level(demand_score, order_count)
        trend = StatisticalDemandAnalysis.map_demand_trend(growth_pct, order_count)
        supply_status = StatisticalDemandAnalysis.map_supply_demand_status(quantity_sold, available_supply, order_count)
        confidence = StatisticalDemandAnalysis.map_confidence(order_count, unique_buyers)
        explanation = StatisticalDemandAnalysis.generate_explanation(
            product_name, demand_level, trend, growth_pct, supply_status, order_count
        )

        scope = "Farmer produce activity" if farmer_profile_id else "Global marketplace orders"

        return ProductDemandResponse(
            product_name=product_name,
            category=category,
            demand_score=demand_score,
            demand_level=demand_level,
            trend=trend,
            recent_quantity_sold=quantity_sold,
            quantity_unit=unit,
            order_count=order_count,
            unique_buyers=unique_buyers,
            sales_velocity_per_day=sales_velocity,
            demand_growth_percentage=growth_pct,
            available_supply=available_supply,
            supply_demand_status=supply_status,
            confidence=confidence,
            explanation=explanation,
            matching_scope=scope,
            period_days=period_days,
            generated_at=now,
        )

    def get_demand_summary(
        self, period_days: int = 30, limit: int = 10, farmer_profile_id: Optional[str] = None
    ) -> DemandSummaryResponse:
        resolved_farmer_id = self._resolve_farmer_profile_id(farmer_profile_id)
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=period_days)
        valid_order_ids_subq = self._get_valid_order_ids_query(start_date).scalar_subquery()

        # Aggregated totals
        tot_stmt = select(
            func.count(func.distinct(OrderItem.order_id)).label("total_orders"),
            func.coalesce(func.sum(OrderItem.quantity), 0.0).label("total_qty"),
            func.count(func.distinct(Order.buyer_user_id)).label("total_buyers"),
        ).join(Order, OrderItem.order_id == Order.id).where(OrderItem.order_id.in_(valid_order_ids_subq))
        if resolved_farmer_id:
            tot_stmt = tot_stmt.where(OrderItem.farmer_profile_id == resolved_farmer_id)

        tot_res = self.db.execute(tot_stmt).first()
        total_orders = tot_res.total_orders if tot_res else 0
        total_qty = float(tot_res.total_qty) if tot_res and tot_res.total_qty else 0.0
        total_buyers = tot_res.total_buyers if tot_res else 0

        # Top product names
        prod_stmt = (
            select(OrderItem.product_name, func.count(func.distinct(OrderItem.order_id)).label("cnt"))
            .join(Order, OrderItem.order_id == Order.id)
            .where(OrderItem.order_id.in_(valid_order_ids_subq))
            .group_by(OrderItem.product_name)
            .order_by(func.count(func.distinct(OrderItem.order_id)).desc())
            .limit(limit)
        )
        if resolved_farmer_id:
            prod_stmt = prod_stmt.where(OrderItem.farmer_profile_id == resolved_farmer_id)

        top_names = [r.product_name for r in self.db.execute(prod_stmt).all()]

        top_products: List[ProductDemandResponse] = []
        for p_name in top_names:
            top_products.append(self.get_product_demand(p_name, period_days, farmer_profile_id))

        return DemandSummaryResponse(
            period_days=period_days,
            total_orders=total_orders,
            total_quantity_sold=total_qty,
            total_unique_buyers=total_buyers,
            top_demanded_products=top_products,
            generated_at=now,
        )

    def get_demand_history(
        self, product_name: Optional[str] = None, period_days: int = 30, farmer_profile_id: Optional[str] = None
    ) -> DemandHistoryResponse:
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=period_days)
        valid_order_ids_subq = self._get_valid_order_ids_query(start_date).scalar_subquery()

        stmt = (
            select(
                func.date(Order.created_at).label("obs_date"),
                func.count(func.distinct(OrderItem.order_id)).label("order_count"),
                func.coalesce(func.sum(OrderItem.quantity), 0.0).label("quantity_sold"),
                func.count(func.distinct(Order.buyer_user_id)).label("unique_buyers"),
            )
            .join(Order, OrderItem.order_id == Order.id)
            .where(OrderItem.order_id.in_(valid_order_ids_subq))
            .group_by(func.date(Order.created_at))
            .order_by(func.date(Order.created_at).asc())
        )
        if product_name:
            stmt = stmt.where(func.lower(OrderItem.product_name) == product_name.lower())
        if farmer_profile_id:
            stmt = stmt.where(OrderItem.farmer_profile_id == farmer_profile_id)

        rows = self.db.execute(stmt).all()
        points: List[DemandHistoryPoint] = []
        for r in rows:
            o_cnt = r.order_count or 0
            q_sold = float(r.quantity_sold) if r.quantity_sold else 0.0
            u_buyers = r.unique_buyers or 0
            score = StatisticalDemandAnalysis.compute_demand_score(
                order_count=o_cnt,
                quantity_sold=q_sold,
                unique_buyers=u_buyers,
                sales_velocity=q_sold,
                growth_pct=0.0,
                available_supply=q_sold,
                period_days=1,
            )
            d_level = StatisticalDemandAnalysis.map_demand_level(score, o_cnt)
            d_trend = StatisticalDemandAnalysis.map_demand_trend(0.0, o_cnt)

            points.append(
                DemandHistoryPoint(
                    date=str(r.obs_date),
                    order_count=o_cnt,
                    quantity_sold=q_sold,
                    unique_buyers=u_buyers,
                    sales_velocity=round(q_sold, 2),
                    demand_score=score,
                    trend=d_trend,
                )
            )

        return DemandHistoryResponse(
            product_name=product_name,
            period_days=period_days,
            points=points,
            generated_at=now,
        )

    def get_regional_demand(
        self, product_name: Optional[str] = None, period_days: int = 30
    ) -> RegionalDemandResponse:
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=period_days)
        valid_order_ids_subq = self._get_valid_order_ids_query(start_date).scalar_subquery()

        # JSON extract for state and district from delivery_address_snapshot
        state_expr = func.json_extract(Order.delivery_address_snapshot, "$.state")
        district_expr = func.json_extract(Order.delivery_address_snapshot, "$.district")

        stmt = (
            select(
                state_expr.label("state"),
                district_expr.label("district"),
                func.count(func.distinct(OrderItem.order_id)).label("order_count"),
                func.coalesce(func.sum(OrderItem.quantity), 0.0).label("quantity_sold"),
                func.count(func.distinct(Order.buyer_user_id)).label("unique_buyers"),
            )
            .join(Order, OrderItem.order_id == Order.id)
            .where(OrderItem.order_id.in_(valid_order_ids_subq))
            .group_by(state_expr, district_expr)
            .order_by(func.count(func.distinct(OrderItem.order_id)).desc())
        )
        if product_name:
            stmt = stmt.where(func.lower(OrderItem.product_name) == product_name.lower())

        rows = self.db.execute(stmt).all()
        regions: List[RegionalDemandItem] = []

        for r in rows:
            st = str(r.state).strip('"') if r.state else "Unknown"
            dt = str(r.district).strip('"') if r.district else None
            o_cnt = r.order_count or 0
            q_sold = float(r.quantity_sold) if r.quantity_sold else 0.0
            u_buyers = r.unique_buyers or 0

            score = StatisticalDemandAnalysis.compute_demand_score(
                order_count=o_cnt,
                quantity_sold=q_sold,
                unique_buyers=u_buyers,
                sales_velocity=q_sold / float(period_days),
                growth_pct=0.0,
                available_supply=q_sold,
                period_days=period_days,
            )
            level = StatisticalDemandAnalysis.map_demand_level(score, o_cnt)

            regions.append(
                RegionalDemandItem(
                    state=st,
                    district=dt,
                    product_name=product_name,
                    order_count=o_cnt,
                    quantity_sold=q_sold,
                    unique_buyers=u_buyers,
                    demand_level=level,
                    demand_score=score,
                )
            )

        return RegionalDemandResponse(period_days=period_days, regions=regions, generated_at=now)

    def get_demand_recommendations(
        self, period_days: int = 30, limit: int = 5
    ) -> DemandRecommendationsResponse:
        now = datetime.now(timezone.utc)
        summary = self.get_demand_summary(period_days=period_days, limit=15)
        recs: List[DemandRecommendationItem] = []

        for prod in summary.top_demanded_products:
            if prod.demand_score >= 40:
                reason = f"High demand score ({prod.demand_score}/100) with {prod.order_count} active orders."
                if prod.supply_demand_status == SupplyDemandStatus.SUPPLY_SHORTAGE:
                    reason += " Zero active supply currently listed."
                elif prod.demand_growth_percentage and prod.demand_growth_percentage > 0:
                    reason += f" Demand grew by +{prod.demand_growth_percentage:.1f}% recently."

                recs.append(
                    DemandRecommendationItem(
                        product_name=prod.product_name,
                        category=prod.category or "VEGETABLE",
                        demand_score=prod.demand_score,
                        demand_level=prod.demand_level,
                        trend=prod.trend,
                        available_supply=prod.available_supply,
                        recommendation_reason=reason,
                    )
                )
                if len(recs) >= limit:
                    break

        return DemandRecommendationsResponse(
            period_days=period_days, recommendations=recs, generated_at=now
        )

    def get_price_demand_combined_insight(
        self, product_name: str, period_days: int = 30
    ) -> PriceDemandCombinedInsight:
        now = datetime.now(timezone.utc)
        demand = self.get_product_demand(product_name, period_days=period_days)
        price_summary = price_intelligence_service.get_summary(self.db, product_name=product_name)

        ref_price = float(price_summary.weighted_avg_price) if price_summary and price_summary.weighted_avg_price else None
        target_price = float(price_summary.latest_price) if price_summary and price_summary.latest_price else ref_price
        price_trend = price_summary.trend.value if (price_summary and price_summary.trend) else None

        combined_parts = []

        if demand.demand_level in [DemandLevel.HIGH, DemandLevel.VERY_HIGH]:
            combined_parts.append(f"Buyer demand for {product_name} is strong ({demand.demand_level.value}).")
        else:
            combined_parts.append(f"Buyer demand for {product_name} is currently {demand.demand_level.value.lower().replace('_', ' ')}.")

        if ref_price:
            combined_parts.append(f"Mandi benchmark price reference is ₹{ref_price:.2f}/kg.")

        if demand.trend == DemandTrend.RISING and price_trend == "RISING":
            combined_parts.append("Both price reference and buyer demand are trending upward simultaneously.")
        elif demand.trend == DemandTrend.RISING:
            combined_parts.append("Recent demand is increasing while price reference remains stable.")
        elif demand.supply_demand_status == SupplyDemandStatus.SUPPLY_SHORTAGE:
            combined_parts.append("Marketplace faces a supply shortage for this product.")

        combined_insight = " ".join(combined_parts)

        return PriceDemandCombinedInsight(
            product_name=product_name,
            reference_price=ref_price,
            target_price=target_price,
            price_trend=price_trend,
            demand_score=demand.demand_score,
            demand_level=demand.demand_level,
            demand_trend=demand.trend,
            supply_demand_status=demand.supply_demand_status,
            combined_insight=combined_insight,
            generated_at=now,
        )
