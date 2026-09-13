from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.earnings import FarmerEarning, FarmerPayout, FinancialAuditLog
from app.models.enums import EarningStatus, OrderStatus, PayoutStatus
from app.models.order import Order, OrderItem
from app.schemas.earnings import (
    FarmerEarningDetailResponse,
    FarmerEarningItemResponse,
    FarmerEarningsListResponse,
    FarmerEarningsSummaryResponse,
)


class EarningsService:
    def create_earnings_for_delivered_order(
        self,
        db: Session,
        order: Order,
        admin_user_id: str,
    ) -> List[FarmerEarning]:
        """
        Creates farmer_earnings records for all items in a DELIVERED order.
        Idempotent: skips order items that already have a farmer_earning entry.
        Runs within the active DB session transaction.
        """
        earnings_created: List[FarmerEarning] = []
        now = datetime.now(timezone.utc)

        for item in order.items:
            # Check existing to prevent duplicates
            existing = (
                db.query(FarmerEarning)
                .filter(FarmerEarning.order_item_id == item.id)
                .first()
            )
            if existing:
                earnings_created.append(existing)
                continue

            # Financial calculation using Decimal
            quantity = Decimal(str(item.quantity))
            unit_price = Decimal(str(item.unit_price))
            gross_amount = quantity * unit_price

            platform_fee = Decimal("0.00")
            logistics_fee = Decimal("0.00")
            other_deductions = Decimal("0.00")

            total_deductions = platform_fee + logistics_fee + other_deductions
            net_amount = gross_amount - total_deductions

            earning = FarmerEarning(
                farmer_profile_id=item.farmer_profile_id,
                order_id=order.id,
                order_item_id=item.id,
                product_name=item.product_name,
                quantity=quantity,
                quantity_unit=item.quantity_unit,
                unit_price=unit_price,
                gross_amount=gross_amount,
                platform_fee=platform_fee,
                logistics_fee=logistics_fee,
                other_deductions=other_deductions,
                net_amount=net_amount,
                currency="INR",
                status=EarningStatus.PENDING_SETTLEMENT.value,
                earned_at=now,
            )
            db.add(earning)
            db.flush()

            # Audit log
            audit = FinancialAuditLog(
                entity_type="EARNING",
                entity_id=earning.id,
                action="EARNING_CREATED",
                performed_by=admin_user_id,
                previous_status=None,
                new_status=EarningStatus.PENDING_SETTLEMENT.value,
                amount=net_amount,
                reason=f"Earning created for delivered order {order.order_number}, item {item.product_name}",
            )
            db.add(audit)
            earnings_created.append(earning)

        return earnings_created

    def auto_settle_earnings_if_eligible(self, db: Session, farmer_profile_id: str) -> None:
        """
        Auto-settles PENDING_SETTLEMENT earnings to AVAILABLE for a farmer.
        In Mandi Direct, delivered order earnings become AVAILABLE immediately upon settlement cycle.
        """
        pending = (
            db.query(FarmerEarning)
            .filter(
                FarmerEarning.farmer_profile_id == farmer_profile_id,
                FarmerEarning.status == EarningStatus.PENDING_SETTLEMENT.value,
            )
            .all()
        )
        for earning in pending:
            earning.status = EarningStatus.AVAILABLE.value
            db.add(earning)

    def get_farmer_earnings_summary(
        self,
        db: Session,
        farmer_profile_id: str,
    ) -> FarmerEarningsSummaryResponse:
        """
        Calculates authoritative farmer financial summary directly from DB aggregation.
        """
        # Auto-settle pending earnings for seamless MVP UX
        self.auto_settle_earnings_if_eligible(db, farmer_profile_id)
        db.flush()

        earnings = (
            db.query(FarmerEarning)
            .filter(FarmerEarning.farmer_profile_id == farmer_profile_id)
            .all()
        )

        total_gross = Decimal("0.00")
        total_deductions = Decimal("0.00")
        total_net = Decimal("0.00")
        pending_settlement = Decimal("0.00")
        total_quantity_sold = Decimal("0.00")
        delivered_order_ids = set()

        for e in earnings:
            total_gross += Decimal(str(e.gross_amount))
            ded = Decimal(str(e.platform_fee)) + Decimal(str(e.logistics_fee)) + Decimal(str(e.other_deductions))
            total_deductions += ded
            total_net += Decimal(str(e.net_amount))
            total_quantity_sold += Decimal(str(e.quantity))
            delivered_order_ids.add(e.order_id)

            if e.status == EarningStatus.PENDING_SETTLEMENT.value:
                pending_settlement += Decimal(str(e.net_amount))

        # Available earnings sum
        available_earnings_sum = sum(
            (Decimal(str(e.net_amount)) for e in earnings if e.status == EarningStatus.AVAILABLE.value),
            Decimal("0.00"),
        )

        # Payouts
        payouts = (
            db.query(FarmerPayout)
            .filter(FarmerPayout.farmer_profile_id == farmer_profile_id)
            .all()
        )

        pending_payouts_sum = sum(
            (Decimal(str(p.amount)) for p in payouts if p.status in [PayoutStatus.PENDING.value, PayoutStatus.PROCESSING.value]),
            Decimal("0.00"),
        )
        total_paid = sum(
            (Decimal(str(p.amount)) for p in payouts if p.status == PayoutStatus.COMPLETED.value),
            Decimal("0.00"),
        )

        available_balance = max(Decimal("0.00"), available_earnings_sum - pending_payouts_sum)

        # Count total orders involving farmer
        total_orders_count = (
            db.query(func.count(func.distinct(OrderItem.order_id)))
            .filter(OrderItem.farmer_profile_id == farmer_profile_id)
            .scalar()
            or 0
        )

        # Mandi Direct impact calculation: estimated traditional market fee savings (~15% saved)
        estimated_additional_earnings = (total_gross * Decimal("0.15")).quantize(Decimal("0.01"))

        return FarmerEarningsSummaryResponse(
            total_gross=total_gross,
            total_deductions=total_deductions,
            total_net=total_net,
            pending_settlement=pending_settlement,
            available_balance=available_balance,
            total_paid=total_paid,
            total_orders=total_orders_count,
            delivered_orders=len(delivered_order_ids),
            total_quantity_sold=total_quantity_sold,
            produce_sold_qty=total_quantity_sold,
            total_sales=total_gross,
            estimated_additional_earnings=estimated_additional_earnings,
        )

    def get_farmer_earnings_list(
        self,
        db: Session,
        farmer_profile_id: str,
        page: int = 1,
        page_size: int = 20,
        status_filter: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        product: Optional[str] = None,
    ) -> FarmerEarningsListResponse:
        """
        Fetch paginated farmer earnings list with multi-farmer data isolation.
        """
        # Ensure eligible earnings are settled
        self.auto_settle_earnings_if_eligible(db, farmer_profile_id)
        db.flush()

        query = (
            db.query(FarmerEarning, Order.order_number)
            .join(Order, FarmerEarning.order_id == Order.id)
            .filter(FarmerEarning.farmer_profile_id == farmer_profile_id)
        )

        if status_filter:
            query = query.filter(FarmerEarning.status == status_filter.upper())
        if date_from:
            query = query.filter(FarmerEarning.earned_at >= date_from)
        if date_to:
            query = query.filter(FarmerEarning.earned_at <= date_to)
        if product:
            query = query.filter(FarmerEarning.product_name.ilike(f"%{product}%"))

        total = query.count()
        results = (
            query.order_by(FarmerEarning.earned_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        items: List[FarmerEarningItemResponse] = []
        for earning, order_number in results:
            items.append(
                FarmerEarningItemResponse(
                    id=earning.id,
                    farmer_profile_id=earning.farmer_profile_id,
                    order_id=earning.order_id,
                    order_number=order_number,
                    order_item_id=earning.order_item_id,
                    product_name=earning.product_name,
                    quantity=Decimal(str(earning.quantity)),
                    quantity_unit=earning.quantity_unit,
                    unit_price=Decimal(str(earning.unit_price)),
                    gross_amount=Decimal(str(earning.gross_amount)),
                    platform_fee=Decimal(str(earning.platform_fee)),
                    logistics_fee=Decimal(str(earning.logistics_fee)),
                    other_deductions=Decimal(str(earning.other_deductions)),
                    net_amount=Decimal(str(earning.net_amount)),
                    currency=earning.currency,
                    status=earning.status,
                    earned_at=earning.earned_at,
                    created_at=earning.created_at,
                )
            )

        return FarmerEarningsListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_farmer_earning_detail(
        self,
        db: Session,
        farmer_profile_id: str,
        earning_id: str,
    ) -> FarmerEarningDetailResponse:
        """
        Fetch single farmer earning detail with authorization check.
        """
        result = (
            db.query(FarmerEarning, Order)
            .join(Order, FarmerEarning.order_id == Order.id)
            .filter(FarmerEarning.id == earning_id)
            .first()
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farmer earning record not found.",
            )

        earning, order = result
        if earning.farmer_profile_id != farmer_profile_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You do not own this earning record.",
            )

        delivery_date = None
        if order.logistics and order.logistics.delivery_completed_at:
            delivery_date = order.logistics.delivery_completed_at
        elif order.delivery_confirmation:
            delivery_date = order.delivery_confirmation.confirmed_at

        buyer_name = order.buyer.full_name if order.buyer else "Direct Buyer"

        return FarmerEarningDetailResponse(
            id=earning.id,
            farmer_profile_id=earning.farmer_profile_id,
            order_id=earning.order_id,
            order_number=order.order_number,
            order_item_id=earning.order_item_id,
            product_name=earning.product_name,
            quantity=Decimal(str(earning.quantity)),
            quantity_unit=earning.quantity_unit,
            unit_price=Decimal(str(earning.unit_price)),
            gross_amount=Decimal(str(earning.gross_amount)),
            platform_fee=Decimal(str(earning.platform_fee)),
            logistics_fee=Decimal(str(earning.logistics_fee)),
            other_deductions=Decimal(str(earning.other_deductions)),
            net_amount=Decimal(str(earning.net_amount)),
            currency=earning.currency,
            status=earning.status,
            earned_at=earning.earned_at,
            created_at=earning.created_at,
            order_date=order.created_at,
            delivery_date=delivery_date,
            buyer_name=buyer_name,
            buyer_notes=order.buyer_notes,
            settlement_date=earning.earned_at,
            paid_date=earning.updated_at if earning.status == EarningStatus.PAID.value else None,
        )


earnings_service = EarningsService()
