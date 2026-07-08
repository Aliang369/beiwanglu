import { ShieldCheck, Sparkles, UsersRound, Wrench } from 'lucide-react'
import type { ComponentType, MouseEvent } from 'react'
import type { MessageItem, MessageType } from './messageMockData'

interface NotificationDropdownProps {
  messages: MessageItem[]
  onMessageOpen?: (message: MessageItem) => void
  onViewAll?: () => void
}

const icons: Record<MessageType, ComponentType<{ className?: string }>> = {
  system: Wrench,
  comment: UsersRound,
  reminder: ShieldCheck,
  update: Sparkles,
}

export function NotificationDropdown({ messages, onMessageOpen, onViewAll }: NotificationDropdownProps) {
  const previewMessages = messages.slice(0, 2)

  function handleMessageClick(event: MouseEvent<HTMLButtonElement>, message: MessageItem) {
    event.stopPropagation()
    onMessageOpen?.(message)
  }

  function handleViewAllClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onViewAll?.()
  }

  return (
    <div className="absolute top-full right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-3">
        <h3 className="font-label-md text-label-md font-bold text-on-surface">通知</h3>
        <button type="button" className="font-label-sm text-label-sm text-primary transition-colors hover:underline">
          全部标记为已读
        </button>
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {previewMessages.map((message, index) => {
          const Icon = icons[message.type]

          return (
            <button
              key={message.id}
              type="button"
              onClick={(event) => handleMessageClick(event, message)}
              className={`block w-full px-4 py-3 text-left transition-colors hover:bg-surface-container-high ${index < previewMessages.length - 1 ? 'border-b border-outline-variant' : ''}`}
            >
              <div className="flex gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 truncate font-label-md text-label-md font-medium text-on-surface">{message.title}</p>
                  <p className="truncate font-label-sm text-label-sm text-on-surface-variant">{message.summary}</p>
                  <p className="mt-1 text-[10px] text-outline">{message.time}</p>
                </div>
                {message.unread ? <span className="mt-1 size-2 shrink-0 rounded-full bg-error" /> : null}
              </div>
            </button>
          )
        })}
      </div>

      <div className="border-t border-outline-variant bg-surface-container-low px-4 py-2 text-center">
        <button type="button" onClick={handleViewAllClick} className="font-label-sm text-label-sm text-primary transition-colors hover:underline">
          查看所有通知
        </button>
      </div>
    </div>
  )
}
