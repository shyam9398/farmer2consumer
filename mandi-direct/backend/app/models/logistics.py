import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class CollectionPoint(BaseModel):
    """
    Physical produce collection / aggregation point (e.g. Village Collection Center, FPO Center).
    Managed by administrators for batch collection from multiple farmers.
    """
    __tablename__ = "collection_points"

    name = Column(String(150), nullable=False, index=True)
    description = Column(Text, nullable=True)
    address = Column(Text, nullable=False)
    village = Column(String(100), nullable=True)
    mandal = Column(String(100), nullable=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    contact_name = Column(String(150), nullable=False)
    contact_phone = Column(String(32), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true", index=True)
    fpo_id = Column(
        String(36),
        ForeignKey("fpo_organizations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    fpo = relationship("FpoOrganization", back_populates="collection_points")

    __table_args__ = (
        Index("ix_collection_points_district_active", "district", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<CollectionPoint id={self.id} name='{self.name}' district='{self.district}' active={self.is_active}>"


class OrderLogistics(BaseModel):
    """
    Logistics coordination, aggregation center association, and fulfillment tracking per order.
    """
    __tablename__ = "order_logistics"

    order_id = Column(
        String(36),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    collection_type = Column(
        String(32),
        nullable=False,
        default="COLLECTION_POINT",
        server_default="COLLECTION_POINT",
        doc="COLLECTION_POINT or DIRECT_FARM_PICKUP",
    )
    collection_point_id = Column(
        String(36),
        ForeignKey("collection_points.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Pickup Location Snapshot / Info
    pickup_address = Column(Text, nullable=True)
    pickup_village = Column(String(100), nullable=True)
    pickup_mandal = Column(String(100), nullable=True)
    pickup_district = Column(String(100), nullable=True)
    pickup_state = Column(String(100), nullable=True)
    pickup_pincode = Column(String(10), nullable=True)
    pickup_latitude = Column(Float, nullable=True)
    pickup_longitude = Column(Float, nullable=True)

    # Delivery Destination Snapshot / Info
    delivery_address = Column(Text, nullable=True)
    delivery_village = Column(String(100), nullable=True)
    delivery_mandal = Column(String(100), nullable=True)
    delivery_district = Column(String(100), nullable=True)
    delivery_state = Column(String(100), nullable=True)
    delivery_pincode = Column(String(10), nullable=True)
    delivery_latitude = Column(Float, nullable=True)
    delivery_longitude = Column(Float, nullable=True)

    # Assigned Fulfillment Agent & Transport
    assigned_agent_name = Column(String(150), nullable=True)
    assigned_agent_phone = Column(String(32), nullable=True)
    vehicle_type = Column(String(64), nullable=True)
    vehicle_number = Column(String(32), nullable=True)

    # Booking state and fleet linkage
    booking_status = Column(
        String(32),
        nullable=False,
        default="BOOKING_REQUESTED",
        server_default="BOOKING_REQUESTED",
        index=True,
        doc="BOOKING_REQUESTED, ACCEPTED, ASSIGNED, GOING_TO_COLLECTION, AT_COLLECTION, PRODUCT_LOADED, OUT_FOR_DELIVERY, ARRIVED_AT_DELIVERY, DELIVERED",
    )
    assigned_vehicle_id = Column(
        String(36),
        ForeignKey("vehicles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    logistics_user_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)

    # Logistics Lifecycle Timestamps
    pickup_scheduled_at = Column(DateTime(timezone=True), nullable=True, index=True)
    pickup_completed_at = Column(DateTime(timezone=True), nullable=True)
    delivery_started_at = Column(DateTime(timezone=True), nullable=True)
    delivery_completed_at = Column(DateTime(timezone=True), nullable=True)
    estimated_delivery_at = Column(DateTime(timezone=True), nullable=True, index=True)
    delivery_notes = Column(Text, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="logistics")
    collection_point = relationship("CollectionPoint", foreign_keys=[collection_point_id])
    assigned_vehicle = relationship("Vehicle", foreign_keys=[assigned_vehicle_id])
    logistics_user = relationship("Profile", foreign_keys=[logistics_user_id])

    __table_args__ = (
        Index("ix_order_logistics_pickup_sched", "pickup_scheduled_at"),
        Index("ix_order_logistics_est_delivery", "estimated_delivery_at"),
    )

    def __repr__(self) -> str:
        return f"<OrderLogistics id={self.id} order_id={self.order_id} collection_type={self.collection_type}>"


class DeliveryConfirmation(BaseModel):
    """
    Formal delivery proof and confirmation record upon handover to buyer.
    """
    __tablename__ = "delivery_confirmations"

    order_id = Column(
        String(36),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    confirmed_by = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    confirmation_type = Column(
        String(32),
        nullable=False,
        default="MANUAL",
        server_default="MANUAL",
        doc="MANUAL, OTP, or PHOTO",
    )
    recipient_name = Column(String(150), nullable=False)
    notes = Column(Text, nullable=True)
    confirmed_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    order = relationship("Order", back_populates="delivery_confirmation")
    actor = relationship("Profile", foreign_keys=[confirmed_by])

    def __repr__(self) -> str:
        return f"<DeliveryConfirmation id={self.id} order_id={self.order_id} recipient='{self.recipient_name}'>"


class LogisticsLocationUpdate(BaseModel):
    """
    Real GPS breadcrumb ping emitted from driver device.
    """
    __tablename__ = "logistics_location_updates"

    order_id = Column(
        String(36),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vehicle_id = Column(
        String(36),
        ForeignKey("vehicles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    logistics_profile_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)
    recorded_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    order = relationship("Order")
    vehicle = relationship("Vehicle")
    logistics_user = relationship("Profile")

    __table_args__ = (
        Index("ix_location_updates_order_time", "order_id", "recorded_at"),
    )

    def __repr__(self) -> str:
        return f"<LogisticsLocationUpdate order={self.order_id} lat={self.latitude} lon={self.longitude}>"


class DeliveryEvent(BaseModel):
    """
    Formal milestone history event in delivery execution.
    """
    __tablename__ = "delivery_events"

    order_id = Column(
        String(36),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type = Column(
        String(64),
        nullable=False,
        index=True,
        doc="BOOKING_CONFIRMED, LOGISTICS_ASSIGNED, REACHED_COLLECTION_POINT, PRODUCT_LOADED, OUT_FOR_DELIVERY, REACHED_DESTINATION, DELIVERED",
    )
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    order = relationship("Order")
    actor = relationship("Profile")

    __table_args__ = (
        Index("ix_delivery_events_order_time", "order_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<DeliveryEvent id={self.id} order={self.order_id} event={self.event_type}>"
