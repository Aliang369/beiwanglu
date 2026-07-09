import { Check, type LucideIcon } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'

export type SelectionCheckboxVariant = 'badge' | 'tile'

interface SelectionCheckboxProps {
  selected: boolean
  /** 无障碍文案主体，如「笔记」「文件夹」→「选择笔记」 */
  entityLabel: string
  onToggle: () => void
  variant?: SelectionCheckboxVariant
  /** tile 未选中时展示的图标；badge 未选中时为空 */
  idleIcon?: LucideIcon
  idleIconProps?: { className?: string; strokeWidth?: number }
  className?: string
}

/**
 * 多选勾选控件。
 * - badge：卡片右上角小圆点
 * - tile：列表左侧大勾选（未选中可显示 idleIcon）
 */
export function SelectionCheckbox({
  selected,
  entityLabel,
  onToggle,
  variant = 'badge',
  idleIcon: IdleIcon,
  idleIconProps,
  className = '',
}: SelectionCheckboxProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onToggle()
  }

  if (variant === 'tile') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={selected ? `取消选择${entityLabel}` : `选择${entityLabel}`}
        aria-pressed={selected}
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${
          selected
            ? 'border-primary bg-primary text-on-primary shadow-sm'
            : 'border-outline-variant bg-surface-container-high text-on-surface-variant hover:border-primary hover:text-primary'
        } ${className}`}
      >
        {selected ? <Check className="size-5" /> : IdleIcon ? <IdleIcon className={idleIconProps?.className ?? 'size-5'} strokeWidth={idleIconProps?.strokeWidth} /> : null}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={selected ? `取消选择${entityLabel}` : `选择${entityLabel}`}
      aria-pressed={selected}
      className={`absolute top-3 right-3 z-50 flex size-8 items-center justify-center rounded-full transition-colors ${
        selected
          ? 'bg-primary text-on-primary shadow-sm'
          : 'border-2 border-outline-variant bg-surface-container-lowest/85 text-on-surface-variant backdrop-blur-md hover:border-primary hover:text-primary'
      } ${className}`}
    >
      {selected ? <Check className="size-4" /> : null}
    </button>
  )
}

/** 列表非多选时左侧图标占位，与 tile 勾选同尺寸 */
export function SelectionTileIdle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-high text-primary shadow-sm ${className}`}>
      {children}
    </div>
  )
}
