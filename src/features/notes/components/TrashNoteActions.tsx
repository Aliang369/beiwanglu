import { RotateCcw, Trash2 } from 'lucide-react'

interface TrashNoteActionsProps {
  onRestore?: () => void
  onPermanentlyDelete?: () => void
  className?: string
}

/** 废纸篓「恢复 / 永久删除」按钮组，Card 与 List 共用 */
export function TrashNoteActions({ onRestore, onPermanentlyDelete, className = '' }: TrashNoteActionsProps) {
  return (
    <div className={`flex flex-wrap items-center justify-end gap-2 ${className}`}>
      <button
        type="button"
        onClick={onRestore}
        className="flex shrink-0 items-center gap-1 rounded-full bg-primary-container/20 px-3 py-1.5 font-label-md text-label-md text-on-primary-fixed-variant transition-colors hover:bg-primary-container/40"
      >
        <RotateCcw className="size-4" /> 恢复
      </button>
      <button
        type="button"
        onClick={onPermanentlyDelete}
        className="flex shrink-0 items-center gap-1 rounded-full bg-error-container/20 px-3 py-1.5 font-label-md text-label-md text-error transition-colors hover:bg-error-container/40"
      >
        <Trash2 className="size-4" /> 永久删除
      </button>
    </div>
  )
}
