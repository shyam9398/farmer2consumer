from datetime import datetime, timezone
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


class Payment(BaseModel):
    """
    Transaction record representing buyer payment for an order.
    Enforces strict decimal precision and provider confirmation checks.
    """
    __tablename__ = "payments"

    order_id = Column(
        String(36),
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
        index=True,
        doc="1-to-1 linkage to purchase order",
    )
    buyer_user_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        doc="Purchasing buyer profile ID",
    )
    amount = Column(
        Numeric(12, 2),
        nullable=False,
        doc="Total payment amount captured in currency",
    )
    currency = Column(
        String(10),
        nullable=False,
        default="INR",
        server_default="INR",
    )
    payment_status = Column(
        String(32),
        nullable=False,
        default="PENDING",
        server_default="PENDING",
        index=True,
        doc="PENDING, PAID, FAILED, REFUNDED",
    )
    payment_method = Column(
        String(50),
        nullable=True,
        doc="UPI, NET_BANKING, CARD, WALLET, CASH_ON_DELIVERY",
    )
    provider = Column(
        String(50),
        nullable=True,
        doc="Payment gateway provider e.g. RAZORPAY, STRIPE, CASHFREE, MANDI_PAY",
    )
    provider_payment_id = Column(
        String(100),
        nullable=True,
        index=True,
        doc="Gateway reference transaction / charge ID",
    )
    provider_order_id = Column(
        String(100),
        nullable=True,
        index=True,
        doc="Gateway order identifier",
    )
    paid_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    order = relationship("Order", foreign_keys=[order_id])
    buyer = relationship("Profile", foreign_keys=[buyer_user_id])

    __table_args__ = (
        CheckConstraint(
            "payment_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED')",
            name="check_valid_payment_record_status",
        ),
        Index("ix_payments_buyer_status", "buyer_user_id", "payment_status"),
    )

    def __repr__(self) -> str:
        return f"<Payment id={self.id} order={self.order_id} amount={self.amount} status={self.payment_status}>"
