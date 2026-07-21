/**
 * 上线前清理旧的 localStorage 数据。
 *
 * 清理目标：
 * - beiwanglu.notes.v4（前端笔记数据，已迁到后端）
 * - beiwanglu.notes.v1（v4 镜像，迁移用）
 * - beiwanglu.notes.v2 / v3（历史版本）
 * - beiwanglu.snapshots.v1（快照数据，已迁到后端）
 *
 * 保留：
 * - beiwanglu.searchHistory.v1（搜索历史，仍走本地）
 * - beiwanglu.auth.accessToken / beiwanglu.auth.refreshToken / beiwanglu.auth.user（登录态）
 *
 * 只清一次：用 beiwanglu.legacyCleared.v1 标记，避免重复清理。
 */

const LEGACY_NOTES_KEYS = [
  'beiwanglu.notes.v4',
  'beiwanglu.notes.v1',
  'beiwanglu.notes.v2',
  'beiwanglu.notes.v3',
  'beiwanglu.snapshots.v1',
]

const CLEARED_FLAG_KEY = 'beiwanglu.legacyCleared.v1'

/**
 * 清理旧 localStorage 数据。仅清理一次，重复调用会跳过。
 *
 * @param force 强制再次清理（即便已标记为已清理）
 * @returns 实际清理的 key 数组
 */
export function clearLegacyStorage(force = false): string[] {
  if (!force) {
    const cleared = window.localStorage.getItem(CLEARED_FLAG_KEY)
    if (cleared === '1') {
      return []
    }
  }

  const removed: string[] = []
  for (const key of LEGACY_NOTES_KEYS) {
    if (window.localStorage.getItem(key) !== null) {
      window.localStorage.removeItem(key)
      removed.push(key)
    }
  }

  window.localStorage.setItem(CLEARED_FLAG_KEY, '1')
  return removed
}
