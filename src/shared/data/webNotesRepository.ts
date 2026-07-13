// 改动：update 的 patch 类型增加 cover；无默认文件夹；存储显式 v4 一次性迁移
import { mockNotes } from './mockNotes'
import type { NotesRepository } from './notesRepository'
import {
  canMoveFolder,
  hasFolderNameConflict,
  applyFolderPatch,
  assertValidParentId,
  buildFolder,
  normalizeFolders,
} from '../notes/folderDomain'
import { applyNotePatch, buildNewNote, normalizeNotes, purgeExpiredTrashNotes, sortNotesByUpdatedAt } from '../notes/noteDomain'
import type { Folder, FolderDraft } from '../types/folder'
import type { Note, NoteDraft } from '../types/note'

const STORAGE_KEY = 'beiwanglu.notes.v1'
const STORAGE_KEY_V2 = 'beiwanglu.notes.v2'
const STORAGE_KEY_V3 = 'beiwanglu.notes.v3'
const STORAGE_KEY_V4 = 'beiwanglu.notes.v4'

/** 历史默认/种子文件夹 id（仅迁移时剔除，非运行时保护逻辑）。 */
const LEGACY_SEED_FOLDER_IDS = new Set([
  'inbox',
  'work',
  'study',
  'personal',
  'travel',
  'ideas',
  'recipes',
  'finance',
])

interface NotesStorageV4 {
  version: 4
  notes: Note[]
  folders: Folder[]
  updatedAt: string
}

interface LegacyNotesStorage {
  version?: number
  notes?: Note[]
  folders?: Folder[]
  updatedAt?: string
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
    patch: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'folderId' | 'isFavorite' | 'isDeleted' | 'deletedAt' | 'cover' | 'pinned' | 'readOnly'>>,
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

  private read(): NotesStorageV4 {
    const now = new Date().toISOString()
    const rawV4 = this.storage.getItem(STORAGE_KEY_V4)

    if (rawV4) {
      try {
        const parsed = JSON.parse(rawV4) as NotesStorageV4
        const notes = normalizeNotes(this.withoutTrashTestNote(parsed.notes ?? []))
        const folders = normalizeFolders(parsed.folders ?? [])
        // v4 已完成种子清理；此处只做引用完整性修正，不反复剔除用户数据
        const cleaned = this.sanitizeNoteFolderRefs(notes, folders)
        return {
          version: 4,
          notes: cleaned,
          folders,
          updatedAt: parsed.updatedAt ?? now,
        }
      } catch {
        // fall through to migrate older keys
      }
    }

    return this.migrateToV4(now)
  }

  /**
   * 一次性迁移到 v4：
   * - 去掉历史默认/种子文件夹 id
   * - 失效的 folderId 置 null
   * - 写入 v4 后不再在每次 read 时做种子过滤
   */
  private migrateToV4(now: string): NotesStorageV4 {
    const legacy = this.readLegacyPayload()
    const notes = normalizeNotes(this.withoutTrashTestNote(legacy.notes)).map((note) => ({
      ...note,
      // 旧版本可能挂在默认收件箱等种子上；迁移后无文件夹
      folderId: note.folderId && !LEGACY_SEED_FOLDER_IDS.has(note.folderId) ? note.folderId : null,
    }))
    const folders = normalizeFolders(legacy.folders).filter((folder) => !LEGACY_SEED_FOLDER_IDS.has(folder.id))
    const cleanedNotes = this.sanitizeNoteFolderRefs(notes, folders)
    const data: NotesStorageV4 = {
      version: 4,
      notes: cleanedNotes,
      folders,
      updatedAt: now,
    }
    this.write(data)
    return data
  }

  private readLegacyPayload(): { notes: Note[]; folders: Folder[] } {
    for (const key of [STORAGE_KEY_V3, STORAGE_KEY_V2]) {
      const raw = this.storage.getItem(key)
      if (!raw) {
        continue
      }
      try {
        const parsed = JSON.parse(raw) as LegacyNotesStorage | Note[]
        if (Array.isArray(parsed)) {
          return { notes: parsed, folders: [] }
        }
        return {
          notes: parsed.notes ?? [],
          folders: parsed.folders ?? [],
        }
      } catch {
        // try next key
      }
    }

    const rawV1 = this.storage.getItem(STORAGE_KEY)
    if (rawV1) {
      try {
        const parsed = JSON.parse(rawV1) as LegacyNotesStorage | Note[]
        if (Array.isArray(parsed)) {
          return { notes: parsed, folders: [] }
        }
        if (Array.isArray(parsed.notes)) {
          return { notes: parsed.notes, folders: parsed.folders ?? [] }
        }
      } catch {
        // fall through
      }
    }

    return {
      notes: mockNotes.map((note) => ({ ...note, folderId: null })),
      folders: [],
    }
  }

  private sanitizeNoteFolderRefs(notes: Note[], folders: Folder[]) {
    const folderIds = new Set(folders.map((folder) => folder.id))
    return notes.map((note) => {
      if (note.folderId && !folderIds.has(note.folderId)) {
        return { ...note, folderId: null }
      }
      return note
    })
  }

  private purgeAndPersist(data: NotesStorageV4) {
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

  private write(data: NotesStorageV4) {
    const payload: NotesStorageV4 = { ...data, version: 4 }
    this.storage.setItem(STORAGE_KEY_V4, JSON.stringify(payload))
    try {
      // 兼容旧读取方：notes 数组镜像
      this.storage.setItem(STORAGE_KEY, JSON.stringify(payload.notes))
    } catch {
      // v4 是主数据；兼容旧 key 写入失败不应让调用方误判主写入失败。
    }
  }
}

export const webNotesRepository = new WebNotesRepository()
