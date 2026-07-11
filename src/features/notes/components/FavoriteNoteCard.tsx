import { Star } from 'lucide-react'
import type { Note } from '../../../shared/types/note'
import { formatUpdatedAt, getNoteTagNames } from '../../../shared/notes/noteSelectors'
import { NoteCardShell } from './NoteCardShell'

interface FavoriteNoteCardProps {
  note: Note
  variant?: 'featured' | 'default'
  query?: string
  onSelect?: (noteId: string) => void
}

export function FavoriteNoteCard({ note, variant = 'default', query, onSelect }: FavoriteNoteCardProps) {
  const primaryTag = getNoteTagNames(note, ['收藏'])[0]
  const updatedAt = formatUpdatedAt(note.updatedAt)
  const featured = variant === 'featured'

  const star = (
    <div className="absolute right-3 top-3 z-50 size-8 flex items-center justify-center">
      <Star className="size-5 text-primary" fill="currentColor" />
    </div>
  )

  return (
    <NoteCardShell
      note={note}
      featured={featured}
      query={query}
      primaryTag={primaryTag}
      updatedLabel={updatedAt}
      imgAltPrefix="收藏笔记"
      onActivate={() => onSelect?.(note.id)}
      cornerSlot={star}
      variant="favorite"
    />
  )
}
