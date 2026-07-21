"""认证服务。"""
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.response import BizCode, BusinessError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.message import Message, NotificationSettings
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest

settings = get_settings()


def _hash_refresh_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _issue_refresh_token(db: Session, user_id: str) -> str:
    """签发 refresh token：原始值返回客户端，哈希入库。"""
    raw = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)
    row = RefreshToken(
        id=str(uuid.uuid4()),
        user_id=user_id,
        token_hash=_hash_refresh_token(raw),
        expires_at=now + timedelta(seconds=settings.jwt_refresh_expires_seconds),
        revoked_at=None,
    )
    db.add(row)
    return raw


def _build_session(db: Session, user: User) -> dict:
    """构造 AuthSession：access + refresh。"""
    access_token, expires_in = create_access_token(user.id)
    refresh_token = _issue_refresh_token(db, user.id)
    db.commit()
    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "tokenType": "Bearer",
        "expiresIn": expires_in,
        "user": user.to_dict(),
    }


def _ensure_user_bootstrap(db: Session, user_id: str) -> None:
    """为新用户创建通知设置 + 欢迎消息。"""
    settings_row = db.get(NotificationSettings, user_id)
    if not settings_row:
        db.add(NotificationSettings(user_id=user_id))

    has_welcome = (
        db.query(Message)
        .filter(Message.user_id == user_id, Message.tag == "欢迎")
        .first()
    )
    if has_welcome:
        return

    welcome = Message(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title="欢迎使用灵感笔记",
        summary="开始记录你的灵感吧",
        content='["欢迎使用灵感笔记，点击任意位置开始创建你的第一篇笔记。"]',
        type="system",
        category="system",
        source="系统",
        tag="欢迎",
        unread=True,
        primary_action="开始使用",
    )
    db.add(welcome)


_ensure_inbox_and_settings = _ensure_user_bootstrap


def _find_user_by_login_identity(db: Session, identity: str) -> User | None:
    """按账号 / 显示名查找用户。"""
    identity = identity.strip()
    if not identity:
        return None
    return (
        db.query(User)
        .filter(
            or_(
                User.account == identity,
                User.name == identity,
            )
        )
        .first()
    )


def register(db: Session, payload: RegisterRequest) -> dict:
    """注册：不自动登录；仍返回 session 结构便于契约对齐（前端不写 session）。"""
    account = payload.account.strip()

    existing = db.query(User).filter(User.account == account).first()
    if existing:
        raise BusinessError(BizCode.BIZ_CONFLICT, "账号已存在")

    user = User(
        id=str(uuid.uuid4()),
        account=account,
        password_hash=hash_password(payload.password),
        name=payload.name or account,
        bio="",
        avatar_url=None,
    )
    db.add(user)
    db.flush()
    _ensure_user_bootstrap(db, user.id)
    db.commit()
    db.refresh(user)
    return _build_session(db, user)


def login(db: Session, payload: LoginRequest) -> dict:
    """密码登录。"""
    user = _find_user_by_login_identity(db, payload.account)
    if not user or not verify_password(payload.password, user.password_hash):
        raise BusinessError(BizCode.ACCOUNT_PASSWORD_WRONG, "账号或密码错误")

    from app.services.note_service import cleanup_legacy_inbox

    cleanup_legacy_inbox(db, user.id)
    return _build_session(db, user)


def refresh_session(db: Session, refresh_token: str) -> dict:
    """用 refresh token 换发新的 access + refresh（轮换）。"""
    raw = (refresh_token or "").strip()
    if not raw:
        raise BusinessError(BizCode.UNAUTHORIZED, "缺少 refresh token", http_status=401)

    token_hash = _hash_refresh_token(raw)
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    now = datetime.now(timezone.utc)
    if row is None or row.revoked_at is not None:
        raise BusinessError(BizCode.UNAUTHORIZED, "refresh token 无效", http_status=401)

    expires_at = row.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= now:
        raise BusinessError(BizCode.UNAUTHORIZED, "refresh token 已过期", http_status=401)

    user = db.get(User, row.user_id)
    if user is None:
        raise BusinessError(BizCode.UNAUTHORIZED, "用户不存在", http_status=401)

    # 轮换：吊销旧 refresh
    row.revoked_at = now
    db.add(row)
    return _build_session(db, user)


def logout(db: Session, user: User, refresh_token: str | None = None) -> dict:
    """退出：吊销当前 refresh（若提供）或该用户全部 refresh。"""
    now = datetime.now(timezone.utc)
    q = db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked_at.is_(None),
    )
    if refresh_token:
        q = q.filter(RefreshToken.token_hash == _hash_refresh_token(refresh_token.strip()))
    for row in q.all():
        row.revoked_at = now
    db.commit()
    return {"success": True}


def get_me(db: Session, user: User) -> dict:
    return user.to_dict()
