"""Create initial profiles table with role and status constraints

Revision ID: 001_profiles
Revises: 
Create Date: 2026-09-08 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_profiles"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("auth_user_id", sa.String(length=64), nullable=False, unique=True),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False, server_default="FARMER"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="ACTIVE"),
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
            "role IN ('FARMER', 'BUYER', 'ADMIN', 'FPO', 'LOGISTICS')",
            name="check_valid_user_role",
        ),
        sa.CheckConstraint(
            "status IN ('ACTIVE', 'PENDING', 'SUSPENDED')",
            name="check_valid_user_status",
        ),
    )
    op.create_index("ix_profiles_auth_user_id", "profiles", ["auth_user_id"], unique=True)
    op.create_index("ix_profiles_email", "profiles", ["email"])
    op.create_index("ix_profiles_role", "profiles", ["role"])


def downgrade() -> None:
    op.drop_index("ix_profiles_role", table_name="profiles")
    op.drop_index("ix_profiles_email", table_name="profiles")
    op.drop_index("ix_profiles_auth_user_id", table_name="profiles")
    op.drop_table("profiles")
