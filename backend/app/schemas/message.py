"""消息相关 schema。"""
from pydantic import BaseModel, Field


class NotificationSettingsSchema(BaseModel):
    systemEnabled: bool = True
    securityEnabled: bool = True
    contentEnabled: bool = True
    emailEnabled: bool = False


class NotificationSettingsUpdate(BaseModel):
    systemEnabled: bool | None = None
    securityEnabled: bool | None = None
    contentEnabled: bool | None = None
    emailEnabled: bool | None = None


class MessageListResult(BaseModel):
    items: list[dict]
    unreadCount: int
