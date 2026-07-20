"""全局异常处理。"""
import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.response import BizCode, BusinessError

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    """注册全局异常处理器。"""

    @app.exception_handler(BusinessError)
    async def business_error_handler(request: Request, exc: BusinessError):
        """业务异常 → 标准响应体。"""
        return JSONResponse(
            status_code=exc.http_status,
            content={"code": exc.code, "message": exc.message, "data": None},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        """参数校验失败 → 40001。"""
        errors = []
        for err in exc.errors():
            loc = ".".join(str(x) for x in err.get("loc", []))
            errors.append(f"{loc}: {err.get('msg', '')}")
        message = "参数校验失败：" + "; ".join(errors) if errors else "参数校验失败"
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"code": BizCode.BAD_REQUEST, "message": message, "data": None},
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        """数据库唯一约束冲突 → 40003。"""
        logger.warning("DB integrity error: %s", exc.orig)
        message = "数据冲突"
        if hasattr(exc.orig, "args") and exc.orig.args:
            msg_text = str(exc.orig.args[0]) if exc.orig.args else ""
            if "Duplicate" in msg_text:
                message = "数据已存在（唯一约束冲突）"
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"code": BizCode.BIZ_CONFLICT, "message": message, "data": None},
        )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
        """数据库异常 → 50000。"""
        logger.exception("DB error: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"code": BizCode.SERVER_ERROR, "message": "数据库错误", "data": None},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        """兜底未处理异常 → 50000。"""
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"code": BizCode.SERVER_ERROR, "message": "服务端未知错误", "data": None},
        )
