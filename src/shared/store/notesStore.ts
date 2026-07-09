import { create } from 'zustand'
import type { NotesRepository } from '../data/notesRepository'
import { firstVisibleNoteId } from '../notes/noteSelectors'
import type { Note, NotesFilter, NotesView } from '../types/note'

export interface NotesState {
  notes: Note[]
  selectedNoteId: string | null
  filter: NotesFilter
  isLoaded: boolean
  loadNotes: () => Promise<void>
  createNote: () => Promise<Note>
  duplicateNote: (noteId: string) => Promise<void>
  selectNote: (noteId: string) => void
  updateSelectedNote: (patch: Partial<Pick<Note, 'title' | 'content'>>) => Promise<void>
  toggleFavorite: (noteId: string) => Promise<void>
  moveToTrash: (noteId: string) => Promise<void>
  restoreNote: (noteId: string) => Promise<void>
  permanentlyDeleteNote: (noteId: string) => Promise<void>
  emptyTrash: () => Promise<void>
  moveToFolder: (noteId: string, folderId: string | null) => Promise<void>
  setView: (view: NotesView) => void
  setQuery: (query: string) => void
  setTagFilter: (tagId: string | null) => void
}

function replaceNote(notes: Note[], updated: Note) {
  return notes.map((note) => (note.id === updated.id ? updated : note))
}

function buildDuplicateTitle(title: string) {
  const base = title.trim() || '未命名笔记'
  return `${base} 副本`
}

export function createNotesStore(repository: NotesRepository) {
  return create<NotesState>((set, get) => ({
    notes: [],
    selectedNoteId: null,
    filter: {
      view: 'all',
      query: '',
      tagId: null,
    },
    isLoaded: false,

    async loadNotes() {
      const notes = await repository.list()
      set((state) => ({
        notes,
        selectedNoteId: state.selectedNoteId ?? firstVisibleNoteId(notes, state.filter.view),
        isLoaded: true,
      }))
    },

    async createNote() {
      const note = await repository.create({ title: '未命名笔记', content: '', folderId: 'inbox' })
      set((state) => ({
        notes: [note, ...state.notes],
        selectedNoteId: note.id,
        filter: { ...state.filter, view: 'all', tagId: null },
      }))
      return note
    },

    async duplicateNote(noteId) {
      const source = get().notes.find((item) => item.id === noteId)

      if (!source || source.isDeleted) {
        return
      }

      const note = await repository.create({
        title: buildDuplicateTitle(source.title),
        content: source.content,
        tags: source.tags.map((tag) => ({ ...tag })),
        folderId: source.folderId,
      })

      set((state) => ({
        notes: [note, ...state.notes],
        selectedNoteId: note.id,
      }))
    },

    selectNote(noteId) {
      set({ selectedNoteId: noteId })
    },

    async updateSelectedNote(patch) {
      const selectedNoteId = get().selectedNoteId

      if (!selectedNoteId) {
        return
      }

      const updated = await repository.update(selectedNoteId, patch)
      set((state) => ({ notes: replaceNote(state.notes, updated) }))
    },

    async toggleFavorite(noteId) {
      const note = get().notes.find((item) => item.id === noteId)

      if (!note) {
        return
      }

      const updated = await repository.update(noteId, { isFavorite: !note.isFavorite })
      set((state) => ({ notes: replaceNote(state.notes, updated) }))
    },

    async moveToTrash(noteId) {
      const updated = await repository.update(noteId, { isDeleted: true, deletedAt: new Date().toISOString() })
      set((state) => {
        const notes = replaceNote(state.notes, updated)
        const selectedNoteId = state.selectedNoteId === noteId ? firstVisibleNoteId(notes, state.filter.view) : state.selectedNoteId

        return { notes, selectedNoteId }
      })
    },

    async restoreNote(noteId) {
      const note = get().notes.find((item) => item.id === noteId)

      if (!note || !note.isDeleted) {
        return
      }

      const updated = await repository.update(noteId, { isDeleted: false, deletedAt: null })
      set((state) => ({ notes: replaceNote(state.notes, updated) }))
    },

    async permanentlyDeleteNote(noteId) {
      const note = get().notes.find((item) => item.id === noteId)

      if (!note || !note.isDeleted) {
        return
      }

      await repository.delete(noteId)
      set((state) => {
        const notes = state.notes.filter((item) => item.id !== noteId)
        const selectedNoteId = state.selectedNoteId === noteId ? firstVisibleNoteId(notes, state.filter.view) : state.selectedNoteId

        return { notes, selectedNoteId }
      })
    },

    async emptyTrash() {
      const deletedNotes = get().notes.filter((item) => item.isDeleted)

      if (deletedNotes.length === 0) {
        return
      }

      await Promise.all(deletedNotes.map((note) => repository.delete(note.id)))
      set((state) => {
        const deletedIds = new Set(deletedNotes.map((note) => note.id))
        const notes = state.notes.filter((item) => !deletedIds.has(item.id))
        const selectedNoteId = state.selectedNoteId && deletedIds.has(state.selectedNoteId)
          ? firstVisibleNoteId(notes, state.filter.view)
          : state.selectedNoteId

        return { notes, selectedNoteId }
      })
    },

    async moveToFolder(noteId, folderId) {
      const note = get().notes.find((item) => item.id === noteId)

      if (!note || note.folderId === folderId) {
        return
      }

      const updated = await repository.update(noteId, { folderId })
      set((state) => ({ notes: replaceNote(state.notes, updated) }))
    },

    setView(view) {
      set((state) => ({
        filter: { ...state.filter, view },
        selectedNoteId: firstVisibleNoteId(state.notes, view),
      }))
    },

    setQuery(query) {
      set((state) => ({ filter: { ...state.filter, query } }))
    },

    setTagFilter(tagId) {
      set((state) => ({ filter: { ...state.filter, tagId } }))
    },
  }))
}
