import type { Note } from '../../../shared/types/note'
import { DestinationPickerDialog, type DestinationOption } from './DestinationPickerDialog'

export type MoveToFolderOption = DestinationOption

interface MoveToFolderDialogProps {
  note?: Note
  title?: string
  description?: string
  initialFolderId?: string | null
  currentFolderId?: string | null
  showCurrent?: boolean
  disableWhenUnchanged?: boolean
  folderOptions: MoveToFolderOption[]
  onClose: () => void
  onMove: (folderId: string | null) => void | Promise<void>
}

export function MoveToFolderDialog({
  note,
  title = '移动到文件夹',
  description,
  initialFolderId,
  currentFolderId,
  showCurrent,
  disableWhenUnchanged = true,
  folderOptions,
  onClose,
  onMove,
}: MoveToFolderDialogProps) {
  const resolvedInitialFolderId = initialFolderId ?? note?.folderId ?? null
  const resolvedCurrentFolderId = currentFolderId ?? note?.folderId ?? null
  const dialogDescription = description ?? `选择“${note?.title || '未命名笔记'}”的目标文件夹。`
  const shouldShowCurrent = showCurrent ?? Boolean(note)

  const options: DestinationOption[] = folderOptions.map((folder) => ({
    ...folder,
    badge: shouldShowCurrent && resolvedCurrentFolderId === folder.id ? '当前' : folder.badge,
  }))

  return (
    <DestinationPickerDialog
      title={title}
      description={dialogDescription}
      options={options}
      initialId={resolvedInitialFolderId}
      disableWhenUnchanged={disableWhenUnchanged}
      variant="compact"
      onClose={onClose}
      onMove={onMove}
    />
  )
}
