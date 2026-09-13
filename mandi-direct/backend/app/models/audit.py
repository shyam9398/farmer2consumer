from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class AuditLog(BaseModel):
    """
    Immutable system-wide audit log for administrative, moderation,
    and critical resource state changes.
    Sensitive credentials and secrets are strictly excluded.
    """
    __tablename__ = "audit_logs"

    actor_user_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="Profile ID of user or admin who executed the action",
    )
    action = Column(
        String(100),
        nullable=False,
        index=True,
        doc="Action executed e.g. CREATE, UPDATE, DELETE, VERIFY, REJECT",
    )
    entity_type = Column(
        String(50),
        nullable=False,
        index=True,
        doc="Entity table/class name e.g. PRODUCE, FARMER, ORDER, VEHICLE",
    )
    entity_id = Column(
        String(36),
        nullable=True,
        index=True,
        doc="Primary identifier of modified entity",
    )
    previous_value = Column(
        JSON,
        nullable=True,
        doc="Sanitized snapshot of entity state prior to mutation",
    )
    new_value = Column(
        JSON,
        nullable=True,
        doc="Sanitized snapshot of entity state post mutation",
    )
    reason = Column(
        Text,
        nullable=True,
        doc="Optional administrative or operational rationale",
    )

    # Relationships
    actor = relationship("Profile", foreign_keys=[actor_user_id])

    __table_args__ = (
        Index("ix_audit_logs_entity", "entity_type", "entity_id"),
        Index("ix_audit_logs_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} action='{self.action}' entity='{self.entity_type}:{self.entity_id}'>"
