import type { Folder, FolderIcon } from '../../types/folder'
import type { MessageCategory, MessageItem, MessageType, NotificationSettings } from '../../types/message'
import type { Note, NoteTag } from '../../types/note'
import type { Snapshot } from '../../types/snapshot'

export function boolToInt(value: boolean | undefined): number {
  return value ? 1 : 0
}

export function intToBool(value: unknown): boolean {
  return Number(value) === 1
}

export function noteFromRow(row: Record<string, unknown>): Note {
  let tags: NoteTag[] = []
  try {
    const parsed = JSON.parse(String(row.tags_json ?? '[]')) as NoteTag[]
    tags = Array.isArray(parsed) ? parsed : []
  } catch {
    tags = []
  }

  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    content: String(row.content ?? ''),
    excerpt: String(row.excerpt ?? ''),
    tags,
    folderId: row.folder_id == null ? null : String(row.folder_id),
    isFavorite: intToBool(row.is_favorite),
    isDeleted: intToBool(row.is_deleted),
    deletedAt: row.deleted_at == null ? null : String(row.deleted_at),
    cover: row.cover == null ? null : String(row.cover),
    pinned: intToBool(row.pinned),
    readOnly: intToBool(row.read_only),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export function folderFromRow(row: Record<string, unknown>): Folder {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    icon: String(row.icon ?? 'folder') as FolderIcon,
    parentId: row.parent_id == null ? null : String(row.parent_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export function snapshotFromRow(row: Record<string, unknown>): Snapshot {
  return {
    id: String(row.id),
    noteId: String(row.note_id),
    title: String(row.title ?? ''),
    noteTitle: String(row.note_title ?? ''),
    content: String(row.content ?? ''),
    createdAt: String(row.created_at),
  }
}

export function messageFromRow(row: Record<string, unknown>): MessageItem {
  let content: string[] = []
  try {
    const parsed = JSON.parse(String(row.content_json ?? '[]')) as string[]
    content = Array.isArray(parsed) ? parsed : []
  } catch {
    content = []
  }

  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    summary: String(row.summary ?? ''),
    content,
    time: String(row.time ?? ''),
    createdAt: String(row.created_at),
    type: String(row.type) as MessageType,
    category: String(row.category) as MessageCategory,
    source: String(row.source ?? ''),
    tag: String(row.tag ?? ''),
    unread: intToBool(row.unread),
    primaryAction: row.primary_action == null ? undefined : String(row.primary_action),
    secondaryAction: row.secondary_action == null ? undefined : String(row.secondary_action),
  }
}

export function notificationSettingsFromRow(row: Record<string, unknown>): NotificationSettings {
  return {
    systemEnabled: intToBool(row.system_enabled),
    securityEnabled: intToBool(row.security_enabled),
    contentEnabled: intToBool(row.content_enabled),
  }
}

export function rowsFromExec(result: Array<{ columns: string[]; values: unknown[][] }>): Array<Record<string, unknown>> {
  if (!result.length) return []
  const { columns, values } = result[0]
  return values.map((valueRow) => {
    const record: Record<string, unknown> = {}
    columns.forEach((column, index) => {
      record[column] = valueRow[index]
    })
    return record
  })
}
