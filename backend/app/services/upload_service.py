"""文件上传服务。"""
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import get_settings
from app.core.response import BizCode, BusinessError

settings = get_settings()

ALLOWED_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}


async def upload_image(user_id: str, file: UploadFile) -> dict:
    """上传图片到服务器本地磁盘。

    存储路径：{upload_dir}/{user_id}/{uuid}.{ext}
    返回 URL：/uploads/{user_id}/{uuid}.{ext}（前端拼接 BASE_URL origin）
    """
    if file.content_type not in ALLOWED_MIME:
        raise BusinessError(BizCode.BAD_REQUEST, f"不支持的图片类型：{file.content_type}")

    # 读取并校验大小
    content = await file.read()
    if len(content) > settings.upload_max_bytes:
        max_mb = settings.upload_max_bytes // (1024 * 1024)
        raise BusinessError(BizCode.BAD_REQUEST, f"图片超过 {max_mb}MB 上限")

    # 用户子目录
    user_dir = settings.upload_path / user_id
    user_dir.mkdir(parents=True, exist_ok=True)

    ext = ALLOWED_MIME[file.content_type]
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = user_dir / filename

    file_path.write_bytes(content)

    url = f"/uploads/{user_id}/{filename}"
    return {"url": url}
