import { FolderInput, Trash2, X } from 'lucide-react'

interface FoldersSelectionBarProps {
  selectedCount: number
  totalCount: number
  canMove?: boolean
  canDelete?: boolean
  onSelectAll: () => void
  onMove: () => void
  onDelete: () => void
  onClear: () => void
}

export function FoldersSelectionBar({
  selectedCount,
  totalCount,
  canMove = true,
  canDelete = true,
  onSelectAll,
  onMove,
  onDelete,
  onClear,
}: FoldersSelectionBarProps) {
  return (
    <div className="mb-6 flex h-16 items-center justify-between rounded-xl bg-surface-container-highest px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClear}
          aria-label="退出多选"
          className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <X className="size-5" />
        </button>
        <span className="font-label-lg text-label-lg text-on-surface">已选择 {selectedCount} 项</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSelectAll}
          disabled={selectedCount === totalCount}
          className="rounded-full px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary disabled:cursor-not-allowed disabled:text-outline"
        >
          全选
        </button>
        <button
          type="button"
          onClick={onMove}
          disabled={!canMove}
          className="flex items-center gap-2 rounded-full px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary disabled:cursor-not-allowed disabled:text-outline"
        >
          <FolderInput className="size-4" />
          <span>移动</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          className="flex items-center gap-2 rounded-full px-4 py-2 font-label-md text-label-md text-error transition-colors hover:bg-error-container/30 disabled:cursor-not-allowed disabled:text-outline"
        >
          <Trash2 className="size-4" />
          <span>删除</span>
        </button>
      </div>
    </div>
  )
}
