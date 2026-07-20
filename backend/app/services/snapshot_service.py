"""快照服务。

双重保留策略（与前端 [[快照双重保留策略决策]] 对齐）：
- 数量上限：每笔记最多 20 条
- 时间上限：7 天 TTL
- 两条策略同时应用，取交集
"""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.response import BizCode, BusinessError
from app.models.note import Note
from app.models.snapshot import Snapshot

MAX_SNAPSHOTS_PER_NOTE = 20
SNAPSHOT_TTL_DAYS = 7


def _trim(db: Session, note_id: str) -> None:
    """按双重策略清理某笔记的旧快照。"""
    now = datetime.now(timezone.utc)
    threshold = now - timedelta(days=SNAPSHOT_TTL_DAYS)

    # 先删过期
    db.query(Snapshot).filter(
        Snapshot.note_id == note_id,
        Snapshot.created_at < threshold,
    ).delete(synchronize_session=False)

    # 再按 created_at 倒序保留前 20 条
    all_snaps = (
        db.query(Snapshot)
        .filter(Snapshot.note_id == note_id)
        .order_by(Snapshot.created_at.desc())
        .all()
    )
    if len(all_snaps) > MAX_SNAPSHOTS_PER_NOTE:
        to_remove = all_snaps[MAX_SNAPSHOTS_PER_NOTE:]
        for snap in to_remove:
            db.delete(snap)


def list_by_note(db: Session, user_id: str, note_id: str) -> list[dict]:
    """列表（按 created_at 倒序）。"""
    note = db.get(Note, note_id)
    if not note or note.user_id != user_id:
        raise BusinessError(BizCode.NOT_FOUND, "笔记不存在")

    snaps = (
        db.query(Snapshot)
        .filter(Snapshot.note_id == note_id, Snapshot.user_id == user_id)
        .order_by(Snapshot.created_at.desc())
        .all()
    )
    return [s.to_dict() for s in snaps]


def create(
    db: Session,
    user_id: str,
    note_id: str,
    title: str,
    note_title: str,
    content: str,
) -> dict:
    """创建快照。"""
    note = db.get(Note, note_id)
    if not note or note.user_id != user_id:
        raise BusinessError(BizCode.NOT_FOUND, "笔记不存在")

    snap = Snapshot(
        id=str(uuid.uuid4()),
        note_id=note_id,
        user_id=user_id,
        title=title or "自动保存",
        note_title=note_title or "",
        content=content or "",
    )
    db.add(snap)
    db.flush()
    _trim(db, note_id)
    db.commit()
    db.refresh(snap)
    return snap.to_dict()


def delete_one(db: Session, user_id: str, snapshot_id: str) -> None:
    """删除单条。"""
    snap = db.get(Snapshot, snapshot_id)
    if not snap or snap.user_id != user_id:
        raise BusinessError(BizCode.NOT_FOUND, "快照不存在")
    db.delete(snap)
    db.commit()


def delete_by_note(db: Session, user_id: str, note_id: str) -> int:
    """清理某笔记全部快照。返回删除数量。"""
    note = db.get(Note, note_id)
    if not note or note.user_id != user_id:
        raise BusinessError(BizCode.NOT_FOUND, "笔记不存在")

    count = (
        db.query(Snapshot)
        .filter(Snapshot.note_id == note_id, Snapshot.user_id == user_id)
        .delete(synchronize_session=False)
    )
    db.commit()
    return count
