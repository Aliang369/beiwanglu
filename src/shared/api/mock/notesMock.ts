import type { Folder, FolderDraft } from '../../types/folder'
import type { Note, NoteDraft } from '../../types/note'
import { ApiError } from '../types'
import { createId, delay } from './utils'

function nowIso(): string {
  return new Date().toISOString()
}

function createExcerpt(content: string): string {
  const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return plain.slice(0, 96)
}

let notes: Note[] = [
  {
    id: 'note_remote_demo_1',
    title: '远程笔记占位示例',
    content: '这是 apiNotes 的 Mock 数据，不会替换本地 localStorage 仓储。',
    excerpt: '这是 apiNotes 的 Mock 数据，不会替换本地 localStorage 仓储。',
    tags: [{ id: 'tag_remote', name: '远程占位' }],
    folderId: null,
    isFavorite: false,
    isDeleted: false,
    deletedAt: null,
    cover: null,
    pinned: false,
    readOnly: false,
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
  },
]

let folders: Folder[] = []

export const mockNotesApi = {
  async listNotes(): Promise<Note[]> {
    await delay()
    return notes.map((note) => ({ ...note, tags: note.tags.map((tag) => ({ ...tag })) }))
  },

  async getNote(id: string): Promise<Note> {
    await delay(100)
    const found = notes.find((note) => note.id === id)
    if (!found) {
      throw new ApiError({ kind: 'business', code: 40401, message: '笔记不存在' })
    }
    return { ...found, tags: found.tags.map((tag) => ({ ...tag })) }
  },

  async createNote(draft: NoteDraft): Promise<Note> {
    await delay()
    const timestamp = nowIso()
    const note: Note = {
      id: createId('note'),
      title: draft.title,
      content: draft.content,
      excerpt: createExcerpt(draft.content),
      tags: draft.tags ? draft.tags.map((tag) => ({ ...tag })) : [],
      folderId: draft.folderId ?? null,
      isFavorite: false,
      isDeleted: false,
      deletedAt: null,
      cover: draft.cover ?? null,
      pinned: false,
      readOnly: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    notes = [note, ...notes]
    return { ...note, tags: note.tags.map((tag) => ({ ...tag })) }
  },

  async updateNote(
    id: string,
    patch: Partial<
      Pick<
        Note,
        | 'title'
        | 'content'
        | 'tags'
        | 'folderId'
        | 'isFavorite'
        | 'isDeleted'
        | 'deletedAt'
        | 'cover'
        | 'pinned'
        | 'readOnly'
      >
    >,
  ): Promise<Note> {
    await delay()
    const index = notes.findIndex((note) => note.id === id)
    if (index < 0) {
      throw new ApiError({ kind: 'business', code: 40401, message: '笔记不存在' })
    }
    const current = notes[index]
    const next: Note = {
      ...current,
      ...patch,
      tags: patch.tags ? patch.tags.map((tag) => ({ ...tag })) : current.tags,
      excerpt:
        patch.content !== undefined ? createExcerpt(patch.content) : current.excerpt,
      updatedAt: nowIso(),
    }
    notes = notes.map((note, i) => (i === index ? next : note))
    return { ...next, tags: next.tags.map((tag) => ({ ...tag })) }
  },

  async deleteNote(id: string): Promise<void> {
    await delay(100)
    const exists = notes.some((note) => note.id === id)
    if (!exists) {
      throw new ApiError({ kind: 'business', code: 40401, message: '笔记不存在' })
    }
    notes = notes.filter((note) => note.id !== id)
  },

  async listFolders(): Promise<Folder[]> {
    await delay()
    return folders.map((folder) => ({ ...folder }))
  },

  async createFolder(draft: FolderDraft): Promise<Folder> {
    await delay()
    const timestamp = nowIso()
    const folder: Folder = {
      id: createId('folder'),
      name: draft.name,
      icon: draft.icon ?? 'folder',
      parentId: draft.parentId ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    folders = [...folders, folder]
    return { ...folder }
  },

  async updateFolder(
    id: string,
    patch: Partial<Pick<Folder, 'name' | 'icon' | 'parentId'>>,
  ): Promise<Folder> {
    await delay()
    const index = folders.findIndex((folder) => folder.id === id)
    if (index < 0) {
      throw new ApiError({ kind: 'business', code: 40401, message: '文件夹不存在' })
    }
    const next: Folder = {
      ...folders[index],
      ...patch,
      updatedAt: nowIso(),
    }
    folders = folders.map((folder, i) => (i === index ? next : folder))
    return { ...next }
  },

  async deleteFolders(ids: string[]): Promise<void> {
    await delay(100)
    const idSet = new Set(ids)
    folders = folders.filter((folder) => !idSet.has(folder.id))
  },
}
