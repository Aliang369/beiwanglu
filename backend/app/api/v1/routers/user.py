"""用户资料与安全路由。"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.user import ChangePasswordRequest, UpdateProfileRequest
from app.services import user_service
from app.core.response import success

router = APIRouter()


@router.get("/profile")
def get_profile(user: User = Depends(get_current_user)):
    """获取资料。"""
    return success(user_service.get_profile(user))


@router.patch("/profile")
def update_profile(
    payload: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新资料。"""
    data = user_service.update_profile(db, user, payload)
    return success(data)


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """修改密码。"""
    data = user_service.change_password(db, user, payload.currentPassword, payload.newPassword)
    return success(data)
