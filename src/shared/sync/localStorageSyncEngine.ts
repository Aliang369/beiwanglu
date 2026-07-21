/**
 * localStorage 回退模式下的云端同步（完整范围尽量对齐 SQLite 引擎）。
 * 冲突策略：LWW（updatedAt / createdAt 后写覆盖）。
 */
import { notesApi } from '../api/modules/notesApi'
import { snapshotsApi } from '../api/modules/snapshotsApi'
import { messagesApi } from '../api/modules/messagesApi'
import { webNotesRepository } from '../data/webNotesRepository'
import { webSnapshotsRepository } from '../data/snapshotsRepository'
import type { Folder } from '../types/folder'
import type { MessageItem } from '../types/message'
import type { Note } from '../types/note'
import { getSyncPreferences, isSyncEnabled, setSyncPreferences } from './syncPreferences'
import type { SyncResult } from './syncEngine'

function newer(a: string | null | undefined, b: string | null | undefined): boolean {
  const ta = a ? new Date(a).getTime() : 0
  const tb = b ? new Date(b).getTime() : 0
  return ta > tb
}

async function pushNote(note: Note): Promise<void> {
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
  } catch {
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

async function pushFolder(folder: Folder): Promise<void> {
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

async function syncNotesAndFolders(): Promise<{ pushed: number; pulled: number }> {
  const [localNotes, localFolders, remoteNotes, remoteFolders] = await Promise.all([
    webNotesRepository.list(),
    webNotesRepository.listFolders(),
    notesApi.listNotes(),
    notesApi.listFolders(),
  ])

  let pushed = 0
  let pulled = 0

  const remoteNoteMap = new Map(remoteNotes.map((item) => [item.id, item]))
  const remoteFolderMap = new Map(remoteFolders.map((item) => [item.id, item]))
  const localNoteMap = new Map(localNotes.map((item) => [item.id, item]))
  const localFolderMap = new Map(localFolders.map((item) => [item.id, item]))

  // folders first（笔记依赖 folderId）
  const folderIds = new Set([...localFolderMap.keys(), ...remoteFolderMap.keys()])
  for (const id of folderIds) {
    const local = localFolderMap.get(id)
    const remote = remoteFolderMap.get(id)
    if (local && remote) {
      if (newer(local.updatedAt, remote.updatedAt)) {
        await pushFolder(local)
        pushed += 1
      } else if (newer(remote.updatedAt, local.updatedAt)) {
        await webNotesRepository.upsertFolder(remote)
        pulled += 1
      }
    } else if (local && !remote) {
      await pushFolder(local)
      pushed += 1
    } else if (!local && remote) {
      await webNotesRepository.upsertFolder(remote)
      pulled += 1
    }
  }

  const noteIds = new Set([...localNoteMap.keys(), ...remoteNoteMap.keys()])
  for (const id of noteIds) {
    const local = localNoteMap.get(id)
    const remote = remoteNoteMap.get(id)
    if (local && remote) {
      if (newer(local.updatedAt, remote.updatedAt)) {
        await pushNote(local)
        pushed += 1
      } else if (newer(remote.updatedAt, local.updatedAt)) {
        await webNotesRepository.upsertNote(remote)
        pulled += 1
      }
    } else if (local && !remote) {
      await pushNote(local)
      pushed += 1
    } else if (!local && remote) {
      await webNotesRepository.upsertNote(remote)
      pulled += 1
    }
  }

  return { pushed, pulled }
}

async function syncSnapshots(notes: Note[]): Promise<{ pushed: number; pulled: number }> {
  let pushed = 0
  let pulled = 0
  const targets = notes
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 30)

  for (const note of targets) {
    try {
      const [local, remote] = await Promise.all([
        webSnapshotsRepository.listByNote(note.id),
        snapshotsApi.listByNote(note.id),
      ])
      const localMap = new Map(local.map((item) => [item.id, item]))
      const remoteMap = new Map(remote.map((item) => [item.id, item]))
      const ids = new Set([...localMap.keys(), ...remoteMap.keys()])

      for (const id of ids) {
        const l = localMap.get(id)
        const r = remoteMap.get(id)
        if (l && r) {
          if (newer(l.createdAt, r.createdAt)) {
            await snapshotsApi.create({
              noteId: l.noteId,
              title: l.title,
              noteTitle: l.noteTitle,
              content: l.content,
            })
            pushed += 1
          } else if (newer(r.createdAt, l.createdAt)) {
            await webSnapshotsRepository.upsertFromRemote(r)
            pulled += 1
          }
        } else if (l && !r) {
          await snapshotsApi.create({
            noteId: l.noteId,
            title: l.title,
            noteTitle: l.noteTitle,
            content: l.content,
          })
          pushed += 1
        } else if (!l && r) {
          await webSnapshotsRepository.upsertFromRemote(r)
          pulled += 1
        }
      }
    } catch {
      // 单笔记失败不阻断
    }
  }

  return { pushed, pulled }
}

async function syncMessages(): Promise<{ pushed: number; pulled: number }> {
  // 消息以服务端为准：拉全量并缓存到 localStorage（轻量 key）
  const KEY = 'beiwanglu.messages.cache.v1'
  let pushed = 0
  let pulled = 0

  const remote = await messagesApi.list()
  let localItems: MessageItem[] = []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { items?: MessageItem[] }
      localItems = Array.isArray(parsed.items) ? parsed.items : []
    }
  } catch {
    localItems = []
  }

  const localMap = new Map(localItems.map((item) => [item.id, item]))
  // 推送本地已读状态
  for (const local of localItems) {
    const remoteItem = remote.items.find((item) => item.id === local.id)
    if (remoteItem && local.unread === false && remoteItem.unread === true) {
      try {
        await messagesApi.markRead(local.id)
        pushed += 1
      } catch {
        // ignore
      }
    }
  }

  // 合并：远端优先覆盖内容，但本地已读可保留更“已读”
  const merged: MessageItem[] = remote.items.map((item) => {
    const local = localMap.get(item.id)
    if (local && local.unread === false) {
      return { ...item, unread: false }
    }
    return item
  })
  // 远端没有的本地消息保留
  for (const local of localItems) {
    if (!merged.some((item) => item.id === local.id)) {
      merged.push(local)
    }
  }

  window.localStorage.setItem(
    KEY,
    JSON.stringify({
      items: merged,
      unreadCount: merged.filter((item) => item.unread).length,
      updatedAt: new Date().toISOString(),
    }),
  )
  pulled = remote.items.length

  try {
    const settings = await messagesApi.getNotificationSettings()
    window.localStorage.setItem(
      'beiwanglu.notificationSettings.cache.v1',
      JSON.stringify({ ...settings, updatedAt: new Date().toISOString() }),
    )
  } catch {
    // ignore
  }

  return { pushed, pulled }
}

export async function runLocalStorageSyncCycle(options?: { force?: boolean }): Promise<SyncResult> {
  if (!options?.force && !isSyncEnabled()) {
    return {
      status: 'disabled',
      pushed: 0,
      pulled: 0,
      lastSyncedAt: getSyncPreferences().lastSyncedAt,
    }
  }

  try {
    const notesFolders = await syncNotesAndFolders()
    const notes = await webNotesRepository.list()
    const snaps = await syncSnapshots(notes)
    const messages = await syncMessages()

    const lastSyncedAt = new Date().toISOString()
    setSyncPreferences({ lastSyncedAt })

    const pushed = notesFolders.pushed + snaps.pushed + messages.pushed
    const pulled = notesFolders.pulled + snaps.pulled + messages.pulled
    console.info('[sync:localStorage] done', { pushed, pulled })

    return {
      status: 'idle',
      pushed,
      pulled,
      lastSyncedAt,
    }
  } catch (error) {
    return {
      status: 'error',
      pushed: 0,
      pulled: 0,
      error: error instanceof Error ? error.message : '同步失败',
      lastSyncedAt: getSyncPreferences().lastSyncedAt,
    }
  }
}
