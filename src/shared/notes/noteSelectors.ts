import type { Note, NotesFilter, NotesView } from '../types/note'

export function getVisibleNotes(notes: Note[], filter: NotesFilter) {
  const query = filter.query.trim().toLowerCase()

  return notes.filter((note) => {
    const matchesView = matchesNotesView(note, filter.view)
    const matchesQuery =
      !query ||
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.excerpt.toLowerCase().includes(query) ||
      note.tags.some((tag) => tag.name.toLowerCase().includes(query))

    const matchesTag = !filter.tagId || note.tags.some((tag) => tag.id === filter.tagId)

    return matchesView && matchesQuery && matchesTag
  })
}

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

function matchesNotesView(note: Note, view: NotesView) {
  return (
    (view === 'trash' && note.isDeleted) ||
    (view === 'favorites' && note.isFavorite && !note.isDeleted) ||
    (view === 'folders' && Boolean(note.folderId) && !note.isDeleted) ||
    (view === 'all' && !note.isDeleted)
  )
}
