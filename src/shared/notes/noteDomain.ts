import type { Note, NoteDraft } from '../types/note'

/** 废纸篓保留天数。 */
export const TRASH_RETENTION_DAYS = 30

/** 剩余天数 <= 该值时高亮提醒。 */
export const TRASH_URGENT_DAYS = 3

const DAY_MS = 24 * 60 * 60 * 1000

export function createExcerpt(content: string) {
  return content.replace(/\s+/g, ' ').trim().slice(0, 96)
}

export function sortNotesByUpdatedAt(notes: Note[]) {
  return [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function buildNewNote(draft: NoteDraft, id: string, now: string): Note {
  return {
    id,
    title: draft.title,
    content: draft.content,
    excerpt: createExcerpt(draft.content),
    tags: draft.tags ?? [{ id: 'draft', name: '草稿', tone: 'primary' }],
    folderId: draft.folderId ?? null,
    isFavorite: false,
    isDeleted: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }
}

export function applyNotePatch(
  note: Note,
  patch: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'folderId' | 'isFavorite' | 'isDeleted' | 'deletedAt'>>,
  now: string,
): Note {
  const content = patch.content ?? note.content
  const next: Note = {
    ...note,
    ...patch,
    excerpt: createExcerpt(content),
    updatedAt: now,
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

/** 兼容旧数据：补齐 deletedAt。 */
export function normalizeNote(raw: Note, now = new Date().toISOString()): Note {
  const isDeleted = Boolean(raw.isDeleted)
  let deletedAt = raw.deletedAt ?? null

  if (isDeleted && !deletedAt) {
    deletedAt = raw.updatedAt || now
  }

  if (!isDeleted) {
    deletedAt = null
  }

  return {
    ...raw,
    isDeleted,
    deletedAt,
  }
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
