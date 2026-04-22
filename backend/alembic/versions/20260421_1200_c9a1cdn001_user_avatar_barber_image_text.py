"""User avatar column; barber profile_image widened for CDN URLs

Revision ID: c9a1cdn001
Revises: b535fabbb631
Create Date: 2026-04-21

"""
from alembic import op
import sqlalchemy as sa


revision = "c9a1cdn001"
down_revision = "b535fabbb631"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar", sa.Text(), nullable=True))
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.alter_column(
            "barbers",
            "profile_image",
            existing_type=sa.String(length=500),
            type_=sa.Text(),
            existing_nullable=True,
        )


def downgrade() -> None:
    op.drop_column("users", "avatar")
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.alter_column(
            "barbers",
            "profile_image",
            existing_type=sa.Text(),
            type_=sa.String(length=500),
            existing_nullable=True,
        )
