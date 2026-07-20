"""认证相关 schema。"""
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    account: str = Field(..., min_length=1, max_length=64, description="账号")
    password: str = Field(..., min_length=1, max_length=128, description="密码")


class RegisterRequest(BaseModel):
    account: str = Field(..., min_length=3, max_length=64, description="账号（3-64 字符）")
    password: str = Field(..., min_length=6, max_length=128, description="密码（6-128 字符）")
    name: str | None = Field(None, max_length=64, description="昵称（可选）")


class SendCodeRequest(BaseModel):
    account: str = Field(..., min_length=1, max_length=128)
    scene: str = Field("login", description="login | register | reset_password")


class LoginByCodeRequest(BaseModel):
    account: str = Field(..., min_length=1, max_length=128)
    code: str = Field(..., min_length=4, max_length=8)


class ResetPasswordRequest(BaseModel):
    account: str = Field(..., min_length=1, max_length=128)
    code: str = Field(..., min_length=4, max_length=8)
    new_password: str = Field(..., min_length=6, max_length=128, alias="newPassword")

    model_config = {"populate_by_name": True}


class UserSchema(BaseModel):
    id: str
    account: str
    name: str
    email: str
    bio: str
    avatarUrl: str | None = None
    createdAt: str
    updatedAt: str


class AuthSessionSchema(BaseModel):
    accessToken: str
    tokenType: str = "Bearer"
    expiresIn: int
    user: UserSchema


class SendCodeResponse(BaseModel):
    expiresIn: int = 300


class SuccessResponse(BaseModel):
    success: bool = True
