// 改动：updateSelectedNote / updateNote 支持 cover；duplicateNote 复制 cover
import { create } from 'zustand'
import type { NotesRepository } from '../data/notesRepository'
import {
  canMoveFolder,
  canPlaceFoldersInParent,
  collectSubtreeIdsForMany,
  getRootFolders,
  sortFoldersByName,
} from '../notes/folderDomain'
import { firstVisibleNoteId } from '../notes/noteSelectors'
import type { Folder, FolderDraft } from '../types/folder'
import type { Note, NotesFilter, NotesView } from '../types/note'

type NoteEditablePatch = Partial<Pick<Note, 'title' | 'content' | 'cover' | 'tags'>>


export interface NotesState {
  notes: Note[]
  folders: Folder[]
  selectedNoteId: string | null
  filter: NotesFilter
  isLoaded: boolean
  loadNotes: () => Promise<void>
  createNote: () => Promise<Note>
  duplicateNote: (noteId: string) => Promise<void>
  selectNote: (noteId: string) => void
  updateNote: (noteId: string, patch: NoteEditablePatch) => Promise<void>
  updateSelectedNote: (patch: NoteEditablePatch) => Promise<void>
  toggleFavorite: (noteId: string) => Promise<void>
  moveToTrash: (noteId: string) => Promise<void>
  restoreNote: (noteId: string) => Promise<void>
  permanentlyDeleteNote: (noteId: string) => Promise<void>
  emptyTrash: () => Promise<void>
  moveToFolder: (noteId: string, folderId: string | null) => Promise<void>
  createFolder: (draft: FolderDraft) => Promise<Folder>
  renameFolder: (folderId: string, name: string) => Promise<void>
  moveFolders: (folderIds: string[], parentId: string | null) => Promise<void>
  deleteFolders: (folderIds: string[]) => Promise<void>
  setView: (view: NotesView) => void
  setQuery: (query: string) => void
  setTagFilter: (tagId: string | null) => void
}

function replaceNote(notes: Note[], updated: Note) {
  return notes.map((note) => (note.id === updated.id ? updated : note))
}

function replaceFolder(folders: Folder[], updated: Folder) {
  return folders.map((folder) => (folder.id === updated.id ? updated : folder))
}

function buildDuplicateTitle(title: string) {
  const base = title.trim() || '未命名笔记'
  return `${base} 副本`
}

export function createNotesStore(repository: NotesRepository) {
  return create<NotesState>((set, get) => ({
    notes: [],
    folders: [],
    selectedNoteId: null,
    filter: {
      view: 'all',
      query: '',
      tagId: null,
    },
    isLoaded: false,

    async loadNotes() {
      const [notes, folders] = await Promise.all([repository.list(), repository.listFolders()])
      set((state) => ({
        notes,
        folders: sortFoldersByName(folders),
        selectedNoteId: state.selectedNoteId ?? firstVisibleNoteId(notes, state.filter.view),
        isLoaded: true,
      }))
    },

    async createNote() {
      const note = await repository.create({ title: '', content: '', tags: [], folderId: null })
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
        cover: source.cover ?? null,
      })

      set((state) => ({
        notes: [note, ...state.notes],
        selectedNoteId: note.id,
      }))
    },

    selectNote(noteId) {
      set({ selectedNoteId: noteId })
    },

    async updateNote(noteId, patch) {
      const exists = get().notes.some((item) => item.id === noteId)

      if (!exists) {
        return
      }

      const updated = await repository.update(noteId, patch)
      set((state) => ({ notes: replaceNote(state.notes, updated) }))
    },

    async updateSelectedNote(patch) {
      const selectedNoteId = get().selectedNoteId

      if (!selectedNoteId) {
        return
      }

      await get().updateNote(selectedNoteId, patch)
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
      const { folders, notes } = get()
      const note = notes.find((item) => item.id === noteId)

      if (!note || !note.isDeleted) {
        return
      }

      const folderId = note.folderId && folders.some((folder) => folder.id === note.folderId) ? note.folderId : null
      const updated = await repository.update(noteId, { isDeleted: false, deletedAt: null, folderId })
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

    async createFolder(draft) {
      const folder = await repository.createFolder(draft)
      set((state) => ({ folders: sortFoldersByName([folder, ...state.folders]) }))
      return folder
    },

    async renameFolder(folderId, name) {
      const updated = await repository.updateFolder(folderId, { name })
      set((state) => ({ folders: sortFoldersByName(replaceFolder(state.folders, updated)) }))
    },

    async moveFolders(folderIds, parentId) {
      const uniqueIds = Array.from(new Set(folderIds))
      const { folders } = get()
      const movingSet = new Set(uniqueIds)

      for (const folderId of uniqueIds) {
        if (!canMoveFolder(folders, folderId, parentId, movingSet)) {
          throw new Error('部分文件夹无法移动到该位置。')
        }
      }

      if (!canPlaceFoldersInParent(folders, uniqueIds, parentId)) {
        throw new Error('目标位置已存在同名文件夹。')
      }

      let nextFolders = folders
      for (const folderId of uniqueIds) {
        const updated = await repository.updateFolder(folderId, { parentId })
        nextFolders = replaceFolder(nextFolders, updated)
      }

      set({ folders: sortFoldersByName(nextFolders) })
    },

    async deleteFolders(folderIds) {
      const uniqueIds = Array.from(new Set(folderIds))

      if (uniqueIds.length === 0) {
        return
      }

      const { folders, notes } = get()
      const subtreeIds = collectSubtreeIdsForMany(folders, uniqueIds)

      if (subtreeIds.size === 0) {
        return
      }

      const now = new Date().toISOString()
      const notesToTrash = notes.filter((note) => note.folderId && subtreeIds.has(note.folderId))

      const trashedNotes = await Promise.all(
        notesToTrash.map((note) => repository.update(note.id, {
          isDeleted: true,
          deletedAt: note.isDeleted ? note.deletedAt : now,
          folderId: null,
        })),
      )
      await repository.deleteFolders(Array.from(subtreeIds))

      set((state) => {
        const trashedById = new Map(trashedNotes.map((note) => [note.id, note]))
        const nextNotes = state.notes.map((note) => trashedById.get(note.id) ?? note)
        const nextFolders = state.folders.filter((folder) => !subtreeIds.has(folder.id))
        const selectedNoteId = state.selectedNoteId && trashedById.has(state.selectedNoteId)
          ? firstVisibleNoteId(nextNotes, state.filter.view)
          : state.selectedNoteId

        return {
          notes: nextNotes,
          folders: nextFolders,
          selectedNoteId,
        }
      })
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

export { getRootFolders }
