import { Check, Folder } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

export interface MoveFolderTargetOption {
  id: string | null
  name: string
  description?: string
  disabled?: boolean
}

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
  const [selectedParentId, setSelectedParentId] = useState<string | null>(initialParentId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const titleId = useId()
  const firstOptionRef = useRef<HTMLButtonElement>(null)
  const enabledOptions = options.filter((option) => !option.disabled)
  const selectedOption = options.find((option) => option.id === selectedParentId)
  const canSubmit = Boolean(selectedOption) && !selectedOption?.disabled && enabledOptions.length > 0

  useEffect(() => {
    firstOptionRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, onClose])

  async function handleMove() {
    if (!canSubmit || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      await onMove(selectedParentId)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 px-4 backdrop-blur-sm" onClick={() => !isSubmitting && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-[0_16px_40px_rgba(17,28,45,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 pb-2 pt-6">
          <h2 id={titleId} className="font-headline-sm text-headline-sm text-on-surface">
            {title}
          </h2>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{description}</p>
        </div>

        <div className="max-h-[360px] space-y-2 overflow-y-auto px-6 py-4" role="radiogroup" aria-label="目标位置">
          {options.length === 0 ? (
            <p className="rounded-xl bg-surface-container-low px-4 py-3 font-body-md text-body-md text-on-surface-variant">没有可移动的目标位置。</p>
          ) : (
            options.map((option, index) => {
              const selected = selectedParentId === option.id

              return (
                <button
                  key={option.id ?? 'root'}
                  ref={index === 0 ? firstOptionRef : undefined}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={option.disabled}
                  onClick={() => setSelectedParentId(option.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected ? 'border-primary bg-primary-container/55 text-on-surface' : 'border-outline-variant/40 bg-surface hover:border-primary/50 hover:bg-surface-container-low'
                  }`}
                >
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    {selected ? <Check className="size-4" /> : <Folder className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="truncate font-label-md text-label-md">{option.name}</span>
                    {option.description ? <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">{option.description}</p> : null}
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-11 rounded-full border border-outline-variant/70 bg-transparent px-5 py-2.5 font-label-md text-label-md text-on-surface transition-colors duration-200 hover:border-outline hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void handleMove()}
            disabled={!canSubmit || isSubmitting}
            className="min-h-11 min-w-[104px] rounded-full bg-primary px-5 py-2.5 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-200 hover:bg-primary-container hover:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? '移动中...' : '移动'}
          </button>
        </div>
      </div>
    </div>
  )
}
