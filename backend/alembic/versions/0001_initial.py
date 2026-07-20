"""initial schema: users / notes / folders / snapshots / messages / notification_settings

Revision ID: 0001_initial
Revises:
Create Date: 2026-07-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("account", sa.String(64), nullable=False),
        sa.Column("password_hash", sa.String(128), nullable=False),
        sa.Column("name", sa.String(64), nullable=False, server_default=""),
        sa.Column("email", sa.String(128), nullable=False, server_default=""),
        sa.Column("bio", sa.String(500), nullable=False, server_default=""),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_account", "users", ["account"], unique=True)

    # notes
    op.create_table(
        "notes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False, server_default=""),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("excerpt", sa.String(600), nullable=False, server_default=""),
        sa.Column("tags", sa.JSON, nullable=False),
        sa.Column("folder_id", sa.String(36), nullable=True),
        sa.Column("is_favorite", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("is_deleted", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cover", sa.String(512), nullable=True),
        sa.Column("pinned", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("read_only", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_notes_is_deleted", "notes", ["is_deleted"])
    op.create_index("ix_notes_user_deleted", "notes", ["user_id", "is_deleted"])
    op.create_index("ix_notes_user_folder", "notes", ["user_id", "folder_id"])
    op.create_index("ix_notes_user_updated", "notes", ["user_id", "updated_at"])

    # folders
    op.create_table(
        "folders",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(64), nullable=False),
        sa.Column("icon", sa.String(32), nullable=False, server_default="folder"),
        sa.Column("parent_id", sa.String(36), nullable=True),
        sa.Column("is_inbox", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "parent_id", "name", name="uq_folders_user_parent_name"),
    )

    # snapshots
    op.create_table(
        "snapshots",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("note_id", sa.String(36), sa.ForeignKey("notes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(64), nullable=False, server_default="自动保存"),
        sa.Column("note_title", sa.String(500), nullable=False, server_default=""),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_snapshots_note_created", "snapshots", ["note_id", "created_at"])
    op.create_index("ix_snapshots_user", "snapshots", ["user_id"])

    # messages
    op.create_table(
        "messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False, server_default=""),
        sa.Column("summary", sa.String(500), nullable=False, server_default=""),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("type", sa.String(32), nullable=False, server_default="system"),
        sa.Column("category", sa.String(32), nullable=False, server_default="system"),
        sa.Column("source", sa.String(64), nullable=False, server_default="系统"),
        sa.Column("tag", sa.String(32), nullable=False, server_default=""),
        sa.Column("unread", sa.Boolean, nullable=False, server_default=sa.text("1")),
        sa.Column("primary_action", sa.String(64), nullable=True),
        sa.Column("secondary_action", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # notification_settings
    op.create_table(
        "notification_settings",
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("system_enabled", sa.Boolean, nullable=False, server_default=sa.text("1")),
        sa.Column("security_enabled", sa.Boolean, nullable=False, server_default=sa.text("1")),
        sa.Column("content_enabled", sa.Boolean, nullable=False, server_default=sa.text("1")),
        sa.Column("email_enabled", sa.Boolean, nullable=False, server_default=sa.text("0")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("notification_settings")
    op.drop_table("messages")
    op.drop_index("ix_snapshots_user", table_name="snapshots")
    op.drop_index("ix_snapshots_note_created", table_name="snapshots")
    op.drop_table("snapshots")
    op.drop_table("folders")
    op.drop_index("ix_notes_user_updated", table_name="notes")
    op.drop_index("ix_notes_user_folder", table_name="notes")
    op.drop_index("ix_notes_user_deleted", table_name="notes")
    op.drop_index("ix_notes_is_deleted", table_name="notes")
    op.drop_table("notes")
    op.drop_index("ix_users_account", table_name="users")
    op.drop_table("users")
