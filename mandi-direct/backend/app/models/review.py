from sqlalchemy import (
    CheckConstraint,
    Column,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class FarmerReview(BaseModel):
    """
    Verified post-delivery buyer rating and review for farmer produce.
    """
    __tablename__ = "farmer_reviews"

    farmer_profile_id = Column(
        String(36),
        ForeignKey("farmer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    buyer_user_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id = Column(
        String(36),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_item_id = Column(
        String(36),
        ForeignKey("order_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rating = Column(
        Integer,
        nullable=False,
        doc="Rating from 1 (lowest) to 5 (highest)",
    )
    comment = Column(
        Text,
        nullable=True,
        doc="Optional feedback comments from buyer",
    )

    # Relationships
    farmer_profile = relationship("FarmerProfile", foreign_keys=[farmer_profile_id])
    buyer = relationship("Profile", foreign_keys=[buyer_user_id])
    order = relationship("Order", foreign_keys=[order_id])
    order_item = relationship("OrderItem", foreign_keys=[order_item_id])

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_valid_rating_range"),
        UniqueConstraint("buyer_user_id", "order_item_id", name="uq_buyer_order_item_review"),
        Index("ix_farmer_reviews_farmer_rating", "farmer_profile_id", "rating"),
    )

    def __repr__(self) -> str:
        return f"<FarmerReview id={self.id} farmer_id={self.farmer_profile_id} rating={self.rating}>"
