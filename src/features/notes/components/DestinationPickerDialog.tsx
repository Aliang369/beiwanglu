import { Check, Folder, FolderInput, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

export interface DestinationOption {
  id: string | null
  name: string
  description?: string
  badge?: string
  noteCount?: number
  disabled?: boolean
}

export interface DestinationPickerDialogProps {
  title?: string
  description?: string
  options: DestinationOption[]
  initialId?: string | null
  /** 与 initial 相同则禁用提交（用于「未改动」） */
  disableWhenUnchanged?: boolean
  /** 视觉变体：compact 带关闭按钮与图标头；simple 纯标题描述 */
  variant?: 'simple' | 'compact'
  emptyText?: string
  submitLabel?: string
  onClose: () => void
  onMove: (id: string | null) => void | Promise<void>
}

/** 选择目标位置的通用弹窗（移动笔记 / 移动文件夹） */
export function DestinationPickerDialog({
  title = '选择目标',
  description,
  options,
  initialId = null,
  disableWhenUnchanged = false,
  variant = 'simple',
  emptyText = '没有可移动的目标位置。',
  submitLabel = '移动',
  onClose,
  onMove,
}: DestinationPickerDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const titleId = useId()
  const firstOptionRef = useRef<HTMLButtonElement>(null)
  const selectedOption = options.find((option) => option.id === selectedId)
  const isUnchanged = disableWhenUnchanged && selectedId === initialId
  const enabledOptions = options.filter((option) => !option.disabled)
  const canSubmit =
    Boolean(selectedOption) && !selectedOption?.disabled && enabledOptions.length > 0 && !isUnchanged && !isSubmitting

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
    if (!canSubmit) {
      return
    }

    setIsSubmitting(true)
    try {
      await onMove(selectedId)
    } finally {
      setIsSubmitting(false)
    }
  }

  const optionList = (
    <div className="max-h-[360px] space-y-2 overflow-y-auto px-6 py-4" role="radiogroup" aria-label="目标位置">
      {options.length === 0 ? (
        <p className="rounded-xl bg-surface-container-low px-4 py-3 font-body-md text-body-md text-on-surface-variant">{emptyText}</p>
      ) : (
        options.map((option, index) => {
          const selected = selectedId === option.id

          return (
            <button
              key={option.id ?? 'root'}
              ref={index === 0 ? firstOptionRef : undefined}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={option.disabled}
              onClick={() => setSelectedId(option.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 ${
                selected ? 'border-primary bg-primary-container/55 text-on-surface' : 'border-outline-variant/40 bg-surface hover:border-primary/50 hover:bg-surface-container-low'
              }`}
            >
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {selected ? <Check className="size-4" /> : <Folder className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-label-md text-label-md">{option.name}</span>
                  {option.badge ? (
                    <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">{option.badge}</span>
                  ) : null}
                </div>
                {option.description ? <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">{option.description}</p> : null}
                {option.noteCount !== undefined ? (
                  <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">{option.noteCount} 篇笔记</p>
                ) : null}
              </div>
            </button>
          )
        })
      )}
    </div>
  )

  if (variant === 'compact') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/35 px-4 backdrop-blur-[2px]" onClick={() => !isSubmitting && onClose()}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="w-full max-w-md overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-[0_12px_32px_rgba(0,50,100,0.08)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary">
                <FolderInput className="size-5" />
              </div>
              <div>
                <h2 id={titleId} className="font-headline-sm text-headline-sm text-on-surface">
                  {title}
                </h2>
                {description ? <p className="mt-0.5 line-clamp-1 font-label-sm text-label-sm text-on-surface-variant">{description}</p> : null}
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="关闭" className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
              <X className="size-5" />
            </button>
          </div>
          {optionList}
          <div className="flex items-center justify-end gap-3 border-t border-outline-variant/20 bg-surface-container-low px-6 py-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-outline-variant px-5 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50">
              取消
            </button>
            <button
              type="button"
              onClick={() => void handleMove()}
              disabled={!canSubmit}
              className="rounded-lg bg-primary px-5 py-2 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-fixed-variant disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-outline disabled:shadow-none"
            >
              {isSubmitting ? '移动中...' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    )
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
          {description ? <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{description}</p> : null}
        </div>
        {optionList}
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
            disabled={!canSubmit}
            className="min-h-11 min-w-[104px] rounded-full bg-primary px-5 py-2.5 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-200 hover:bg-primary-container hover:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? '移动中...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
