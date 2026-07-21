"""认证路由。"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.response import success
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest
from app.services import auth_service

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


@router.post("/refresh")
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    """刷新 access token（并轮换 refresh）。"""
    data = auth_service.refresh_session(db, payload.refreshToken)
    return success(data)


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    """获取当前用户。"""
    return success(user.to_dict())


@router.post("/logout")
async def logout(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """退出登录；可选 body: { refreshToken } 精确吊销，否则吊销该用户全部 refresh。"""
    refresh_token = None
    try:
        body = await request.json()
        if isinstance(body, dict):
            refresh_token = body.get("refreshToken")
    except Exception:
        refresh_token = None
    data = auth_service.logout(db, user, refresh_token)
    return success(data)
