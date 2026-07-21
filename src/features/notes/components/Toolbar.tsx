import { Bell, Clock3, LogOut, Menu, RefreshCw, Search, Shield, UserRound, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import {
  clearSearchHistory,
  loadSearchHistory,
  pushSearchHistory,
  removeSearchHistoryItem,
} from '../../../shared/notes/searchHistory'
import { useAuthStore } from '../../../shared/store/authStore'
import { useMessagesStore } from '../../../shared/store/messagesStore'
import type { MessageItem } from '../../../shared/types/message'
import { NotificationDropdown } from './NotificationDropdown'

const SEARCH_DEBOUNCE_MS = 200

interface ToolbarProps {
  query: string
  onQueryChange: (query: string) => void
  onRefresh?: () => void | Promise<void>
  onLoginClick?: () => void
  onProfileClick?: () => void
  onAccountSettingsClick?: () => void
  onLogoutClick?: () => void
  onMessagesClick?: () => void
  onMessageOpen?: (message: MessageItem) => void
}

export function Toolbar({ query, onQueryChange, onRefresh, onLoginClick, onProfileClick, onAccountSettingsClick, onLogoutClick, onMessagesClick, onMessageOpen }: ToolbarProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const account = useAuthStore((state) => state.user)
  const messages = useMessagesStore((state) => state.items)
  const unreadCount = useMessagesStore((state) => state.unreadCount)
  const markAllRead = useMessagesStore((state) => state.markAllRead)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(() => query.length > 0)
  const [draftQuery, setDraftQuery] = useState(query)
  const [history, setHistory] = useState<string[]>(() => loadSearchHistory())
  const [historyOpen, setHistoryOpen] = useState(false)
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const desktopWrapRef = useRef<HTMLDivElement>(null)
  const mobileWrapRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuTriggerRef = useRef<HTMLButtonElement>(null)
  const userMenuPopupRef = useRef<HTMLDivElement>(null)
  const userMenuInitialFocusRef = useRef<'first' | 'last'>('first')
  /** 仅键盘打开菜单时自动聚焦菜单项，避免鼠标点击出现浏览器焦点蓝框 */
  const userMenuShouldAutoFocusRef = useRef(false)
  const historyListId = useId()
  const userMenuId = useId()

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
      if (!desktopWrapRef.current?.contains(target) && !mobileWrapRef.current?.contains(target)) {
        setHistoryOpen(false)
      }
      if (!userMenuRef.current?.contains(target)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  useEffect(() => {
    if (!userMenuOpen) {
      return
    }
    if (!userMenuShouldAutoFocusRef.current) {
      return
    }
    userMenuShouldAutoFocusRef.current = false
    const menuItems = userMenuPopupRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')
    const target =
      userMenuInitialFocusRef.current === 'last'
        ? menuItems?.item((menuItems?.length ?? 1) - 1)
        : menuItems?.item(0)
    target?.focus()
  }, [userMenuOpen])

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

  function closeUserMenu({ restoreFocus = false } = {}) {
    setUserMenuOpen(false)
    if (restoreFocus) {
      window.setTimeout(() => userMenuTriggerRef.current?.focus(), 0)
    }
  }

  function runUserMenuAction(action?: () => void) {
    setUserMenuOpen(false)
    userMenuTriggerRef.current?.focus()
    action?.()
  }

  function handleUserMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const menuItems = Array.from(userMenuPopupRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const currentIndex = menuItems.indexOf(document.activeElement as HTMLElement)
    let nextIndex: number | null = null

    if (event.key === 'ArrowDown') {
      nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0
    } else if (event.key === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = menuItems.length - 1
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeUserMenu({ restoreFocus: true })
      return
    }

    if (nextIndex !== null) {
      event.preventDefault()
      menuItems[nextIndex]?.focus()
    }
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
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationOpen((open) => !open)}
            className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
            aria-label="消息中心"
            aria-expanded={notificationOpen}
          >
            <Bell className="size-5" />
            {unreadCount > 0 ? (
              <span className="absolute top-2 right-2 size-2 rounded-full border border-surface bg-error" />
            ) : null}
          </button>
          {notificationOpen ? (
            <NotificationDropdown
              messages={messages}
              onMessageOpen={(message) => {
                setNotificationOpen(false)
                onMessageOpen?.(message)
              }}
              onViewAll={() => {
                setNotificationOpen(false)
                onMessagesClick?.()
              }}
              onMarkAllRead={() => {
                void markAllRead()
              }}
            />
          ) : null}
        </div>
        {!isAuthenticated ? (
          <button
            type="button"
            onClick={onLoginClick}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-primary px-4 font-label-md text-label-md font-medium text-on-primary shadow-sm transition-all hover:bg-primary-container hover:text-on-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 active:scale-[0.98]"
          >
            登录/注册
          </button>
        ) : (
          <div ref={userMenuRef} className="relative">
            <button
              ref={userMenuTriggerRef}
              type="button"
              onClick={(event) => {
                // detail === 0：键盘触发的 click（Enter/Space）；鼠标点击 detail >= 1
                const fromKeyboard = event.detail === 0
                userMenuShouldAutoFocusRef.current = fromKeyboard
                if (fromKeyboard) {
                  userMenuInitialFocusRef.current = 'first'
                }
                setUserMenuOpen((open) => !open)
              }}
              onKeyDown={(event) => {
                if (!userMenuOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
                  event.preventDefault()
                  userMenuShouldAutoFocusRef.current = true
                  userMenuInitialFocusRef.current = event.key === 'ArrowUp' ? 'last' : 'first'
                  setUserMenuOpen(true)
                  return
                }
                // 鼠标打开后焦点可能仍在头像上：方向键再进入菜单项
                if (userMenuOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End')) {
                  event.preventDefault()
                  const menuItems = Array.from(userMenuPopupRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
                  if (menuItems.length === 0) return
                  if (event.key === 'ArrowUp' || event.key === 'End') {
                    menuItems[menuItems.length - 1]?.focus()
                  } else {
                    menuItems[0]?.focus()
                  }
                }
              }}
              className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-outline-variant/30 bg-primary-container text-on-primary transition-opacity hover:opacity-80"
              aria-label="用户菜单"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-controls={userMenuOpen ? userMenuId : undefined}
            >
              {account?.avatarUrl ? <img src={account.avatarUrl} alt="" className="size-full object-cover" /> : <UserRound className="size-5" />}
            </button>

            {userMenuOpen ? (
              <div ref={userMenuPopupRef} id={userMenuId} role="menu" onKeyDown={handleUserMenuKeyDown} className="absolute top-full right-0 z-30 mt-2 w-48 rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-2 shadow-lg">
                {account ? (
                  <div className="border-b border-outline-variant/30 px-4 pb-2">
                    <p className="truncate text-label-md font-medium text-on-surface">{account.name}</p>
                    <p className="truncate text-label-sm text-on-surface-variant">{account.account}</p>
                  </div>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => runUserMenuAction(onProfileClick)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-on-surface transition-colors hover:bg-surface-container-low focus:outline-none focus-visible:bg-surface-container-low focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
                >
                  <UserRound className="size-4" />
                  <span className="text-label-md">个人资料</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => runUserMenuAction(onAccountSettingsClick)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-on-surface transition-colors hover:bg-surface-container-low focus:outline-none focus-visible:bg-surface-container-low focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
                >
                  <Shield className="size-4" />
                  <span className="text-label-md">账号设置</span>
                </button>
                <div className="my-1 border-t border-outline-variant/30" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => runUserMenuAction(onLogoutClick)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-error transition-colors hover:bg-error-container/30 focus:outline-none focus-visible:bg-error-container/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-error/35"
                >
                  <LogOut className="size-4" />
                  <span className="text-label-md">退出登录</span>
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </header>
  )
}
