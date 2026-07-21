import { describe, expect, it } from 'vitest'
import type { Note } from '../types/note'
import {
  EMPTY_DOC_JSON,
  EXCERPT_MAX_LENGTH,
  applyNotePatch,
  buildNewNote,
  createExcerpt,
  formatTrashPurgeLabel,
  getTrashDaysRemaining,
  isTrashExpired,
  isTrashPurgeUrgent,
  normalizeNote,
  purgeExpiredTrashNotes,
  sortNotesByUpdatedAt,
} from './noteDomain'

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: '标题',
    content: EMPTY_DOC_JSON,
    excerpt: '',
    tags: [],
    folderId: null,
    isFavorite: false,
    isDeleted: false,
    deletedAt: null,
    pinned: false,
    readOnly: false,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

const doc = (text: string) =>
  JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  })

describe('noteDomain', () => {
  it('createExcerpt 提取正文并截断到上限', () => {
    const long = '字'.repeat(EXCERPT_MAX_LENGTH + 20)
    expect(createExcerpt(doc(long))).toHaveLength(EXCERPT_MAX_LENGTH)
    expect(createExcerpt(doc('  hello   world  '))).toBe('hello world')
  })

  it('buildNewNote 生成默认字段', () => {
    const note = buildNewNote({ title: '新笔记', content: doc('正文') }, 'id-1', '2026-07-21T00:00:00.000Z')
    expect(note.id).toBe('id-1')
    expect(note.isFavorite).toBe(false)
    expect(note.isDeleted).toBe(false)
    expect(note.deletedAt).toBeNull()
    expect(note.folderId).toBeNull()
    expect(note.excerpt).toBe('正文')
    expect(note.pinned).toBe(false)
  })

  it('applyNotePatch 更新摘要、时间，并在删除时写入 deletedAt', () => {
    const base = makeNote()
    const deleted = applyNotePatch(base, { isDeleted: true }, '2026-07-21T12:00:00.000Z')
    expect(deleted.isDeleted).toBe(true)
    expect(deleted.deletedAt).toBe('2026-07-21T12:00:00.000Z')
    expect(deleted.updatedAt).toBe('2026-07-21T12:00:00.000Z')

    const restored = applyNotePatch(deleted, { isDeleted: false, content: doc('恢复后') }, '2026-07-21T13:00:00.000Z')
    expect(restored.isDeleted).toBe(false)
    expect(restored.deletedAt).toBeNull()
    expect(restored.excerpt).toBe('恢复后')
  })

  it('sortNotesByUpdatedAt 按更新时间倒序', () => {
    const a = makeNote({ id: 'a', updatedAt: '2026-07-01T00:00:00.000Z' })
    const b = makeNote({ id: 'b', updatedAt: '2026-07-03T00:00:00.000Z' })
    const c = makeNote({ id: 'c', updatedAt: '2026-07-02T00:00:00.000Z' })
    expect(sortNotesByUpdatedAt([a, b, c]).map((n) => n.id)).toEqual(['b', 'c', 'a'])
  })

  it('normalizeNote 补齐删除态并刷新 excerpt', () => {
    const raw = makeNote({
      isDeleted: true,
      deletedAt: null,
      content: doc('归一化'),
      updatedAt: '2026-07-10T00:00:00.000Z',
    })
    const note = normalizeNote(raw, '2026-07-21T00:00:00.000Z')
    expect(note.deletedAt).toBe('2026-07-10T00:00:00.000Z')
    expect(note.excerpt).toBe('归一化')
  })

  it('废纸篓剩余天数、到期清理与紧急标签', () => {
    const deletedAt = '2026-07-01T00:00:00.000Z'
    const note = makeNote({ isDeleted: true, deletedAt, updatedAt: deletedAt })
    const day10 = new Date('2026-07-11T00:00:00.000Z')
    const day30 = new Date('2026-07-31T00:00:00.000Z')
    const day31 = new Date('2026-08-01T00:00:00.000Z')

    expect(getTrashDaysRemaining(note, day10)).toBe(20)
    expect(isTrashPurgeUrgent(getTrashDaysRemaining(note, day10))).toBe(false)
    expect(formatTrashPurgeLabel(20)).toBe('20天后清除')

    // 30 天整点：剩余 0，已到期
    expect(getTrashDaysRemaining(note, day30)).toBe(0)
    expect(isTrashExpired(note, day30)).toBe(true)
    expect(isTrashPurgeUrgent(0)).toBe(true)
    expect(formatTrashPurgeLabel(0)).toBe('即将清除')

    const kept = makeNote({ id: 'alive' })
    const purged = purgeExpiredTrashNotes([note, kept], day31)
    expect(purged.map((n) => n.id)).toEqual(['alive'])
  })
})
