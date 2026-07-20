"""快照模型。"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Snapshot(Base):
    """笔记版本快照。双重保留策略：每笔记最多 20 条 + 7 天 TTL。"""

    __tablename__ = "snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)  # UUID
    note_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("notes.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(64), nullable=False, default="自动保存")
    note_title: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_snapshots_note_created", "note_id", "created_at"),
        Index("ix_snapshots_user", "user_id"),
    )

    def to_dict(self) -> dict:
        """前端 Snapshot 字段对齐。"""
        return {
            "id": self.id,
            "noteId": self.note_id,
            "title": self.title,
            "noteTitle": self.note_title,
            "content": self.content,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
