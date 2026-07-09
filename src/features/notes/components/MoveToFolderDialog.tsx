import { Check, Folder, FolderInput, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Note } from '../../../shared/types/note'

export interface MoveToFolderOption {
  id: string | null
  name: string
  noteCount?: number
}

interface MoveToFolderDialogProps {
  note: Note
  folderOptions: MoveToFolderOption[]
  onClose: () => void
  onMove: (folderId: string | null) => void | Promise<void>
}

export function MoveToFolderDialog({ note, folderOptions, onClose, onMove }: MoveToFolderDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(note.folderId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const firstOptionRef = useRef<HTMLButtonElement>(null)
  const isUnchanged = selectedFolderId === note.folderId

  useEffect(() => {
    firstOptionRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleMove() {
    if (isUnchanged || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      await onMove(selectedFolderId)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/35 px-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-folder-title"
        className="w-full max-w-md overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-[0_12px_32px_rgba(0,50,100,0.08)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary">
              <FolderInput className="size-5" />
            </div>
            <div>
              <h2 id="move-folder-title" className="font-headline-sm text-headline-sm text-on-surface">移动到文件夹</h2>
              <p className="mt-0.5 line-clamp-1 font-label-sm text-label-sm text-on-surface-variant">选择“{note.title || '未命名笔记'}”的目标文件夹。</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭" className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto px-6 py-5">
          <div className="space-y-2" role="radiogroup" aria-label="目标文件夹">
            {folderOptions.map((folder, index) => {
              const selected = selectedFolderId === folder.id
              const current = note.folderId === folder.id

              return (
                <button
                  key={folder.id ?? 'none'}
                  ref={index === 0 ? firstOptionRef : undefined}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    selected ? 'border-primary bg-primary-container/55 text-on-surface' : 'border-outline-variant/40 bg-surface hover:border-primary/50 hover:bg-surface-container-low'
                  }`}
                >
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    {selected ? <Check className="size-4" /> : <Folder className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-label-md text-label-md">{folder.name}</span>
                      {current ? <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">当前</span> : null}
                    </div>
                    {folder.noteCount !== undefined ? <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">{folder.noteCount} 篇笔记</p> : null}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-outline-variant/20 bg-surface-container-low px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-outline-variant px-5 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={isUnchanged || isSubmitting}
            className="rounded-lg bg-primary px-5 py-2 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-fixed-variant disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-outline disabled:shadow-none"
          >
            {isSubmitting ? '移动中...' : '移动'}
          </button>
        </div>
      </div>
    </div>
  )
}
