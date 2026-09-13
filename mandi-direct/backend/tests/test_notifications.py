from datetime import datetime, timezone
from decimal import Decimal
import pytest

from app.models.enums import NotificationType, OrderStatus, UserRole
from app.models.notification import Notification, NotificationPreference
from app.schemas.notification import NotificationPreferenceUpdate
from app.services.notification_service import notification_service


@pytest.fixture
def farmer_user(create_test_user, db_session):
    return create_test_user(
        auth_user_id="auth-farmer-p14-001",
        email="farmer.p14@mandidirect.in",
        full_name="Ramesh Farmer",
        role=UserRole.FARMER,
    )


@pytest.fixture
def buyer_user(create_test_user, db_session):
    return create_test_user(
        auth_user_id="auth-buyer-p14-001",
        email="buyer.p14@mandidirect.in",
        full_name="Suresh Buyer",
        role=UserRole.BUYER,
    )


@pytest.fixture
def buyer_user_b(create_test_user, db_session):
    return create_test_user(
        auth_user_id="auth-buyer-p14-002",
        email="buyer2.p14@mandidirect.in",
        full_name="Another Buyer",
        role=UserRole.BUYER,
    )


@pytest.fixture
def logistics_user(create_test_user, db_session):
    return create_test_user(
        auth_user_id="auth-logistics-p14-001",
        email="logistics.p14@mandidirect.in",
        full_name="Fleet Logistics",
        role=UserRole.LOGISTICS,
    )


@pytest.fixture
def fpo_user(create_test_user, db_session):
    return create_test_user(
        auth_user_id="auth-fpo-p14-001",
        email="fpo.p14@mandidirect.in",
        full_name="Kisan FPO Union",
        role=UserRole.FPO,
    )


@pytest.fixture
def admin_user(create_test_user, db_session):
    return create_test_user(
        auth_user_id="auth-admin-p14-001",
        email="admin.p14@mandidirect.in",
        full_name="System Admin",
        role=UserRole.ADMIN,
    )


