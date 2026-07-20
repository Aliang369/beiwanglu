"""安全相关：密码哈希、JWT 签发与校验。"""
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import bcrypt
import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.response import BizCode, BusinessError
from app.db.session import get_db
from app.models.user import User

settings = get_settings()
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """密码 bcrypt 哈希。"""
    if not password or len(password) < 6:
        raise BusinessError(BizCode.PASSWORD_RULE, "密码至少 6 位")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """校验密码。"""
    if not password or not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: str) -> tuple[str, int]:
    """签发 JWT。返回 (token, expires_in_seconds)。"""
    expires_in = settings.jwt_expires_seconds
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expires_in)).timestamp()),
        "jti": uuid4().hex,
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, expires_in


def decode_token(token: str) -> dict:
    """解码并校验 JWT，失败抛 BusinessError(401)。"""
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError:
        raise BusinessError(BizCode.UNAUTHORIZED, "token 已过期", http_status=401)
    except jwt.InvalidTokenError:
        raise BusinessError(BizCode.UNAUTHORIZED, "token 无效", http_status=401)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI 依赖项：从 Bearer Token 解析当前用户。

    用法：`def handler(user: User = Depends(get_current_user))`。
    """
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise BusinessError(BizCode.UNAUTHORIZED, "未提供认证信息", http_status=401)

    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise BusinessError(BizCode.UNAUTHORIZED, "token 缺少 sub", http_status=401)

    user = db.get(User, user_id)
    if user is None:
        raise BusinessError(BizCode.UNAUTHORIZED, "用户不存在", http_status=401)

    return user
