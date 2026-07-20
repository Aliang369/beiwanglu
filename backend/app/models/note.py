"""笔记模型。"""
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Note(Base):
    """笔记表。content 存 ProseMirror doc JSON，tags 为 note-scoped 标签数组。"""

    __tablename__ = "notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)  # UUID
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    excerpt: Mapped[str] = mapped_column(String(600), nullable=False, default="")
    tags: Mapped[list] = mapped_column(JSON, nullable=False, default=list)  # NoteTag[]
    folder_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cover: Mapped[str | None] = mapped_column(String(512), nullable=True)
    pinned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    read_only: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_notes_user_deleted", "user_id", "is_deleted"),
        Index("ix_notes_user_folder", "user_id", "folder_id"),
        Index("ix_notes_user_updated", "user_id", "updated_at"),
    )

    def to_dict(self) -> dict:
        """前端 Note 字段对齐。"""
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "excerpt": self.excerpt,
            "tags": self.tags or [],
            "folderId": self.folder_id,
            "isFavorite": self.is_favorite,
            "isDeleted": self.is_deleted,
            "deletedAt": self.deleted_at.isoformat() if self.deleted_at else None,
            "cover": self.cover,
            "pinned": self.pinned,
            "readOnly": self.read_only,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
