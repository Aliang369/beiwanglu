import type { SqliteDatabase } from '../data/sqlite/database'
import type { SyncEntity } from '../data/sqlite/schema'
import { rowsFromExec } from '../data/sqlite/mappers'

export type SyncOp = 'upsert' | 'delete'

/** 单条队列最大尝试次数；达到后视为失败项，仍保留待人工「立即同步」强制重试时可重置 */
export const SYNC_MAX_ATTEMPTS = 8

export interface SyncQueueItem {
  id: number
  entity: SyncEntity
  entityId: string
  op: SyncOp
  payload: unknown | null
  updatedAt: string
  attempts: number
}

export interface SyncQueueStats {
  total: number
  pending: number
  failed: number
}

/** 本地变更入队；同一 entity+id 合并为最新一条，并重置 attempts。 */
export async function enqueueSyncChange(
  db: SqliteDatabase,
  entity: SyncEntity,
  entityId: string,
  op: SyncOp,
  payload?: unknown,
): Promise<void> {
  const now = new Date().toISOString()
  await db.run(
    `INSERT INTO sync_queue (entity, entity_id, op, payload_json, updated_at, attempts)
     VALUES (?, ?, ?, ?, ?, 0)
     ON CONFLICT(entity, entity_id) DO UPDATE SET
       op = excluded.op,
       payload_json = excluded.payload_json,
       updated_at = excluded.updated_at,
       attempts = 0`,
    [entity, entityId, op, payload === undefined ? null : JSON.stringify(payload), now],
  )
}

function mapRow(row: Record<string, unknown>): SyncQueueItem {
  let payload: unknown = null
  if (row.payload_json != null) {
    try {
      payload = JSON.parse(String(row.payload_json))
    } catch {
      payload = null
    }
  }
  return {
    id: Number(row.id),
    entity: String(row.entity) as SyncEntity,
    entityId: String(row.entity_id),
    op: String(row.op) as SyncOp,
    payload,
    updatedAt: String(row.updated_at),
    attempts: Number(row.attempts ?? 0),
  }
}

export async function listSyncQueue(db: SqliteDatabase, limit = 200): Promise<SyncQueueItem[]> {
  const rows = rowsFromExec(
    await db.exec(
      `SELECT id, entity, entity_id, op, payload_json, updated_at, attempts
       FROM sync_queue
       ORDER BY updated_at ASC
       LIMIT ?`,
      [limit],
    ),
  )
  return rows.map(mapRow)
}

/** 可推送项：未达失败上限；按 attempts 做简单退避（attempts 越高越靠后）。 */
export async function listReadySyncQueue(db: SqliteDatabase, limit = 200): Promise<SyncQueueItem[]> {
  const all = await listSyncQueue(db, 500)
  const ready = all.filter((item) => item.attempts < SYNC_MAX_ATTEMPTS)
  ready.sort((a, b) => {
    if (a.attempts !== b.attempts) return a.attempts - b.attempts
    return a.updatedAt.localeCompare(b.updatedAt)
  })
  return ready.slice(0, limit)
}

export async function getSyncQueueStats(db: SqliteDatabase): Promise<SyncQueueStats> {
  const rows = rowsFromExec(await db.exec(`SELECT attempts FROM sync_queue`))
  let pending = 0
  let failed = 0
  for (const row of rows) {
    const attempts = Number(row.attempts ?? 0)
    if (attempts >= SYNC_MAX_ATTEMPTS) failed += 1
    else pending += 1
  }
  return { total: rows.length, pending, failed }
}

/** 强制重试：将失败项 attempts 清零 */
export async function resetFailedSyncQueue(db: SqliteDatabase): Promise<number> {
  const before = (await getSyncQueueStats(db)).failed
  await db.run(`UPDATE sync_queue SET attempts = 0 WHERE attempts >= ?`, [SYNC_MAX_ATTEMPTS])
  return before
}

export async function removeSyncQueueItem(db: SqliteDatabase, id: number): Promise<void> {
  await db.run(`DELETE FROM sync_queue WHERE id = ?`, [id])
}

export async function bumpSyncQueueAttempt(db: SqliteDatabase, id: number): Promise<void> {
  await db.run(`UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?`, [id])
}

export async function getSyncCursor(db: SqliteDatabase, entity: SyncEntity): Promise<string | null> {
  const rows = rowsFromExec(await db.exec(`SELECT cursor FROM sync_state WHERE entity = ?`, [entity]))
  if (!rows.length || rows[0].cursor == null) return null
  return String(rows[0].cursor)
}

export async function setSyncCursor(db: SqliteDatabase, entity: SyncEntity, cursor: string | null): Promise<void> {
  const now = new Date().toISOString()
  await db.run(
    `INSERT INTO sync_state (entity, last_pulled_at, last_pushed_at, cursor)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(entity) DO UPDATE SET
       last_pulled_at = excluded.last_pulled_at,
       cursor = excluded.cursor`,
    [entity, now, now, cursor],
  )
}
