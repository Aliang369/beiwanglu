/**
 * 笔记版本快照数据模型。
 * - 每次编辑保存自动生成一条快照，存储当时的内容 JSON 与标题。
 * - 双重保留策略：最近 MAX_SNAPSHOTS_PER_NOTE 条 且 在 SNAPSHOT_TTL_MS 时间内的快照。
 * - TODO: 后续迁移到 IndexedDB 或后端存储，目前先跑通流程使用 localStorage。
 */
export interface Snapshot {
  id: string
  noteId: string
  /** 快照标题（用于面板展示，如"自动保存"/"恢复前自动保存"）。 */
  title: string
  /** 快照时刻的笔记标题。 */
  noteTitle: string
  /** 快照时刻的笔记内容（ProseMirror doc JSON 字符串）。 */
  content: string
  /** ISO 时间戳。 */
  createdAt: string
}

export const MAX_SNAPSHOTS_PER_NOTE = 20
export const SNAPSHOT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 天
