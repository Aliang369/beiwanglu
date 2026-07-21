"""应用配置：从环境变量加载。"""
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """全局配置，从 .env 加载。"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # 应用
    app_env: str = "dev"
    app_debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 3000

    # 数据库
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "beiwanglu"

    # JWT
    jwt_secret: str = "change-me-to-a-strong-random-string-at-least-32-chars"
    jwt_algorithm: str = "HS256"
    jwt_expires_seconds: int = 900  # access: 15 分钟
    jwt_refresh_expires_seconds: int = 2592000  # refresh: 30 天

    # CORS
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # 文件上传
    upload_dir: str = "./uploads"
    upload_max_bytes: int = 5242880  # 5MB

    @property
    def cors_origin_list(self) -> list[str]:
        """CORS 允许源列表。"""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def database_url(self) -> str:
        """SQLAlchemy 数据库 URL（MySQL + PyMySQL）。"""
        return (
            f"mysql+pymysql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}?charset=utf8mb4"
        )

    @property
    def upload_path(self) -> Path:
        """上传目录绝对路径。"""
        path = Path(self.upload_dir).resolve()
        path.mkdir(parents=True, exist_ok=True)
        return path


@lru_cache
def get_settings() -> Settings:
    """单例配置。"""
    return Settings()
