"""FastAPI 应用入口。"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.api import api_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.response import success

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期。"""
    # 启动
    print(f"[beiwanglu] env={settings.app_env} debug={settings.app_debug}")
    print(f"[beiwanglu] database={settings.db_host}:{settings.db_port}/{settings.db_name}")
    print(f"[beiwanglu] upload_dir={settings.upload_path}")
    yield
    # 关闭
    print("[beiwanglu] shutting down")


app = FastAPI(
    title="灵感笔记 API",
    description="后端接口契约见 docs/api-contract.md",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.app_debug else None,
    redoc_url="/redoc" if settings.app_debug else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Authorization"],
)

# 异常处理
register_exception_handlers(app)

# 路由
app.include_router(api_router, prefix="/api/v1")

# 静态文件：上传文件访问
app.mount("/uploads", StaticFiles(directory=str(settings.upload_path)), name="uploads")


@app.get("/health")
async def health():
    """健康检查。"""
    return success({"status": "ok", "version": "0.1.0"})


@app.get("/")
async def root():
    """根路径。"""
    return success({"name": "灵感笔记 API", "docs": "/docs"})
