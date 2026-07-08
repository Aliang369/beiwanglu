import type { NoteTag } from '../../../shared/types/note'
import { TagChip } from './TagChip'

interface TagFilterBarProps {
  tags: NoteTag[]
  selectedTagId: string | null
  onTagChange: (tagId: string | null) => void
}

export function TagFilterBar({ tags, selectedTagId, onTagChange }: TagFilterBarProps) {
  if (tags.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant/30 bg-surface-container-lowest px-gutter py-2">
      <button
        type="button"
        onClick={() => onTagChange(null)}
        className={`rounded-full border px-3 py-1 font-label-sm text-label-sm transition-colors hover:border-primary hover:text-primary ${
          selectedTagId === null
            ? 'border-primary bg-secondary-container text-primary'
            : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant'
        }`}
      >
        全部标签
      </button>
      {tags.map((tag) => (
        <TagChip key={tag.id} tag={tag} selected={selectedTagId === tag.id} onClick={onTagChange} />
      ))}
    </div>
  )
}
