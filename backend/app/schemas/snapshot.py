"""快照相关 schema。"""
from pydantic import BaseModel, Field


class SnapshotCreateRequest(BaseModel):
    noteId: str = Field(..., min_length=1, max_length=36)
    title: str = Field("自动保存", max_length=64)
    noteTitle: str = Field("", max_length=500)
    content: str = Field("", description="ProseMirror doc JSON 字符串")


class SnapshotSchema(BaseModel):
    id: str
    noteId: str
    title: str
    noteTitle: str
    content: str
    createdAt: str


class SnapshotListResponse(BaseModel):
    items: list[SnapshotSchema]


class SnapshotDeleteResult(BaseModel):
    success: bool = True
    deletedCount: int | None = None
