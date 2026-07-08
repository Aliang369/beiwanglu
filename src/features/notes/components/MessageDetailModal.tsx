import { Archive, Info, MailOpen, ShieldCheck, Sparkles, Trash2, UsersRound, Wrench, X } from 'lucide-react'
import type { ComponentType } from 'react'
import type { MessageItem, MessageType } from './messageMockData'

interface MessageDetailModalProps {
  message: MessageItem
  onClose: () => void
}

const icons: Record<MessageType, ComponentType<{ className?: string }>> = {
  system: Archive,
  comment: UsersRound,
  reminder: ShieldCheck,
  update: Sparkles,
}

export function MessageDetailModal({ message, onClose }: MessageDetailModalProps) {
  const Icon = icons[message.type] ?? Wrench

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-inverse-surface/35 px-4 py-10 backdrop-blur-[2px]" onClick={onClose}>
      <article
        className="w-full max-w-[800px] overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-[0_12px_32px_rgba(0,50,100,0.08)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex flex-col gap-4 border-b border-surface-variant bg-surface-container-low px-6 py-6 md:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="m-0 truncate font-headline-md text-headline-md leading-tight text-on-surface">{message.title}</h1>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{message.source}</span>
                  <span className="text-[10px] text-outline-variant">•</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{message.time}</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              {/* TODO: 接入真实未读状态。 */}
              <button type="button" className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high" title="标记为未读">
                <MailOpen className="size-5" />
              </button>
              {/* TODO: 接入真实删除消息。 */}
              <button type="button" className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-error" title="删除">
                <Trash2 className="size-5" />
              </button>
              <button type="button" onClick={onClose} className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface" aria-label="关闭消息详情">
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            <span className="rounded-full bg-secondary-container px-3 py-1 font-label-sm text-label-sm text-on-secondary-container">{message.tag}</span>
            <span className="rounded-full bg-surface-dim px-3 py-1 font-label-sm text-label-sm text-on-surface">{message.category === 'security' ? '安全' : '系统'}</span>
          </div>
        </header>

        <div className="px-6 py-8 md:px-8 md:py-10">
          <div className="max-w-none font-body-md text-body-md text-on-surface">
            {message.content.map((paragraph) => (
              <p key={paragraph} className="mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}

            {message.type === 'update' ? (
              <>
                <h3 className="mb-4 mt-8 font-headline-sm text-headline-sm text-on-surface">主要更新内容</h3>
                <ul className="mb-6 list-disc space-y-2 pl-5 text-on-surface-variant">
                  <li>全新画廊视图：以卡片形式直观浏览笔记。</li>
                  <li>深度专注模式：隐藏无关界面元素，保留纯净画布。</li>
                  <li>同步性能提升：跨设备同步更快、更稳定。</li>
                  <li>增强 Markdown 支持：更适合结构化写作。</li>
                </ul>
              </>
            ) : null}

            <div className="mt-8 flex items-start gap-4 rounded-lg border border-surface-variant bg-surface-container p-6">
              <Info className="mt-1 size-5 shrink-0 text-primary" />
              <div>
                <h4 className="mb-1 font-label-md text-label-md font-bold">提示</h4>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  当前消息为本地演示数据，不会同步已读、删除或账户状态。
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-4 border-t border-surface-variant bg-surface-container-lowest px-6 py-6 md:px-8">
          {message.secondaryAction ? (
            <button type="button" className="rounded-lg border border-outline-variant px-6 py-2.5 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low">
              {message.secondaryAction}
            </button>
          ) : null}
          <button type="button" onClick={onClose} className="rounded-lg bg-primary px-6 py-2.5 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-fixed-variant">
            {message.primaryAction ?? '知道了'}
          </button>
        </footer>
      </article>
    </div>
  )
}
