/**
 * 笔记快照仓储抽象。
 *
 * 与 NotesRepository 模式一致：
 * - 本机：WebSnapshotsRepository（localStorage 回退）或 SqliteSnapshotsRepository
 * - 云端：ApiSnapshotsRepository / snapshotsApi 由同步引擎推拉
 *
 * localStorage key: beiwanglu.snapshots.v1
 * 结构：{ version, snapshots: Record<noteId, Snapshot[]> }
 */
import { snapshotsApi } from '../api/modules/snapshotsApi'
import { MAX_SNAPSHOTS_PER_NOTE, SNAPSHOT_TTL_MS } from '../types/snapshot'
import type { Snapshot } from '../types/snapshot'

const STORAGE_KEY = 'beiwanglu.snapshots.v1'

interface SnapshotsStorage {
  version: 1
  snapshots: Record<string, Snapshot[]>
}

/**
 * 快照仓储接口。
 * - listByNote: 返回指定笔记的快照列表（按 createdAt 倒序）
 * - add: 追加快照，并按双重策略清理（实现方负责 trim），返回最新列表
 * - deleteByNote: 删除指定笔记的全部快照（笔记永久删除时级联调用）
 */
export interface SnapshotsRepository {
  listByNote(noteId: string): Promise<Snapshot[]>
  add(snapshot: Snapshot): Promise<Snapshot[]>
  deleteByNote(noteId: string): Promise<void>
}

// ---------------- 本地仓储（localStorage） ----------------

export class WebSnapshotsRepository implements SnapshotsRepository {
  private readonly storage: Storage

  constructor(storage: Storage = window.localStorage) {
    this.storage = storage
  }

  async listByNote(noteId: string): Promise<Snapshot[]> {
    const data = this.read()
    return data.snapshots[noteId] ?? []
  }

  /** 追加快照并按双重策略清理（数量上限 + 时间上限）。 */
  async add(snapshot: Snapshot): Promise<Snapshot[]> {
    const data = this.read()
    const list = (data.snapshots[snapshot.noteId] ?? []).slice()
    list.push(snapshot)
    const trimmed = this.trim(list)
    data.snapshots[snapshot.noteId] = trimmed
    this.write(data)
    return trimmed
  }

  /** 删除某笔记的全部快照（笔记被永久删除时调用）。 */
  async deleteByNote(noteId: string): Promise<void> {
    const data = this.read()
    delete data.snapshots[noteId]
    this.write(data)
  }

  /** 同步引擎：覆盖写入单条快照（不入队远端）。 */
  async upsertFromRemote(snapshot: Snapshot): Promise<void> {
    const data = this.read()
    const list = (data.snapshots[snapshot.noteId] ?? []).slice().filter((item) => item.id !== snapshot.id)
    list.push(snapshot)
    data.snapshots[snapshot.noteId] = this.trim(list)
    this.write(data)
  }

  async replaceNoteSnapshots(noteId: string, snapshots: Snapshot[]): Promise<void> {
    const data = this.read()
    data.snapshots[noteId] = this.trim(snapshots)
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

// ---------------- 远端仓储（基于 snapshotsApi） ----------------

/**
 * 远端快照仓储。双重保留策略（20 + 7 天）由后端实现。
 */
export class ApiSnapshotsRepository implements SnapshotsRepository {
  async listByNote(noteId: string): Promise<Snapshot[]> {
    return snapshotsApi.listByNote(noteId)
  }

  async add(snapshot: Snapshot): Promise<Snapshot[]> {
    await snapshotsApi.create({
      noteId: snapshot.noteId,
      title: snapshot.title,
      noteTitle: snapshot.noteTitle,
      content: snapshot.content,
    })
    // 后端已 trim，重新拉取列表保证一致
    return snapshotsApi.listByNote(snapshot.noteId)
  }

  async deleteByNote(noteId: string): Promise<void> {
    await snapshotsApi.deleteByNote(noteId)
  }
}

// ---------------- 单例 ----------------

export const webSnapshotsRepository = new WebSnapshotsRepository()
export const apiSnapshotsRepository = new ApiSnapshotsRepository()
