import { notesApi } from '../api/modules/notesApi'
import { snapshotsApi } from '../api/modules/snapshotsApi'
import { messagesApi } from '../api/modules/messagesApi'
import { openSqliteDatabase, schedulePersist } from '../data/sqlite/database'
import { folderFromRow, messageFromRow, noteFromRow, rowsFromExec } from '../data/sqlite/mappers'
import { sqliteNotesRepository } from '../data/sqlite/sqliteNotesRepository'
import { sqliteSnapshotsRepository } from '../data/sqlite/sqliteSnapshotsRepository'
import type { Folder } from '../types/folder'
import type { MessageItem, NotificationSettings } from '../types/message'
import type { Note } from '../types/note'
import type { Snapshot } from '../types/snapshot'
import { getSyncPreferences, isSyncEnabled, setSyncPreferences } from './syncPreferences'
import {
  SYNC_MAX_ATTEMPTS,
  bumpSyncQueueAttempt,
  getSyncCursor,
  getSyncQueueStats,
  listReadySyncQueue,
  removeSyncQueueItem,
  resetFailedSyncQueue,
  setSyncCursor,
  type SyncQueueStats,
} from './syncQueue'

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'disabled'

export interface SyncResult {
  status: SyncStatus
  pushed: number
  pulled: number
  error?: string
  lastSyncedAt: string | null
  queue?: SyncQueueStats
}

let inflight: Promise<SyncResult> | null = null

function newer(a: string | null | undefined, b: string | null | undefined): boolean {
  const ta = a ? new Date(a).getTime() : 0
  const tb = b ? new Date(b).getTime() : 0
  return ta > tb
}

function mergeByUpdatedAt<T extends { id: string; updatedAt: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of local) map.set(item.id, item)
  for (const item of remote) {
    const current = map.get(item.id)
    if (!current || newer(item.updatedAt, current.updatedAt)) {
      map.set(item.id, item)
    }
  }
  return [...map.values()]
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: number; status?: number }).code
  const status = (error as { status?: number }).status
  const message = String((error as { message?: string }).message ?? '')
  return code === 40401 || status === 404 || /不存在|not found/i.test(message)
}

/** 保留本地 id：先 update，不存在则 create(id) 再 update 补全字段 */
async function upsertNoteRemote(note: Note): Promise<void> {
  try {
    await notesApi.updateNote(note.id, {
      title: note.title,
      content: note.content,
      tags: note.tags,
      folderId: note.folderId,
      isFavorite: note.isFavorite,
      isDeleted: note.isDeleted,
      deletedAt: note.deletedAt,
      cover: note.cover,
      pinned: note.pinned,
      readOnly: note.readOnly,
    })
  } catch (error) {
    if (!isNotFoundError(error)) {
      // 其它错误：尝试 create+update；仍失败则抛出由队列重试
    }
    await notesApi.createNote({
      id: note.id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      folderId: note.folderId,
      cover: note.cover,
    })
    await notesApi.updateNote(note.id, {
      title: note.title,
      content: note.content,
      tags: note.tags,
      folderId: note.folderId,
      isFavorite: note.isFavorite,
      isDeleted: note.isDeleted,
      deletedAt: note.deletedAt,
      cover: note.cover,
      pinned: note.pinned,
      readOnly: note.readOnly,
    })
  }
}

async function upsertFolderRemote(folder: Folder): Promise<void> {
  try {
    await notesApi.updateFolder(folder.id, {
      name: folder.name,
      icon: folder.icon,
      parentId: folder.parentId,
    })
  } catch {
    await notesApi.createFolder({
      id: folder.id,
      name: folder.name,
      icon: folder.icon,
      parentId: folder.parentId,
    })
  }
}

async function pullNotesAndFolders(): Promise<number> {
  const [remoteNotes, remoteFolders] = await Promise.all([notesApi.listNotes(), notesApi.listFolders()])
  const db = await openSqliteDatabase()
  const localNotes = rowsFromExec(await db.exec(`SELECT * FROM notes WHERE deleted_hard = 0`)).map(noteFromRow)
  const localFolders = rowsFromExec(await db.exec(`SELECT * FROM folders WHERE deleted_hard = 0`)).map(folderFromRow)

  const mergedNotes = mergeByUpdatedAt(localNotes, remoteNotes)
  const mergedFolders = mergeByUpdatedAt(localFolders, remoteFolders)

  let pulled = 0
  for (const note of mergedNotes) {
    const local = localNotes.find((item) => item.id === note.id)
    if (!local || newer(note.updatedAt, local.updatedAt)) {
      await sqliteNotesRepository.upsertNoteFromRemote(note)
      pulled += 1
    }
  }
  for (const folder of mergedFolders) {
    const local = localFolders.find((item) => item.id === folder.id)
    if (!local || newer(folder.updatedAt, local.updatedAt)) {
      await sqliteNotesRepository.upsertFolderFromRemote(folder)
      pulled += 1
    }
  }

  await setSyncCursor(db, 'note', new Date().toISOString())
  await setSyncCursor(db, 'folder', new Date().toISOString())
  schedulePersist(db)
  return pulled
}

