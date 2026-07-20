"""数据库会话与依赖。"""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20,
    echo=settings.app_debug and settings.app_env == "dev",
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """SQLAlchemy 2.0 声明式基类。"""

    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI 依赖项：提供数据库会话并自动关闭。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
