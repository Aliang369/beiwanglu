"""用户相关 schema。"""
from pydantic import BaseModel, Field


class UpdateProfileRequest(BaseModel):
    name: str | None = Field(None, max_length=64)
    bio: str | None = Field(None, max_length=500)
    avatarUrl: str | None = Field(None, max_length=512)


class ChangePasswordRequest(BaseModel):
    currentPassword: str = Field(..., min_length=1, max_length=128)
    newPassword: str = Field(..., min_length=6, max_length=128)
