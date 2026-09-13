from datetime import datetime, timezone
from decimal import Decimal
import random
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.earnings import FarmerEarning, FarmerPayout, FinancialAuditLog
from app.models.enums import EarningStatus, NotificationType, PayoutStatus
from app.models.farmer import FarmerProfile
from app.schemas.payouts import (
    FarmerPayoutListResponse,
    FarmerPayoutResponse,
    PayoutRequestCreate,
)
from app.services.earnings import earnings_service
from app.services.notification_service import notification_service


class PayoutsService:
    def _generate_payout_reference(self) -> str:
        date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        rand_str = f"{random.randint(10000, 99999)}"
        return f"MDP-{date_str}-{rand_str}"

    def request_payout(
        self,
        db: Session,
        farmer_profile: FarmerProfile,
        request_in: PayoutRequestCreate,
        user_profile_id: str,
    ) -> FarmerPayoutResponse:
        """
        Creates a PENDING payout request for farmer available earnings balance.
        """
        amount = Decimal(str(request_in.amount)).quantize(Decimal("0.01"))
        if amount <= Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Payout request amount must be greater than zero.",
            )

        # Check available balance
        summary = earnings_service.get_farmer_earnings_summary(db, farmer_profile.id)
        if amount > summary.available_balance:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Insufficient available balance. Requested: ₹{amount}, Available: ₹{summary.available_balance}.",
            )

        # Generate unique reference
        ref = self._generate_payout_reference()
        while db.query(FarmerPayout).filter(FarmerPayout.payout_reference == ref).first():
            ref = self._generate_payout_reference()

        now = datetime.now(timezone.utc)
        payout = FarmerPayout(
            farmer_profile_id=farmer_profile.id,
            payout_reference=ref,
            amount=amount,
            currency="INR",
            status=PayoutStatus.PENDING.value,
            payment_method="BANK_TRANSFER",
            provider="MANDI_DIRECT_PAY",
            requested_at=now,
        )
        db.add(payout)
        db.flush()

        # Audit log
        audit = FinancialAuditLog(
            entity_type="PAYOUT",
            entity_id=payout.id,
            action="PAYOUT_REQUESTED",
            performed_by=user_profile_id,
            previous_status=None,
            new_status=PayoutStatus.PENDING.value,
            amount=amount,
            reason=f"Farmer requested payout of ₹{amount}",
        )
        db.add(audit)
        db.commit()
        db.refresh(payout)

        # Phase 14: Notify farmer of payout request submission
        if farmer_profile.profile_id:
            notification_service.create_notification(
                db,
                recipient_user_id=farmer_profile.profile_id,
                type=NotificationType.PAYOUT,
                title="Payout Request Submitted",
                message=f"Your payout request of ₹{amount} ({ref}) has been submitted.",
                entity_type="PAYOUT",
                entity_id=payout.id,
                action_url="/farmer/payouts",
            )
            db.commit()

        farmer_name = farmer_profile.profile.full_name if farmer_profile.profile else "Farmer"
        farmer_phone = farmer_profile.profile.phone if farmer_profile.profile else None

        return FarmerPayoutResponse(
            id=payout.id,
            farmer_profile_id=payout.farmer_profile_id,
            farmer_name=farmer_name,
            farmer_phone=farmer_phone,
            payout_reference=payout.payout_reference,
            amount=Decimal(str(payout.amount)),
            currency=payout.currency,
            status=payout.status,
            payment_method=payout.payment_method,
            provider=payout.provider,
            provider_payout_id=payout.provider_payout_id,
            requested_at=payout.requested_at,
            processed_at=payout.processed_at,
            failed_at=payout.failed_at,
            failure_reason=payout.failure_reason,
            created_at=payout.created_at,
        )

    def get_farmer_payouts(
        self,
        db: Session,
        farmer_profile_id: str,
        page: int = 1,
        page_size: int = 20,
        status_filter: Optional[str] = None,
    ) -> FarmerPayoutListResponse:
        """
        Fetch farmer payout history list.
        """
        query = db.query(FarmerPayout).filter(FarmerPayout.farmer_profile_id == farmer_profile_id)
        if status_filter:
            query = query.filter(FarmerPayout.status == status_filter.upper())

        total = query.count()
        payouts = (
            query.order_by(FarmerPayout.requested_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        items: List[FarmerPayoutResponse] = []
        for p in payouts:
            farmer_name = p.farmer.profile.full_name if p.farmer and p.farmer.profile else "Farmer"
            farmer_phone = p.farmer.profile.phone if p.farmer and p.farmer.profile else None
            items.append(
                FarmerPayoutResponse(
                    id=p.id,
                    farmer_profile_id=p.farmer_profile_id,
                    farmer_name=farmer_name,
                    farmer_phone=farmer_phone,
                    payout_reference=p.payout_reference,
                    amount=Decimal(str(p.amount)),
                    currency=p.currency,
                    status=p.status,
                    payment_method=p.payment_method,
                    provider=p.provider,
                    provider_payout_id=p.provider_payout_id,
                    requested_at=p.requested_at,
                    processed_at=p.processed_at,
                    failed_at=p.failed_at,
                    failure_reason=p.failure_reason,
                    created_at=p.created_at,
                )
            )

        return FarmerPayoutListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_admin_payouts(
        self,
        db: Session,
        page: int = 1,
        page_size: int = 20,
        status_filter: Optional[str] = None,
        farmer_profile_id: Optional[str] = None,
    ) -> FarmerPayoutListResponse:
        """
        Fetch payout list for Admin management dashboard.
        """
        query = db.query(FarmerPayout)
        if status_filter:
            query = query.filter(FarmerPayout.status == status_filter.upper())
        if farmer_profile_id:
            query = query.filter(FarmerPayout.farmer_profile_id == farmer_profile_id)

        total = query.count()
        payouts = (
            query.order_by(FarmerPayout.requested_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        items: List[FarmerPayoutResponse] = []
        for p in payouts:
            farmer_name = p.farmer.profile.full_name if p.farmer and p.farmer.profile else "Farmer"
            farmer_phone = p.farmer.profile.phone if p.farmer and p.farmer.profile else None
            items.append(
                FarmerPayoutResponse(
                    id=p.id,
                    farmer_profile_id=p.farmer_profile_id,
                    farmer_name=farmer_name,
                    farmer_phone=farmer_phone,
                    payout_reference=p.payout_reference,
                    amount=Decimal(str(p.amount)),
                    currency=p.currency,
                    status=p.status,
                    payment_method=p.payment_method,
                    provider=p.provider,
                    provider_payout_id=p.provider_payout_id,
                    requested_at=p.requested_at,
                    processed_at=p.processed_at,
                    failed_at=p.failed_at,
                    failure_reason=p.failure_reason,
                    created_at=p.created_at,
                )
            )

        return FarmerPayoutListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )

    def update_payout_status(
        self,
        db: Session,
        payout_id: str,
        new_status: str,
        failure_reason: Optional[str],
        provider_payout_id: Optional[str],
        admin_user_id: str,
    ) -> FarmerPayoutResponse:
        """
        Admin action to update payout state (PROCESSING, COMPLETED, FAILED).
        Enforces state transition rules and mandatory failure reason.
        """
        payout = db.query(FarmerPayout).filter(FarmerPayout.id == payout_id).first()
        if not payout:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payout request '{payout_id}' not found.",
            )

        target_status = new_status.upper()
        allowed_statuses = [
            PayoutStatus.PROCESSING.value,
            PayoutStatus.COMPLETED.value,
            PayoutStatus.FAILED.value,
        ]
        if target_status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid status '{new_status}'. Allowed values: {allowed_statuses}",
            )

        if target_status == PayoutStatus.FAILED.value and not failure_reason:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A detailed failure_reason is mandatory when rejecting or failing a payout.",
            )

        current_status = payout.status

        # Valid transitions:
        # PENDING -> PROCESSING, COMPLETED, FAILED
        # PROCESSING -> COMPLETED, FAILED
        if current_status in [PayoutStatus.COMPLETED.value, PayoutStatus.FAILED.value, PayoutStatus.CANCELLED.value]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Payout is already in terminal state '{current_status}' and cannot be modified.",
            )

        now = datetime.now(timezone.utc)
        payout.status = target_status

        if provider_payout_id:
            payout.provider_payout_id = provider_payout_id.strip()

        if target_status == PayoutStatus.COMPLETED.value:
            payout.processed_at = now
            # Transition farmer's AVAILABLE earnings to PAID up to payout amount
            earnings = (
                db.query(FarmerEarning)
                .filter(
                    FarmerEarning.farmer_profile_id == payout.farmer_profile_id,
                    FarmerEarning.status == EarningStatus.AVAILABLE.value,
                )
                .order_by(FarmerEarning.earned_at.asc())
                .all()
            )
            remaining_to_cover = Decimal(str(payout.amount))
            for e in earnings:
                if remaining_to_cover <= Decimal("0.00"):
                    break
                net = Decimal(str(e.net_amount))
                e.status = EarningStatus.PAID.value
                db.add(e)
                remaining_to_cover -= net

        elif target_status == PayoutStatus.FAILED.value:
            payout.failed_at = now
            payout.failure_reason = failure_reason.strip() if failure_reason else None

        elif target_status == PayoutStatus.PROCESSING.value:
            payout.processed_at = now

        db.add(payout)

        # Audit log
        audit = FinancialAuditLog(
            entity_type="PAYOUT",
            entity_id=payout.id,
            action=f"PAYOUT_{target_status}",
            performed_by=admin_user_id,
            previous_status=current_status,
            new_status=target_status,
            amount=Decimal(str(payout.amount)),
            reason=failure_reason or f"Admin updated payout status to {target_status}",
        )
        db.add(audit)
        db.commit()
        db.refresh(payout)

        # Phase 14: Notify farmer of payout status updates
        recipient_id = payout.farmer.profile_id if payout.farmer else None
        if recipient_id:
            if target_status == PayoutStatus.PROCESSING.value:
                notification_service.create_notification(
                    db,
                    recipient_user_id=recipient_id,
                    type=NotificationType.PAYOUT,
                    title="Payout Processing",
                    message=f"Your payout request of ₹{payout.amount} ({payout.payout_reference}) is now being processed.",
                    entity_type="PAYOUT",
                    entity_id=payout.id,
                    action_url="/farmer/payouts",
                )
            elif target_status == PayoutStatus.COMPLETED.value:
                notification_service.create_notification(
                    db,
                    recipient_user_id=recipient_id,
                    type=NotificationType.PAYOUT,
                    title="Payout Completed",
                    message=f"Your payout of ₹{payout.amount} ({payout.payout_reference}) has been completed successfully.",
                    entity_type="PAYOUT",
                    entity_id=payout.id,
                    action_url="/farmer/payouts",
                )
            elif target_status == PayoutStatus.FAILED.value:
                notification_service.create_notification(
                    db,
                    recipient_user_id=recipient_id,
                    type=NotificationType.PAYOUT,
                    title="Payout Failed",
                    message=f"Your payout request of ₹{payout.amount} ({payout.payout_reference}) failed. Reason: {failure_reason}",
                    entity_type="PAYOUT",
                    entity_id=payout.id,
                    action_url="/farmer/payouts",
                )
            db.commit()

        farmer_name = payout.farmer.profile.full_name if payout.farmer and payout.farmer.profile else "Farmer"
        farmer_phone = payout.farmer.profile.phone if payout.farmer and payout.farmer.profile else None

        return FarmerPayoutResponse(
            id=payout.id,
            farmer_profile_id=payout.farmer_profile_id,
            farmer_name=farmer_name,
            farmer_phone=farmer_phone,
            payout_reference=payout.payout_reference,
            amount=Decimal(str(payout.amount)),
            currency=payout.currency,
            status=payout.status,
            payment_method=payout.payment_method,
            provider=payout.provider,
            provider_payout_id=payout.provider_payout_id,
            requested_at=payout.requested_at,
            processed_at=payout.processed_at,
            failed_at=payout.failed_at,
            failure_reason=payout.failure_reason,
            created_at=payout.created_at,
        )


payouts_service = PayoutsService()
