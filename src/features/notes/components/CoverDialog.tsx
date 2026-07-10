// 改动：封面设置/更换弹窗 — 预览 + URL 表单，对齐现有 Dialog 体系
import { Image, ImagePlus, Link2 } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { DEFAULT_COVER_URL } from '../../../shared/notes/noteDomain'

export interface CoverDialogProps {
  /** set = 首次设置；change = 更换已有封面 */
  mode?: 'set' | 'change'
  initialUrl?: string | null
  onClose: () => void
  onSubmit: (url: string) => void | Promise<void>
}

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function CoverDialog({
  mode = 'set',
  initialUrl = null,
  onClose,
  onSubmit,
}: CoverDialogProps) {
  const titleId = useId()
  const descId = useId()
  const errorId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const seed = (initialUrl && initialUrl.trim()) || DEFAULT_COVER_URL
  const [url, setUrl] = useState(seed)
  const [error, setError] = useState<string | null>(null)
  const [previewBroken, setPreviewBroken] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const trimmed = url.trim()
  const previewUrl = isHttpUrl(trimmed) ? trimmed : ''
  const title = mode === 'change' ? '更换封面' : '设置封面'
  const submitLabel = mode === 'change' ? '保存更换' : '应用封面'
  const description =
    mode === 'change'
      ? '粘贴新的图片链接，预览满意后保存。卡片与编辑页会同步更新。'
      : '为笔记添加一张封面图，让列表一眼就能认出它。'

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    setPreviewBroken(false)
  }, [trimmed])

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!trimmed) {
      setError('请输入图片链接。')
      inputRef.current?.focus()
      return
    }

    if (!isHttpUrl(trimmed)) {
      setError('请输入以 http:// 或 https:// 开头的有效链接。')
      inputRef.current?.focus()
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(trimmed)
    } finally {
      setIsSubmitting(false)
    }
  }

  function applyDefault() {
    setUrl(DEFAULT_COVER_URL)
    setError(null)
    setPreviewBroken(false)
    inputRef.current?.focus()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/45 px-4 backdrop-blur-sm"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-[0_20px_48px_rgba(17,28,45,0.16)]"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={(event) => void handleSubmit(event)}>
          <div className="border-b border-outline-variant/20 px-6 pb-4 pt-6">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed/70 text-primary">
                <ImagePlus className="size-5" />
              </div>
              <div className="min-w-0">
                <h2 id={titleId} className="font-headline-sm text-headline-sm text-on-surface">
                  {title}
                </h2>
                <p id={descId} className="mt-1 font-body-md text-body-md leading-relaxed text-on-surface-variant">
                  {description}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="relative overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low">
              <div className="aspect-[16/9] w-full">
                {previewUrl && !previewBroken ? (
                  <img
                    src={previewUrl}
                    alt="封面预览"
                    className="h-full w-full object-cover transition-opacity duration-200"
                    onError={() => setPreviewBroken(true)}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary-container/15 via-surface-container-low to-surface-container-high px-6 text-center">
                    <Image className="size-8 text-outline/60" />
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {previewBroken ? '图片加载失败，请检查链接是否可访问' : '输入有效链接后将在此预览'}
                    </p>
                  </div>
                )}
              </div>
              {previewUrl && !previewBroken ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-inverse-surface/55 to-transparent px-3 pb-2.5 pt-8">
                  <span className="font-label-sm text-label-sm text-inverse-on-surface/90">实时预览</span>
                </div>
              ) : null}
            </div>

            <div>
              <label htmlFor="cover-url" className="mb-2 flex items-center gap-1.5 font-label-md text-label-md text-on-surface">
                <Link2 className="size-3.5 text-on-surface-variant" />
                图片地址
              </label>
              <input
                ref={inputRef}
                id="cover-url"
                type="url"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value)
                  if (error) {
                    setError(null)
                  }
                }}
                placeholder="https://example.com/cover.jpg"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                disabled={isSubmitting}
                className={`w-full rounded-xl border bg-surface px-4 py-3 font-body-md text-body-md text-on-surface transition-all duration-200 placeholder:text-outline focus:outline-none focus:ring-2 disabled:opacity-60 ${
                  error
                    ? 'border-error focus:border-error focus:ring-error/25'
                    : 'border-outline-variant/70 focus:border-primary focus:ring-primary/25'
                }`}
              />
              {error ? (
                <p id={errorId} role="alert" className="mt-2 font-label-sm text-label-sm text-error">
                  {error}
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-label-sm text-label-sm text-outline">支持 https 图片链接</p>
                  <button
                    type="button"
                    onClick={applyDefault}
                    disabled={isSubmitting || trimmed === DEFAULT_COVER_URL}
                    className="cursor-pointer font-label-sm text-label-sm text-primary transition-colors duration-150 hover:text-primary-container focus-visible:outline-none focus-visible:underline disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    使用默认封面
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-outline-variant/20 bg-surface-bright/60 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-11 cursor-pointer rounded-full border border-outline-variant/70 bg-transparent px-5 py-2.5 font-label-md text-label-md text-on-surface transition-colors duration-200 hover:border-outline hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !trimmed}
              className="min-h-11 min-w-[120px] cursor-pointer rounded-full bg-primary px-5 py-2.5 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-200 hover:bg-primary-container hover:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary disabled:hover:text-on-primary"
            >
              {isSubmitting ? '保存中...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
