import type { Note, NotesFilter, NotesView } from '../types/note'
import { extractTextFromNoteContent } from './noteDomain'

export function parseSearchTerms(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
}

function scoreNoteMatchFields(
  title: string,
  plainText: string,
  tagNames: string[],
  terms: string[],
): number {
  if (terms.length === 0) {
    return 0
  }

  let score = 0

  for (const term of terms) {
    let termScore = 0

    if (title.includes(term)) {
      termScore = Math.max(termScore, title === term ? 120 : title.startsWith(term) ? 100 : 80)
    }

    if (tagNames.some((name) => name.includes(term))) {
      termScore = Math.max(termScore, 50)
    }

    if (plainText.includes(term)) {
      termScore = Math.max(termScore, 20)
    }

    if (termScore === 0) {
      return 0
    }

    score += termScore
  }

  return score
}

export function scoreNoteMatch(note: Note, terms: string[]): number {
  if (terms.length === 0) {
    return 0
  }

  return scoreNoteMatchFields(
    note.title.toLowerCase(),
    extractTextFromNoteContent(note.content).toLowerCase(),
    note.tags.map((tag) => tag.name.toLowerCase()),
    terms,
  )
}

export function noteMatchesSearchTerms(note: Note, terms: string[]): boolean {
  return scoreNoteMatch(note, terms) > 0 || terms.length === 0
}

export function getVisibleNotes(notes: Note[], filter: NotesFilter) {
  const terms = parseSearchTerms(filter.query)

  if (terms.length === 0) {
    return notes.filter((note) => {
      const matchesView = matchesNotesView(note, filter.view)
      const matchesTag = !filter.tagId || note.tags.some((tag) => tag.id === filter.tagId)
      return matchesView && matchesTag
    })
  }

  const scored: Array<{ note: Note; score: number }> = []

  for (const note of notes) {
    if (!matchesNotesView(note, filter.view)) {
      continue
    }

    if (filter.tagId && !note.tags.some((tag) => tag.id === filter.tagId)) {
      continue
    }

    const title = note.title.toLowerCase()
    const plainText = extractTextFromNoteContent(note.content).toLowerCase()
    const tagNames = note.tags.map((tag) => tag.name.toLowerCase())
    const score = scoreNoteMatchFields(title, plainText, tagNames, terms)

    if (score > 0) {
      scored.push({ note, score })
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }

    return new Date(b.note.updatedAt).getTime() - new Date(a.note.updatedAt).getTime()
  })

  return scored.map(({ note }) => note)
}

/** 从各笔记 tags 聚合去重（note-scoped 标签的列表侧视图，非全局标签表）。 */
export function getAllTags(notes: Note[]) {

  const tags = new Map<string, Note['tags'][number]>()

  for (const note of notes) {
    for (const tag of note.tags) {
      tags.set(tag.id, tag)
    }
  }

  return [...tags.values()]
}

export function firstVisibleNoteId(notes: Note[], view: NotesView) {
  return notes.find((note) => matchesNotesView(note, view))?.id ?? null
}

export function formatUpdatedAt(iso: string) {
  const date = new Date(iso)
  const today = new Date()

  if (date.toDateString() === today.toDateString()) {
    return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }

  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

export function formatClockTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

/** 笔记标签名列表，空时返回 fallback */
export function getNoteTagNames(note: Note, fallback: string[] = []) {
  return note.tags.length > 0 ? note.tags.map((tag) => tag.name) : fallback
}

function matchesNotesView(note: Note, view: NotesView) {
  return (
    (view === 'trash' && note.isDeleted) ||
    (view === 'favorites' && note.isFavorite && !note.isDeleted) ||
    (view === 'folders' && Boolean(note.folderId) && !note.isDeleted) ||
    (view === 'all' && !note.isDeleted)
  )
}
