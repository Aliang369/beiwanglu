"""文件上传路由。"""
from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services import upload_service
from app.core.response import success

router = APIRouter()


@router.post("/image")
async def upload_image(
    file: UploadFile,
    user: User = Depends(get_current_user),
):
    """上传图片。multipart/form-data，字段名 file。"""
    data = await upload_service.upload_image(user.id, file)
    return success(data)
