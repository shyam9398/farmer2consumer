from sqlalchemy import Boolean, Column, ForeignKey, Index, String, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class BuyerAddress(BaseModel):
    """
    Delivery addresses saved by buyers for marketplace checkout.
    Secured by strict buyer_user_id tenant isolation.
    """
    __tablename__ = "buyer_addresses"

    buyer_user_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        doc="References profiles.id of the buyer",
    )
    full_name = Column(String(150), nullable=False)
    phone = Column(String(32), nullable=False)
    address_line1 = Column(Text, nullable=False)
    address_line2 = Column(Text, nullable=True)
    village = Column(String(100), nullable=True)
    mandal = Column(String(100), nullable=True)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    landmark = Column(String(150), nullable=True)
    is_default = Column(Boolean, default=False, nullable=False)

    # Relationships
    buyer = relationship("Profile", foreign_keys=[buyer_user_id])

    __table_args__ = (
        Index("ix_buyer_addresses_buyer_default", "buyer_user_id", "is_default"),
    )

    def __repr__(self) -> str:
        return f"<BuyerAddress id={self.id} buyer_user_id={self.buyer_user_id} pincode={self.pincode}>"