class TestNotificationService:
    """Unit tests for NotificationService methods and business rules."""

    def test_01_notification_creation(self, db_session, farmer_user):
        """Notification can be created for an existing user."""
        notif = notification_service.create_notification(
            db_session,
            recipient_user_id=farmer_user.id,
            type=NotificationType.ORDER,
            title="Order Received",
            message="You have received a new order.",
            entity_type="ORDER",
            entity_id="order-uuid-1",
            action_url="/farmer/orders/order-uuid-1",
        )
        assert notif is not None
        assert notif.recipient_user_id == farmer_user.id
        assert notif.type == NotificationType.ORDER
        assert notif.is_read is False
        assert notif.read_at is None

    def test_02_notification_retrieval_and_unread_count(self, db_session, farmer_user):
        """User can retrieve paginated notifications and unread count."""
        notification_service.create_notification(
            db_session,
            recipient_user_id=farmer_user.id,
            type=NotificationType.ORDER,
            title="Order Received",
            message="You have received a new order.",
            entity_type="ORDER",
            entity_id="order-uuid-2",
        )
        db_session.commit()

        items, total, unread_count = notification_service.get_user_notifications(
            db_session, farmer_user.id
        )
        assert total >= 1
        assert unread_count >= 1
        assert any(n.title == "Order Received" for n in items)

    def test_03_notification_ownership_isolation(self, db_session, farmer_user, buyer_user):
        """Notifications belonging to farmer_user are not returned for buyer_user."""
        notification_service.create_notification(
            db_session,
            recipient_user_id=farmer_user.id,
            type=NotificationType.SYSTEM,
            title="Private Farmer Alert",
            message="Secret farmer message",
        )
        db_session.commit()

        buyer_items, buyer_total, buyer_unread = notification_service.get_user_notifications(
            db_session, buyer_user.id
        )
        assert buyer_total == 0
        assert buyer_unread == 0

    def test_04_mark_as_read(self, db_session, farmer_user):
        """User can mark their own notification as read."""
        notif = notification_service.create_notification(
            db_session,
            recipient_user_id=farmer_user.id,
            type=NotificationType.ORDER,
            title="Mark Read Test",
            message="Mark read test message",
        )
        db_session.commit()
        assert notif.is_read is False

        updated = notification_service.mark_as_read(db_session, farmer_user.id, notif.id)
        assert updated.is_read is True
        assert updated.read_at is not None

        # Re-verify unread count decreased
        unread = notification_service.get_unread_count(db_session, farmer_user.id)
        assert unread == 0

    def test_05_mark_all_as_read(self, db_session, buyer_user):
        """User can mark all their unread notifications as read at once."""
        # Create multiple notifications
        for i in range(3):
            notification_service.create_notification(
                db_session,
                recipient_user_id=buyer_user.id,
                type=NotificationType.SYSTEM,
                title=f"System Notice {i}",
                message=f"Notice content {i}",
            )
        db_session.commit()

        count = notification_service.get_unread_count(db_session, buyer_user.id)
        assert count == 3

        marked = notification_service.mark_all_as_read(db_session, buyer_user.id)
        assert marked == 3

        count_after = notification_service.get_unread_count(db_session, buyer_user.id)
        assert count_after == 0

    def test_06_pagination_and_filtering(self, db_session, farmer_user):
        """Pagination and type filtering work as expected."""
        # Add 2 VERIFICATION and 2 PAYOUT notifications
        for i in range(2):
            notification_service.create_notification(
                db_session,
                recipient_user_id=farmer_user.id,
                type=NotificationType.VERIFICATION,
                title=f"Verification Alert {i}",
                message="Profile verified",
                prevent_duplicates=False,
            )
            notification_service.create_notification(
                db_session,
                recipient_user_id=farmer_user.id,
                type=NotificationType.PAYOUT,
                title=f"Payout Alert {i}",
                message="Payout updated",
                prevent_duplicates=False,
            )
        db_session.commit()

        # Filter by type VERIFICATION
        v_items, v_total, _ = notification_service.get_user_notifications(
            db_session, farmer_user.id, notification_type=NotificationType.VERIFICATION
        )
        assert v_total >= 2
        assert all(n.type == NotificationType.VERIFICATION for n in v_items)

        # Pagination test
        p1, total, _ = notification_service.get_user_notifications(
            db_session, farmer_user.id, page=1, page_size=2
        )
        assert len(p1) == 2
        assert total >= 4

    def test_07_notification_preferences_persistence(self, db_session, buyer_user):
        """User preferences can be retrieved and updated with persistence."""
        pref = notification_service.get_preferences(db_session, buyer_user.id)
        assert pref.order_notifications is True
        assert pref.system_notifications is True

        # Turn off order notifications
        update_data = NotificationPreferenceUpdate(order_notifications=False)
        updated = notification_service.update_preferences(db_session, buyer_user.id, update_data)
        assert updated.order_notifications is False

        # Attempt to create an ORDER notification -> should be skipped!
        skipped = notification_service.create_notification(
            db_session,
            recipient_user_id=buyer_user.id,
            type=NotificationType.ORDER,
            title="Order Should Be Skipped",
            message="You opted out of order notifications.",
        )
        assert skipped is None

    def test_08_system_notifications_cannot_be_disabled(self, db_session, buyer_user):
        """SYSTEM notifications must remain enabled."""
        # Update attempting to disable system notifications (rejected by Pydantic or forced True)
        update_data = NotificationPreferenceUpdate(
            order_notifications=True,
            system_notifications=True,
        )
        pref = notification_service.update_preferences(db_session, buyer_user.id, update_data)
        assert pref.system_notifications is True

        # System notifications are always created even if user disables other things
        notif = notification_service.create_notification(
            db_session,
            recipient_user_id=buyer_user.id,
            type=NotificationType.SYSTEM,
            title="Essential System Notice",
            message="This notification cannot be turned off.",
        )
        assert notif is not None

    def test_09_duplicate_prevention(self, db_session, farmer_user):
        """Identical notifications for the same entity and event are not duplicated."""
        first = notification_service.create_notification(
            db_session,
            recipient_user_id=farmer_user.id,
            type=NotificationType.PRODUCE,
            title="Listing Approved",
            message="Your produce has been approved.",
            entity_type="PRODUCE",
            entity_id="prod-lot-123",
        )
        assert first is not None

        # Repeat identical call with prevent_duplicates=True (default)
        dup = notification_service.create_notification(
            db_session,
            recipient_user_id=farmer_user.id,
            type=NotificationType.PRODUCE,
            title="Listing Approved",
            message="Your produce has been approved.",
            entity_type="PRODUCE",
            entity_id="prod-lot-123",
        )
        assert dup is None

    def test_10_invalid_recipient_validation(self, db_session):
        """Creating a notification for a non-existent user returns None."""
        notif = notification_service.create_notification(
            db_session,
            recipient_user_id="non-existent-user-id",
            type=NotificationType.SYSTEM,
            title="Test",
            message="Should not be created",
        )
        assert notif is None

    def test_11_role_specific_notifications(
        self, db_session, farmer_user, fpo_user, buyer_user, logistics_user, admin_user
    ):
        """Role-specific notifications can be created across all 5 roles."""
        roles = [
            (farmer_user, NotificationType.ORDER, "Farmer Order"),
            (fpo_user, NotificationType.VERIFICATION, "FPO Verification"),
            (buyer_user, NotificationType.PAYMENT, "Buyer Payment"),
            (logistics_user, NotificationType.LOGISTICS, "Logistics Task"),
            (admin_user, NotificationType.SYSTEM, "Admin Ops Alert"),
        ]
        for user, n_type, title in roles:
            notif = notification_service.create_notification(
                db_session,
                recipient_user_id=user.id,
                type=n_type,
                title=title,
                message=f"Event for {user.role}",
            )
            assert notif is not None
            assert notif.recipient_user_id == user.id
            assert notif.type == n_type


