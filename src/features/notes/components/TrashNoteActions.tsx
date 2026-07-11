// 改动：纯图标按钮 + 恢复二次确认弹窗
import { RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

interface TrashNoteActionsProps {
  noteTitle?: string
  onRestore?: () => void
  onPermanentlyDelete?: () => void
  className?: string
}

/** 废纸篓「恢复 / 永久删除」纯图标按钮组，Card 与 List 共用 */
export function TrashNoteActions({ noteTitle, onRestore, onPermanentlyDelete, className = '' }: TrashNoteActionsProps) {
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)

  return (
    <>
      <div className={`flex shrink-0 items-center gap-2 ${className}`}>
        {onRestore ? (
          <button
            type="button"
            onClick={() => setRestoreConfirmOpen(true)}
            aria-label="恢复"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container/20 text-on-primary-fixed-variant transition-colors hover:bg-primary-container/40"
          >
            <RotateCcw className="size-4" />
          </button>
        ) : null}
        {onPermanentlyDelete ? (
          <button
            type="button"
            onClick={onPermanentlyDelete}
            aria-label="永久删除"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-error-container/20 text-error transition-colors hover:bg-error-container/40"
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </div>

      {restoreConfirmOpen ? (
        <ConfirmDialog
          confirmLabel="恢复"
          description={
            <>
              将恢复「{noteTitle || '未命名笔记'}」到所有笔记，确认操作？
            </>
          }
          onClose={() => setRestoreConfirmOpen(false)}
          onConfirm={() => {
            onRestore?.()
            setRestoreConfirmOpen(false)
          }}
        />
      ) : null}
    </>
  )
}
