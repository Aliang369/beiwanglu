"""用户资料与安全服务。"""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.response import BizCode, BusinessError
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UpdateProfileRequest


def get_profile(user: User) -> dict:
    """获取资料。"""
    return user.to_dict()


def update_profile(db: Session, user: User, payload: UpdateProfileRequest) -> dict:
    """更新资料。"""
    changed = False
    if payload.name is not None:
        user.name = payload.name
        changed = True
    if payload.bio is not None:
        user.bio = payload.bio
        changed = True
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
        changed = True

    if changed:
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
    return user.to_dict()


def change_password(db: Session, user: User, current_password: str, new_password: str) -> dict:
    """修改密码。"""
    if not verify_password(current_password, user.password_hash):
        raise BusinessError(BizCode.ACCOUNT_PASSWORD_WRONG, "当前密码错误")
    if current_password == new_password:
        raise BusinessError(BizCode.BIZ_CONFLICT, "新密码不能与旧密码相同")

    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True}
