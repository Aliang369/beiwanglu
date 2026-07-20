"""消息与通知路由。"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.message import NotificationSettingsUpdate
from app.services import message_service
from app.core.response import success

router = APIRouter()


# /messages
@router.get("/messages")
def list_messages(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """消息列表。"""
    data = message_service.list_messages(db, user.id)
    return success(data)


@router.get("/messages/{message_id}")
def get_message(
    message_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """消息详情。"""
    data = message_service.get_message(db, user.id, message_id)
    return success(data)


@router.post("/messages/{message_id}/read")
def mark_read(
    message_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """标记已读。"""
    data = message_service.mark_read(db, user.id, message_id)
    return success(data)


@router.post("/messages/read-all")
def mark_all_read(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """全部已读。"""
    data = message_service.mark_all_read(db, user.id)
    return success(data)


# /notifications
@router.get("/notifications/settings")
def get_notification_settings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取通知设置。"""
    data = message_service.get_notification_settings(db, user.id)
    return success(data)


@router.patch("/notifications/settings")
def update_notification_settings(
    payload: NotificationSettingsUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新通知设置。"""
    data = message_service.update_notification_settings(db, user.id, payload)
    return success(data)
