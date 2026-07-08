import { Edit3, FolderInput, Trash2, X } from 'lucide-react'

interface FoldersSelectionBarProps {
  selectedCount: number
  onClear: () => void
}

export function FoldersSelectionBar({ selectedCount, onClear }: FoldersSelectionBarProps) {
  return (
    <div className="mb-6 flex h-16 items-center justify-between rounded-xl bg-surface-container-highest px-4 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onClear}
          className="flex size-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-variant"
        >
          <X className="size-5" />
        </button>
        <span className="font-headline-sm text-headline-sm font-bold text-primary">已选择 {selectedCount} 项</span>
      </div>
      <div className="flex items-center gap-3">
        {/* TODO: 接入批量移动逻辑。 */}
        <button type="button" className="flex items-center gap-2 rounded-full px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-primary-fixed">
          <FolderInput className="size-5" /> 移动
        </button>
        {/* TODO: 接入批量重命名逻辑。 */}
        <button type="button" className="flex items-center gap-2 rounded-full px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-primary-fixed">
          <Edit3 className="size-5" /> 重命名
        </button>
        <div className="mx-1 h-6 w-px bg-outline-variant" />
        {/* TODO: 接入批量删除逻辑。 */}
        <button type="button" className="flex items-center gap-2 rounded-full px-4 py-2 font-label-md text-label-md text-error transition-colors hover:bg-error-container">
          <Trash2 className="size-5" /> 删除
        </button>
      </div>
    </div>
  )
}
