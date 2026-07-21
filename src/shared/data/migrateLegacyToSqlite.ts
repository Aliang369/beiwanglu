/**
 * 将历史 localStorage 笔记/快照导入 SQLite（一次性）。
 * 不再删除旧 key，避免用户回退版本丢数据；导入标记独立。
 */
import { openSqliteDatabase, schedulePersist } from './sqlite/database'
import { boolToInt } from './sqlite/mappers'
import type { Folder } from '../types/folder'
import type { Note } from '../types/note'
import type { Snapshot } from '../types/snapshot'
import { normalizeFolders } from '../notes/folderDomain'
import { normalizeNotes } from '../notes/noteDomain'

const LEGACY_NOTES_KEYS = [
  'beiwanglu.notes.v4',
  'beiwanglu.notes.v3',
  'beiwanglu.notes.v2',
  'beiwanglu.notes.v1',
]
const LEGACY_SNAPSHOTS_KEY = 'beiwanglu.snapshots.v1'
const MIGRATED_FLAG = 'beiwanglu.sqlite.migrated.v1'

interface LegacyNotesPayload {
  version?: number
  notes?: Note[]
  folders?: Folder[]
}

interface LegacySnapshotsPayload {
  version?: number
  snapshots?: Record<string, Snapshot[]>
}

function readLegacyNotes(): { notes: Note[]; folders: Folder[] } {
  for (const key of LEGACY_NOTES_KEYS) {
    const raw = window.localStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as LegacyNotesPayload | Note[]
      if (Array.isArray(parsed)) {
        return { notes: normalizeNotes(parsed), folders: [] }
      }
      if (parsed && typeof parsed === 'object') {
        return {
          notes: normalizeNotes(Array.isArray(parsed.notes) ? parsed.notes : []),
          folders: normalizeFolders(Array.isArray(parsed.folders) ? parsed.folders : []),
        }
      }
    } catch {
      // try next key
    }
  }
  return { notes: [], folders: [] }
}

function readLegacySnapshots(): Snapshot[] {
  const raw = window.localStorage.getItem(LEGACY_SNAPSHOTS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as LegacySnapshotsPayload
    if (!parsed?.snapshots) return []
    return Object.values(parsed.snapshots).flat()
  } catch {
    return []
  }
}

/** 若尚未迁移，把 localStorage 数据写入 SQLite。 */
export async function migrateLegacyLocalStorageToSqlite(): Promise<{ notes: number; folders: number; snapshots: number }> {
  if (typeof window === 'undefined') {
    return { notes: 0, folders: 0, snapshots: 0 }
  }
  if (window.localStorage.getItem(MIGRATED_FLAG) === '1') {
    return { notes: 0, folders: 0, snapshots: 0 }
  }

  const { notes, folders } = readLegacyNotes()
  const snapshots = readLegacySnapshots()
  const db = await openSqliteDatabase()

  for (const folder of folders) {
    await db.run(
      `INSERT OR IGNORE INTO folders (id, name, icon, parent_id, created_at, updated_at, deleted_hard)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [folder.id, folder.name, folder.icon, folder.parentId, folder.createdAt, folder.updatedAt],
    )
  }

  for (const note of notes) {
    await db.run(
      `INSERT OR IGNORE INTO notes (
        id, title, content, excerpt, tags_json, folder_id, is_favorite, is_deleted, deleted_at,
        cover, pinned, read_only, created_at, updated_at, deleted_hard
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        note.id,
        note.title,
        note.content,
        note.excerpt,
        JSON.stringify(note.tags ?? []),
        note.folderId,
        boolToInt(note.isFavorite),
        boolToInt(note.isDeleted),
        note.deletedAt,
        note.cover ?? null,
        boolToInt(Boolean(note.pinned)),
        boolToInt(Boolean(note.readOnly)),
        note.createdAt,
        note.updatedAt,
      ],
    )
  }

  for (const snap of snapshots) {
    await db.run(
      `INSERT OR IGNORE INTO snapshots (id, note_id, title, note_title, content, created_at, deleted_hard)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [snap.id, snap.noteId, snap.title, snap.noteTitle, snap.content, snap.createdAt],
    )
  }

  schedulePersist(db)
  window.localStorage.setItem(MIGRATED_FLAG, '1')
  return { notes: notes.length, folders: folders.length, snapshots: snapshots.length }
}
