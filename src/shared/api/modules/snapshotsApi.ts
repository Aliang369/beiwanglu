import type { Snapshot } from '../../types/snapshot'
import { isMockApiMode } from '../config'
import { request } from '../httpClient'

/**
 * 远端快照 API。
 * 字段契约见 docs/api-contract.md §5.3。
 */
export const snapshotsApi = {
  listByNote(noteId: string): Promise<Snapshot[]> {
    if (isMockApiMode()) {
      // Mock 模式：返回空数组，由 webSnapshotsRepository 兜底
      return Promise.resolve([])
    }
    return request<{ items: Snapshot[] }>({ method: 'GET', path: '/snapshots', query: { noteId } }).then(
      (res) => res.items,
    )
  },

  create(payload: {
    noteId: string
    title: string
    noteTitle: string
    content: string
  }): Promise<Snapshot> {
    if (isMockApiMode()) {
      return Promise.reject(new Error('mock 模式不支持创建快照'))
    }
    return request<Snapshot>({ method: 'POST', path: '/snapshots', body: payload })
  },

  delete(id: string): Promise<void> {
    if (isMockApiMode()) return Promise.resolve()
    return request<void>({ method: 'DELETE', path: `/snapshots/${id}` })
  },

  deleteByNote(noteId: string): Promise<{ success: boolean; deletedCount: number }> {
    if (isMockApiMode()) return Promise.resolve({ success: true, deletedCount: 0 })
    return request<{ success: boolean; deletedCount: number }>({
      method: 'DELETE',
      path: '/snapshots',
      query: { noteId },
    })
  },
}
