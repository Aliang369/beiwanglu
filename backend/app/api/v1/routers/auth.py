"""认证路由。"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginByCodeRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    SendCodeRequest,
)
from app.services import auth_service
from app.core.response import success

router = APIRouter()


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """密码登录。"""
    data = auth_service.login(db, payload)
    return success(data)


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """注册。"""
    data = auth_service.register(db, payload)
    return success(data)


@router.post("/send-code")
def send_code(payload: SendCodeRequest, db: Session = Depends(get_db)):
    """发送验证码。本期未启用。"""
    data = auth_service.send_code(db, payload.account, payload.scene)
    return success(data)


@router.post("/login-by-code")
def login_by_code(payload: LoginByCodeRequest, db: Session = Depends(get_db)):
    """验证码登录。本期未启用。"""
    data = auth_service.login_by_code(db, payload.account, payload.code)
    return success(data)


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """重置密码。本期未启用。"""
    data = auth_service.reset_password(db, payload.account, payload.code, payload.new_password)
    return success(data)


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    """获取当前用户。"""
    return success(user.to_dict())


@router.post("/logout")
def logout(user: User = Depends(get_current_user)):
    """退出登录。"""
    return success({"success": True})
