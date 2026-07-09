import { mockNotes } from './mockNotes'
import type { NotesRepository } from './notesRepository'
import {
  canMoveFolder,
  hasFolderNameConflict,
  applyFolderPatch,
  assertValidParentId,
  buildFolder,
  ensureDefaultFolders,
  normalizeFolders,
  seedDefaultFolders,
} from '../notes/folderDomain'
import { applyNotePatch, buildNewNote, normalizeNotes, purgeExpiredTrashNotes, sortNotesByUpdatedAt } from '../notes/noteDomain'
import type { Folder, FolderDraft } from '../types/folder'
import type { Note, NoteDraft } from '../types/note'

const STORAGE_KEY = 'beiwanglu.notes.v1'
const STORAGE_KEY_V2 = 'beiwanglu.notes.v2'

interface NotesStorageV2 {
  version: 2
  notes: Note[]
  folders: Folder[]
  updatedAt: string
}

export class WebNotesRepository implements NotesRepository {
  private readonly storage: Storage

  constructor(storage: Storage = window.localStorage) {
    this.storage = storage
  }

  async list() {
    const data = this.purgeAndPersist(this.read())
    return sortNotesByUpdatedAt(data.notes)
  }

  async listFolders() {
    const data = this.read()
    return data.folders
  }

  async create(draft: NoteDraft) {
    const data = this.read()
    const note = buildNewNote(draft, this.createId(), new Date().toISOString())
    const next = { ...data, notes: [note, ...data.notes], updatedAt: note.updatedAt }
    this.write(next)
    return note
  }

  async createFolder(draft: FolderDraft) {
    const data = this.read()
    const now = new Date().toISOString()
    assertValidParentId(data.folders, draft.parentId ?? null)

    if (hasFolderNameConflict(data.folders, draft.name, draft.parentId ?? null)) {
      throw new Error('同级已存在同名文件夹。')
    }

    const folder = buildFolder(draft, this.createId(), now)
    const next = { ...data, folders: [folder, ...data.folders], updatedAt: now }
    this.write(next)
    return folder
  }

  async update(
    id: string,
    patch: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'folderId' | 'isFavorite' | 'isDeleted' | 'deletedAt'>>,
  ) {
    const data = this.read()
    const index = data.notes.findIndex((note) => note.id === id)

    if (index < 0) {
      throw new Error(`Note not found: ${id}`)
    }

    const updated = applyNotePatch(data.notes[index], patch, new Date().toISOString())
    const notes = [...data.notes]
    notes[index] = updated
    this.write({ ...data, notes, updatedAt: updated.updatedAt })
    return updated
  }

  async updateFolder(id: string, patch: Partial<Pick<Folder, 'name' | 'icon' | 'parentId'>>) {
    const data = this.read()
    const index = data.folders.findIndex((folder) => folder.id === id)

    if (index < 0) {
      throw new Error(`Folder not found: ${id}`)
    }

    const nextParentId = patch.parentId !== undefined ? patch.parentId : data.folders[index].parentId
    const nextName = patch.name !== undefined ? patch.name : data.folders[index].name

    if (patch.parentId !== undefined) {
      assertValidParentId(data.folders, patch.parentId, new Set([id]))
      if (!canMoveFolder(data.folders, id, patch.parentId)) {
        throw new Error('文件夹无法移动到该位置。')
      }
    }

    if (hasFolderNameConflict(data.folders, nextName, nextParentId, new Set([id]))) {
      throw new Error('同级已存在同名文件夹。')
    }

    const updated = applyFolderPatch(data.folders[index], patch, new Date().toISOString())
    const folders = [...data.folders]
    folders[index] = updated
    this.write({ ...data, folders, updatedAt: updated.updatedAt })
    return updated
  }

  async delete(id: string) {
    const data = this.read()
    const notes = data.notes.filter((note) => note.id !== id)

    if (notes.length === data.notes.length) {
      throw new Error(`Note not found: ${id}`)
    }

    this.write({ ...data, notes, updatedAt: new Date().toISOString() })
  }

  async deleteFolders(ids: string[]) {
    if (ids.length === 0) {
      return
    }

    const data = this.read()
    const idSet = new Set(ids)
    const folders = data.folders.filter((folder) => !idSet.has(folder.id))
    this.write({ ...data, folders, updatedAt: new Date().toISOString() })
  }

  private createId() {
    return window.crypto.randomUUID()
  }

  private read(): NotesStorageV2 {
    const now = new Date().toISOString()
    const rawV2 = this.storage.getItem(STORAGE_KEY_V2)

    if (rawV2) {
      try {
        const parsed = JSON.parse(rawV2) as NotesStorageV2
        const notes = normalizeNotes(this.withoutTrashTestNote(parsed.notes ?? []))
        const folders = ensureDefaultFolders(normalizeFolders(parsed.folders ?? []), now)
        return { version: 2, notes, folders, updatedAt: parsed.updatedAt ?? now }
      } catch {
        // fall through to rebuild
      }
    }

    const rawV1 = this.storage.getItem(STORAGE_KEY)

    if (rawV1) {
      try {
        const notes = normalizeNotes(this.withoutTrashTestNote(JSON.parse(rawV1) as Note[]))
        const folders = ensureDefaultFolders(this.foldersFromNoteIds(notes, now), now)
        const data: NotesStorageV2 = { version: 2, notes, folders, updatedAt: now }
        this.write(data)
        return data
      } catch {
        // fall through
      }
    }

    const data: NotesStorageV2 = {
      version: 2,
      notes: normalizeNotes(mockNotes),
      folders: seedDefaultFolders(now),
      updatedAt: now,
    }
    this.write(data)
    return data
  }

  private foldersFromNoteIds(notes: Note[], now: string) {
    const ids = new Set(notes.map((note) => note.folderId).filter(Boolean) as string[])
    const seeded = seedDefaultFolders(now)
    const byId = new Map(seeded.map((folder) => [folder.id, folder]))

    for (const id of ids) {
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          name: id,
          icon: 'folder',
          parentId: null,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    return Array.from(byId.values())
  }

  private purgeAndPersist(data: NotesStorageV2) {
    const nextNotes = purgeExpiredTrashNotes(data.notes)

    if (nextNotes.length !== data.notes.length) {
      const next = { ...data, notes: nextNotes, updatedAt: new Date().toISOString() }
      this.write(next)
      return next
    }

    return data
  }

  private withoutTrashTestNote(notes: Note[]) {
    return notes.filter((note) => note.id !== 'trash-test-note')
  }

  private write(data: NotesStorageV2) {
    this.storage.setItem(STORAGE_KEY_V2, JSON.stringify(data))
    try {
      // 同步笔记数组到旧 key，避免其它读 v1 的代码完全失联（过渡期）
      this.storage.setItem(STORAGE_KEY, JSON.stringify(data.notes))
    } catch {
      // v2 是主数据；兼容旧 key 写入失败不应让调用方误判主写入失败。
    }
  }
}

export const webNotesRepository = new WebNotesRepository()
