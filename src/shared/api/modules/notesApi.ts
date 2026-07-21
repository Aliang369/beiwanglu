import type { Folder, FolderDraft } from '../../types/folder'
import type { Note, NoteDraft } from '../../types/note'
import { isMockApiMode } from '../config'
import { request } from '../httpClient'
import { mockNotesApi } from '../mock/notesMock'

export type NoteUpdatePatch = Partial<
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
>

/**
 * 远程笔记/文件夹 API。
 * 本地优先架构下：业务读写走 SQLite；本模块供同步引擎推拉云端使用。
 */
export const notesApi = {
  listNotes(): Promise<Note[]> {
    if (isMockApiMode()) return mockNotesApi.listNotes()
    return request<Note[]>({ method: 'GET', path: '/notes' })
  },

  getNote(id: string): Promise<Note> {
    if (isMockApiMode()) return mockNotesApi.getNote(id)
    return request<Note>({ method: 'GET', path: `/notes/${id}` })
  },

  createNote(draft: NoteDraft): Promise<Note> {
    if (isMockApiMode()) return mockNotesApi.createNote(draft)
    return request<Note>({ method: 'POST', path: '/notes', body: draft })
  },

  updateNote(id: string, patch: NoteUpdatePatch): Promise<Note> {
    if (isMockApiMode()) return mockNotesApi.updateNote(id, patch)
    return request<Note>({ method: 'PATCH', path: `/notes/${id}`, body: patch })
  },

  deleteNote(id: string): Promise<void> {
    if (isMockApiMode()) return mockNotesApi.deleteNote(id)
    return request<void>({ method: 'DELETE', path: `/notes/${id}` })
  },

  listFolders(): Promise<Folder[]> {
    if (isMockApiMode()) return mockNotesApi.listFolders()
    return request<Folder[]>({ method: 'GET', path: '/folders' })
  },

  createFolder(draft: FolderDraft): Promise<Folder> {
    if (isMockApiMode()) return mockNotesApi.createFolder(draft)
    return request<Folder>({ method: 'POST', path: '/folders', body: draft })
  },

  updateFolder(
    id: string,
    patch: Partial<Pick<Folder, 'name' | 'icon' | 'parentId'>>,
  ): Promise<Folder> {
    if (isMockApiMode()) return mockNotesApi.updateFolder(id, patch)
    return request<Folder>({ method: 'PATCH', path: `/folders/${id}`, body: patch })
  },

  deleteFolders(ids: string[]): Promise<void> {
    if (isMockApiMode()) return mockNotesApi.deleteFolders(ids)
    return request<void>({ method: 'POST', path: '/folders/delete', body: { ids } })
  },
}
