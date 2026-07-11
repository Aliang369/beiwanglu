// 改动：excerpt 上限提高到 480，保证宽大卡约 10 行预览够字
import type { Note, NoteDraft } from '../types/note'

/** 设置封面时 prompt 的默认图片 URL（沿用原硬编码封面链接）。 */
export const DEFAULT_COVER_URL = 'https://placewaifu.com/image/800/450'

/** 废纸篓保留天数。 */
export const TRASH_RETENTION_DAYS = 30

/** 剩余天数 <= 该值时高亮提醒。 */
export const TRASH_URGENT_DAYS = 3

/**
 * 卡片摘要最大字符数。
 * 宽大卡约 25–35 字/行 × 10 行 ≈ 250–350，取 480 留余量。
 */
export const EXCERPT_MAX_LENGTH = 480

/** 新笔记的初始内容：一个空段落的 ProseMirror doc JSON 字符串。 */
export const EMPTY_DOC_JSON = '{"type":"doc","content":[{"type":"paragraph"}]}'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 从 note.content 提取纯文本用于摘要/预览。
 * - ProseMirror doc JSON 字符串：递归收集 text 节点的 text 字段，块级节点之间补换行。
 * - 解析失败或非 doc 结构：视为纯文本/HTML 原样返回（兼容历史数据）。
 */
export function extractTextFromNoteContent(content: string): string {
  if (!content) {
    return ''
  }

  try {
    const parsed = JSON.parse(content)

    if (!parsed || parsed.type !== 'doc' || !Array.isArray(parsed.content)) {
      return content
    }

    return collectText(parsed).replace(/\n{3,}/g, '\n\n').trim()
  } catch {
    return content
  }
}

function collectText(node: { type?: string; text?: string; content?: unknown[] }): string {
  if (typeof node.text === 'string') {
    return node.text
  }

  if (Array.isArray(node.content)) {
    return node.content
      .map((child) => collectText(child as typeof node))
      .filter(Boolean)
      .join(node.type === 'doc' ? '\n' : '')
  }

  return ''
}

/**
 * 从 ProseMirror doc JSON 中提取纯文本，跳过 code（行内代码）和 codeBlock（代码块）节点。
 * 用于字数统计：代码内容不计入正文字数。
 */
function collectTextExcludeCode(node: { type?: string; text?: string; content?: unknown[]; marks?: unknown[] }): string {
  // 行内代码：marks 中包含 type === 'code' 的节点跳过
  if (typeof node.text === 'string') {
    const marks = Array.isArray(node.marks) ? node.marks as Array<{ type: string }> : []
    if (marks.some((mark) => mark.type === 'code')) {
      return ''
    }
    return node.text
  }

  // 代码块节点整体跳过
  if (node.type === 'codeBlock') {
    return ''
  }

  if (Array.isArray(node.content)) {
    return node.content
      .map((child) => collectTextExcludeCode(child as typeof node))
      .filter(Boolean)
      .join(node.type === 'doc' ? '\n' : '')
  }

  return ''
}

/**
 * 从 note.content 提取纯文本（排除代码内容），用于字数统计。
 * - ProseMirror doc JSON：递归收集 text 节点，跳过 code marks 和 codeBlock 节点。
 * - 解析失败或非 doc 结构：视为纯文本/HTML 原样返回。
 */
export function extractTextExcludeCode(content: string): string {
  if (!content) {
    return ''
  }

  try {
    const parsed = JSON.parse(content)

    if (!parsed || parsed.type !== 'doc' || !Array.isArray(parsed.content)) {
      return content
    }

    return collectTextExcludeCode(parsed).replace(/\n{3,}/g, '\n\n').trim()
  } catch {
    return content
  }
}

/** 统计标题 + 正文全部可见文字（去空白）的字数。 */
export function countVisibleNoteChars(title: string, content: string) {
  const body = extractTextFromNoteContent(content)
  return `${title ?? ''}${body}`.replace(/\s+/g, '').length
}

export function createExcerpt(content: string) {
  return extractTextFromNoteContent(content).replace(/\s+/g, ' ').trim().slice(0, EXCERPT_MAX_LENGTH)
}


