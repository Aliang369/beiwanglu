import { Edit3, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'

interface RenameFolderDialogProps {
  initialName: string
  existingNames?: string[]
  onClose: () => void
  onRename: (name: string) => void
}

export function RenameFolderDialog({ initialName, existingNames = [], onClose, onRename }: RenameFolderDialogProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()

    if (!trimmed) {
      setError('请输入文件夹名称。')
      inputRef.current?.focus()
      return
    }

    if (trimmed === initialName.trim()) {
      onClose()
      return
    }

    if (existingNames.some((existing) => existing === trimmed && existing !== initialName.trim())) {
      setError('已存在同名文件夹。')
      inputRef.current?.focus()
      return
    }

    onRename(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/35 px-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-folder-title"
        className="w-full max-w-md overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-[0_12px_32px_rgba(0,50,100,0.08)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary">
              <Edit3 className="size-5" />
            </div>
            <div>
              <h2 id="rename-folder-title" className="font-headline-sm text-headline-sm text-on-surface">重命名文件夹</h2>
              <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">修改文件夹名称，方便后续查找。</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭" className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6">
            <label htmlFor="rename-folder-name" className="mb-2 block font-label-md text-label-md text-on-surface">
              文件夹名称
            </label>
            <input
              ref={inputRef}
              id="rename-folder-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                if (error) {
                  setError(null)
                }
              }}
              maxLength={40}
              placeholder="例如：工作项目"
              aria-invalid={error ? true : undefined}
              className={`w-full rounded-lg border bg-surface px-4 py-2.5 font-body-md text-body-md text-on-surface transition-colors placeholder:text-outline focus:outline-none focus:ring-2 ${
                error ? 'border-error focus:ring-error/40' : 'border-outline-variant focus:border-primary focus:ring-primary/30'
              }`}
            />
            {error ? <p className="mt-2 font-label-sm text-label-sm text-error">{error}</p> : null}
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
              type="submit"
              className="rounded-lg bg-primary px-5 py-2 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-fixed-variant"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
