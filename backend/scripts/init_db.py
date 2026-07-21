"""初始化数据库与账号。

用法：
    python -m scripts.init_db
    python -m scripts.init_db --account admin --password yourpass

会执行：
1. 创建数据库（如不存在）
2. alembic upgrade head（建表）
3. 创建初始账号（如指定）
"""
import argparse
import sys
import uuid
from pathlib import Path

# 把 backend/ 加入 sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pymysql  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.auth_service import _ensure_user_bootstrap  # noqa: E402


def create_database_if_not_exists(settings) -> None:
    """连接 MySQL 服务器（不指定 db），创建数据库。"""
    conn = pymysql.connect(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        charset="utf8mb4",
    )
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{settings.db_name}` "
                f"DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        conn.commit()
        print(f"[OK] 数据库 '{settings.db_name}' 已就绪")
    finally:
        conn.close()


def run_alembic_upgrade() -> None:
    """运行 alembic upgrade head。"""
    from alembic import command
    from alembic.config import Config

    alembic_cfg = Config(str(Path(__file__).resolve().parent.parent / "alembic.ini"))
    command.upgrade(alembic_cfg, "head")
    print("[OK] alembic upgrade head 完成")


def create_initial_account(account: str, password: str) -> None:
    """创建初始账号 + 通知设置 / 欢迎消息（不再创建 inbox）。"""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.account == account).first()
        if existing:
            print(f"[SKIP] 账号 '{account}' 已存在，跳过创建")
            return

        user = User(
            id=str(uuid.uuid4()),
            account=account,
            password_hash=hash_password(password),
            name=account,
            bio="",
            avatar_url=None,
        )
        db.add(user)
        db.flush()

        _ensure_user_bootstrap(db, user.id)
        db.commit()
        print(f"[OK] 初始账号 '{account}' 创建成功（通知设置/欢迎消息，无 inbox）")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="初始化数据库与账号")
    parser.add_argument("--account", default="admin", help="初始账号（默认 admin）")
    parser.add_argument("--password", default="123456", help="初始密码（默认 123456）")
    args = parser.parse_args()

    settings = get_settings()
    print(f"将连接 MySQL：{settings.db_host}:{settings.db_port} user={settings.db_user}")
    print(f"数据库：{settings.db_name}")
    print()

    try:
        create_database_if_not_exists(settings)
        run_alembic_upgrade()
        create_initial_account(args.account, args.password)
        print()
        print("[完成] 初始化结束。可用以下凭据登录：")
        print(f"  账号：{args.account}")
        print(f"  密码：{args.password}")
    except Exception as exc:
        print(f"[ERROR] 初始化失败：{exc}")
        raise


if __name__ == "__main__":
    main()
