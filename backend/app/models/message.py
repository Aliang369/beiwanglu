"""消息与通知设置模型。"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Message(Base):
    """消息表。type: system/comment/reminder/update；category: system/security/content。"""

    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)  # UUID
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    summary: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    content: Mapped[str] = mapped_column(Text, nullable=False, default="[]")  # JSON 字符串数组
    type: Mapped[str] = mapped_column(String(32), nullable=False, default="system")
    category: Mapped[str] = mapped_column(String(32), nullable=False, default="system")
    source: Mapped[str] = mapped_column(String(64), nullable=False, default="系统")
    tag: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    unread: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    primary_action: Mapped[str | None] = mapped_column(String(64), nullable=True)
    secondary_action: Mapped[str | None] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def to_dict(self) -> dict:
        """前端 MessageItem 字段对齐。"""
        import json

        try:
            content_list = json.loads(self.content) if self.content else []
            if not isinstance(content_list, list):
                content_list = []
        except (ValueError, TypeError):
            content_list = []

        return {
            "id": self.id,
            "title": self.title,
            "summary": self.summary,
            "content": content_list,
            "time": self.created_at.isoformat() if self.created_at else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "type": self.type,
            "category": self.category,
            "source": self.source,
            "tag": self.tag,
            "unread": self.unread,
            "primaryAction": self.primary_action,
            "secondaryAction": self.secondary_action,
        }


class NotificationSettings(Base):
    """通知设置表。每个用户一行。"""

    __tablename__ = "notification_settings"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    system_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    security_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    content_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def to_dict(self) -> dict:
        return {
            "systemEnabled": self.system_enabled,
            "securityEnabled": self.security_enabled,
            "contentEnabled": self.content_enabled,
        }
