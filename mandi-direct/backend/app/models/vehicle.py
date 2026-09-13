from sqlalchemy import (
    Column,
    Float,
    ForeignKey,
    Index,
    Numeric,
    String,
)
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Vehicle(BaseModel):
    """
    Logistics delivery vehicle registration and availability tracking.
    """
    __tablename__ = "vehicles"

    logistics_user_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vehicle_number = Column(
        String(32),
        unique=True,
        nullable=False,
        index=True,
        doc="Registered vehicle registration number e.g. AP 39 TX 1234",
    )
    vehicle_type = Column(
        String(64),
        nullable=False,
        doc="Vehicle classification e.g. MINI_TRUCK, PICKUP_VAN, HEAVY_TRUCK",
    )
    capacity = Column(
        Numeric(10, 2),
        nullable=False,
        doc="Maximum payload capacity in kilograms (KG)",
    )
    availability_status = Column(
        String(32),
        nullable=False,
        default="AVAILABLE",
        server_default="AVAILABLE",
        index=True,
        doc="AVAILABLE, ASSIGNED, ON_DELIVERY, INACTIVE",
    )
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)

    # Relationships
    logistics_user = relationship("Profile", foreign_keys=[logistics_user_id])

    __table_args__ = (
        Index("ix_vehicles_user_status", "logistics_user_id", "availability_status"),
    )

    def __repr__(self) -> str:
        return f"<Vehicle id={self.id} number='{self.vehicle_number}' status='{self.availability_status}'>"
