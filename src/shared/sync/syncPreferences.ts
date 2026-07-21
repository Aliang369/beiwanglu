/**
 * 同步偏好：登录后默认开启；关闭需二次确认（UI 层）。
 * 偏好本身存在 localStorage（与账号解耦的设备级开关）。
 */

const SYNC_PREFS_KEY = 'beiwanglu.sync.prefs.v1'

export interface SyncPreferences {
  /** 登录后是否与云端同步；默认 true。 */
  enabled: boolean
  /** ISO；最近一次成功同步时间。 */
  lastSyncedAt: string | null
}

const DEFAULT_PREFS: SyncPreferences = {
  enabled: true,
  lastSyncedAt: null,
}

export function getSyncPreferences(): SyncPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFS }
  const raw = window.localStorage.getItem(SYNC_PREFS_KEY)
  if (!raw) return { ...DEFAULT_PREFS }
  try {
    const parsed = JSON.parse(raw) as Partial<SyncPreferences>
    return {
      enabled: parsed.enabled !== false,
      lastSyncedAt: typeof parsed.lastSyncedAt === 'string' ? parsed.lastSyncedAt : null,
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function setSyncPreferences(patch: Partial<SyncPreferences>): SyncPreferences {
  const next = { ...getSyncPreferences(), ...patch }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SYNC_PREFS_KEY, JSON.stringify(next))
  }
  return next
}

export function isSyncEnabled(): boolean {
  return getSyncPreferences().enabled
}
