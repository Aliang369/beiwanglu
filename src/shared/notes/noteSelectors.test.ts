import { describe, expect, it } from 'vitest'
import type { Note } from '../types/note'
import { EMPTY_DOC_JSON } from './noteDomain'
import {
  firstVisibleNoteId,
  getAllTags,
  getVisibleNotes,
  noteMatchesSearchTerms,
  parseSearchTerms,
  scoreNoteMatch,
} from './noteSelectors'

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: '灵感笔记',
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

describe('noteSelectors', () => {
  it('parseSearchTerms 分词并小写化', () => {
    expect(parseSearchTerms('  Hello  世界  ')).toEqual(['hello', '世界'])
    expect(parseSearchTerms('   ')).toEqual([])
  })

  it('scoreNoteMatch 标题命中高于标签与正文', () => {
    const note = makeNote({
      title: '同步引擎',
      content: doc(' unrelated '),
      tags: [{ id: 't1', name: '其他' }],
    })
    const titleScore = scoreNoteMatch(note, ['同步'])
    const bodyNote = makeNote({ title: '无', content: doc('同步相关内容') })
    const bodyScore = scoreNoteMatch(bodyNote, ['同步'])
    const tagNote = makeNote({ title: '无', tags: [{ id: 't2', name: '同步' }] })
    const tagScore = scoreNoteMatch(tagNote, ['同步'])

    expect(titleScore).toBeGreaterThan(tagScore)
    expect(tagScore).toBeGreaterThan(bodyScore)
    expect(noteMatchesSearchTerms(note, ['不存在'])).toBe(false)
  })

  it('getVisibleNotes 处理视图、标签与搜索排序', () => {
    const notes = [
      makeNote({
        id: 'all-old',
        title: '普通笔记',
        updatedAt: '2026-07-01T00:00:00.000Z',
      }),
      makeNote({
        id: 'fav',
        title: '收藏同步',
        isFavorite: true,
        updatedAt: '2026-07-02T00:00:00.000Z',
      }),
      makeNote({
        id: 'trash',
        title: '已删同步',
        isDeleted: true,
        deletedAt: '2026-07-03T00:00:00.000Z',
        updatedAt: '2026-07-03T00:00:00.000Z',
      }),
      makeNote({
        id: 'folder',
        title: '夹内同步',
        folderId: 'f1',
        tags: [{ id: 'tag-a', name: '工作' }],
        pinned: true,
        updatedAt: '2026-07-01T12:00:00.000Z',
      }),
      makeNote({
        id: 'tag-only',
        title: '标签笔记',
        tags: [{ id: 'tag-a', name: '工作' }],
        updatedAt: '2026-07-04T00:00:00.000Z',
      }),
    ]

    expect(getVisibleNotes(notes, { view: 'all', query: '', tagId: null }).map((n) => n.id)).toEqual([
      'folder',
      'tag-only',
      'fav',
      'all-old',
    ])
    expect(getVisibleNotes(notes, { view: 'favorites', query: '', tagId: null }).map((n) => n.id)).toEqual(['fav'])
    expect(getVisibleNotes(notes, { view: 'trash', query: '', tagId: null }).map((n) => n.id)).toEqual(['trash'])
    expect(getVisibleNotes(notes, { view: 'folders', query: '', tagId: null }).map((n) => n.id)).toEqual(['folder'])
    expect(getVisibleNotes(notes, { view: 'all', query: '', tagId: 'tag-a' }).map((n) => n.id)).toEqual([
      'folder',
      'tag-only',
    ])

    const searched = getVisibleNotes(notes, { view: 'all', query: '同步', tagId: null })
    expect(searched.map((n) => n.id)).toEqual(['folder', 'fav'])
  })

  it('getAllTags 去重聚合', () => {
    const notes = [
      makeNote({ tags: [{ id: 't1', name: 'A' }, { id: 't2', name: 'B' }] }),
      makeNote({ id: 'n2', tags: [{ id: 't1', name: 'A' }] }),
    ]
    expect(getAllTags(notes).map((t) => t.id).sort()).toEqual(['t1', 't2'])
  })

  it('firstVisibleNoteId 按视图取首个', () => {
    const notes = [
      makeNote({ id: 'trash', isDeleted: true, deletedAt: '2026-07-01T00:00:00.000Z' }),
      makeNote({ id: 'alive', title: '存活' }),
    ]
    expect(firstVisibleNoteId(notes, 'all')).toBe('alive')
    expect(firstVisibleNoteId(notes, 'trash')).toBe('trash')
  })
})