export type NotePatch = Partial<
  Pick<Note, 'title' | 'content' | 'tags' | 'folderId' | 'isFavorite' | 'isDeleted' | 'deletedAt' | 'cover'>
>

export function sortNotesByUpdatedAt(notes: Note[]) {
  return [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function buildNewNote(draft: NoteDraft, id: string, now: string): Note {
  const note: Note = {
    id,
    title: draft.title,
    content: draft.content || EMPTY_DOC_JSON,
    excerpt: createExcerpt(draft.content),
    tags: draft.tags ?? [],
    folderId: draft.folderId ?? null,
    isFavorite: false,
    isDeleted: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  if (typeof draft.cover === 'string' && draft.cover.trim()) {
    note.cover = draft.cover.trim()
  }

  return note
}

export function applyNotePatch(note: Note, patch: NotePatch, now: string): Note {
  const content = patch.content ?? note.content
  const { cover: patchCover, ...restPatch } = patch

  const next: Note = {
    ...note,
    ...restPatch,
    excerpt: createExcerpt(content),
    updatedAt: now,
  }

  // cover：null 删除；字符串设置；undefined 保留原值
  if (patchCover === null) {
    delete next.cover
  } else if (typeof patchCover === 'string') {
    next.cover = patchCover
  }

  if (patch.isDeleted === true && note.isDeleted !== true) {
    next.deletedAt = patch.deletedAt ?? now
  }

  if (patch.isDeleted === false) {
    next.deletedAt = null
  }

  if (next.isDeleted && !next.deletedAt) {
    next.deletedAt = now
  }

  if (!next.isDeleted) {
    next.deletedAt = null
  }

  return next
}

/** 兼容旧数据：补齐 deletedAt；按 content 刷新 excerpt。 */
export function normalizeNote(raw: Note, now = new Date().toISOString()): Note {
  const isDeleted = Boolean(raw.isDeleted)
  let deletedAt = raw.deletedAt ?? null

  if (isDeleted && !deletedAt) {
    deletedAt = raw.updatedAt || now
  }

  if (!isDeleted) {
    deletedAt = null
  }

  const content = raw.content ?? ''
  const note: Note = {
    ...raw,
    content,
    excerpt: createExcerpt(content),
    isDeleted,
    deletedAt,
  }

  // 规范化 cover：空字符串视为无封面
  if (note.cover === '' || note.cover === null) {
    delete note.cover
  }

  return note
}

export function normalizeNotes(notes: Note[], now = new Date().toISOString()) {
  return notes.map((note) => normalizeNote(note, now))
}

export function getTrashDeletedAt(note: Note) {
  if (!note.isDeleted) {
    return null
  }

  return note.deletedAt ?? note.updatedAt
}

/** 剩余整天数：0 表示今天到期/已到期，null 表示不在废纸篓。 */
export function getTrashDaysRemaining(note: Note, now = new Date()) {
  const deletedAt = getTrashDeletedAt(note)

  if (!deletedAt) {
    return null
  }

  const deletedTime = new Date(deletedAt).getTime()

  if (Number.isNaN(deletedTime)) {
    return null
  }

  const expiresAt = deletedTime + TRASH_RETENTION_DAYS * DAY_MS
  const remainingMs = expiresAt - now.getTime()
  return Math.max(0, Math.ceil(remainingMs / DAY_MS))
}

export function isTrashExpired(note: Note, now = new Date()) {
  if (!note.isDeleted) {
    return false
  }

  const remaining = getTrashDaysRemaining(note, now)
  return remaining !== null && remaining <= 0
}

export function purgeExpiredTrashNotes(notes: Note[], now = new Date()) {
  return notes.filter((note) => !isTrashExpired(note, now))
}

export function formatTrashPurgeLabel(daysRemaining: number | null) {
  if (daysRemaining === null) {
    return '已删除'
  }

  if (daysRemaining <= 0) {
    return '即将清除'
  }

  if (daysRemaining === 1) {
    return '1天后清除'
  }

  return `${daysRemaining}天后清除`
}

export function isTrashPurgeUrgent(daysRemaining: number | null) {
  return daysRemaining !== null && daysRemaining <= TRASH_URGENT_DAYS
}
