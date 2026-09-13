"""Complete Supabase PostgreSQL schema reconciliation.
Adds FPO organizations, members, payments, vehicles, farmer reviews,
logistics location tracking, delivery events, audit logs, and demand snapshots.
Guards with idempotent inspection to ensure zero conflicts on existing databases.

Revision ID: 014_complete_supabase_schema
Revises: 013_notifications
Create Date: 2026-09-12 12:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "014_complete_supabase_schema"
down_revision: Union[str, None] = "013_notifications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    def get_existing_cols(table_name: str) -> set:
        if table_name not in existing_tables:
            return set()
        return {c["name"] for c in inspector.get_columns(table_name)}

    # 1. Profile extensions
    profile_cols = get_existing_cols("profiles")
    if "avatar_url" not in profile_cols:
        op.add_column("profiles", sa.Column("avatar_url", sa.Text(), nullable=True))
    if "is_active" not in profile_cols:
        op.add_column(
            "profiles",
            sa.Column(
                "is_active",
                sa.Boolean(),
                server_default=sa.text("true"),
                nullable=False,
            ),
        )

    # 2. Farmer profile extensions
    farmer_profile_cols = get_existing_cols("farmer_profiles")
    if "rating" not in farmer_profile_cols:
        op.add_column(
            "farmer_profiles",
            sa.Column("rating", sa.Numeric(3, 2), nullable=True),
        )
    if "review_count" not in farmer_profile_cols:
        op.add_column(
            "farmer_profiles",
            sa.Column(
                "review_count",
                sa.Integer(),
                server_default="0",
                nullable=False,
            ),
        )

    # 3. FPO Organizations table
    if "fpo_organizations" not in existing_tables:
        op.create_table(
            "fpo_organizations",
            sa.Column("id", sa.String(36), primary_key=True, nullable=False),
            sa.Column("name", sa.String(200), nullable=False),
            sa.Column("registration_number", sa.String(100), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("phone", sa.String(32), nullable=True),
            sa.Column("email", sa.String(255), nullable=True),
            sa.Column("address", sa.Text(), nullable=True),
            sa.Column("village", sa.String(100), nullable=True),
            sa.Column("mandal", sa.String(100), nullable=True),
            sa.Column("district", sa.String(100), nullable=True),
            sa.Column("state", sa.String(100), nullable=True),
            sa.Column("pincode", sa.String(10), nullable=True),
            sa.Column("latitude", sa.Float(), nullable=True),
            sa.Column("longitude", sa.Float(), nullable=True),
            sa.Column(
                "verification_status",
                sa.String(32),
                nullable=False,
                server_default="PENDING",
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )
        op.create_index("ix_fpo_organizations_name", "fpo_organizations", ["name"])
        op.create_index(
            "ix_fpo_organizations_reg_num",
            "fpo_organizations",
            ["registration_number"],
            unique=True,
        )
        op.create_index("ix_fpo_organizations_district", "fpo_organizations", ["district"])
        op.create_index("ix_fpo_organizations_state", "fpo_organizations", ["state"])
        op.create_index("ix_fpo_organizations_pincode", "fpo_organizations", ["pincode"])
        op.create_index(
            "ix_fpo_organizations_status",
            "fpo_organizations",
            ["verification_status"],
        )

    # 4. FPO Members table
    if "fpo_members" not in existing_tables:
        op.create_table(
            "fpo_members",
            sa.Column("id", sa.String(36), primary_key=True, nullable=False),
            sa.Column(
                "fpo_id",
                sa.String(36),
                sa.ForeignKey("fpo_organizations.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "farmer_profile_id",
                sa.String(36),
                sa.ForeignKey("farmer_profiles.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "membership_status",
                sa.String(32),
                nullable=False,
                server_default="ACTIVE",
            ),
            sa.Column(
                "joined_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.UniqueConstraint("fpo_id", "farmer_profile_id", name="uq_fpo_farmer_member"),
        )
        op.create_index("ix_fpo_members_fpo_id", "fpo_members", ["fpo_id"])
        op.create_index(
            "ix_fpo_members_farmer_profile_id",
            "fpo_members",
            ["farmer_profile_id"],
        )

    # 5. Link FPO to Produce Listings and Collection Points
    produce_cols = get_existing_cols("produce_listings")
    if "fpo_id" not in produce_cols:
        op.add_column(
            "produce_listings",
            sa.Column(
                "fpo_id",
                sa.String(36),
                sa.ForeignKey("fpo_organizations.id", ondelete="SET NULL"),
                nullable=True,
            ),
        )
        op.create_index("ix_produce_listings_fpo_id", "produce_listings", ["fpo_id"])

    cp_cols = get_existing_cols("collection_points")
    if "fpo_id" not in cp_cols:
        op.add_column(
            "collection_points",
            sa.Column(
                "fpo_id",
                sa.String(36),
                sa.ForeignKey("fpo_organizations.id", ondelete="SET NULL"),
                nullable=True,
            ),
        )
        op.create_index("ix_collection_points_fpo_id", "collection_points", ["fpo_id"])

    # 6. Vehicles table
    if "vehicles" not in existing_tables:
        op.create_table(
            "vehicles",
            sa.Column("id", sa.String(36), primary_key=True, nullable=False),
            sa.Column(
                "logistics_user_id",
                sa.String(36),
                sa.ForeignKey("profiles.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("vehicle_number", sa.String(32), nullable=False),
            sa.Column("vehicle_type", sa.String(64), nullable=False),
            sa.Column("capacity", sa.Numeric(10, 2), nullable=False),
            sa.Column(
                "availability_status",
                sa.String(32),
                nullable=False,
                server_default="AVAILABLE",
            ),
            sa.Column("current_latitude", sa.Float(), nullable=True),
            sa.Column("current_longitude", sa.Float(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.UniqueConstraint("vehicle_number", name="uq_vehicles_vehicle_number"),
        )
        op.create_index("ix_vehicles_vehicle_number", "vehicles", ["vehicle_number"])
        op.create_index("ix_vehicles_logistics_user_id", "vehicles", ["logistics_user_id"])
        op.create_index(
            "ix_vehicles_availability_status", "vehicles", ["availability_status"]
        )

    # 7. Order logistics fleet extensions
    order_logistics_cols = get_existing_cols("order_logistics")
    if "booking_status" not in order_logistics_cols:
        op.add_column(
            "order_logistics",
            sa.Column(
                "booking_status",
                sa.String(32),
                server_default="BOOKING_REQUESTED",
                nullable=False,
            ),
        )
        op.create_index(
            "ix_order_logistics_booking_status",
            "order_logistics",
            ["booking_status"],
        )
    if "assigned_vehicle_id" not in order_logistics_cols:
        op.add_column(
            "order_logistics",
            sa.Column(
                "assigned_vehicle_id",
                sa.String(36),
                sa.ForeignKey("vehicles.id", ondelete="SET NULL"),
                nullable=True,
            ),
        )
        op.create_index(
            "ix_order_logistics_assigned_vehicle_id",
            "order_logistics",
            ["assigned_vehicle_id"],
        )
    if "logistics_user_id" not in order_logistics_cols:
        op.add_column(
            "order_logistics",
            sa.Column(
                "logistics_user_id",
                sa.String(36),
                sa.ForeignKey("profiles.id", ondelete="SET NULL"),
                nullable=True,
            ),
        )
        op.create_index(
            "ix_order_logistics_logistics_user_id",
            "order_logistics",
            ["logistics_user_id"],
        )
    if "current_latitude" not in order_logistics_cols:
        op.add_column(
            "order_logistics",
            sa.Column("current_latitude", sa.Float(), nullable=True),
        )
    if "current_longitude" not in order_logistics_cols:
        op.add_column(
            "order_logistics",
            sa.Column("current_longitude", sa.Float(), nullable=True),
        )

    # 8. Farmer reviews table
    if "farmer_reviews" not in existing_tables:
        op.create_table(
            "farmer_reviews",
            sa.Column("id", sa.String(36), primary_key=True, nullable=False),
            sa.Column(
                "farmer_profile_id",
                sa.String(36),
                sa.ForeignKey("farmer_profiles.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "buyer_user_id",
                sa.String(36),
                sa.ForeignKey("profiles.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "order_id",
                sa.String(36),
                sa.ForeignKey("orders.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "order_item_id",
                sa.String(36),
                sa.ForeignKey("order_items.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("rating", sa.Integer(), nullable=False),
            sa.Column("comment", sa.Text(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.CheckConstraint(
                "rating >= 1 AND rating <= 5", name="check_valid_review_rating_range"
            ),
            sa.UniqueConstraint(
                "buyer_user_id", "order_item_id", name="uq_buyer_order_item_review"
            ),
        )
        op.create_index(
            "ix_farmer_reviews_farmer_profile_id",
            "farmer_reviews",
            ["farmer_profile_id"],
        )
        op.create_index(
            "ix_farmer_reviews_buyer_user_id",
            "farmer_reviews",
            ["buyer_user_id"],
        )
        op.create_index(
            "ix_farmer_reviews_order_id",
            "farmer_reviews",
            ["order_id"],
        )

    # 9. Payments table
    if "payments" not in existing_tables:
        op.create_table(
            "payments",
            sa.Column("id", sa.String(36), primary_key=True, nullable=False),
            sa.Column(
                "order_id",
                sa.String(36),
                sa.ForeignKey("orders.id", ondelete="RESTRICT"),
                nullable=False,
                unique=True,
            ),
            sa.Column(
                "buyer_user_id",
                sa.String(36),
                sa.ForeignKey("profiles.id", ondelete="RESTRICT"),
                nullable=False,
            ),
            sa.Column("amount", sa.Numeric(12, 2), nullable=False),
            sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
            sa.Column(
                "payment_status",
                sa.String(32),
                nullable=False,
                server_default="PENDING",
            ),
            sa.Column("payment_method", sa.String(50), nullable=True),
            sa.Column("provider", sa.String(50), nullable=True),
            sa.Column("provider_payment_id", sa.String(100), nullable=True),
            sa.Column("provider_order_id", sa.String(100), nullable=True),
            sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.CheckConstraint(
                "payment_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED')",
                name="check_valid_payment_record_status",
            ),
        )
        op.create_index("ix_payments_order_id", "payments", ["order_id"])
        op.create_index(
            "ix_payments_buyer_status", "payments", ["buyer_user_id", "payment_status"]
        )
        op.create_index(
            "ix_payments_provider_payment_id", "payments", ["provider_payment_id"]
        )

    # 10. Logistics location updates
    if "logistics_location_updates" not in existing_tables:
        op.create_table(
            "logistics_location_updates",
            sa.Column("id", sa.String(36), primary_key=True, nullable=False),
            sa.Column(
                "order_id",
                sa.String(36),
                sa.ForeignKey("orders.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "vehicle_id",
                sa.String(36),
                sa.ForeignKey("vehicles.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column(
                "logistics_profile_id",
                sa.String(36),
                sa.ForeignKey("profiles.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("latitude", sa.Float(), nullable=False),
            sa.Column("longitude", sa.Float(), nullable=False),
            sa.Column("accuracy", sa.Float(), nullable=True),
            sa.Column(
                "recorded_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )
        op.create_index(
            "ix_location_updates_order_time",
            "logistics_location_updates",
            ["order_id", "recorded_at"],
        )

    # 11. Delivery events table
    if "delivery_events" not in existing_tables:
        op.create_table(
            "delivery_events",
            sa.Column("id", sa.String(36), primary_key=True, nullable=False),
            sa.Column(
                "order_id",
                sa.String(36),
                sa.ForeignKey("orders.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("event_type", sa.String(64), nullable=False),
            sa.Column("latitude", sa.Float(), nullable=True),
            sa.Column("longitude", sa.Float(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column(
                "created_by",
                sa.String(36),
                sa.ForeignKey("profiles.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )
        op.create_index(
            "ix_delivery_events_order_time",
            "delivery_events",
            ["order_id", "created_at"],
        )
        op.create_index("ix_delivery_events_event_type", "delivery_events", ["event_type"])

    # 12. System audit logs table
    if "audit_logs" not in existing_tables:
        op.create_table(
            "audit_logs",
            sa.Column("id", sa.String(36), primary_key=True, nullable=False),
            sa.Column(
                "actor_user_id",
                sa.String(36),
                sa.ForeignKey("profiles.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column("action", sa.String(100), nullable=False),
            sa.Column("entity_type", sa.String(50), nullable=False),
            sa.Column("entity_id", sa.String(36), nullable=True),
            sa.Column("previous_value", sa.JSON(), nullable=True),
            sa.Column("new_value", sa.JSON(), nullable=True),
            sa.Column("reason", sa.Text(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )
        op.create_index(
            "ix_audit_logs_entity", "audit_logs", ["entity_type", "entity_id"]
        )
        op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])
        op.create_index("ix_audit_logs_action", "audit_logs", ["action"])

    # 13. Demand snapshots table
    if "demand_snapshots" not in existing_tables:
        op.create_table(
            "demand_snapshots",
            sa.Column("id", sa.String(36), primary_key=True, nullable=False),
            sa.Column("product_name", sa.String(150), nullable=False),
            sa.Column("category", sa.String(50), nullable=True),
            sa.Column("district", sa.String(100), nullable=True),
            sa.Column("state", sa.String(100), nullable=True),
            sa.Column("period_start", sa.Date(), nullable=False),
            sa.Column("period_end", sa.Date(), nullable=False),
            sa.Column(
                "order_count",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
            sa.Column(
                "quantity_sold",
                sa.Numeric(12, 2),
                nullable=False,
                server_default="0",
            ),
            sa.Column(
                "unique_buyers",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
            sa.Column("demand_score", sa.Numeric(5, 2), nullable=True),
            sa.Column("demand_level", sa.String(32), nullable=True),
            sa.Column("trend", sa.String(32), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )
        op.create_index(
            "ix_demand_snapshots_product_date",
            "demand_snapshots",
            ["product_name", "period_start"],
        )
        op.create_index(
            "ix_demand_snapshots_district_product",
            "demand_snapshots",
            ["district", "product_name"],
        )


def downgrade() -> None:
    op.drop_table("demand_snapshots")
    op.drop_table("audit_logs")
    op.drop_table("delivery_events")
    op.drop_table("logistics_location_updates")
    op.drop_table("payments")
    op.drop_table("farmer_reviews")

    op.drop_index("ix_order_logistics_logistics_user_id", table_name="order_logistics")
    op.drop_index("ix_order_logistics_assigned_vehicle_id", table_name="order_logistics")
    op.drop_index("ix_order_logistics_booking_status", table_name="order_logistics")
    op.drop_column("order_logistics", "current_longitude")
    op.drop_column("order_logistics", "current_latitude")
    op.drop_column("order_logistics", "logistics_user_id")
    op.drop_column("order_logistics", "assigned_vehicle_id")
    op.drop_column("order_logistics", "booking_status")

    op.drop_table("vehicles")
    op.drop_index("ix_collection_points_fpo_id", table_name="collection_points")
    op.drop_column("collection_points", "fpo_id")
    op.drop_index("ix_produce_listings_fpo_id", table_name="produce_listings")
    op.drop_column("produce_listings", "fpo_id")
    op.drop_table("fpo_members")
    op.drop_table("fpo_organizations")
    op.drop_column("farmer_profiles", "review_count")
    op.drop_column("farmer_profiles", "rating")
    op.drop_column("profiles", "is_active")
    op.drop_column("profiles", "avatar_url")
