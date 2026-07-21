"""消息与通知服务。"""
from sqlalchemy.orm import Session

from app.core.response import BizCode, BusinessError
from app.models.message import Message, NotificationSettings
from app.schemas.message import NotificationSettingsUpdate


def list_messages(db: Session, user_id: str) -> dict:
    """列表（含 unreadCount）。"""
    msgs = (
        db.query(Message)
        .filter(Message.user_id == user_id)
        .order_by(Message.created_at.desc())
        .all()
    )
    unread_count = sum(1 for m in msgs if m.unread)
    return {
        "items": [m.to_dict() for m in msgs],
        "unreadCount": unread_count,
    }


def get_message(db: Session, user_id: str, message_id: str) -> dict:
    """详情。"""
    msg = db.get(Message, message_id)
    if not msg or msg.user_id != user_id:
        raise BusinessError(BizCode.NOT_FOUND, "消息不存在")
    return msg.to_dict()


def mark_read(db: Session, user_id: str, message_id: str) -> dict:
    """标记已读。"""
    msg = db.get(Message, message_id)
    if not msg or msg.user_id != user_id:
        raise BusinessError(BizCode.NOT_FOUND, "消息不存在")
    if not msg.unread:
        return msg.to_dict()
    msg.unread = False
    db.commit()
    db.refresh(msg)
    return msg.to_dict()


def mark_all_read(db: Session, user_id: str) -> dict:
    """全部已读。"""
    db.query(Message).filter(
        Message.user_id == user_id,
        Message.unread.is_(True),
    ).update({Message.unread: False}, synchronize_session=False)
    db.commit()
    return {"success": True, "unreadCount": 0}


def get_notification_settings(db: Session, user_id: str) -> dict:
    """获取通知设置。"""
    settings = db.get(NotificationSettings, user_id)
    if not settings:
        # 兜底：自动创建默认
        settings = NotificationSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings.to_dict()


def update_notification_settings(
    db: Session, user_id: str, payload: NotificationSettingsUpdate
) -> dict:
    """更新通知设置（部分字段）。"""
    settings = db.get(NotificationSettings, user_id)
    if not settings:
        settings = NotificationSettings(user_id=user_id)
        db.add(settings)

    if payload.systemEnabled is not None:
        settings.system_enabled = payload.systemEnabled
    if payload.securityEnabled is not None:
        settings.security_enabled = payload.securityEnabled
    if payload.contentEnabled is not None:
        settings.content_enabled = payload.contentEnabled

    db.commit()
    db.refresh(settings)
    return settings.to_dict()
