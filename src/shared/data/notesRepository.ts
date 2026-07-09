import type { Folder, FolderDraft } from '../types/folder'
import type { Note, NoteDraft } from '../types/note'

export interface NotesRepository {
  list(): Promise<Note[]>
  listFolders(): Promise<Folder[]>
  create(draft: NoteDraft): Promise<Note>
  createFolder(draft: FolderDraft): Promise<Folder>
  update(
    id: string,
    patch: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'folderId' | 'isFavorite' | 'isDeleted' | 'deletedAt'>>,
  ): Promise<Note>
  updateFolder(id: string, patch: Partial<Pick<Folder, 'name' | 'icon' | 'parentId'>>): Promise<Folder>
  delete(id: string): Promise<void>
  deleteFolders(ids: string[]): Promise<void>
}
