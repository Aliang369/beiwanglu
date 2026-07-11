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
    <div
      role="toolbar"
      aria-label="按标签筛选笔记"
      className="flex flex-wrap items-center gap-2 border-b border-outline-variant/30 bg-surface px-gutter py-2.5"
    >
      <button
        type="button"
        onClick={() => onTagChange(null)}
        aria-pressed={selectedTagId === null}
        className={`inline-flex h-8 cursor-pointer items-center rounded-full border px-3 font-label-sm text-label-sm leading-none transition-colors duration-200 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          selectedTagId === null
            ? 'border-primary/50 bg-secondary-container text-primary shadow-sm'
            : 'border-outline-variant/40 bg-surface-container-low text-on-surface-variant'
        }`}
      >
        全部标签
      </button>
      {tags.map((tag) => (
        <TagChip
          key={tag.id}
          tag={tag}
          selected={selectedTagId === tag.id}
          onClick={(tagId) => onTagChange(selectedTagId === tagId ? null : tagId)}
        />
      ))}
    </div>
  )
}
