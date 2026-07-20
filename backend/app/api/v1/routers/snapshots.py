"""快照路由。"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.snapshot import SnapshotCreateRequest
from app.services import snapshot_service
from app.core.response import success

router = APIRouter()


@router.get("")
def list_by_note(
    noteId: str = Query(..., min_length=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """列表。"""
    data = snapshot_service.list_by_note(db, user.id, noteId)
    return success({"items": data})


@router.post("")
def create(
    payload: SnapshotCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """创建。"""
    data = snapshot_service.create(
        db, user.id, payload.noteId, payload.title, payload.noteTitle, payload.content
    )
    return success(data)


@router.delete("/{snapshot_id}")
def delete_one(
    snapshot_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除单条。"""
    snapshot_service.delete_one(db, user.id, snapshot_id)
    return success({"success": True})


@router.delete("")
def delete_by_note(
    noteId: str = Query(..., min_length=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """清理某笔记全部快照。"""
    count = snapshot_service.delete_by_note(db, user.id, noteId)
    return success({"success": True, "deletedCount": count})