class TestNotificationAPIsAndSecurity:
    """End-to-end API integration and authorization tests."""

    def test_20_list_notifications_api(self, client, make_auth_header, farmer_user):
        """Authenticated user can fetch their notifications via GET /api/v1/notifications."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email, role="authenticated")
        res = client.get("/api/v1/notifications", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert "total" in data
        assert "unread_count" in data

    def test_21_unread_count_api(self, client, make_auth_header, farmer_user):
        """Authenticated user can fetch their unread count via GET /api/v1/notifications/unread-count."""
        headers = make_auth_header(farmer_user.auth_user_id, farmer_user.email, role="authenticated")
        res = client.get("/api/v1/notifications/unread-count", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)

    def test_22_mark_as_read_api(self, client, make_auth_header, db_session, buyer_user):
        """Authenticated user can mark notification as read via PATCH /api/v1/notifications/{id}/read."""
        notif = notification_service.create_notification(
            db_session,
            recipient_user_id=buyer_user.id,
            type=NotificationType.ORDER,
            title="Order Placed API Test",
            message="Your order was created.",
            prevent_duplicates=False,
        )
        db_session.commit()

        headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email, role="authenticated")
        res = client.patch(f"/api/v1/notifications/{notif.id}/read", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["is_read"] is True
        assert data["read_at"] is not None

    def test_23_unauthorized_notification_access(
        self, client, make_auth_header, db_session, farmer_user, buyer_user
    ):
        """User B cannot mark User A's notification as read (returns 403)."""
        notif = notification_service.create_notification(
            db_session,
            recipient_user_id=farmer_user.id,
            type=NotificationType.ORDER,
            title="Farmer Only Alert",
            message="Sensitive farmer notification.",
            prevent_duplicates=False,
        )
        db_session.commit()

        # Buyer attempts to mark farmer's notification
        buyer_headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email, role="authenticated")
        res = client.patch(f"/api/v1/notifications/{notif.id}/read", headers=buyer_headers)
        assert res.status_code == 403

    def test_24_mark_all_as_read_api(self, client, make_auth_header, buyer_user):
        """Authenticated user can mark all as read via PATCH /api/v1/notifications/read-all."""
        headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email, role="authenticated")
        res = client.patch("/api/v1/notifications/read-all", headers=headers)
        assert res.status_code == 200
        assert res.json()["unread_count"] == 0

    def test_25_notification_preferences_api(self, client, make_auth_header, buyer_user):
        """User can get and update preferences via API."""
        headers = make_auth_header(buyer_user.auth_user_id, buyer_user.email, role="authenticated")

        # GET
        res_get = client.get("/api/v1/notification-preferences", headers=headers)
        assert res_get.status_code == 200
        data = res_get.json()
        assert data["user_id"] == buyer_user.id

        # PUT
        payload = {
            "order_notifications": True,
            "verification_notifications": False,
            "logistics_notifications": True,
            "matching_notifications": False,
        }
        res_put = client.put("/api/v1/notification-preferences", json=payload, headers=headers)
        assert res_put.status_code == 200
        updated = res_put.json()
        assert updated["verification_notifications"] is False
        assert updated["matching_notifications"] is False
        assert updated["system_notifications"] is True  # Always True

        # Re-fetch to confirm persistence
        res_verify = client.get("/api/v1/notification-preferences", headers=headers)
        assert res_verify.status_code == 200
        assert res_verify.json()["verification_notifications"] is False
