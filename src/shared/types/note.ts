// 改动：Note / NoteDraft 增加可选 cover 字段（封面图片 URL）
export type NoteTone = 'neutral' | 'danger' | 'primary'

export type NotesView = 'all' | 'favorites' | 'trash' | 'folders'

/**
 * 标签为 note-scoped：嵌在笔记 tags[] 内，不是全局标签实体。
 * 筛选条候选项通过对各笔记 tags 聚合得到。
 */
export interface NoteTag {
  id: string
  name: string
  /** 视觉 tone 可选；当前 UI 统一默认色，不再按 tone 分色。 */
  tone?: NoteTone
}

export interface Note {
  id: string
  title: string
  /**
   * 编辑器内容。
   * 新笔记为 ProseMirror doc 的 JSON 字符串化结果（见 noteDomain.EMPTY_DOC_JSON）。
   * 历史纯文本/HTML 字符串在渲染时由 RichEditor 做 fallback 解析。
   */
  content: string
  excerpt: string
  /** note-scoped 标签列表（非全局标签表）。 */
  tags: NoteTag[]
  folderId: string | null
  isFavorite: boolean
  isDeleted: boolean
  /** ISO 时间；进入废纸篓时写入，恢复时清空。 */
  deletedAt: string | null
  /** 封面图片 URL；null/undefined 表示无封面。 */
  cover?: string | null
  /** 是否置顶（在列表顶部优先显示）。 */
  pinned?: boolean
  /** 是否只读（锁定内容防止意外修改）。 */
  readOnly?: boolean
  createdAt: string
  updatedAt: string
}

export interface NoteDraft {
  title: string
  content: string
  tags?: NoteTag[]
  folderId?: string | null
  cover?: string | null
}

export interface NotesFilter {
  view: NotesView
  query: string
  tagId: string | null
}
