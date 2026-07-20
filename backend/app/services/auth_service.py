"""认证服务。"""
import uuid

from sqlalchemy.orm import Session

from app.core.response import BizCode, BusinessError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.folder import Folder
from app.models.user import User
from app.models.message import Message, NotificationSettings
from app.schemas.auth import LoginRequest, RegisterRequest


def _build_session(user: User) -> dict:
    """构造 AuthSession 响应。"""
    token, expires_in = create_access_token(user.id)
    return {
        "accessToken": token,
        "tokenType": "Bearer",
        "expiresIn": expires_in,
        "user": user.to_dict(),
    }


def _ensure_inbox_and_settings(db: Session, user_id: str) -> None:
    """为新用户创建 inbox 文件夹 + 通知设置 + 欢迎消息。"""
    inbox = db.query(Folder).filter(Folder.user_id == user_id, Folder.is_inbox.is_(True)).first()
    if not inbox:
        db.add(
            Folder(
                id=str(uuid.uuid4()),
                user_id=user_id,
                name="inbox",
                icon="folder",
                parent_id=None,
                is_inbox=True,
            )
        )

    settings = db.get(NotificationSettings, user_id)
    if not settings:
        db.add(NotificationSettings(user_id=user_id))

    # 欢迎消息
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


def register(db: Session, payload: RegisterRequest) -> dict:
    """注册：不自动登录（按知识库约定）。返回 AuthSession 以便前端决定流程。"""
    existing = db.query(User).filter(User.account == payload.account).first()
    if existing:
        raise BusinessError(BizCode.BIZ_CONFLICT, "账号已存在")

    user = User(
        id=str(uuid.uuid4()),
        account=payload.account,
        password_hash=hash_password(payload.password),
        name=payload.name or payload.account,
        email="",
        bio="",
        avatar_url=None,
    )
    db.add(user)
    db.flush()
    _ensure_inbox_and_settings(db, user.id)
    db.commit()
    db.refresh(user)

    # 知识库约定：注册不自动登录。但契约文档说返回 AuthSession，前端 register 不调 setSession。
    return _build_session(user)


def login(db: Session, payload: LoginRequest) -> dict:
    """密码登录。"""
    user = db.query(User).filter(User.account == payload.account).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise BusinessError(BizCode.ACCOUNT_PASSWORD_WRONG, "账号或密码错误")
    return _build_session(user)


def login_by_code(db: Session, account: str, code: str) -> dict:
    """验证码登录。本期验证码服务未启用，统一报错。"""
    raise BusinessError(BizCode.CODE_SERVICE_DISABLED, "验证码服务未启用")


def send_code(db: Session, account: str, scene: str) -> dict:
    """发送验证码。本期未启用。"""
    raise BusinessError(BizCode.CODE_SERVICE_DISABLED, "验证码服务未启用")


def reset_password(db: Session, account: str, code: str, new_password: str) -> dict:
    """重置密码。本期未启用。"""
    raise BusinessError(BizCode.CODE_SERVICE_DISABLED, "验证码服务未启用")


def get_me(user: User) -> dict:
    """获取当前用户。"""
    return user.to_dict()


def logout(user: User) -> dict:
    """退出登录。本期不做 token 黑名单，前端清会话即可。"""
    return {"success": True}
