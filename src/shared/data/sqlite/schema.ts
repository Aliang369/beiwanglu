/**
 * 三端统一 SQLite schema（Web/sql.js · 桌面 Tauri · 移动端复用同一 DDL）。
 * 业务读写以本地库为准；云端同步另见 src/shared/sync/。
 */

export const SQLITE_SCHEMA_VERSION = 1

export const SQLITE_SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL DEFAULT '[]',
  folder_id TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  cover TEXT,
  pinned INTEGER NOT NULL DEFAULT 0,
  read_only INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_hard INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_notes_deleted ON notes(is_deleted, deleted_hard);
CREATE INDEX IF NOT EXISTS ix_notes_folder ON notes(folder_id);
CREATE INDEX IF NOT EXISTS ix_notes_updated ON notes(updated_at);

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'folder',
  parent_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_hard INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_folders_parent ON folders(parent_id);
CREATE INDEX IF NOT EXISTS ix_folders_updated ON folders(updated_at);

CREATE TABLE IF NOT EXISTS snapshots (
  id TEXT PRIMARY KEY NOT NULL,
  note_id TEXT NOT NULL,
  title TEXT NOT NULL,
  note_title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_hard INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_snapshots_note ON snapshots(note_id, created_at);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  content_json TEXT NOT NULL DEFAULT '[]',
  time TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  tag TEXT NOT NULL DEFAULT '',
  unread INTEGER NOT NULL DEFAULT 1,
  primary_action TEXT,
  secondary_action TEXT,
  updated_at TEXT NOT NULL,
  deleted_hard INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS ix_messages_unread ON messages(unread);

CREATE TABLE IF NOT EXISTS notification_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  system_enabled INTEGER NOT NULL DEFAULT 1,
  security_enabled INTEGER NOT NULL DEFAULT 1,
  content_enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_state (
  entity TEXT PRIMARY KEY NOT NULL,
  last_pulled_at TEXT,
  last_pushed_at TEXT,
  cursor TEXT
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  op TEXT NOT NULL,
  payload_json TEXT,
  updated_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_sync_queue_entity ON sync_queue(entity, entity_id);
`

export type SyncEntity = 'note' | 'folder' | 'snapshot' | 'message' | 'notification_settings'
