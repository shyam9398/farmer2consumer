from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import NotificationType


class Notification(BaseModel):
    """
    Persistent notification model for Mandi Direct users across all roles:
    FARMER, FPO, BUYER, LOGISTICS, ADMIN.
    Created exclusively from genuine business events.
    """
    __tablename__ = "notifications"

    recipient_user_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="References profiles.id of the notification recipient",
    )
    type = Column(
        SAEnum(NotificationType, name="notification_type", native_enum=False),
        nullable=False,
        index=True,
        doc="Categorical notification type (e.g. ORDER, VERIFICATION, LOGISTICS)",
    )
    title = Column(
        String(255),
        nullable=False,
        doc="Short factual notification title",
    )
    message = Column(
        Text,
        nullable=False,
        doc="Factual, clear notification message body",
    )
    entity_type = Column(
        String(50),
        nullable=True,
        doc="Optional entity classification (e.g. ORDER, PRODUCE, PAYOUT, VERIFICATION)",
    )
    entity_id = Column(
        String(36),
        nullable=True,
        doc="Optional referenced entity primary key",
    )
    action_url = Column(
        String(255),
        nullable=True,
        doc="Internal relative navigation route (e.g. /farmer/orders/xyz)",
    )
    is_read = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        doc="Read/unread status flag",
    )
    read_at = Column(
        DateTime(timezone=True),
        nullable=True,
        doc="Timestamp when the notification was marked as read",
    )

    # Relationships
    recipient = relationship("Profile", foreign_keys=[recipient_user_id], lazy="joined")

    __table_args__ = (
        Index("ix_notifications_recipient_is_read", "recipient_user_id", "is_read"),
        Index("ix_notifications_recipient_created_at", "recipient_user_id", "created_at"),
    )


class NotificationPreference(BaseModel):
    """
    Persistent notification category preference controls per user.
    System notifications cannot be disabled.
    """
    __tablename__ = "notification_preferences"

    user_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
        doc="References profiles.id of the user owning these preferences",
    )
    order_notifications = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="Enable/disable notifications for order lifecycle events",
    )
    verification_notifications = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="Enable/disable notifications for verification lifecycle events",
    )
    logistics_notifications = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="Enable/disable notifications for pickup and delivery events",
    )
    payment_notifications = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="Enable/disable notifications for buyer payment events",
    )
    payout_notifications = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="Enable/disable notifications for farmer payout events",
    )
    matching_notifications = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="Enable/disable notifications for smart matching opportunities",
    )
    intelligence_notifications = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="Enable/disable notifications for price and demand updates",
    )
    system_notifications = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="System operational notifications (permanently enabled)",
    )

    user = relationship("Profile", foreign_keys=[user_id], lazy="joined")
