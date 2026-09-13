"""Create notifications and notification_preferences tables for Phase 14 Notifications & Communication.

Revision ID: 013_notifications
Revises: 012_buyer_preferences
Create Date: 2026-09-12 10:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "013_notifications"
down_revision: Union[str, None] = "012_buyer_preferences"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create notifications table
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("recipient_user_id", sa.String(length=36), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=True),
        sa.Column("entity_id", sa.String(length=36), nullable=True),
        sa.Column("action_url", sa.String(length=255), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["recipient_user_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_recipient_id", "notifications", ["recipient_user_id"])
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])
    op.create_index("ix_notifications_recipient_is_read", "notifications", ["recipient_user_id", "is_read"])
    op.create_index("ix_notifications_recipient_created_at", "notifications", ["recipient_user_id", "created_at"])

    # 2. Create notification_preferences table
    op.create_table(
        "notification_preferences",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("order_notifications", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("verification_notifications", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("logistics_notifications", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("payment_notifications", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("payout_notifications", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("matching_notifications", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("intelligence_notifications", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("system_notifications", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_notification_preferences_user_id"),
    )
    op.create_index("ix_notification_preferences_user_id", "notification_preferences", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_notification_preferences_user_id", table_name="notification_preferences")
    op.drop_table("notification_preferences")
    op.drop_index("ix_notifications_recipient_created_at", table_name="notifications")
    op.drop_index("ix_notifications_recipient_is_read", table_name="notifications")
    op.drop_index("ix_notifications_created_at", table_name="notifications")
    op.drop_index("ix_notifications_is_read", table_name="notifications")
    op.drop_index("ix_notifications_recipient_id", table_name="notifications")
    op.drop_table("notifications")
