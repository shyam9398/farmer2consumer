from typing import Optional
from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.enums import NotificationType
from app.models.profile import Profile
from app.schemas.notification import (
    NotificationListResponse,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
    NotificationResponse,
    UnreadNotificationCountResponse,
)
from app.services.notification_service import notification_service

router = APIRouter()


@router.get(
    "/notifications",
    response_model=NotificationListResponse,
    summary="List Authenticated User Notifications",
    description="Retrieve paginated notifications with optional unread and category filters for the current user.",
)
def list_notifications(
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    type: Optional[NotificationType] = Query(None, description="Filter by notification type"),
    current_user: Profile = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> NotificationListResponse:
    items, total, unread_count = notification_service.get_user_notifications(
        db,
        current_user.id,
        unread_only=unread_only,
        notification_type=type,
        page=page,
        page_size=page_size,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        unread_count=unread_count,
    )


@router.get(
    "/notifications/unread-count",
    response_model=UnreadNotificationCountResponse,
    summary="Get Unread Notification Count",
    description="Returns the total count of unread notifications for the authenticated user.",
)
def get_unread_count(
    current_user: Profile = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> UnreadNotificationCountResponse:
    count = notification_service.get_unread_count(db, current_user.id)
    return UnreadNotificationCountResponse(unread_count=count)


@router.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark Notification as Read",
    description="Marks a specific notification as read. Fails if the notification does not belong to the user.",
)
def mark_notification_as_read(
    notification_id: str = Path(..., description="ID of the notification to mark read"),
    current_user: Profile = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> NotificationResponse:
    notification = notification_service.mark_as_read(db, current_user.id, notification_id)
    return NotificationResponse.model_validate(notification)


@router.patch(
    "/notifications/read-all",
    response_model=UnreadNotificationCountResponse,
    summary="Mark All Notifications as Read",
    description="Marks all unread notifications for the authenticated user as read.",
)
def mark_all_notifications_as_read(
    current_user: Profile = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> UnreadNotificationCountResponse:
    notification_service.mark_all_as_read(db, current_user.id)
    return UnreadNotificationCountResponse(unread_count=0)


@router.get(
    "/notification-preferences",
    response_model=NotificationPreferenceResponse,
    summary="Get Notification Preferences",
    description="Fetch notification delivery preferences for the authenticated user.",
)
def get_notification_preferences(
    current_user: Profile = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> NotificationPreferenceResponse:
    pref = notification_service.get_preferences(db, current_user.id)
    return NotificationPreferenceResponse.model_validate(pref)


@router.put(
    "/notification-preferences",
    response_model=NotificationPreferenceResponse,
    summary="Update Notification Preferences",
    description="Update notification delivery preferences. SYSTEM notifications cannot be disabled.",
)
def update_notification_preferences(
    payload: NotificationPreferenceUpdate,
    current_user: Profile = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> NotificationPreferenceResponse:
    pref = notification_service.update_preferences(db, current_user.id, payload)
    return NotificationPreferenceResponse.model_validate(pref)
