/**
 * 笔记搜索输入框（共享组件）
 * - 200ms 防抖同步 onQueryChange
 * - 搜索历史下拉（localStorage 持久化）
 * - Cmd/Ctrl+K 全局聚焦快捷键
 * - Enter 提交（写入历史 + 触发 onSubmit）
 * - ESC 清空 / 失焦
 */
import { Clock3, Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import {
  clearSearchHistory,
  loadSearchHistory,
  pushSearchHistory,
  removeSearchHistoryItem,
} from '../../../shared/notes/searchHistory'

const SEARCH_DEBOUNCE_MS = 200

interface NoteSearchInputProps {
  /** 受控初始值（外部同步用） */
  query?: string
  /** 防抖后的查询同步 */
  onQueryChange?: (query: string) => void
  /** Enter 提交回调（已写入历史后触发） */
  onSubmit?: (query: string) => void
  /** 输入框容器自定义类名 */
  className?: string
  /** 占位符 */
  placeholder?: string
}

export function NoteSearchInput({
  query = '',
  onQueryChange,
  onSubmit,
  className = '',
  placeholder = '搜索笔记...',
}: NoteSearchInputProps) {
  const [draftQuery, setDraftQuery] = useState(query)
  const [history, setHistory] = useState<string[]>(() => loadSearchHistory())
  const [historyOpen, setHistoryOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const historyListId = useId()

  useEffect(() => {
    setDraftQuery(query)
  }, [query])

  useEffect(() => {
    if (draftQuery === query) {
      return
    }

    const timer = window.setTimeout(() => {
      onQueryChange?.(draftQuery)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [draftQuery, query, onQueryChange])

  useEffect(() => {
    function handleGlobalSearchShortcut(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') {
        return
      }

      const target = event.target as HTMLElement | null
      const tagName = target?.tagName
      const isEditable =
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        Boolean(target?.isContentEditable)

      if (isEditable && target !== inputRef.current) {
        return
      }

      event.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
      setHistoryOpen(true)
    }

    window.addEventListener('keydown', handleGlobalSearchShortcut)
    return () => window.removeEventListener('keydown', handleGlobalSearchShortcut)
  }, [])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (wrapRef.current?.contains(target)) {
        return
      }
      setHistoryOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  function commitQuery(next: string, options?: { saveHistory?: boolean; closeHistory?: boolean }) {
    const value = next
    setDraftQuery(value)
    onQueryChange?.(value)

    if (options?.saveHistory && value.trim()) {
      setHistory(pushSearchHistory(value))
    }

    if (options?.closeHistory) {
      setHistoryOpen(false)
    }
  }

  function handleHistorySelect(item: string) {
    commitQuery(item, { saveHistory: true, closeHistory: true })
    onSubmit?.(item)
  }

  function handleHistoryRemove(item: string) {
    setHistory(removeSearchHistoryItem(item, history))
  }

  function handleClearHistory() {
    clearSearchHistory()
    setHistory([])
  }

  const showHistory = historyOpen && history.length > 0
  const searchInputClass =
    'h-full w-full min-w-0 border-none bg-transparent text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden'

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="flex h-10 w-full items-center rounded-full bg-surface-container-low px-3 transition-all focus-within:ring-2 focus-within:ring-primary">
        <Search className="mr-2 size-5 shrink-0 text-on-surface-variant" aria-hidden />
        <input
          ref={inputRef}
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
          onFocus={() => setHistoryOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              if (draftQuery) {
                commitQuery('')
              } else {
                setHistoryOpen(false)
                inputRef.current?.blur()
              }
              return
            }

            if (event.key === 'Enter') {
              commitQuery(draftQuery, { saveHistory: true, closeHistory: true })
              onSubmit?.(draftQuery)
            }
          }}
          className={searchInputClass}
          placeholder={placeholder}
          type="search"
          aria-label="搜索笔记"
          aria-keyshortcuts="Meta+K Control+K"
          aria-autocomplete="list"
          aria-controls={historyListId}
          aria-expanded={showHistory}
        />
        {draftQuery ? (
          <button
            type="button"
            onClick={() => commitQuery('')}
            className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-surface-variant/80 transition-colors hover:bg-surface-container hover:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="清空搜索"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {showHistory ? (
        <div
          id={historyListId}
          role="listbox"
          aria-label="最近搜索"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-low shadow-lg"
        >
          <div className="flex h-10 items-center justify-between border-b border-outline-variant/20 px-3">
            <span className="font-label-sm text-label-sm text-on-surface-variant">最近搜索</span>
            <button
              type="button"
              onClick={handleClearHistory}
              className="inline-flex h-7 cursor-pointer items-center rounded-full px-2.5 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              清空
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {history.map((item) => (
              <li key={item} className="px-1.5">
                <div className="flex h-10 items-center gap-1 rounded-xl px-1 transition-colors hover:bg-surface-container">
                  <button
                    type="button"
                    role="option"
                    onClick={() => handleHistorySelect(item)}
                    className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Clock3 className="size-4 shrink-0 text-on-surface-variant" aria-hidden />
                    <span className="truncate font-body-md text-body-md text-on-surface">{item}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHistoryRemove(item)}
                    className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`删除历史 ${item}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
