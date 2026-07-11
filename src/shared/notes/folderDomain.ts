import type { Folder, FolderDraft, FolderIcon } from '../types/folder'

const FOLDER_ICONS: readonly FolderIcon[] = ['work', 'study', 'travel', 'ideas', 'recipes', 'finance', 'folder']

function normalizeFolderIcon(icon: unknown): FolderIcon {
  return FOLDER_ICONS.includes(icon as FolderIcon) ? (icon as FolderIcon) : 'folder'
}

export function buildFolder(draft: FolderDraft, id: string, now: string): Folder {
  return {
    id,
    name: draft.name.trim(),
    icon: draft.icon ?? 'folder',
    parentId: draft.parentId ?? null,
    createdAt: now,
    updatedAt: now,
  }
}

export function applyFolderPatch(
  folder: Folder,
  patch: Partial<Pick<Folder, 'name' | 'icon' | 'parentId'>>,
  now: string,
): Folder {
  return {
    ...folder,
    ...patch,
    name: patch.name !== undefined ? patch.name.trim() : folder.name,
    updatedAt: now,
  }
}

export function normalizeFolder(raw: Folder): Folder {
  return {
    id: raw.id,
    name: (raw.name || '').trim() || raw.id,
    icon: normalizeFolderIcon(raw.icon),
    parentId: raw.parentId ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export function normalizeFolders(folders: Folder[]) {
  const normalized = folders.map(normalizeFolder)
  const byId = new Map(normalized.map((folder) => [folder.id, folder]))

  return normalized.map((folder) => {
    if (folder.parentId === null || folder.parentId === folder.id) {
      return { ...folder, parentId: null }
    }

    const parent = byId.get(folder.parentId)
    if (!parent || parent.parentId !== null) {
      return { ...folder, parentId: null }
    }

    return folder
  })
}

export function getChildFolders(folders: Folder[], parentId: string) {
  return folders.filter((folder) => folder.parentId === parentId)
}

export function getRootFolders(folders: Folder[]) {
  return folders.filter((folder) => folder.parentId === null)
}

/** 自身 + 直接子文件夹 id（一层）。 */
export function collectSubtreeIds(folders: Folder[], folderId: string) {
  const ids = new Set<string>([folderId])
  for (const child of getChildFolders(folders, folderId)) {
    ids.add(child.id)
  }
  return ids
}

export function collectSubtreeIdsForMany(folders: Folder[], folderIds: string[]) {
  const ids = new Set<string>()
  for (const folderId of folderIds) {
    for (const id of collectSubtreeIds(folders, folderId)) {
      ids.add(id)
    }
  }
  return ids
}

/**
 * 一层规则：
 * - parentId 为 null → 根
 * - parentId 非空 → 父必须存在且父的 parentId 为 null
 */
export function assertValidParentId(folders: Folder[], parentId: string | null, excludeIds: Set<string> = new Set()) {
  if (parentId === null) {
    return
  }

  if (excludeIds.has(parentId)) {
    throw new Error('不能移动到已选文件夹或其子文件夹下。')
  }

  const parent = folders.find((folder) => folder.id === parentId)

  if (!parent) {
    throw new Error('目标文件夹不存在。')
  }

  if (parent.parentId !== null) {
    throw new Error('只能放在根级文件夹下，不支持更深嵌套。')
  }
}

export function hasFolderNameConflict(
  folders: Folder[],
  name: string,
  parentId: string | null,
  excludeIds: Set<string> = new Set(),
) {
  const trimmed = name.trim()
  return folders.some((folder) => !excludeIds.has(folder.id) && folder.parentId === parentId && folder.name === trimmed)
}

export function canPlaceFoldersInParent(folders: Folder[], folderIds: string[], nextParentId: string | null) {
  const movingIds = new Set(folderIds)
  const movingNames = new Set<string>()

  for (const folderId of folderIds) {
    const folder = folders.find((item) => item.id === folderId)
    if (!folder) {
      return false
    }

    if (movingNames.has(folder.name)) {
      return false
    }
    movingNames.add(folder.name)

    if (hasFolderNameConflict(folders, folder.name, nextParentId, movingIds)) {
      return false
    }
  }

  return true
}

export function canMoveFolder(
  folders: Folder[],
  folderId: string,
  nextParentId: string | null,
  movingIds: Set<string> = new Set([folderId]),
) {
  if (movingIds.has(nextParentId as string)) {
    return false
  }

  if (nextParentId === folderId) {
    return false
  }

  const folder = folders.find((item) => item.id === folderId)
  if (!folder) {
    return false
  }

  if (folder.parentId === nextParentId) {
    return false
  }

  try {
    assertValidParentId(folders, nextParentId, movingIds)
  } catch {
    return false
  }

  // 带有子文件夹的文件夹，只能 parentId = null（保持为根），避免第三层。
  const hasChildren = folders.some((item) => item.parentId === folderId)
  if (hasChildren && nextParentId !== null) {
    return false
  }

  return true
}

export function getValidMoveTargets(folders: Folder[], movingIds: string[]) {
  const movingSet = new Set(movingIds)
  const blocked = collectSubtreeIdsForMany(folders, movingIds)
  const roots = getRootFolders(folders).filter((folder) => !blocked.has(folder.id))

  const anyHasChildren = movingIds.some((id) => folders.some((folder) => folder.parentId === id))

  return {
    allowRoot: true,
    rootOnly: anyHasChildren,
    rootFolders: anyHasChildren ? [] : roots.filter((folder) => !movingSet.has(folder.id)),
  }
}

export function sortFoldersByName(folders: Folder[]) {
  return [...folders].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}
