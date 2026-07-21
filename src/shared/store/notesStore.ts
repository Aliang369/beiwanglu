// 改动：updateSelectedNote / updateNote 支持 cover；duplicateNote 复制 cover；新增版本快照能力
// 改动：快照仓储抽象；本机优先仓储 + 同步引擎（非登录硬切云端）
import { create } from 'zustand'
import type { NotesRepository } from '../data/notesRepository'
import type { SnapshotsRepository } from '../data/snapshotsRepository'
import { webSnapshotsRepository } from '../data/snapshotsRepository'
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
import type { Snapshot } from '../types/snapshot'

type NoteEditablePatch = Partial<Pick<Note, 'title' | 'content' | 'cover' | 'tags' | 'pinned' | 'readOnly'>>


export interface NotesState {
  notes: Note[]
  folders: Folder[]
  selectedNoteId: string | null
  filter: NotesFilter
  isLoaded: boolean
  /** 笔记版本快照：noteId → 快照列表（按 createdAt 倒序）。 */
  snapshots: Record<string, Snapshot[]>
  loadNotes: () => Promise<void>
  createNote: (folderId?: string | null) => Promise<Note>
  duplicateNote: (noteId: string) => Promise<void>
  selectNote: (noteId: string) => void
  updateNote: (noteId: string, patch: NoteEditablePatch) => Promise<void>
  updateSelectedNote: (patch: NoteEditablePatch) => Promise<void>
  toggleFavorite: (noteId: string) => Promise<void>
  togglePinned: (noteId: string) => Promise<void>
  toggleReadOnly: (noteId: string) => Promise<void>
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
  /** 加载指定笔记的快照列表到 state。 */
  loadSnapshots: (noteId: string) => Promise<void>
  /** 创建一条快照（标题默认"自动保存"）。返回最新快照列表。 */
  createSnapshot: (noteId: string, content: string, noteTitle: string, title?: string) => Promise<Snapshot[]>
  /** 恢复到指定快照：先把当前内容存为"恢复前自动保存"快照，再覆盖笔记内容。 */
  restoreSnapshot: (noteId: string, snapshotId: string) => Promise<void>
  /** 切换笔记底层仓储（本机 SQLite/回退等），并立即重新加载。 */
  setRepository: (repository: NotesRepository) => Promise<void>
  /** 切换快照底层仓储（本机 SQLite/回退等）。 */
  setSnapshotsRepository: (repository: SnapshotsRepository) => void
  isLoading: boolean
  loadError: string | null
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

export function createNotesStore(initialRepository: NotesRepository) {
  let repository = initialRepository
  let snapshotsRepository: SnapshotsRepository = webSnapshotsRepository

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
    isLoading: false,
    loadError: null,
    snapshots: {},

    async setRepository(nextRepository) {
      repository = nextRepository
      set({
        isLoaded: false,
        isLoading: false,
        loadError: null,
        notes: [],
        folders: [],
        selectedNoteId: null,
        snapshots: {},
      })
      await get().loadNotes()
    },

    setSnapshotsRepository(nextSnapshotsRepository) {
      snapshotsRepository = nextSnapshotsRepository
      set({ snapshots: {} })
    },

    async loadNotes() {
      set({ isLoading: true, loadError: null })
      try {
        const [notes, folders] = await Promise.all([repository.list(), repository.listFolders()])
        set((state) => ({
          notes,
          folders: sortFoldersByName(folders),
          selectedNoteId: state.selectedNoteId ?? firstVisibleNoteId(notes, state.filter.view),
          isLoaded: true,
          isLoading: false,
          loadError: null,
        }))
      } catch (error) {
        set({
          isLoading: false,
          loadError: error instanceof Error ? error.message : '笔记加载失败',
        })
      }
    },

    async createNote(folderId) {
      const resolvedFolderId =
        folderId && get().folders.some((folder) => folder.id === folderId) ? folderId : null
      const note = await repository.create({
        title: '',
        content: '',
        tags: [],
        folderId: resolvedFolderId,
      })
      set((state) => ({
        notes: [note, ...state.notes],
        selectedNoteId: note.id,
        filter: {
          ...state.filter,
          view: resolvedFolderId ? state.filter.view : 'all',
          tagId: null,
        },
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

    async togglePinned(noteId) {
      const note = get().notes.find((item) => item.id === noteId)

      if (!note) {
        return
      }

      const updated = await repository.update(noteId, { pinned: !note.pinned })
      set((state) => ({ notes: replaceNote(state.notes, updated) }))
    },

    async toggleReadOnly(noteId) {
      const note = get().notes.find((item) => item.id === noteId)

      if (!note) {
        return
      }

      const updated = await repository.update(noteId, { readOnly: !note.readOnly })
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
      await snapshotsRepository.deleteByNote(noteId)
      set((state) => {
        const notes = state.notes.filter((item) => item.id !== noteId)
        const selectedNoteId = state.selectedNoteId === noteId ? firstVisibleNoteId(notes, state.filter.view) : state.selectedNoteId
        const snapshots = { ...state.snapshots }
        delete snapshots[noteId]

        return { notes, selectedNoteId, snapshots }
      })
    },

    async emptyTrash() {
      const deletedNotes = get().notes.filter((item) => item.isDeleted)

      if (deletedNotes.length === 0) {
        return
      }

      await Promise.all(deletedNotes.map((note) => repository.delete(note.id)))
      await Promise.all(deletedNotes.map((note) => snapshotsRepository.deleteByNote(note.id)))
      set((state) => {
        const deletedIds = new Set(deletedNotes.map((note) => note.id))
        const notes = state.notes.filter((item) => !deletedIds.has(item.id))
        const selectedNoteId = state.selectedNoteId && deletedIds.has(state.selectedNoteId)
          ? firstVisibleNoteId(notes, state.filter.view)
          : state.selectedNoteId
        const snapshots = { ...state.snapshots }
        for (const id of deletedIds) {
          delete snapshots[id]
        }

        return { notes, selectedNoteId, snapshots }
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

      // 删除文件夹后：夹内笔记改为未分类，不进废纸篓（与后端一致）
      const notesToUncategorize = notes.filter(
        (note) => note.folderId && subtreeIds.has(note.folderId) && !note.isDeleted,
      )

      const uncategorizedNotes = await Promise.all(
        notesToUncategorize.map((note) => repository.update(note.id, { folderId: null })),
      )
      await repository.deleteFolders(Array.from(subtreeIds))

      set((state) => {
        const uncategorizedById = new Map(uncategorizedNotes.map((note) => [note.id, note]))
        const nextNotes = state.notes.map((note) => uncategorizedById.get(note.id) ?? note)
        const nextFolders = state.folders.filter((folder) => !subtreeIds.has(folder.id))

        return {
          notes: nextNotes,
          folders: nextFolders,
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

    async loadSnapshots(noteId) {
      const list = await snapshotsRepository.listByNote(noteId)
      set((state) => {
        const prev = state.snapshots[noteId]
        // 内容未变化时不更新 state，避免触发 re-render 循环
        if (prev && prev.length === list.length && prev.every((s, i) => s.id === prev[i].id && s.createdAt === prev[i].createdAt)) {
          return state
        }
        return { snapshots: { ...state.snapshots, [noteId]: list } }
      })
    },

    async createSnapshot(noteId, content, noteTitle, title = '自动保存') {
      const snapshot: Snapshot = {
        id: window.crypto.randomUUID(),
        noteId,
        title,
        noteTitle,
        content,
        createdAt: new Date().toISOString(),
      }
      const list = await snapshotsRepository.add(snapshot)
      set((state) => ({ snapshots: { ...state.snapshots, [noteId]: list } }))
      return list
    },

    async restoreSnapshot(noteId, snapshotId) {
      const note = get().notes.find((item) => item.id === noteId)
      const target = get().snapshots[noteId]?.find((s) => s.id === snapshotId)
      if (!note || !target) {
        return
      }
      // 先把当前内容存为"恢复前自动保存"快照
      await get().createSnapshot(noteId, note.content, note.title, '恢复前自动保存')
      // 再用快照内容覆盖笔记
      await get().updateNote(noteId, { content: target.content, title: target.noteTitle })
    },
  }))
}

export { getRootFolders }
