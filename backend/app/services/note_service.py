"""笔记与文件夹服务。

关键设计：
- 所有查询按 user_id 隔离
- excerpt 由后端生成（与前端 noteDomain.extractTextFromNoteContent 对齐，max 480）
- delete 走软删除：is_deleted=true, deleted_at=now
- 30 天 TTL 自动清理（list 时触发）
"""
import json
import re
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.response import BizCode, BusinessError
from app.models.folder import Folder
from app.models.note import Note
from app.models.snapshot import Snapshot
from app.schemas.note import NoteDraftRequest, NoteUpdateRequest

EXCERPT_MAX_LENGTH = 480
TRASH_RETENTION_DAYS = 30

# 空笔记的 ProseMirror doc JSON（与前端 EMPTY_DOC_JSON 对齐）
EMPTY_DOC_JSON = json.dumps(
    {"type": "doc", "content": [{"type": "paragraph"}]},
    ensure_ascii=False,
)


# ---------------- 摘要生成 ----------------

def extract_text_from_content(content: str) -> str:
    """从 ProseMirror doc JSON 提取纯文本。

    与前端 noteDomain.extractTextFromNoteContent 对齐：
    - 解析 JSON，递归收集 text 节点
    - 块级节点之间补换行
    - 解析失败视为纯文本/HTML 原样返回
    """
    if not content:
        return ""

    try:
        doc = json.loads(content)
    except (ValueError, TypeError):
        # 非 JSON，视为纯文本/HTML 原样返回
        return content

    if not isinstance(doc, dict) or doc.get("type") != "doc":
        return content if isinstance(doc, str) else ""

    parts: list[str] = []

    def walk(node: dict | list | None) -> None:
        if isinstance(node, list):
            for item in node:
                walk(item)
            return
        if not isinstance(node, dict):
            return

        node_type = node.get("type")
        if node_type == "text":
            text = node.get("text", "")
            if text:
                parts.append(text)
            return

        # 块级节点（paragraph/heading/list_item 等）之间补换行
        block_types = {
            "paragraph", "heading", "codeBlock", "bulletList", "orderedList",
            "listItem", "blockquote", "tableRow", "tableCell",
        }
        if node_type in block_types and parts and not parts[-1].endswith("\n"):
            parts.append("\n")

        content_field = node.get("content")
        if content_field is not None:
            walk(content_field)

    walk(doc.get("content"))
    text = "".join(parts)
    # 连续空白合并为单个空格（保留换行）
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def make_excerpt(content: str) -> str:
    """生成摘要，最长 480 字符。"""
    text = extract_text_from_content(content)
    if len(text) <= EXCERPT_MAX_LENGTH:
        return text
    return text[:EXCERPT_MAX_LENGTH]


# ---------------- 垃圾桶清理 ----------------

def purge_expired_trash(db: Session, user_id: str) -> int:
    """清理已到期（>= 30 天）的废纸篓笔记。返回清理数量。"""
    threshold = datetime.now(timezone.utc) - timedelta(days=TRASH_RETENTION_DAYS)
    expired = (
        db.query(Note)
        .filter(
            Note.user_id == user_id,
            Note.is_deleted.is_(True),
            Note.deleted_at.is_not(None),
            Note.deleted_at < threshold,
        )
        .all()
    )
    for note in expired:
        # 级联清理快照
        db.query(Snapshot).filter(Snapshot.note_id == note.id).delete()
        db.delete(note)
    if expired:
        db.commit()
    return len(expired)


# ---------------- 笔记 CRUD ----------------

def list_notes(
    db: Session,
    user_id: str,
    folder_id: str | None = None,
    is_favorite: bool | None = None,
    is_deleted: bool | None = None,
) -> list[dict]:
    """列表。"""
    purge_expired_trash(db, user_id)
    query = db.query(Note).filter(Note.user_id == user_id)
    if folder_id is not None:
        query = query.filter(Note.folder_id == folder_id)
    if is_favorite is not None:
        query = query.filter(Note.is_favorite.is_(is_favorite))
    if is_deleted is not None:
        query = query.filter(Note.is_deleted.is_(is_deleted))
    # 列表展示：pinned 优先 + updatedAt 倒序
    notes = query.order_by(Note.pinned.desc(), Note.updated_at.desc()).all()
    return [n.to_dict() for n in notes]


