import type { Note, NoteDraft } from '../types/note'

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
    createdAt: now,
    updatedAt: now,
  }
}

export function applyNotePatch(
  note: Note,
  patch: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'folderId' | 'isFavorite' | 'isDeleted'>>,
  now: string,
): Note {
  const content = patch.content ?? note.content

  return {
    ...note,
    ...patch,
    excerpt: createExcerpt(content),
    updatedAt: now,
  }
}
