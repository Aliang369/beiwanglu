import { DestinationPickerDialog, type DestinationOption } from './DestinationPickerDialog'

export type MoveFolderTargetOption = DestinationOption

interface MoveFolderDialogProps {
  title?: string
  description?: string
  options: MoveFolderTargetOption[]
  initialParentId?: string | null
  onClose: () => void
  onMove: (parentId: string | null) => void | Promise<void>
}

export function MoveFolderDialog({
  title = '移动文件夹',
  description = '选择目标位置。子文件夹与其中的笔记会一起移动。',
  options,
  initialParentId = null,
  onClose,
  onMove,
}: MoveFolderDialogProps) {
  return (
    <DestinationPickerDialog
      title={title}
      description={description}
      options={options}
      initialId={initialParentId}
      variant="simple"
      onClose={onClose}
      onMove={onMove}
    />
  )
}
