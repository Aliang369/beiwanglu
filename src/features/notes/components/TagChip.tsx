import { X } from 'lucide-react'
import type { NoteTag } from '../../../shared/types/note'

interface TagChipProps {
  tag: NoteTag
  selected?: boolean
  onClick?: (tagId: string) => void
  onRemove?: (tagId: string) => void
  /** editor：与「添加标签」同高；filter：筛选条稍大触控 */
  size?: 'editor' | 'filter'
}

const defaultToneClass = 'border-outline-variant/40 bg-surface-container-low text-on-surface-variant'
const selectedClass = 'border-primary/50 bg-secondary-container text-primary shadow-sm'

/** 与 NoteEditorTags「添加标签」共用同一盒模型 */
const editorSizeClass = 'box-border h-7 px-2.5 font-label-sm text-label-sm leading-none'
const filterSizeClass = 'box-border h-8 px-3 font-label-sm text-label-sm leading-none'

export function TagChip({ tag, selected = false, onClick, onRemove, size = 'filter' }: TagChipProps) {
  const sizeClass = size === 'editor' ? editorSizeClass : filterSizeClass
  const className = selected ? selectedClass : defaultToneClass
  const baseClass = `inline-flex shrink-0 items-center rounded-full border ${sizeClass}`

  if (onClick && !onRemove) {
    return (
      <button
        type="button"
        onClick={() => onClick(tag.id)}
        aria-pressed={selected}
        className={`${baseClass} cursor-pointer transition-colors duration-200 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
      >
        {tag.name}
      </button>
    )
  }

  if (onRemove) {
    return (
      <span className={`group relative ${baseClass} ${className}`}>
        <span className="max-w-[10rem] truncate">{tag.name}</span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onRemove(tag.id)
          }}
          aria-label={`移除标签 ${tag.name}`}
          className="absolute -right-1 -top-1 inline-flex size-3.5 cursor-pointer items-center justify-center rounded-full border border-outline-variant/40 bg-surface text-on-surface-variant opacity-0 shadow-sm transition-opacity duration-150 hover:bg-surface-container hover:text-on-surface focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <X className="size-2.5" strokeWidth={2.5} />
        </button>
      </span>
    )
  }

  return (
    <span className={`${baseClass} ${className}`}>
      <span className="max-w-[10rem] truncate">{tag.name}</span>
    </span>
  )
}
