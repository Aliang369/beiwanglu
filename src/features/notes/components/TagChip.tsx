import type { NoteTag } from '../../../shared/types/note'

interface TagChipProps {
  tag: NoteTag
  selected?: boolean
  onClick?: (tagId: string) => void
}

const toneClass = {
  neutral: 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant',
  danger: 'border-error-container/50 bg-error-container/30 text-error',
  primary: 'border-primary-container/30 bg-secondary-container text-primary',
}

export function TagChip({ tag, selected = false, onClick }: TagChipProps) {
  const className = selected ? 'border-primary bg-secondary-container text-primary' : toneClass[tag.tone ?? 'neutral']

  if (onClick) {
    return (
      <button type="button" onClick={() => onClick(tag.id)} className={`rounded-full border px-2 py-1 font-label-sm text-label-sm transition-colors hover:border-primary hover:text-primary ${className}`}>
        {tag.name}
      </button>
    )
  }

  return (
    <span className={`rounded-full border px-2 py-1 font-label-sm text-label-sm ${className}`}>
      {tag.name}
    </span>
  )
}
