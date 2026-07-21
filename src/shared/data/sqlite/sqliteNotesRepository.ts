import type { SqliteDatabase } from './database'
import {
  canMoveFolder,
  hasFolderNameConflict,
  applyFolderPatch,
  assertValidParentId,
  buildFolder,
  normalizeFolders,
} from '../../notes/folderDomain'
import {
  applyNotePatch,
  buildNewNote,
  normalizeNotes,
  purgeExpiredTrashNotes,
  isTrashExpired,
  sortNotesByUpdatedAt,
} from '../../notes/noteDomain'
import type { Folder, FolderDraft } from '../../types/folder'
import type { Note, NoteDraft } from '../../types/note'
import { openSqliteDatabase, schedulePersist } from './database'
import { boolToInt, folderFromRow, noteFromRow, rowsFromExec } from './mappers'
import type { NotesRepository } from '../notesRepository'
import type { SyncEntity } from './schema'
import { enqueueSyncChange } from '../../sync/syncQueue'
import { useSyncStore } from '../../store/syncStore'

async function trackLocalChange(
  db: Parameters<typeof enqueueSyncChange>[0],
  entity: Parameters<typeof enqueueSyncChange>[1],
  entityId: string,
  op: Parameters<typeof enqueueSyncChange>[3],
  payload?: unknown,
) {
  await enqueueSyncChange(db, entity, entityId, op, payload)
  useSyncStore.getState().scheduleSync()
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

async function withDb<T>(fn: (db: SqliteDatabase) => T | Promise<T>): Promise<T> {
  const db = await openSqliteDatabase()
  const result = await fn(db)
  schedulePersist(db)
  return result
}

async function listNotes(db: SqliteDatabase): Promise<Note[]> {
  const rows = rowsFromExec(
    await db.exec(
      `SELECT * FROM notes WHERE deleted_hard = 0 ORDER BY updated_at DESC`,
    ),
  )
  const notes = normalizeNotes(rows.map(noteFromRow))
  const expired = notes.filter((note) => isTrashExpired(note))
  if (expired.length > 0) {
    const now = new Date().toISOString()
    for (const note of expired) {
      await db.run(`UPDATE notes SET deleted_hard = 1, updated_at = ? WHERE id = ?`, [now, note.id])
      await trackLocalChange(db, 'note', note.id, 'delete')
    }
  }
  return sortNotesByUpdatedAt(purgeExpiredTrashNotes(notes))
}

async function listFolders(db: SqliteDatabase): Promise<Folder[]> {
  const rows = rowsFromExec(
    await db.exec(`SELECT * FROM folders WHERE deleted_hard = 0 ORDER BY name COLLATE NOCASE ASC`),
  )
  return normalizeFolders(rows.map(folderFromRow))
}

async function insertNote(db: SqliteDatabase, note: Note): Promise<void> {
  await db.run(
    `INSERT INTO notes (
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

async function updateNoteRow(db: SqliteDatabase, note: Note): Promise<void> {
  await db.run(
    `UPDATE notes SET
      title = ?, content = ?, excerpt = ?, tags_json = ?, folder_id = ?, is_favorite = ?,
      is_deleted = ?, deleted_at = ?, cover = ?, pinned = ?, read_only = ?, updated_at = ?, deleted_hard = 0
     WHERE id = ?`,
    [
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
      note.updatedAt,
      note.id,
    ],
  )
}

async function insertFolder(db: SqliteDatabase, folder: Folder): Promise<void> {
  await db.run(
    `INSERT INTO folders (id, name, icon, parent_id, created_at, updated_at, deleted_hard)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [folder.id, folder.name, folder.icon, folder.parentId, folder.createdAt, folder.updatedAt],
  )
}

async function updateFolderRow(db: SqliteDatabase, folder: Folder): Promise<void> {
  await db.run(
    `UPDATE folders SET name = ?, icon = ?, parent_id = ?, updated_at = ?, deleted_hard = 0 WHERE id = ?`,
    [folder.name, folder.icon, folder.parentId, folder.updatedAt, folder.id],
  )
}

/**
 * 本地优先 SQLite 笔记仓储（Web: sql.js + localStorage 持久化）。
 * 桌面/移动端后续替换 database 适配层，业务接口保持不变。
 */
export class SqliteNotesRepository implements NotesRepository {
  async list(): Promise<Note[]> {
    return withDb(async (db) => await listNotes(db))
  }

  async listFolders(): Promise<Folder[]> {
    return withDb(async (db) => await listFolders(db))
  }

  async create(draft: NoteDraft): Promise<Note> {
    return withDb(async (db) => {
      const note = buildNewNote(draft, createId(), new Date().toISOString())
      await insertNote(db, note)
      await trackLocalChange(db, 'note', note.id, 'upsert', note)
      return note
    })
  }

  async createFolder(draft: FolderDraft): Promise<Folder> {
    return withDb(async (db) => {
      const folders = await listFolders(db)
      const now = new Date().toISOString()
      assertValidParentId(folders, draft.parentId ?? null)
      if (hasFolderNameConflict(folders, draft.name, draft.parentId ?? null)) {
        throw new Error('同级已存在同名文件夹。')
      }
      const folder = buildFolder(draft, createId(), now)
      await insertFolder(db, folder)
      await trackLocalChange(db, 'folder', folder.id, 'upsert', folder)
      return folder
    })
  }

  async update(
    id: string,
    patch: Partial<
      Pick<
        Note,
        | 'title'
        | 'content'
        | 'tags'
        | 'folderId'
        | 'isFavorite'
        | 'isDeleted'
        | 'deletedAt'
        | 'cover'
        | 'pinned'
        | 'readOnly'
      >
    >,
  ): Promise<Note> {
    return withDb(async (db) => {
      const rows = rowsFromExec(await db.exec(`SELECT * FROM notes WHERE id = ? AND deleted_hard = 0`, [id]))
      if (!rows.length) {
        throw new Error(`Note not found: ${id}`)
      }
      const current = noteFromRow(rows[0])
      const updated = applyNotePatch(current, patch, new Date().toISOString())
      await updateNoteRow(db, updated)
      await trackLocalChange(db, 'note', updated.id, 'upsert', updated)
      return updated
    })
  }

  async updateFolder(
    id: string,
    patch: Partial<Pick<Folder, 'name' | 'icon' | 'parentId'>>,
  ): Promise<Folder> {
    return withDb(async (db) => {
      const folders = await listFolders(db)
      const current = folders.find((folder) => folder.id === id)
      if (!current) {
        throw new Error(`Folder not found: ${id}`)
      }
      if (patch.parentId !== undefined) {
        assertValidParentId(folders, patch.parentId)
        if (!canMoveFolder(folders, id, patch.parentId)) {
          throw new Error('无法移动到该位置。')
        }
      }
      const nextName = patch.name ?? current.name
      const nextParentId = patch.parentId === undefined ? current.parentId : patch.parentId
      if (
        (patch.name !== undefined || patch.parentId !== undefined) &&
        hasFolderNameConflict(folders, nextName, nextParentId, new Set([id]))
      ) {
        throw new Error('同级已存在同名文件夹。')
      }
      const updated = applyFolderPatch(current, patch, new Date().toISOString())
      await updateFolderRow(db, updated)
      await trackLocalChange(db, 'folder', updated.id, 'upsert', updated)
      return updated
    })
  }

  async delete(id: string): Promise<void> {
    return withDb(async (db) => {
      const now = new Date().toISOString()
      await db.run(`UPDATE notes SET deleted_hard = 1, updated_at = ? WHERE id = ?`, [now, id])
      await db.run(`UPDATE snapshots SET deleted_hard = 1 WHERE note_id = ?`, [id])
      await trackLocalChange(db, 'note', id, 'delete')
      await trackLocalChange(db, 'snapshot', id, 'delete')
    })
  }

  async deleteFolders(ids: string[]): Promise<void> {
    return withDb(async (db) => {
      const now = new Date().toISOString()
      for (const id of ids) {
        await db.run(`UPDATE folders SET deleted_hard = 1, updated_at = ? WHERE id = ?`, [now, id])
        await trackLocalChange(db, 'folder', id, 'delete')
      }
    })
  }

  /** 供迁移 / 同步引擎批量写入。 */
  async upsertNoteFromRemote(note: Note): Promise<void> {
    return withDb(async (db) => {
      const rows = rowsFromExec(await db.exec(`SELECT id FROM notes WHERE id = ?`, [note.id]))
      if (rows.length) await updateNoteRow(db, note)
      else await insertNote(db, note)
    })
  }

  async upsertFolderFromRemote(folder: Folder): Promise<void> {
    return withDb(async (db) => {
      const rows = rowsFromExec(await db.exec(`SELECT id FROM folders WHERE id = ?`, [folder.id]))
      if (rows.length) await updateFolderRow(db, folder)
      else await insertFolder(db, folder)
    })
  }

  async markHardDeleted(entity: SyncEntity, id: string): Promise<void> {
    return withDb(async (db) => {
      const now = new Date().toISOString()
      if (entity === 'note') {
        await db.run(`UPDATE notes SET deleted_hard = 1, updated_at = ? WHERE id = ?`, [now, id])
      } else if (entity === 'folder') {
        await db.run(`UPDATE folders SET deleted_hard = 1, updated_at = ? WHERE id = ?`, [now, id])
      } else if (entity === 'snapshot') {
        await db.run(`UPDATE snapshots SET deleted_hard = 1 WHERE note_id = ? OR id = ?`, [id, id])
      } else if (entity === 'message') {
        await db.run(`UPDATE messages SET deleted_hard = 1, updated_at = ? WHERE id = ?`, [now, id])
      }
    })
  }
}

export const sqliteNotesRepository = new SqliteNotesRepository()
