import { type MouseEvent, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { MoreVertical } from 'lucide-react'

export interface HoverMenuItem {
  key: string
  label: string
  icon: LucideIcon
  /** 传给 Lucide 图标的 fill，如收藏星标实心/空心 */
  iconFill?: string
  danger?: boolean
  hidden?: boolean
  onSelect: () => void
}

interface HoverActionMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: HoverMenuItem[]
  /** 触发按钮尺寸样式：card 右上角小钮 / list 行内钮 */
  triggerVariant?: 'card' | 'list' | 'always'
  menuWidthClassName?: string
  children?: ReactNode
}

export function HoverActionMenu({
  open,
  onOpenChange,
  items,
  triggerVariant = 'card',
  menuWidthClassName = 'w-48',
  children,
}: HoverActionMenuProps) {
  const visibleItems = items.filter((item) => !item.hidden)

  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onOpenChange(!open)
  }

  if (visibleItems.length === 0 && !children) {
    return null
  }

  const triggerClass =
    triggerVariant === 'list'
      ? `flex size-9 items-center justify-center rounded-full text-outline transition-all hover:bg-surface-container-low hover:text-primary focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-fixed ${
          open ? 'bg-surface-container-low text-primary' : ''
        }`
      : triggerVariant === 'always'
        ? `flex size-8 items-center justify-center rounded-full text-on-surface-variant transition-all hover:bg-surface-container-highest hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed ${
            open ? 'bg-surface-container-highest text-on-surface' : ''
          }`
      : `flex size-8 items-center justify-center rounded-full border border-white/40 bg-surface-container-lowest/60 text-on-surface-variant shadow-sm backdrop-blur-md transition-all hover:bg-surface-container-lowest/85 hover:text-primary focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-fixed group-hover:opacity-100 ${
          open ? 'opacity-100' : 'opacity-0'
        }`

  return (
    <div
      className="relative z-30 w-max"
      onClick={(event) => event.stopPropagation()}
      onMouseEnter={() => onOpenChange(true)}
      onMouseLeave={() => onOpenChange(false)}
    >
      <button type="button" onClick={handleToggle} className={triggerClass} aria-haspopup="menu" aria-expanded={open}>
        <MoreVertical className={triggerVariant === 'list' ? 'size-5' : triggerVariant === 'card' ? 'size-5' : 'size-4'} />
      </button>
      <div
        className={`absolute right-0 top-full z-40 pt-2 transition-all duration-150 ${
          open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`${menuWidthClassName} overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-2 shadow-lg`} role="menu">
          {children}
          {visibleItems.map((item, index) => {
            const Icon = item.icon
            const prevDanger = index > 0 && visibleItems[index - 1]?.danger
            const showDivider = item.danger && !prevDanger && index > 0

            return (
              <div key={item.key}>
                {showDivider ? <div className="my-1 border-t border-outline-variant/30" /> : null}
                <button
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation()
                    item.onSelect()
                    onOpenChange(false)
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-label-md transition-colors ${
                    item.danger
                      ? 'text-error hover:bg-error-container/30'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <Icon
                    className={`size-4 ${item.danger ? '' : 'text-on-surface-variant'}`}
                    fill={item.iconFill ?? 'none'}
                  />
                  <span>{item.label}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
