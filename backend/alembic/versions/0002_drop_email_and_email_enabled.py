"""drop users.email and notification_settings.email_enabled

Revision ID: 0002_drop_email
Revises: 0001_initial
Create Date: 2026-07-21
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_drop_email"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_column("email")
    with op.batch_alter_table("notification_settings") as batch:
        batch.drop_column("email_enabled")


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("email", sa.String(128), nullable=False, server_default=""))
    with op.batch_alter_table("notification_settings") as batch:
        batch.add_column(sa.Column("email_enabled", sa.Boolean(), nullable=False, server_default=sa.text("0")))
