from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.enums import NotificationType


class NotificationBase(BaseModel):
    recipient_user_id: str
    type: NotificationType
    title: str = Field(..., max_length=255)
    message: str
    entity_type: Optional[str] = Field(None, max_length=50)
    entity_id: Optional[str] = Field(None, max_length=36)
    action_url: Optional[str] = Field(None, max_length=255)


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    recipient_user_id: str
    type: NotificationType
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    action_url: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    unread_count: int


class UnreadNotificationCountResponse(BaseModel):
    unread_count: int


class NotificationPreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    order_notifications: bool
    verification_notifications: bool
    logistics_notifications: bool
    payment_notifications: bool
    payout_notifications: bool
    matching_notifications: bool
    intelligence_notifications: bool
    system_notifications: bool
    created_at: datetime
    updated_at: datetime


class NotificationPreferenceUpdate(BaseModel):
    order_notifications: Optional[bool] = None
    verification_notifications: Optional[bool] = None
    logistics_notifications: Optional[bool] = None
    payment_notifications: Optional[bool] = None
    payout_notifications: Optional[bool] = None
    matching_notifications: Optional[bool] = None
    intelligence_notifications: Optional[bool] = None
    system_notifications: Optional[bool] = Field(
        default=True,
        description="System notifications cannot be disabled",
    )

    @field_validator("system_notifications")
    @classmethod
    def validate_system_notifications(cls, v: Optional[bool]) -> bool:
        if v is False:
            raise ValueError("SYSTEM notifications cannot be disabled")
        return True
