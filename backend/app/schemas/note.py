"""笔记与文件夹相关 schema。"""
from pydantic import BaseModel, Field


class NoteTagSchema(BaseModel):
    id: str
    name: str
    tone: str | None = None


class NoteDraftRequest(BaseModel):
    title: str = Field("", max_length=500)
    content: str = Field("", description="ProseMirror doc JSON 字符串")
    tags: list[NoteTagSchema] | None = None
    folderId: str | None = None
    cover: str | None = Field(None, max_length=512)


class NoteUpdateRequest(BaseModel):
    title: str | None = Field(None, max_length=500)
    content: str | None = None
    tags: list[NoteTagSchema] | None = None
    folderId: str | None = None
    isFavorite: bool | None = None
    isDeleted: bool | None = None
    deletedAt: str | None = None
    cover: str | None = Field(None, max_length=512)
    pinned: bool | None = None
    readOnly: bool | None = None


class FolderDraftRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    icon: str = Field("folder", max_length=32)
    parentId: str | None = None


class FolderUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=64)
    icon: str | None = Field(None, max_length=32)
    parentId: str | None = None


class FolderBatchDeleteRequest(BaseModel):
    ids: list[str]
