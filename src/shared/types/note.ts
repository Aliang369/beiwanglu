export type NoteTone = 'neutral' | 'danger' | 'primary'

export type NotesView = 'all' | 'favorites' | 'trash' | 'folders'

export interface NoteTag {
  id: string
  name: string
  tone?: NoteTone
}

export interface Note {
  id: string
  title: string
  content: string
  excerpt: string
  tags: NoteTag[]
  folderId: string | null
  isFavorite: boolean
  isDeleted: boolean
  /** ISO 时间；进入废纸篓时写入，恢复时清空。 */
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NoteDraft {
  title: string
  content: string
  tags?: NoteTag[]
  folderId?: string | null
}

export interface NotesFilter {
  view: NotesView
  query: string
  tagId: string | null
}
