/**
 * 本地数据后端选择：优先 SQLite，失败回退 localStorage。
 */
import type { NotesRepository } from './notesRepository'
import type { SnapshotsRepository } from './snapshotsRepository'
import { webNotesRepository } from './webNotesRepository'
import { webSnapshotsRepository } from './snapshotsRepository'
import { sqliteNotesRepository } from './sqliteNotesRepository'
import { sqliteSnapshotsRepository } from './sqlite/sqliteSnapshotsRepository'
import { probeSqliteAvailable } from './sqlite/database'
import { migrateLegacyLocalStorageToSqlite } from './migrateLegacyToSqlite'

export type LocalBackendKind = 'sqlite' | 'localStorage'

let backend: LocalBackendKind = 'localStorage'
let initialized = false

export function getLocalBackendKind(): LocalBackendKind {
  return backend
}

export function getActiveNotesRepository(): NotesRepository {
  return backend === 'sqlite' ? sqliteNotesRepository : webNotesRepository
}

export function getActiveSnapshotsRepository(): SnapshotsRepository {
  return backend === 'sqlite' ? sqliteSnapshotsRepository : webSnapshotsRepository
}

/**
 * 启动时探测 SQLite；成功则迁移 legacy 数据并标记 sqlite 后端。
 * 任何失败都回退 localStorage，保证页面可开。
 */
export async function initLocalBackend(): Promise<LocalBackendKind> {
  if (initialized) return backend
  initialized = true

  const ok = await probeSqliteAvailable()
  if (!ok) {
    backend = 'localStorage'
    console.info('[localBackend] using localStorage fallback')
    return backend
  }

  try {
    await migrateLegacyLocalStorageToSqlite()
    backend = 'sqlite'
    console.info('[localBackend] using SQLite')
  } catch (error) {
    console.warn('[localBackend] migrate failed, fallback to localStorage', error)
    backend = 'localStorage'
  }
  return backend
}
