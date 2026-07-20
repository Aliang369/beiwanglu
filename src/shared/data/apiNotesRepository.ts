import { notesApi } from '../api/modules/notesApi'
import type { Folder, FolderDraft } from '../types/folder'
import type { Note, NoteDraft } from '../types/note'
import type { NotesRepository } from './notesRepository'

/**
 * 基于 notesApi 的远端笔记仓储。
 * 登录后由 notesStore 切换使用；与 localStorage 本地仓储数据隔离。
 */
export class ApiNotesRepository implements NotesRepository {
  async list(): Promise<Note[]> {
    return notesApi.listNotes()
  }

  async listFolders(): Promise<Folder[]> {
    return notesApi.listFolders()
  }

  async create(draft: NoteDraft): Promise<Note> {
    return notesApi.createNote(draft)
  }

  async createFolder(draft: FolderDraft): Promise<Folder> {
    return notesApi.createFolder(draft)
  }

  async update(
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
    return notesApi.updateNote(id, patch)
  }

  async updateFolder(
    id: string,
    patch: Partial<Pick<Folder, 'name' | 'icon' | 'parentId'>>,
  ): Promise<Folder> {
    return notesApi.updateFolder(id, patch)
  }

  async delete(id: string): Promise<void> {
    return notesApi.deleteNote(id)
  }

  async deleteFolders(ids: string[]): Promise<void> {
    return notesApi.deleteFolders(ids)
  }
}

export const apiNotesRepository = new ApiNotesRepository()
