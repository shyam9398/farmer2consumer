from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.logging import get_logger
from app.models.enums import NotificationType
from app.models.notification import Notification, NotificationPreference
from app.models.profile import Profile
from app.repositories.notification import notification_repo
from app.schemas.notification import NotificationPreferenceUpdate

logger = get_logger("notification_service")


class NotificationService:
    """
    Centralized service for creating, managing, and delivering persistent notifications
    derived exclusively from real Mandi Direct business events.
    """

    def _is_type_enabled_by_preferences(
        self, pref: NotificationPreference, notification_type: NotificationType
    ) -> bool:
        """Check if user has opted into the notification category."""
        if notification_type in (NotificationType.SYSTEM, NotificationType.AUTH):
            return True
        elif notification_type == NotificationType.ORDER:
            return pref.order_notifications
        elif notification_type in (
            NotificationType.VERIFICATION,
            NotificationType.PRODUCE,
            NotificationType.PROFILE,
        ):
            return pref.verification_notifications
        elif notification_type == NotificationType.LOGISTICS:
            return pref.logistics_notifications
        elif notification_type == NotificationType.PAYMENT:
            return pref.payment_notifications
        elif notification_type == NotificationType.PAYOUT:
            return pref.payout_notifications
        elif notification_type == NotificationType.MATCHING:
            return pref.matching_notifications
        elif notification_type in (
            NotificationType.PRICE_INTELLIGENCE,
            NotificationType.DEMAND_INTELLIGENCE,
        ):
            return pref.intelligence_notifications
        return True

    def create_notification(
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
        prevent_duplicates: bool = True,
    ) -> Optional[Notification]:
        """
        Create and persist a notification from a verified system event.
        - Validates recipient profile exists.
        - Checks recipient notification preferences.
        - Deduplicates identical entity-state events.
        - Sanitizes action_url to relative internal paths only.
        """
        if not recipient_user_id:
            logger.warning("Attempted to create notification with empty recipient_user_id")
            return None

        # 1. Verify recipient profile exists
        profile = db.query(Profile.id).filter(Profile.id == recipient_user_id).first()
        if not profile:
            logger.warning(f"Recipient user {recipient_user_id} does not exist. Skipping notification.")
            return None

        # 2. Check notification preferences
        pref = notification_repo.get_or_create_preferences(db, recipient_user_id)
        if not self._is_type_enabled_by_preferences(pref, type):
            logger.info(
                f"Notification of type {type} disabled by recipient {recipient_user_id} preferences. Skipping."
            )
            return None

        # 3. Deduplication check
        if prevent_duplicates and notification_repo.exists_duplicate(
            db,
            recipient_user_id=recipient_user_id,
            type=type,
            title=title,
            entity_type=entity_type,
            entity_id=entity_id,
        ):
            logger.info(
                f"Duplicate notification for {recipient_user_id}, type={type}, entity={entity_type}:{entity_id}. Skipping."
            )
            return None

        # 4. Sanitize action_url
        safe_action_url = None
        if action_url:
            cleaned = action_url.strip()
            # Only allow internal relative paths
            if cleaned.startswith("/") and not cleaned.startswith("//"):
                safe_action_url = cleaned

        # 5. Persist notification
        notification = notification_repo.create(
            db,
            recipient_user_id=recipient_user_id,
            type=type,
            title=title.strip(),
            message=message.strip(),
            entity_type=entity_type,
            entity_id=entity_id,
            action_url=safe_action_url,
        )
        logger.info(
            f"Notification created [id={notification.id}, recipient={recipient_user_id}, type={type}]"
        )
        return notification

    def get_user_notifications(
        self,
        db: Session,
        user_id: str,
        *,
        unread_only: bool = False,
        notification_type: Optional[NotificationType] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Notification], int, int]:
        """
        Fetch paginated notifications for the authenticated user along with total and unread count.
        """
        items, total = notification_repo.get_user_notifications(
            db,
            user_id,
            unread_only=unread_only,
            notification_type=notification_type,
            page=page,
            page_size=page_size,
        )
        unread_count = notification_repo.get_unread_count(db, user_id)
        return items, total, unread_count

    def get_unread_count(self, db: Session, user_id: str) -> int:
        """Fetch unread count for the authenticated user."""
        return notification_repo.get_unread_count(db, user_id)

    def mark_as_read(
        self, db: Session, user_id: str, notification_id: str
    ) -> Notification:
        """
        Mark a notification as read after strictly verifying ownership.
        """
        notification = notification_repo.get_by_id(db, notification_id)
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )
        if notification.recipient_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to access this notification",
            )

        notification_repo.mark_as_read(db, notification)
        db.commit()
        db.refresh(notification)
        return notification

    def mark_all_as_read(self, db: Session, user_id: str) -> int:
        """Mark all unread notifications for the authenticated user as read."""
        count = notification_repo.mark_all_as_read(db, user_id)
        db.commit()
        return count

    def get_preferences(
        self, db: Session, user_id: str
    ) -> NotificationPreference:
        """Retrieve or initialize notification preferences for authenticated user."""
        pref = notification_repo.get_or_create_preferences(db, user_id)
        db.commit()
        db.refresh(pref)
        return pref

    def update_preferences(
        self, db: Session, user_id: str, data: NotificationPreferenceUpdate
    ) -> NotificationPreference:
        """Update notification preferences for authenticated user."""
        pref = notification_repo.update_preferences(db, user_id, data)
        db.commit()
        db.refresh(pref)
        return pref


notification_service = NotificationService()
