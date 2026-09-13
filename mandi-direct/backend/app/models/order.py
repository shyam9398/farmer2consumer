from sqlalchemy import (
    CheckConstraint,
    Column,
    ForeignKey,
    Index,
    JSON,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import OrderStatus, PaymentStatus


class Order(BaseModel):
    """
    Direct farmer-to-consumer wholesale purchase order.
    Maintains financial totals, permanent delivery address snapshots,
    and state machine progression.
    """
    __tablename__ = "orders"

    order_number = Column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
        doc="Human-friendly unique order reference e.g. MD-YYYYMMDD-XXXXX",
    )
    buyer_user_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        doc="References profiles.id of the purchasing buyer",
    )
    status = Column(
        String(32),
        nullable=False,
        default=OrderStatus.PENDING.value,
        server_default="PENDING",
        index=True,
    )
    payment_status = Column(
        String(32),
        nullable=False,
        default=PaymentStatus.PENDING.value,
        server_default="PENDING",
        index=True,
    )

    # Financial breakdown (Strict Decimal precision)
    subtotal = Column(Numeric(12, 2), nullable=False)
    delivery_fee = Column(
        Numeric(12, 2), nullable=False, default=0.0, server_default="0.00"
    )
    total_amount = Column(Numeric(12, 2), nullable=False)

    delivery_address_id = Column(
        String(36),
        ForeignKey("buyer_addresses.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    delivery_address_snapshot = Column(
        JSON,
        nullable=False,
        doc="Permanent immutable snapshot of shipping address at checkout time",
    )
    buyer_notes = Column(Text, nullable=True)

    # Relationships
    buyer = relationship("Profile", foreign_keys=[buyer_user_id])
    delivery_address = relationship("BuyerAddress", foreign_keys=[delivery_address_id])
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="joined",
    )
    status_history = relationship(
        "OrderStatusHistory",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderStatusHistory.created_at.asc()",
    )
    logistics = relationship(
        "OrderLogistics",
        back_populates="order",
        uselist=False,
        cascade="all, delete-orphan",
    )
    delivery_confirmation = relationship(
        "DeliveryConfirmation",
        back_populates="order",
        uselist=False,
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED')",
            name="check_valid_order_status",
        ),
        CheckConstraint(
            "payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')",
            name="check_valid_payment_status",
        ),
        Index("ix_orders_buyer_status", "buyer_user_id", "status"),
        Index("ix_orders_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Order id={self.id} order_number={self.order_number} status={self.status} total={self.total_amount}>"


class OrderItem(BaseModel):
    """
    Snapshot of produce listing purchased in an order.
    Stores immutable price and produce metadata as it existed at order placement time.
    """
    __tablename__ = "order_items"

    order_id = Column(
        String(36),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    produce_listing_id = Column(
        String(36),
        ForeignKey("produce_listings.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    farmer_profile_id = Column(
        String(36),
        ForeignKey("farmer_profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Snapshot fields
    product_name = Column(String(150), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False)
    quantity_unit = Column(String(20), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    produce = relationship("ProduceListing", foreign_keys=[produce_listing_id])
    farmer = relationship("FarmerProfile", foreign_keys=[farmer_profile_id])

    __table_args__ = (
        Index("ix_order_items_farmer_order", "farmer_profile_id", "order_id"),
    )

    def __repr__(self) -> str:
        return f"<OrderItem id={self.id} order_id={self.order_id} product={self.product_name} qty={self.quantity}>"


class OrderStatusHistory(BaseModel):
    """
    Immutable audit log of all order lifecycle status transitions.
    """
    __tablename__ = "order_status_history"

    order_id = Column(
        String(36),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    previous_status = Column(String(32), nullable=True)
    new_status = Column(String(32), nullable=False)
    changed_by = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    reason = Column(Text, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="status_history")
    actor = relationship("Profile", foreign_keys=[changed_by])

    def __repr__(self) -> str:
        return f"<OrderStatusHistory id={self.id} order_id={self.order_id} {self.previous_status}->{self.new_status}>"
