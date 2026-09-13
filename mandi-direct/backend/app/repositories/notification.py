from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.enums import NotificationType
from app.models.notification import Notification, NotificationPreference
from app.schemas.notification import NotificationPreferenceUpdate


class NotificationRepository:
    """Repository for managing notifications and user notification preferences."""

    def create(
        self,
        db: Session,
        *,
        recipient_user_id: str,
        type: NotificationType,
        title: str,
        message: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        action_url: Optional[str] = None,
    ) -> Notification:
        """Create a notification in the database."""
        notification = Notification(
            recipient_user_id=recipient_user_id,
            type=type,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
            action_url=action_url,
            is_read=False,
            read_at=None,
        )
        db.add(notification)
        db.flush()
        return notification

    def get_by_id(self, db: Session, notification_id: str) -> Optional[Notification]:
        """Fetch a single notification by id."""
        return db.query(Notification).filter(Notification.id == notification_id).first()

    def get_user_notifications(
        self,
        db: Session,
        user_id: str,
        *,
        unread_only: bool = False,
        notification_type: Optional[NotificationType] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Notification], int]:
        """
        Fetch paginated notifications for a user with optional unread and type filters.
        Returns (items, total_count).
        """
        query = db.query(Notification).filter(Notification.recipient_user_id == user_id)

        if unread_only:
            query = query.filter(Notification.is_read.is_(False))

        if notification_type:
            query = query.filter(Notification.type == notification_type)

        total_count = query.count()

        offset = max(0, (page - 1) * page_size)
        items = (
            query.order_by(Notification.created_at.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )
        return items, total_count

    def get_unread_count(self, db: Session, user_id: str) -> int:
        """Efficiently compute unread notification count for a user."""
        count = (
            db.query(func.count(Notification.id))
            .filter(
                Notification.recipient_user_id == user_id,
                Notification.is_read.is_(False),
            )
            .scalar()
        )
        return count or 0

    def mark_as_read(self, db: Session, notification: Notification) -> Notification:
        """Mark a single notification as read."""
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.now(timezone.utc)
            notification.updated_at = datetime.now(timezone.utc)
            db.flush()
        return notification

    def mark_all_as_read(self, db: Session, user_id: str) -> int:
        """Mark all unread notifications for a user as read."""
        now = datetime.now(timezone.utc)
        count = (
            db.query(Notification)
            .filter(
                Notification.recipient_user_id == user_id,
                Notification.is_read.is_(False),
            )
            .update(
                {
                    Notification.is_read: True,
                    Notification.read_at: now,
                    Notification.updated_at: now,
                },
                synchronize_session=False,
            )
        )
        db.flush()
        return count

    def get_preferences(self, db: Session, user_id: str) -> Optional[NotificationPreference]:
        """Fetch notification preferences for a user."""
        return (
            db.query(NotificationPreference)
            .filter(NotificationPreference.user_id == user_id)
            .first()
        )

    def get_or_create_preferences(self, db: Session, user_id: str) -> NotificationPreference:
        """Fetch or initialize default preferences for a user."""
        pref = self.get_preferences(db, user_id)
        if not pref:
            pref = NotificationPreference(
                user_id=user_id,
                order_notifications=True,
                verification_notifications=True,
                logistics_notifications=True,
                payment_notifications=True,
                payout_notifications=True,
                matching_notifications=True,
                intelligence_notifications=True,
                system_notifications=True,
            )
            db.add(pref)
            db.flush()
        return pref

    def update_preferences(
        self, db: Session, user_id: str, data: NotificationPreferenceUpdate
    ) -> NotificationPreference:
        """Update notification preferences for a user, guaranteeing system_notifications remains True."""
        pref = self.get_or_create_preferences(db, user_id)
        now = datetime.now(timezone.utc)

        if data.order_notifications is not None:
            pref.order_notifications = data.order_notifications
        if data.verification_notifications is not None:
            pref.verification_notifications = data.verification_notifications
        if data.logistics_notifications is not None:
            pref.logistics_notifications = data.logistics_notifications
        if data.payment_notifications is not None:
            pref.payment_notifications = data.payment_notifications
        if data.payout_notifications is not None:
            pref.payout_notifications = data.payout_notifications
        if data.matching_notifications is not None:
            pref.matching_notifications = data.matching_notifications
        if data.intelligence_notifications is not None:
            pref.intelligence_notifications = data.intelligence_notifications

        # system_notifications is permanently True
        pref.system_notifications = True
        pref.updated_at = now

        db.flush()
        return pref

    def exists_duplicate(
        self,
        db: Session,
        recipient_user_id: str,
        type: NotificationType,
        title: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
    ) -> bool:
        """Check if an identical notification was already recorded for this entity and user."""
        query = db.query(Notification.id).filter(
            Notification.recipient_user_id == recipient_user_id,
            Notification.type == type,
            Notification.title == title,
        )
        if entity_type:
            query = query.filter(Notification.entity_type == entity_type)
        if entity_id:
            query = query.filter(Notification.entity_id == entity_id)

        return db.query(query.exists()).scalar() or False


notification_repo = NotificationRepository()