async function pullSnapshotsForLocalNotes(notes: Note[]): Promise<number> {
  let pulled = 0
  // 控制流量：最近更新的最多 50 条笔记
  const targets = notes
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 50)

  for (const note of targets) {
    try {
      const remote = await snapshotsApi.listByNote(note.id)
      const local = await sqliteSnapshotsRepository.listByNote(note.id)
      const map = new Map(local.map((item) => [item.id, item]))
      for (const snap of remote) {
        const current = map.get(snap.id)
        if (!current || newer(snap.createdAt, current.createdAt)) {
          await sqliteSnapshotsRepository.upsertFromRemote(snap)
          pulled += 1
        }
      }
    } catch {
      // 单笔记失败不阻断整轮
    }
  }
  return pulled
}

async function pullMessages(): Promise<number> {
  const remote = await messagesApi.list()
  const db = await openSqliteDatabase()
  const localRows = rowsFromExec(await db.exec(`SELECT * FROM messages WHERE deleted_hard = 0`))
  const local = localRows.map(messageFromRow)
  const localById = new Map(local.map((item) => [item.id, item]))
  let pulled = 0

  for (const item of remote.items) {
    const current = localById.get(item.id)
    // MessageItem 无 updatedAt：以 createdAt + unread 为准，远端优先覆盖展示字段；本地未推送的已读见 push
    if (!current || newer(item.createdAt, current.createdAt) || item.unread !== current.unread) {
      // 若本地已读且远端仍未读，保留本地已读，交给 push 推送
      const unread = current && current.unread === false && item.unread === true ? false : item.unread
      await db.run(
        `INSERT INTO messages (
          id, title, summary, content_json, time, created_at, type, category, source, tag,
          unread, primary_action, secondary_action, updated_at, deleted_hard
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          summary = excluded.summary,
          content_json = excluded.content_json,
          time = excluded.time,
          created_at = excluded.created_at,
          type = excluded.type,
          category = excluded.category,
          source = excluded.source,
          tag = excluded.tag,
          unread = excluded.unread,
          primary_action = excluded.primary_action,
          secondary_action = excluded.secondary_action,
          updated_at = excluded.updated_at,
          deleted_hard = 0`,
        [
          item.id,
          item.title,
          item.summary,
          JSON.stringify(item.content ?? []),
          item.time,
          item.createdAt,
          item.type,
          item.category,
          item.source,
          item.tag,
          unread ? 1 : 0,
          item.primaryAction ?? null,
          item.secondaryAction ?? null,
          new Date().toISOString(),
        ],
      )
      pulled += 1
    }
  }

  try {
    const settings = await messagesApi.getNotificationSettings()
    await upsertNotificationSettings(db, settings)
  } catch {
    // ignore
  }

  await setSyncCursor(db, 'message', new Date().toISOString())
  schedulePersist(db)
  return pulled
}

async function upsertNotificationSettings(
  db: Awaited<ReturnType<typeof openSqliteDatabase>>,
  settings: NotificationSettings,
): Promise<void> {
  await db.run(
    `INSERT INTO notification_settings (id, system_enabled, security_enabled, content_enabled, updated_at)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       system_enabled = excluded.system_enabled,
       security_enabled = excluded.security_enabled,
       content_enabled = excluded.content_enabled,
       updated_at = excluded.updated_at`,
    [
      settings.systemEnabled ? 1 : 0,
      settings.securityEnabled ? 1 : 0,
      settings.contentEnabled ? 1 : 0,
      new Date().toISOString(),
    ],
  )
}

async function pushQueue(options?: { forceRetryFailed?: boolean }): Promise<{ pushed: number; lastError?: string }> {
  const db = await openSqliteDatabase()
  if (options?.forceRetryFailed) {
    await resetFailedSyncQueue(db)
  }

  const queue = await listReadySyncQueue(db)
  let pushed = 0
  let lastError: string | undefined

  for (const item of queue) {
    try {
      if (item.entity === 'note') {
        if (item.op === 'delete') {
          try {
            await notesApi.deleteNote(item.entityId)
          } catch (error) {
            if (!isNotFoundError(error)) throw error
          }
        } else {
          const note = item.payload as Note | null
          if (!note) {
            await removeSyncQueueItem(db, item.id)
            continue
          }
          await upsertNoteRemote(note)
        }
      } else if (item.entity === 'folder') {
        if (item.op === 'delete') {
          try {
            await notesApi.deleteFolders([item.entityId])
          } catch (error) {
            if (!isNotFoundError(error)) throw error
          }
        } else {
          const folder = item.payload as Folder | null
          if (!folder) {
            await removeSyncQueueItem(db, item.id)
            continue
          }
          await upsertFolderRemote(folder)
        }
      } else if (item.entity === 'snapshot') {
        if (item.op === 'delete') {
          try {
            // entityId 为 noteId（永久删除笔记时入队）
            await snapshotsApi.deleteByNote(item.entityId)
          } catch {
            // ignore cascade failures
          }
        } else {
          const snap = item.payload as Snapshot | null
          if (!snap) {
            await removeSyncQueueItem(db, item.id)
            continue
          }
          try {
            await snapshotsApi.create({
              noteId: snap.noteId,
              title: snap.title,
              noteTitle: snap.noteTitle,
              content: snap.content,
            })
          } catch (error) {
            // 远端可能已有等价内容；不阻断
            if (!isNotFoundError(error)) {
              // create 失败仍计 attempts
              throw error
            }
          }
        }
      } else if (item.entity === 'message') {
        if (item.op === 'upsert' && item.payload && typeof item.payload === 'object') {
          const message = item.payload as MessageItem & { action?: string }
          if (message.action === 'markAllRead') {
            await messagesApi.markAllRead()
          } else if (message.action === 'settings' && message) {
            // payload 直接是 settings patch 时
            const patch = item.payload as Partial<NotificationSettings>
            await messagesApi.updateNotificationSettings(patch)
          } else if (!message.unread && message.id) {
            await messagesApi.markRead(message.id)
          }
        }
      } else if (item.entity === 'notification_settings') {
        if (item.op === 'upsert' && item.payload && typeof item.payload === 'object') {
          await messagesApi.updateNotificationSettings(item.payload as Partial<NotificationSettings>)
        }
      }

      await removeSyncQueueItem(db, item.id)
      pushed += 1
    } catch (error) {
      await bumpSyncQueueAttempt(db, item.id)
      lastError = error instanceof Error ? error.message : '同步推送失败'
    }
  }

  schedulePersist(db)
  return { pushed, lastError }
}