def get_note(db: Session, user_id: str, note_id: str) -> dict:
    """详情。"""
    note = db.get(Note, note_id)
    if not note or note.user_id != user_id:
        raise BusinessError(BizCode.NOT_FOUND, "笔记不存在")
    return note.to_dict()


def create_note(db: Session, user_id: str, draft: NoteDraftRequest) -> dict:
    """创建。"""
    content = draft.content if draft.content else EMPTY_DOC_JSON
    note = Note(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=draft.title or "",
        content=content,
        excerpt=make_excerpt(content),
        tags=[t.model_dump() for t in draft.tags] if draft.tags else [],
        folder_id=draft.folderId,
        is_favorite=False,
        is_deleted=False,
        deleted_at=None,
        cover=draft.cover,
        pinned=False,
        read_only=False,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note.to_dict()


def update_note(
    db: Session,
    user_id: str,
    note_id: str,
    patch: NoteUpdateRequest,
) -> dict:
    """更新（部分字段）。"""
    note = db.get(Note, note_id)
    if not note or note.user_id != user_id:
        raise BusinessError(BizCode.NOT_FOUND, "笔记不存在")

    if note.read_only:
        # 只读模式下只允许元数据字段（isFavorite/pinned/isDeleted 等仍可改）
        # 但 title/content/tags 不允许改
        forbidden = ["title", "content", "tags"]
        for field in forbidden:
            if getattr(patch, field, None) is not None:
                raise BusinessError(BizCode.BIZ_CONFLICT, f"只读笔记不允许修改 {field}")

    now = datetime.now(timezone.utc)
    changed = False

    if patch.title is not None:
        note.title = patch.title
        changed = True
    if patch.content is not None:
        note.content = patch.content
        note.excerpt = make_excerpt(patch.content)
        changed = True
    if patch.tags is not None:
        note.tags = [t.model_dump() for t in patch.tags]
        changed = True
    if patch.folderId is not None:
        note.folder_id = patch.folderId
        changed = True
    if patch.isFavorite is not None:
        note.is_favorite = patch.isFavorite
        changed = True
    if patch.isDeleted is not None:
        note.is_deleted = patch.isDeleted
        note.deleted_at = now if patch.isDeleted else None
        changed = True
    if patch.deletedAt is not None:
        note.deleted_at = patch.deletedAt
        changed = True
    if patch.cover is not None:
        note.cover = patch.cover
        changed = True
    if patch.pinned is not None:
        note.pinned = patch.pinned
        changed = True
    if patch.readOnly is not None:
        note.read_only = patch.readOnly
        changed = True

    if changed:
        note.updated_at = now
        db.commit()
        db.refresh(note)
    return note.to_dict()


def delete_note(db: Session, user_id: str, note_id: str) -> None:
    """永久删除（业务层做软删除）。"""
    note = db.get(Note, note_id)
    if not note or note.user_id != user_id:
        raise BusinessError(BizCode.NOT_FOUND, "笔记不存在")

    # 软删除：标 is_deleted + deleted_at
    note.is_deleted = True
    note.deleted_at = datetime.now(timezone.utc)
    note.updated_at = datetime.now(timezone.utc)
    db.commit()


# ---------------- 文件夹 CRUD ----------------

VALID_FOLDER_ICONS = {"work", "study", "travel", "ideas", "recipes", "finance", "folder"}


def _assert_valid_parent(db: Session, user_id: str, parent_id: str | None) -> None:
    """parent_id 必须为 null 或根级文件夹。"""
    if parent_id is None:
        return
    parent = db.get(Folder, parent_id)
    if not parent or parent.user_id != user_id:
        raise BusinessError(BizCode.BAD_REQUEST, "父文件夹不存在")
    if parent.parent_id is not None:
        raise BusinessError(BizCode.BAD_REQUEST, "仅支持一层子文件夹")


def _has_name_conflict(
    db: Session,
    user_id: str,
    name: str,
    parent_id: str | None,
    exclude_id: str | None = None,
) -> bool:
    query = db.query(Folder).filter(
        Folder.user_id == user_id,
        Folder.name == name,
        Folder.parent_id.is_(parent_id) if parent_id is None else Folder.parent_id == parent_id,
    )
    if exclude_id:
        query = query.filter(Folder.id != exclude_id)
    return query.first() is not None


def list_folders(db: Session, user_id: str) -> list[dict]:
    """列表（按 name 升序）。"""
    folders = (
        db.query(Folder)
        .filter(Folder.user_id == user_id)
        .order_by(Folder.name.asc())
        .all()
    )
    return [f.to_dict() for f in folders]


def create_folder(db: Session, user_id: str, name: str, icon: str, parent_id: str | None) -> dict:
    """创建。"""
    if icon not in VALID_FOLDER_ICONS:
        icon = "folder"
    _assert_valid_parent(db, user_id, parent_id)
    if _has_name_conflict(db, user_id, name, parent_id):
        raise BusinessError(BizCode.BIZ_CONFLICT, "同级已存在同名文件夹")

    folder = Folder(
        id=str(uuid.uuid4()),
        user_id=user_id,
        name=name,
        icon=icon,
        parent_id=parent_id,
        is_inbox=False,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder.to_dict()


def update_folder(
    db: Session,
    user_id: str,
    folder_id: str,
    name: str | None,
    icon: str | None,
    parent_id: str | None,
) -> dict:
    """更新。"""
    folder = db.get(Folder, folder_id)
    if not folder or folder.user_id != user_id:
        raise BusinessError(BizCode.NOT_FOUND, "文件夹不存在")
    if folder.is_inbox:
        raise BusinessError(BizCode.BIZ_CONFLICT, "inbox 文件夹不可修改")

    if parent_id is not None:
        _assert_valid_parent(db, user_id, parent_id)
        # 不能把自己移到自己的子级（虽然只有一层，但仍要防止 parentId = 自己）
        if parent_id == folder_id:
            raise BusinessError(BizCode.BAD_REQUEST, "不能将文件夹移动到自身下")

    if name is not None and name != folder.name:
        if _has_name_conflict(db, user_id, name, parent_id if parent_id is not None else folder.parent_id, exclude_id=folder_id):
            raise BusinessError(BizCode.BIZ_CONFLICT, "同级已存在同名文件夹")
        folder.name = name

    if icon is not None:
        folder.icon = icon if icon in VALID_FOLDER_ICONS else folder.icon
    if parent_id is not None:
        folder.parent_id = parent_id

    folder.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(folder)
    return folder.to_dict()


def delete_folders(db: Session, user_id: str, ids: list[str]) -> None:
    """批量删除文件夹。

    业务规则：
    - inbox 受保护不可删
    - 删除文件夹会一并删除其直接子文件夹
    - 文件夹中的笔记移入废纸篓（folderId 置 null, is_deleted=true）
    """
    if not ids:
        return

    folders = (
        db.query(Folder)
        .filter(Folder.user_id == user_id, Folder.id.in_(ids))
        .all()
    )
    for folder in folders:
        if folder.is_inbox:
            raise BusinessError(BizCode.BIZ_CONFLICT, "inbox 文件夹不可删除")

    # 收集要删除的全部文件夹 id（含子文件夹）
    to_delete_ids: set[str] = set()
    queue = list(folders)
    while queue:
        f = queue.pop()
        if f.id in to_delete_ids:
            continue
        to_delete_ids.add(f.id)
        # 找直接子文件夹
        children = db.query(Folder).filter(Folder.user_id == user_id, Folder.parent_id == f.id).all()
        queue.extend(children)

    # 把这些文件夹下的笔记移入废纸篓
    now = datetime.now(timezone.utc)
    notes_to_trash = (
        db.query(Note)
        .filter(Note.user_id == user_id, Note.folder_id.in_(list(to_delete_ids)))
        .all()
    )
    for note in notes_to_trash:
        note.folder_id = None
        note.is_deleted = True
        note.deleted_at = now
        note.updated_at = now

    # 删除文件夹
    db.query(Folder).filter(Folder.id.in_(list(to_delete_ids))).delete(synchronize_session=False)
    db.commit()
