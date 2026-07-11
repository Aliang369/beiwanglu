import { Bell, Clock3, LogOut, Menu, RefreshCw, Search, Shield, UserRound, Users, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import {
  clearSearchHistory,
  loadSearchHistory,
  pushSearchHistory,
  removeSearchHistoryItem,
} from '../../../shared/notes/searchHistory'
import { NotificationDropdown } from './NotificationDropdown'
import { messageItems, type MessageItem } from './messageMockData'

const SEARCH_DEBOUNCE_MS = 200

interface ToolbarProps {
  query: string
  onQueryChange: (query: string) => void
  onRefresh?: () => void | Promise<void>
  onProfileClick?: () => void
  onAccountSettingsClick?: () => void
  onSwitchAccountClick?: () => void
  onLogoutClick?: () => void
  onMessagesClick?: () => void
  onMessageOpen?: (message: MessageItem) => void
}

export function Toolbar({ query, onQueryChange, onRefresh, onProfileClick, onAccountSettingsClick, onSwitchAccountClick, onLogoutClick, onMessagesClick, onMessageOpen }: ToolbarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(() => query.length > 0)
  const [draftQuery, setDraftQuery] = useState(query)
  const [history, setHistory] = useState<string[]>(() => loadSearchHistory())
  const [historyOpen, setHistoryOpen] = useState(false)
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const desktopWrapRef = useRef<HTMLDivElement>(null)
  const mobileWrapRef = useRef<HTMLDivElement>(null)
  const historyListId = useId()

  useEffect(() => {
    setDraftQuery(query)
  }, [query])

  useEffect(() => {
    if (draftQuery === query) {
      return
    }

    const timer = window.setTimeout(() => {
      onQueryChange(draftQuery)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [draftQuery, query, onQueryChange])

  useEffect(() => {
    if (mobileSearchOpen) {
      mobileInputRef.current?.focus()
    }
  }, [mobileSearchOpen])

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

      if (isEditable && target !== desktopInputRef.current && target !== mobileInputRef.current) {
        return
      }

      event.preventDefault()

      const isDesktop = window.matchMedia('(min-width: 768px)').matches

      if (isDesktop) {
        desktopInputRef.current?.focus()
        desktopInputRef.current?.select()
        setHistoryOpen(true)
        return
      }

      setMobileSearchOpen(true)
      setHistoryOpen(true)
      window.setTimeout(() => {
        mobileInputRef.current?.focus()
        mobileInputRef.current?.select()
      }, 0)
    }

    window.addEventListener('keydown', handleGlobalSearchShortcut)
    return () => window.removeEventListener('keydown', handleGlobalSearchShortcut)
  }, [])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (desktopWrapRef.current?.contains(target) || mobileWrapRef.current?.contains(target)) {
        return
      }
      setHistoryOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  async function handleRefresh() {
    if (!onRefresh || isRefreshing) {
      return
    }

    setIsRefreshing(true)
    const startedAt = Date.now()

    try {
      await onRefresh()
    } finally {
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, 500 - elapsed)

      if (remaining > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remaining))
      }

      setIsRefreshing(false)
    }
  }

  function commitQuery(next: string, options?: { saveHistory?: boolean; closeHistory?: boolean }) {
    const value = next
    setDraftQuery(value)
    onQueryChange(value)

    if (options?.saveHistory && value.trim()) {
      setHistory(pushSearchHistory(value))
    }

    if (options?.closeHistory) {
      setHistoryOpen(false)
    }
  }

  function openMobileSearch() {
    setMobileSearchOpen(true)
    setHistoryOpen(true)
  }

  function closeMobileSearch() {
    setMobileSearchOpen(false)
    setHistoryOpen(false)
    commitQuery('')
  }

  function handleHistorySelect(item: string) {
    commitQuery(item, { saveHistory: true, closeHistory: true })
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

  function renderHistoryPanel() {
    if (!showHistory) {
      return null
    }

    return (
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
    )
  }

  function renderClearButton(onClear: () => void) {
    if (!draftQuery) {
      return null
    }

    return (
      <button
        type="button"
        onClick={onClear}
        className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-surface-variant/80 transition-colors hover:bg-surface-container hover:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="清空搜索"
      >
        <X className="size-3.5" />
      </button>
    )
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between gap-2 border-b border-outline-variant bg-surface px-gutter text-primary">
      {!mobileSearchOpen ? (
        <div className="flex items-center gap-4 md:hidden">
          <button type="button" className="-ml-2 rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low">
            <Menu className="size-5" />
          </button>
        </div>
      ) : null}

      <div ref={desktopWrapRef} className="relative hidden md:block">
        <div className="flex h-10 w-[min(400px,40vw)] items-center rounded-full bg-surface-container-low px-3 transition-all focus-within:ring-2 focus-within:ring-primary">
          <Search className="mr-2 size-5 shrink-0 text-on-surface-variant" aria-hidden />
          <input
            ref={desktopInputRef}
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            onFocus={() => setHistoryOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                if (draftQuery) {
                  commitQuery('')
                } else {
                  setHistoryOpen(false)
                  desktopInputRef.current?.blur()
                }
                return
              }

              if (event.key === 'Enter') {
                commitQuery(draftQuery, { saveHistory: true, closeHistory: true })
              }
            }}
            className={searchInputClass}
            placeholder="搜索笔记..."
            type="search"
            aria-label="搜索笔记"
            aria-keyshortcuts="Meta+K Control+K"
            aria-autocomplete="list"
            aria-controls={historyListId}
            aria-expanded={showHistory}
          />
          {renderClearButton(() => commitQuery(''))}
        </div>
        {renderHistoryPanel()}
      </div>

      {mobileSearchOpen ? (
        <div ref={mobileWrapRef} className="relative flex min-w-0 flex-1 items-center gap-2 md:hidden">
          <div className="flex h-10 min-w-0 flex-1 items-center rounded-full bg-surface-container-low px-3 transition-all focus-within:ring-2 focus-within:ring-primary">
            <Search className="mr-2 size-5 shrink-0 text-on-surface-variant" aria-hidden />
            <input
              ref={mobileInputRef}
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              onFocus={() => setHistoryOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  closeMobileSearch()
                  return
                }

                if (event.key === 'Enter') {
                  commitQuery(draftQuery, { saveHistory: true, closeHistory: true })
                }
              }}
              className={searchInputClass}
              placeholder="搜索笔记..."
              type="search"
              aria-label="搜索笔记"
              aria-autocomplete="list"
              aria-controls={historyListId}
              aria-expanded={showHistory}
            />
            {renderClearButton(() => commitQuery(''))}
          </div>
          <button
            type="button"
            onClick={closeMobileSearch}
            className="min-h-9 shrink-0 cursor-pointer px-1 font-label-md text-label-md text-primary"
          >
            取消
          </button>
          {renderHistoryPanel()}
        </div>
      ) : (
        <button
          type="button"
          onClick={openMobileSearch}
          className="min-h-10 min-w-10 cursor-pointer rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low md:hidden"
          aria-label="打开搜索"
        >
          <Search className="size-5" />
        </button>
      )}

      <div className={`ml-auto items-center gap-2 md:gap-4 ${mobileSearchOpen ? 'hidden md:flex' : 'flex'}`}>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={!onRefresh || isRefreshing}
          aria-label="刷新笔记"
          aria-busy={isRefreshing}
          className={`hidden rounded-full p-2 transition-colors sm:block ${
            isRefreshing
              ? 'cursor-wait text-primary'
              : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary disabled:cursor-not-allowed disabled:opacity-60'
          }`}
        >
          <RefreshCw className={`size-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
        <div className="group relative">
          <button
            type="button"
            onClick={onMessagesClick}
            className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
            aria-label="消息中心"
          >
            <Bell className="size-5" />
            <span className="absolute top-2 right-2 size-2 rounded-full border border-surface bg-error" />
          </button>
          <div className="invisible opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
            <NotificationDropdown messages={messageItems} onMessageOpen={onMessageOpen} onViewAll={onMessagesClick} />
          </div>
        </div>
        <div className="group relative hidden md:flex">
          <button
            type="button"
            className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-outline-variant/30 bg-primary-container text-on-primary transition-opacity hover:opacity-80"
            aria-label="用户菜单"
          >
            <UserRound className="size-5" />
          </button>

          <div className="invisible absolute top-full right-0 z-30 mt-2 w-48 rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-2 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
            <button type="button" onClick={onProfileClick} className="flex w-full items-center gap-3 px-4 py-2 text-left text-on-surface transition-colors hover:bg-surface-container-low">
              <UserRound className="size-4" />
              <span className="text-label-md">个人资料</span>
            </button>
            <button type="button" onClick={onAccountSettingsClick} className="flex w-full items-center gap-3 px-4 py-2 text-left text-on-surface transition-colors hover:bg-surface-container-low">
              <Shield className="size-4" />
              <span className="text-label-md">账号设置</span>
            </button>
            <button type="button" onClick={onSwitchAccountClick} className="flex w-full items-center gap-3 px-4 py-2 text-left text-on-surface transition-colors hover:bg-surface-container-low">
              <Users className="size-4" />
              <span className="text-label-md">切换账号</span>
            </button>
            <div className="my-1 border-t border-outline-variant/30" />
            <button type="button" onClick={onLogoutClick} className="flex w-full items-center gap-3 px-4 py-2 text-left text-error transition-colors hover:bg-error-container/30">
              <LogOut className="size-4" />
              <span className="text-label-md">退出登录</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
