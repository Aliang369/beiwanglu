"""文件夹模型。"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Folder(Base):
    """文件夹表。一层子文件夹（parentId 仅根级）。inbox 为受保护默认文件夹。"""

    __tablename__ = "folders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)  # UUID
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    icon: Mapped[str] = mapped_column(String(32), nullable=False, default="folder")
    parent_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    is_inbox: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

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
        # 同级不允许同名（按 parent_id 分组）
        UniqueConstraint("user_id", "parent_id", "name", name="uq_folders_user_parent_name"),
    )

    def to_dict(self) -> dict:
        """前端 Folder 字段对齐。"""
        return {
            "id": self.id,
            "name": self.name,
            "icon": self.icon,
            "parentId": self.parent_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
