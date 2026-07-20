"""API v1 路由聚合。"""
from fastapi import APIRouter

from app.api.v1.routers import auth, folders, messages, notes, snapshots, uploads, user

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(user.router, prefix="/user", tags=["user"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(folders.router, prefix="/folders", tags=["folders"])
api_router.include_router(snapshots.router, prefix="/snapshots", tags=["snapshots"])
api_router.include_router(messages.router, tags=["messages"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
