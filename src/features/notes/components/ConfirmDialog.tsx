import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

interface ConfirmDialogProps {
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  isDestructive = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // 危险操作默认聚焦「取消」，降低误删概率
    const focusTarget = isDestructive ? cancelRef.current : confirmRef.current
    focusTarget?.focus()
  }, [isDestructive])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return
      }

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )

      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, onClose])

  async function handleConfirm() {
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/45 px-4 backdrop-blur-sm"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-describedby={descriptionId}
        className="w-full max-w-[420px] overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_16px_40px_rgba(17,28,45,0.14)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 pt-6">
          <div id={descriptionId} className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
            {description}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-10 cursor-pointer rounded-full border border-outline-variant bg-surface-container-lowest px-5 py-2 font-label-md text-label-md text-on-surface transition-colors duration-150 hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
            className={`min-h-10 min-w-[108px] cursor-pointer rounded-full px-5 py-2 font-label-md text-label-md shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] ${
              isDestructive
                ? 'bg-error text-on-error hover:bg-on-error-container focus-visible:ring-error/40'
                : 'bg-primary text-on-primary hover:bg-primary-container focus-visible:ring-primary/35'
            }`}
          >
            {isSubmitting ? '处理中...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
