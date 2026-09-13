"""Add metadata columns to produce_images for Phase 5.

Revision ID: 004_produce_images_metadata
Revises: 003_produce_listings_and_images
Create Date: 2026-09-08 22:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004_produce_images_metadata"
down_revision: Union[str, None] = "003_produce_listings_and_images"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("produce_images") as batch_op:
        batch_op.add_column(sa.Column("public_url", sa.Text(), nullable=True))
        batch_op.add_column(
            sa.Column(
                "file_name",
                sa.String(length=255),
                nullable=False,
                server_default="photo.jpg",
            )
        )
        batch_op.add_column(
            sa.Column(
                "mime_type",
                sa.String(length=100),
                nullable=False,
                server_default="image/jpeg",
            )
        )
        batch_op.add_column(
            sa.Column(
                "file_size",
                sa.Integer(),
                nullable=False,
                server_default="0",
            )
        )
        batch_op.add_column(sa.Column("width", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("height", sa.Integer(), nullable=True))
        batch_op.add_column(
            sa.Column(
                "display_order",
                sa.Integer(),
                nullable=False,
                server_default="0",
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("produce_images") as batch_op:
        batch_op.drop_column("display_order")
        batch_op.drop_column("height")
        batch_op.drop_column("width")
        batch_op.drop_column("file_size")
        batch_op.drop_column("mime_type")
        batch_op.drop_column("file_name")
        batch_op.drop_column("public_url")
