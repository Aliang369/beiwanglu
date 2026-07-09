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

/** 受保护：不可删除、不可移出根级。 */
export const PROTECTED_FOLDER_IDS = ['inbox'] as const

export type ProtectedFolderId = (typeof PROTECTED_FOLDER_IDS)[number]

export function isProtectedFolderId(folderId: string) {
  return (PROTECTED_FOLDER_IDS as readonly string[]).includes(folderId)
}
