from typing import Any, List, Optional, Tuple
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session, joinedload
from app.models.profile import Profile
from app.models.verification import VerificationRecord
from app.repositories.base import BaseRepository


class VerificationRecordRepository(BaseRepository[VerificationRecord, Any, Any]):
    """Data access layer for verification audit history."""

    def __init__(self):
        super().__init__(VerificationRecord)

    def create_record(
        self,
        db: Session,
        *,
        entity_type: str,
        entity_id: str,
        action: str,
        previous_status: Optional[str],
        new_status: str,
        admin_user_id: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> VerificationRecord:
        """Create and persist a verification decision or resubmission event."""
        import uuid

        record = VerificationRecord(
            id=str(uuid.uuid4()),
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            previous_status=previous_status,
            new_status=new_status,
            admin_user_id=admin_user_id,
            reason=reason,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def get_history_for_entity(
        self, db: Session, entity_type: str, entity_id: str
    ) -> List[VerificationRecord]:
        """Fetch all historical verification actions for a specific entity in chronological order."""
        return (
            db.query(VerificationRecord)
            .options(joinedload(VerificationRecord.admin_user))
            .filter(
                VerificationRecord.entity_type == entity_type,
                VerificationRecord.entity_id == entity_id,
            )
            .order_by(desc(VerificationRecord.created_at))
            .all()
        )

    def list_records(
        self,
        db: Session,
        *,
        entity_type: Optional[str] = None,
        action: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[VerificationRecord], int]:
        """Paginated search and filtering of all system verification logs."""
        query = db.query(VerificationRecord).options(joinedload(VerificationRecord.admin_user))

        if entity_type and entity_type.upper() != "ALL":
            query = query.filter(VerificationRecord.entity_type == entity_type.upper())

        if action and action.upper() != "ALL":
            query = query.filter(VerificationRecord.action == action.upper())

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.outerjoin(Profile, VerificationRecord.admin_user_id == Profile.id).filter(
                or_(
                    VerificationRecord.reason.ilike(term),
                    VerificationRecord.entity_id.ilike(term),
                    Profile.full_name.ilike(term),
                    Profile.email.ilike(term),
                )
            )

        total = query.count()
        offset = (max(1, page) - 1) * page_size
        items = query.order_by(desc(VerificationRecord.created_at)).offset(offset).limit(page_size).all()
        return items, total


verification_record_repository = VerificationRecordRepository()
