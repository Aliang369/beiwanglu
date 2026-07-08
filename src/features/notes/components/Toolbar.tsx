import { Bell, LogOut, Menu, RefreshCw, Search, Shield, UserRound, Users } from 'lucide-react'
import { NotificationDropdown } from './NotificationDropdown'
import { messageItems, type MessageItem } from './messageMockData'

interface ToolbarProps {
  query: string
  onQueryChange: (query: string) => void
  onProfileClick?: () => void
  onAccountSettingsClick?: () => void
  onSwitchAccountClick?: () => void
  onLogoutClick?: () => void
  onMessagesClick?: () => void
  onMessageOpen?: (message: MessageItem) => void
}

export function Toolbar({ query, onQueryChange, onProfileClick, onAccountSettingsClick, onSwitchAccountClick, onLogoutClick, onMessagesClick, onMessageOpen }: ToolbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-gutter text-primary">
      <div className="flex items-center gap-4 md:hidden">
        <button type="button" className="-ml-2 rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low">
          <Menu className="size-5" />
        </button>
      </div>

      <label className="hidden h-10 w-[400px] items-center rounded-full bg-surface-container-low px-4 transition-all focus-within:ring-2 focus-within:ring-primary md:flex">
        <Search className="mr-2 size-5 text-on-surface-variant" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="h-full w-full border-none bg-transparent text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none"
          placeholder="搜索笔记..."
          type="search"
        />
      </label>

      <button type="button" className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low md:hidden">
        <Search className="size-5" />
      </button>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <button
          type="button"
          className="hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary sm:block"
        >
          <RefreshCw className="size-5" />
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