/**
 * 执行一轮本地 ↔ 云端同步。
 * - 仅在登录且同步开关开启时运行（force 可绕过开关检查由上层保证）
 * - 冲突：后写覆盖（LWW，比较 updatedAt / createdAt）
 * - 队列失败：attempts 递增，达上限后暂停直至强制重试
 */
export async function runSyncCycle(options?: {
  force?: boolean
  forceRetryFailed?: boolean
}): Promise<SyncResult> {
  if (!options?.force && !isSyncEnabled()) {
    return {
      status: 'disabled',
      pushed: 0,
      pulled: 0,
      lastSyncedAt: getSyncPreferences().lastSyncedAt,
    }
  }

  if (inflight) return inflight

  inflight = (async () => {
    try {
      const pulledNotes = await pullNotesAndFolders()
      const db = await openSqliteDatabase()
      const notes = rowsFromExec(await db.exec(`SELECT * FROM notes WHERE deleted_hard = 0`)).map(noteFromRow)
      const pulledSnaps = await pullSnapshotsForLocalNotes(notes)
      const pulledMessages = await pullMessages()
      const pushResult = await pushQueue({ forceRetryFailed: options?.forceRetryFailed })

      // 首登/漏队：本地新于远端的笔记再推一次（保留本地 id）
      const remoteNotes = await notesApi.listNotes()
      const remoteMap = new Map(remoteNotes.map((item) => [item.id, item]))
      let extraPush = 0
      let extraError: string | undefined
      for (const note of notes) {
        const remote = remoteMap.get(note.id)
        if (!remote || newer(note.updatedAt, remote.updatedAt)) {
          try {
            await upsertNoteRemote(note)
            extraPush += 1
          } catch (error) {
            extraError = error instanceof Error ? error.message : '笔记上传失败'
          }
        }
      }

      // 文件夹漏推
      const localFolders = rowsFromExec(await db.exec(`SELECT * FROM folders WHERE deleted_hard = 0`)).map(folderFromRow)
      const remoteFolders = await notesApi.listFolders()
      const remoteFolderMap = new Map(remoteFolders.map((item) => [item.id, item]))
      for (const folder of localFolders) {
        const remote = remoteFolderMap.get(folder.id)
        if (!remote || newer(folder.updatedAt, remote.updatedAt)) {
          try {
            await upsertFolderRemote(folder)
            extraPush += 1
          } catch (error) {
            extraError = error instanceof Error ? error.message : '文件夹上传失败'
          }
        }
      }

      const queue = await getSyncQueueStats(db)
      const lastSyncedAt = new Date().toISOString()
      setSyncPreferences({ lastSyncedAt })
      await getSyncCursor(db, 'note')

      const errorParts = [pushResult.lastError, extraError].filter(Boolean)
      const hasHardError = queue.failed > 0 || Boolean(pushResult.lastError && pushResult.pushed === 0 && extraPush === 0)

      return {
        status: hasHardError ? 'error' : 'idle',
        pushed: pushResult.pushed + extraPush,
        pulled: pulledNotes + pulledSnaps + pulledMessages,
        error:
          errorParts.length > 0
            ? errorParts[0]
            : queue.failed > 0
              ? `${queue.failed} 条变更多次同步失败，可点「立即同步」重试`
              : undefined,
        lastSyncedAt,
        queue,
      }
    } catch (error) {
      return {
        status: 'error',
        pushed: 0,
        pulled: 0,
        error: error instanceof Error ? error.message : '同步失败',
        lastSyncedAt: getSyncPreferences().lastSyncedAt,
      }
    } finally {
      inflight = null
    }
  })()

  return inflight
}

export { SYNC_MAX_ATTEMPTS }
