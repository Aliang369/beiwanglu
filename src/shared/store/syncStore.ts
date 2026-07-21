import { create } from 'zustand'
import { getLocalBackendKind } from '../data/localBackend'
import { openSqliteDatabase } from '../data/sqlite/database'
import { getSyncPreferences, setSyncPreferences, type SyncPreferences } from '../sync/syncPreferences'
import { runSyncCycle, type SyncResult, type SyncStatus } from '../sync/syncEngine'
import { runLocalStorageSyncCycle } from '../sync/localStorageSyncEngine'
import { getSyncQueueStats, type SyncQueueStats } from '../sync/syncQueue'

interface SyncState {
  enabled: boolean
  status: SyncStatus
  lastSyncedAt: string | null
  lastError: string | null
  lastResult: SyncResult | null
  queue: SyncQueueStats | null
  hydrate: () => void
  setEnabled: (enabled: boolean) => SyncPreferences
  syncNow: (options?: { force?: boolean; forceRetryFailed?: boolean }) => Promise<SyncResult>
  /** 本地写入后防抖触发同步 */
  scheduleSync: () => void
  refreshQueueStats: () => Promise<void>
}

let debounceTimer: number | null = null
let visibilityBound = false

async function readQueueStats(): Promise<SyncQueueStats | null> {
  try {
    if (getLocalBackendKind() !== 'sqlite') return null
    const db = await openSqliteDatabase()
    return await getSyncQueueStats(db)
  } catch {
    return null
  }
}

export const useSyncStore = create<SyncState>((set, get) => ({
  enabled: true,
  status: 'idle',
  lastSyncedAt: null,
  lastError: null,
  lastResult: null,
  queue: null,

  hydrate() {
    const prefs = getSyncPreferences()
    set({
      enabled: prefs.enabled,
      lastSyncedAt: prefs.lastSyncedAt,
      status: prefs.enabled ? 'idle' : 'disabled',
    })
    void get().refreshQueueStats()

    if (typeof window !== 'undefined' && !visibilityBound) {
      visibilityBound = true
      window.addEventListener('online', () => {
        if (get().enabled) void get().syncNow()
      })
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && get().enabled) {
          void get().syncNow()
        }
      })
    }
  },

  setEnabled(enabled) {
    const prefs = setSyncPreferences({ enabled })
    set({
      enabled: prefs.enabled,
      lastSyncedAt: prefs.lastSyncedAt,
      status: prefs.enabled ? 'idle' : 'disabled',
      lastError: null,
    })
    return prefs
  },

  async syncNow(options) {
    if (!options?.force && !get().enabled) {
      const result: SyncResult = {
        status: 'disabled',
        pushed: 0,
        pulled: 0,
        lastSyncedAt: get().lastSyncedAt,
      }
      set({ status: 'disabled', lastResult: result })
      return result
    }

    set({ status: 'syncing', lastError: null })
    const backend = getLocalBackendKind()
    const result =
      backend === 'sqlite'
        ? await runSyncCycle({
            force: options?.force,
            forceRetryFailed: options?.forceRetryFailed ?? options?.force,
          })
        : await runLocalStorageSyncCycle(options)

    const queue = (await readQueueStats()) ?? result.queue ?? null
    set({
      status: result.status === 'error' ? 'error' : get().enabled ? 'idle' : 'disabled',
      lastSyncedAt: result.lastSyncedAt,
      lastError: result.error ?? null,
      lastResult: result,
      queue,
    })
    return result
  },

  scheduleSync() {
    if (!get().enabled) return
    if (typeof window === 'undefined') return
    if (debounceTimer != null) window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => {
      debounceTimer = null
      void get().syncNow()
    }, 1200)
  },

  async refreshQueueStats() {
    const queue = await readQueueStats()
    if (queue) set({ queue })
  },
}))
