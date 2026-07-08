import { Archive, Bell, CheckCheck, Settings2, ShieldCheck, Sparkles, UsersRound, Wrench } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { messageItems, type MessageItem, type MessageType } from './messageMockData'

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

export function MessageCenterView({ onMessageOpen }: MessageCenterViewProps) {
  const [activeFilter, setActiveFilter] = useState<MessageFilter>('all')
  const filteredMessages = activeFilter === 'all' ? messageItems : messageItems.filter((message) => message.category === activeFilter)

  return (
    <main className="relative mx-auto w-full max-w-container-max-width flex-1 overflow-y-auto bg-surface-container-lowest p-gutter">
      <div className="mx-auto flex h-full max-w-container-max-width flex-col gap-6">
        <div className="mb-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-background">消息中心</h2>
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">查看系统通知与账户动态。</p>
          </div>
          <div className="flex items-center gap-3">
            {/* TODO: 接入真实已读状态。 */}
            <button type="button" className="flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low">
              <CheckCheck className="size-[18px]" />
              全部标为已读
            </button>
            {/* TODO: 接入通知设置。 */}
            <button type="button" aria-label="Notification Settings" className="flex size-10 items-center justify-center rounded-lg bg-surface-container-low text-on-surface transition-colors hover:bg-surface-container">
              <Settings2 className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 border-b border-outline-variant/50">
          {filters.map((filter) => {
            const count = filter.value === 'all' ? messageItems.length : messageItems.filter((message) => message.category === filter.value).length
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
          {filteredMessages.length > 0 ? (
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
