from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class FarmerEarning(BaseModel):
    """
    Direct financial earning record created per delivered OrderItem.
    Enforces multi-farmer data isolation and strict decimal precision.
    """
    __tablename__ = "farmer_earnings"

    farmer_profile_id = Column(
        String(36),
        ForeignKey("farmer_profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        doc="Farmer who earned this payout line",
    )
    order_id = Column(
        String(36),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_item_id = Column(
        String(36),
        ForeignKey("order_items.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
        index=True,
        doc="Guarantees idempotent 1-to-1 mapping between order item and earning record",
    )

    # Produce snapshot
    product_name = Column(String(150), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False)
    quantity_unit = Column(String(20), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

    # Financial Breakdown (All Decimal precision)
    gross_amount = Column(Numeric(12, 2), nullable=False)
    platform_fee = Column(
        Numeric(10, 2), nullable=False, default=0.0, server_default="0.00"
    )
    logistics_fee = Column(
        Numeric(10, 2), nullable=False, default=0.0, server_default="0.00"
    )
    other_deductions = Column(
        Numeric(10, 2), nullable=False, default=0.0, server_default="0.00"
    )
    net_amount = Column(Numeric(12, 2), nullable=False)

    currency = Column(String(10), nullable=False, default="INR", server_default="INR")
    status = Column(
        String(32),
        nullable=False,
        default="PENDING_SETTLEMENT",
        server_default="PENDING_SETTLEMENT",
        index=True,
    )
    earned_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    # Relationships
    farmer = relationship("FarmerProfile", foreign_keys=[farmer_profile_id])
    order = relationship("Order", foreign_keys=[order_id])
    order_item = relationship("OrderItem", foreign_keys=[order_item_id])

    __table_args__ = (
        CheckConstraint(
            "status IN ('EXPECTED', 'PENDING_SETTLEMENT', 'AVAILABLE', 'PAID', 'CANCELLED', 'REFUNDED')",
            name="check_valid_earning_status",
        ),
        Index("ix_farmer_earnings_farmer_status", "farmer_profile_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<FarmerEarning id={self.id} farmer={self.farmer_profile_id} net={self.net_amount} status={self.status}>"


class FarmerPayout(BaseModel):
    """
    Payout request/disbursement record for farmer accumulated available earnings.
    """
    __tablename__ = "farmer_payouts"

    farmer_profile_id = Column(
        String(36),
        ForeignKey("farmer_profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    payout_reference = Column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
        doc="Human-friendly payout reference e.g. MDP-YYYYMMDD-XXXXX",
    )
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="INR", server_default="INR")
    status = Column(
        String(32),
        nullable=False,
        default="PENDING",
        server_default="PENDING",
        index=True,
    )
    payment_method = Column(
        String(50),
        nullable=False,
        default="BANK_TRANSFER",
        server_default="BANK_TRANSFER",
    )
    provider = Column(
        String(50),
        nullable=False,
        default="MANDI_DIRECT_PAY",
        server_default="MANDI_DIRECT_PAY",
    )
    provider_payout_id = Column(String(100), nullable=True)

    requested_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    processed_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    failure_reason = Column(Text, nullable=True)

    # Relationships
    farmer = relationship("FarmerProfile", foreign_keys=[farmer_profile_id])

    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')",
            name="check_valid_payout_status",
        ),
        Index("ix_farmer_payouts_farmer_status", "farmer_profile_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<FarmerPayout id={self.id} ref={self.payout_reference} amount={self.amount} status={self.status}>"


class FinancialAuditLog(BaseModel):
    """
    Immutable financial audit trail for all earnings & payout state transitions.
    """
    __tablename__ = "financial_audit_logs"

    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(String(36), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    performed_by = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    previous_status = Column(String(32), nullable=True)
    new_status = Column(String(32), nullable=True)
    amount = Column(Numeric(12, 2), nullable=True)
    reason = Column(Text, nullable=True)

    # Relationships
    actor = relationship("Profile", foreign_keys=[performed_by])

    def __repr__(self) -> str:
        return f"<FinancialAuditLog id={self.id} action={self.action} entity={self.entity_type}:{self.entity_id}>"
