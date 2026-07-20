"""笔记路由。"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.note import NoteDraftRequest, NoteUpdateRequest
from app.services import note_service
from app.core.response import success

router = APIRouter()


@router.get("")
def list_notes(
    folderId: str | None = Query(None),
    isFavorite: bool | None = Query(None),
    isDeleted: bool | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """列表。"""
    data = note_service.list_notes(db, user.id, folderId, isFavorite, isDeleted)
    return success(data)


@router.get("/{note_id}")
def get_note(
    note_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """详情。"""
    data = note_service.get_note(db, user.id, note_id)
    return success(data)


@router.post("")
def create_note(
    payload: NoteDraftRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """创建。"""
    data = note_service.create_note(db, user.id, payload)
    return success(data)


@router.patch("/{note_id}")
def update_note(
    note_id: str,
    payload: NoteUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新。"""
    data = note_service.update_note(db, user.id, note_id, payload)
    return success(data)


@router.delete("/{note_id}")
def delete_note(
    note_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """永久删除（业务层做软删除）。"""
    note_service.delete_note(db, user.id, note_id)
    return success(None)
