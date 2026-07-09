import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

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
  const titleId = useId()
  const errorId = useId()
  const trimmed = name.trim()
  const initialTrimmed = initialName.trim()
  const remaining = 40 - name.length
  const unchanged = trimmed === initialTrimmed

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!trimmed) {
      setError('请输入文件夹名称。')
      inputRef.current?.focus()
      return
    }

    if (unchanged) {
      onClose()
      return
    }

    if (existingNames.some((existing) => existing === trimmed && existing !== initialTrimmed)) {
      setError('已存在同名文件夹。')
      inputRef.current?.focus()
      return
    }

    onRename(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 px-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-[0_16px_40px_rgba(17,28,45,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-2 pt-6">
            <h2 id={titleId} className="font-headline-sm text-headline-sm text-on-surface">
              重命名文件夹
            </h2>
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">修改名称后，列表会立刻更新显示。</p>
          </div>

          <div className="px-6 py-4">
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
              aria-describedby={error ? errorId : undefined}
              className={`w-full rounded-xl border bg-surface px-4 py-3 font-body-md text-body-md text-on-surface transition-all duration-200 placeholder:text-outline focus:outline-none focus:ring-2 ${
                error
                  ? 'border-error focus:border-error focus:ring-error/25'
                  : 'border-outline-variant/70 focus:border-primary focus:ring-primary/25'
              }`}
            />
            <div className="mt-2 flex items-start justify-between gap-3">
              {error ? (
                <p id={errorId} role="alert" className="font-label-sm text-label-sm text-error">
                  {error}
                </p>
              ) : (
                <p className="font-label-sm text-label-sm text-on-surface-variant">当前：{initialName}</p>
              )}
              <span className={`shrink-0 font-label-sm text-label-sm ${remaining <= 5 ? 'text-error' : 'text-outline'}`}>{remaining}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-full border border-outline-variant/70 bg-transparent px-5 py-2.5 font-label-md text-label-md text-on-surface transition-colors duration-200 hover:border-outline hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!trimmed || unchanged}
              className="min-h-11 min-w-[104px] rounded-full bg-primary px-5 py-2.5 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-200 hover:bg-primary-container hover:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary disabled:hover:text-on-primary"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
