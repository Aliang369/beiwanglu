/**
 * 笔记快照本地存储仓库。
 * - localStorage key: beiwanglu.snapshots.v1
 * - 结构：{ version, snapshots: Record<noteId, Snapshot[]> }
 * - TODO: 后续迁移到 IndexedDB 或后端存储，当前跑通流程使用 localStorage。
 */
import { MAX_SNAPSHOTS_PER_NOTE, SNAPSHOT_TTL_MS } from '../types/snapshot'
import type { Snapshot } from '../types/snapshot'

const STORAGE_KEY = 'beiwanglu.snapshots.v1'

interface SnapshotsStorage {
  version: 1
  snapshots: Record<string, Snapshot[]>
}

export class WebSnapshotsRepository {
  private readonly storage: Storage

  constructor(storage: Storage = window.localStorage) {
    this.storage = storage
  }

  listByNote(noteId: string): Snapshot[] {
    const data = this.read()
    return data.snapshots[noteId] ?? []
  }

  /** 追加快照并按双重策略清理（数量上限 + 时间上限）。 */
  add(snapshot: Snapshot): Snapshot[] {
    const data = this.read()
    const list = (data.snapshots[snapshot.noteId] ?? []).slice()
    list.push(snapshot)
    const trimmed = this.trim(list)
    data.snapshots[snapshot.noteId] = trimmed
    this.write(data)
    return trimmed
  }

  /** 替换某笔记的全部快照（清理用）。 */
  setNoteSnapshots(noteId: string, snapshots: Snapshot[]): void {
    const data = this.read()
    data.snapshots[noteId] = snapshots
    this.write(data)
  }

  /** 删除某笔记的全部快照（笔记被永久删除时调用）。 */
  deleteByNote(noteId: string): void {
    const data = this.read()
    delete data.snapshots[noteId]
    this.write(data)
  }

  private trim(list: Snapshot[]): Snapshot[] {
    const now = Date.now()
    const withinTtl = list.filter((s) => now - new Date(s.createdAt).getTime() <= SNAPSHOT_TTL_MS)
    // 保留最近 N 条（按时间倒序）
    const sorted = withinTtl.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return sorted.slice(0, MAX_SNAPSHOTS_PER_NOTE)
  }

  private read(): SnapshotsStorage {
    const raw = this.storage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SnapshotsStorage
        if (parsed && parsed.version === 1 && parsed.snapshots) {
          return parsed
        }
      } catch {
        // fall through
      }
    }
    return { version: 1, snapshots: {} }
  }

  private write(data: SnapshotsStorage): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

export const webSnapshotsRepository = new WebSnapshotsRepository()
