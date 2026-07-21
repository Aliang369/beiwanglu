import { Archive, Bell, CheckCheck, Settings2, ShieldCheck, Sparkles, UsersRound, Wrench, X } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { useMessagesStore } from '../../../shared/store/messagesStore'
import type { MessageItem, MessageType, NotificationSettings } from '../../../shared/types/message'

interface MessageCenterViewProps {
  onMessageOpen?: (message: MessageItem) => void
}

type MessageFilter = 'all' | 'system' | 'security'

const icons: Record<MessageType, ComponentType<{ className?: string }>> = {
  system: Archive,
  comment: UsersRound,
  reminder: ShieldCheck,
  update: Sparkles,
}

const filters: Array<{ value: MessageFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'system', label: '系统通知' },
  { value: 'security', label: '账户安全' },
]

const settingLabels: Array<{ key: keyof NotificationSettings; label: string; description: string }> = [
  { key: 'systemEnabled', label: '系统通知', description: '产品更新与系统公告' },
  { key: 'securityEnabled', label: '安全通知', description: '登录与账户安全提醒' },
  { key: 'contentEnabled', label: '内容通知', description: '协作与共享相关提醒' },
]

export function MessageCenterView({ onMessageOpen }: MessageCenterViewProps) {
  const items = useMessagesStore((state) => state.items)
  const isLoading = useMessagesStore((state) => state.isLoading)
  const error = useMessagesStore((state) => state.error)
  const settings = useMessagesStore((state) => state.settings)
  const source = useMessagesStore((state) => state.source)
  const markAllRead = useMessagesStore((state) => state.markAllRead)
  const updateSettings = useMessagesStore((state) => state.updateSettings)
  const load = useMessagesStore((state) => state.load)
  const clearError = useMessagesStore((state) => state.clearError)

  const [activeFilter, setActiveFilter] = useState<MessageFilter>('all')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  const filteredMessages =
    activeFilter === 'all' ? items : items.filter((message) => message.category === activeFilter)

  async function handleMarkAllRead() {
    setActionError(null)
    setIsMarkingAll(true)
    try {
      await markAllRead()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '全部标为已读失败')
    } finally {
      setIsMarkingAll(false)
    }
  }

  async function handleToggleSetting(key: keyof NotificationSettings) {
    setActionError(null)
    try {
      await updateSettings({ [key]: !settings[key] })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '通知设置保存失败')
    }
  }

  return (
    <main className="relative mx-auto w-full max-w-container-max-width flex-1 overflow-y-auto bg-surface-container-lowest p-gutter">
      <div className="mx-auto flex h-full max-w-container-max-width flex-col gap-6">
        <div className="mb-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-background">消息中心</h2>
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              {source === 'guest' ? '未登录：本地演示消息，写操作仅保存在当前会话。' : '已登录：消息来自远端 API / Mock。'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={isMarkingAll || isLoading}
              className="flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low disabled:cursor-wait disabled:opacity-70"
            >
              <CheckCheck className="size-[18px]" />
              {isMarkingAll ? '处理中...' : '全部标为已读'}
            </button>
            <button
              type="button"
              aria-label="通知设置"
              onClick={() => setSettingsOpen((open) => !open)}
              className="flex size-10 items-center justify-center rounded-lg bg-surface-container-low text-on-surface transition-colors hover:bg-surface-container"
            >
              <Settings2 className="size-5" />
            </button>
          </div>
        </div>

        {settingsOpen ? (
          <section className="rounded-xl border border-outline-variant/40 bg-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">通知设置</h3>
              <button type="button" onClick={() => setSettingsOpen(false)} className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-low" aria-label="关闭通知设置">
                <X className="size-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {settingLabels.map((item) => (
                <label key={item.key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-3">
                  <input
                    type="checkbox"
                    checked={settings[item.key]}
                    onChange={() => void handleToggleSetting(item.key)}
                    className="mt-1 size-4 rounded border-outline text-primary focus:ring-primary"
                  />
                  <span>
                    <span className="block font-label-md text-label-md text-on-surface">{item.label}</span>
                    <span className="mt-0.5 block font-label-sm text-label-sm text-on-surface-variant">{item.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        ) : null}

        {(error || actionError) ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/30 bg-error-container/20 px-4 py-3" role="alert">
            <p className="font-label-md text-label-md text-error">{actionError ?? error}</p>
            <button
              type="button"
              onClick={() => {
                setActionError(null)
                clearError()
                void load(source === 'api')
              }}
              className="rounded-full border border-error/40 px-3 py-1 font-label-sm text-label-sm text-error"
            >
              重试
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-6 border-b border-outline-variant/50">
          {filters.map((filter) => {
            const count = filter.value === 'all' ? items.length : items.filter((message) => message.category === filter.value).length
            const active = activeFilter === filter.value

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`border-b-2 px-1 pb-3 font-label-md text-label-md transition-all ${
                  active ? 'border-primary font-semibold text-primary' : 'border-transparent text-on-surface-variant hover:border-outline-variant hover:text-on-surface'
                }`}
              >
                {filter.label}{filter.value === 'all' ? ` (${count})` : ''}
              </button>
            )
          })}
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-12">
          {isLoading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">正在加载消息...</p>
            </div>
          ) : filteredMessages.length > 0 ? (
            filteredMessages.map((message) => <MessageCard key={message.id} message={message} onOpen={onMessageOpen} />)
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Bell className="mb-4 size-16 text-outline-variant/50" />
              <h4 className="mb-2 font-headline-sm text-headline-sm text-on-surface-variant">暂无新消息</h4>
              <p className="font-body-md text-body-md text-outline">您已处理完所有通知。</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function MessageCard({ message, onOpen }: { message: MessageItem; onOpen?: (message: MessageItem) => void }) {
  const Icon = icons[message.type] ?? Wrench
  const unread = Boolean(message.unread)
  const iconTone = message.category === 'security' ? 'bg-error-container text-on-error-container' : unread ? 'bg-surface-container-highest text-primary' : 'bg-surface-container-low text-on-surface-variant'

  return (
    <article
      onClick={() => onOpen?.(message)}
      className={`group relative flex cursor-pointer items-start gap-4 rounded-xl border p-5 transition-all hover:bg-surface hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] md:gap-6 md:p-6 ${
        unread ? 'border-outline-variant/50 bg-surface' : 'border-outline-variant/30 bg-surface/50 opacity-70 hover:opacity-100'
      }`}
    >
      {unread ? <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" /> : null}
      <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${iconTone}`}>
        <Icon className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-4">
          <h3 className="truncate font-headline-sm text-headline-sm text-on-background">{message.title}</h3>
          <span className="shrink-0 whitespace-nowrap font-label-sm text-label-sm text-on-surface-variant">{message.time}</span>
        </div>
        <p className="line-clamp-2 font-body-md text-body-md text-on-surface-variant">{message.summary}</p>
        {message.primaryAction || message.secondaryAction ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {message.primaryAction ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onOpen?.(message)
                }}
                className={message.category === 'security' ? 'rounded-lg bg-error px-4 py-2 font-label-md text-label-md text-on-error transition-opacity hover:opacity-90' : 'font-label-md text-label-md text-primary underline-offset-4 hover:underline'}
              >
                {message.primaryAction}
              </button>
            ) : null}
            {message.secondaryAction ? (
              <button
                type="button"
                onClick={(event) => event.stopPropagation()}
                className="rounded-lg border border-outline-variant px-4 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low"
              >
                {message.secondaryAction}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}
