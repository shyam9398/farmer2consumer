from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import BaseModel


class VerificationRecord(BaseModel):
    """
    Audit log record capturing every admin approval, rejection, or farmer resubmission.
    Guarantees full accountability for agricultural trust and safety.
    """
    __tablename__ = "verification_records"

    entity_type = Column(
        String(32),
        nullable=False,
        index=True,
        doc="Type of entity reviewed: FARMER or PRODUCE",
    )
    entity_id = Column(
        String(36),
        nullable=False,
        index=True,
        doc="References the farmer_profile_id or produce_listing_id",
    )
    action = Column(
        String(32),
        nullable=False,
        index=True,
        doc="Action taken: APPROVE, REJECT, RESUBMIT",
    )
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)

    admin_user_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="References profiles.id of the admin making the decision (null on farmer resubmit)",
    )
    reason = Column(Text, nullable=True, doc="Mandatory explanation on rejection, optional note on approval")

    # Relationship to admin profile
    admin_user = relationship("Profile", foreign_keys=[admin_user_id])

    __table_args__ = (
        CheckConstraint(
            "entity_type IN ('FARMER', 'PRODUCE')",
            name="check_valid_verification_entity_type",
        ),
        CheckConstraint(
            "action IN ('APPROVE', 'REJECT', 'RESUBMIT')",
            name="check_valid_verification_action",
        ),
        Index("ix_verification_records_entity", "entity_type", "entity_id"),
        Index("ix_verification_records_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<VerificationRecord id={self.id} entity={self.entity_type}:{self.entity_id} "
            f"action={self.action} status={self.previous_status}->{self.new_status}>"
        )
