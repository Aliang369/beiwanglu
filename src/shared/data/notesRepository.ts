import type { Note, NoteDraft } from '../types/note'

export interface NotesRepository {
  list(): Promise<Note[]>
  create(draft: NoteDraft): Promise<Note>
  update(id: string, patch: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'folderId' | 'isFavorite' | 'isDeleted'>>): Promise<Note>
}
