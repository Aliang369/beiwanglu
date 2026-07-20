"""文件夹路由。"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.note import FolderBatchDeleteRequest, FolderDraftRequest, FolderUpdateRequest
from app.services import note_service
from app.core.response import success

router = APIRouter()


@router.get("")
def list_folders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """列表。"""
    data = note_service.list_folders(db, user.id)
    return success(data)


@router.post("")
def create_folder(
    payload: FolderDraftRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """创建。"""
    data = note_service.create_folder(db, user.id, payload.name, payload.icon, payload.parentId)
    return success(data)


@router.patch("/{folder_id}")
def update_folder(
    folder_id: str,
    payload: FolderUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新。"""
    data = note_service.update_folder(
        db, user.id, folder_id, payload.name, payload.icon, payload.parentId
    )
    return success(data)


@router.post("/delete")
def delete_folders(
    payload: FolderBatchDeleteRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """批量删除。"""
    note_service.delete_folders(db, user.id, payload.ids)
    return success({"success": True})
