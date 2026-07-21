import type { SqliteDatabase } from './database'
import { MAX_SNAPSHOTS_PER_NOTE, SNAPSHOT_TTL_MS } from '../../types/snapshot'
import type { Snapshot } from '../../types/snapshot'
import type { SnapshotsRepository } from '../snapshotsRepository'
import { openSqliteDatabase, schedulePersist } from './database'
import { rowsFromExec, snapshotFromRow } from './mappers'
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

async function withDb<T>(fn: (db: SqliteDatabase) => T | Promise<T>): Promise<T> {
  const db = await openSqliteDatabase()
  const result = await fn(db)
  schedulePersist(db)
  return result
}

function trimSnapshots(list: Snapshot[]): Snapshot[] {
  const now = Date.now()
  const withinTtl = list.filter((item) => now - new Date(item.createdAt).getTime() <= SNAPSHOT_TTL_MS)
  return withinTtl
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_SNAPSHOTS_PER_NOTE)
}

export class SqliteSnapshotsRepository implements SnapshotsRepository {
  async listByNote(noteId: string): Promise<Snapshot[]> {
    return withDb(async (db) => {
      const rows = rowsFromExec(
        await db.exec(
          `SELECT * FROM snapshots WHERE note_id = ? AND deleted_hard = 0 ORDER BY created_at DESC`,
          [noteId],
        ),
      )
      return trimSnapshots(rows.map(snapshotFromRow))
    })
  }

  async add(snapshot: Snapshot): Promise<Snapshot[]> {
    return withDb(async (db) => {
      await db.run(
        `INSERT INTO snapshots (id, note_id, title, note_title, content, created_at, deleted_hard)
         VALUES (?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(id) DO UPDATE SET
           note_id = excluded.note_id,
           title = excluded.title,
           note_title = excluded.note_title,
           content = excluded.content,
           created_at = excluded.created_at,
           deleted_hard = 0`,
        [
          snapshot.id,
          snapshot.noteId,
          snapshot.title,
          snapshot.noteTitle,
          snapshot.content,
          snapshot.createdAt,
        ],
      )
      await trackLocalChange(db, 'snapshot', snapshot.id, 'upsert', snapshot)

      const rows = rowsFromExec(
        await db.exec(
          `SELECT * FROM snapshots WHERE note_id = ? AND deleted_hard = 0 ORDER BY created_at DESC`,
          [snapshot.noteId],
        ),
      )
      const trimmed = trimSnapshots(rows.map(snapshotFromRow))
      const keep = new Set(trimmed.map((item) => item.id))
      for (const row of rows) {
        const id = String(row.id)
        if (!keep.has(id)) {
          await db.run(`UPDATE snapshots SET deleted_hard = 1 WHERE id = ?`, [id])
          await trackLocalChange(db, 'snapshot', id, 'delete')
        }
      }
      return trimmed
    })
  }

  async deleteByNote(noteId: string): Promise<void> {
    return withDb(async (db) => {
      await db.run(`UPDATE snapshots SET deleted_hard = 1 WHERE note_id = ?`, [noteId])
      await trackLocalChange(db, 'snapshot', noteId, 'delete')
    })
  }

  async upsertFromRemote(snapshot: Snapshot): Promise<void> {
    return withDb(async (db) => {
      await db.run(
        `INSERT INTO snapshots (id, note_id, title, note_title, content, created_at, deleted_hard)
         VALUES (?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(id) DO UPDATE SET
           note_id = excluded.note_id,
           title = excluded.title,
           note_title = excluded.note_title,
           content = excluded.content,
           created_at = excluded.created_at,
           deleted_hard = 0`,
        [
          snapshot.id,
          snapshot.noteId,
          snapshot.title,
          snapshot.noteTitle,
          snapshot.content,
          snapshot.createdAt,
        ],
      )
    })
  }
}

export const sqliteSnapshotsRepository = new SqliteSnapshotsRepository()
