"""统一响应与业务异常。"""
from typing import Any, Generic, TypeVar

from fastapi import status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """统一响应体：{ code, message, data }。"""

    code: int = 0
    message: str = "ok"
    data: T | None = None


def success(data: Any = None, message: str = "ok") -> dict:
    """成功响应。"""
    return {"code": 0, "message": message, "data": data}


def error(code: int, message: str, http_status: int = status.HTTP_200_OK) -> JSONResponse:
    """错误响应（业务错误默认 HTTP 200，仅用 code 区分）。"""
    return JSONResponse(
        status_code=http_status,
        content={"code": code, "message": message, "data": None},
    )


# 业务错误码（与 docs/api-contract.md §1.7 对齐）
class BizCode:
    SUCCESS = 0
    BAD_REQUEST = 40001          # 参数缺失/不合法
    PASSWORD_RULE = 40002        # 密码不符合规则
    BIZ_CONFLICT = 40003         # 业务约束冲突（如新旧密码相同）
    ACCOUNT_PASSWORD_WRONG = 40101  # 账号或密码错误
    UNAUTHORIZED = 401           # 未授权
    FORBIDDEN = 403              # 无权限
    NOT_FOUND = 40401            # 资源不存在
    SERVER_ERROR = 50000         # 服务端未知错误


class BusinessError(Exception):
    """业务异常，被全局 handler 捕获后转为标准响应。"""

    def __init__(
        self,
        code: int = BizCode.SERVER_ERROR,
        message: str = "服务端未知错误",
        http_status: int = status.HTTP_200_OK,
    ):
        self.code = code
        self.message = message
        self.http_status = http_status
        super().__init__(message)
