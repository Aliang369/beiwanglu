export type FolderIcon = 'work' | 'study' | 'travel' | 'ideas' | 'recipes' | 'finance' | 'folder'

export interface Folder {
  id: string
  name: string
  icon: FolderIcon
  /** null = 根级；非空时父级必须是根级（仅一层子文件夹）。 */
  parentId: string | null
  createdAt: string
  updatedAt: string
}

export interface FolderDraft {
  name: string
  icon?: FolderIcon
  parentId?: string | null
}
