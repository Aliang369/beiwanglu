import { Clock3, Star } from 'lucide-react'
import type { Note } from '../../../shared/types/note'
import { formatUpdatedAt, getNoteTagNames } from '../../../shared/notes/noteSelectors'

interface FavoriteNoteListItemProps {
  note: Note
  onSelect?: (noteId: string) => void
}


export function FavoriteNoteListItem({ note, onSelect }: FavoriteNoteListItemProps) {
  const primaryTag = getNoteTagNames(note, ['收藏'])[0]

  return (
    <article
      onClick={() => onSelect?.(note.id)}
      className="group flex cursor-pointer items-center gap-6 rounded-xl border border-outline-variant bg-white p-5 transition-all duration-300 hover:border-primary-fixed-dim hover:shadow-lg"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
        <Star className="size-6" fill="currentColor" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex min-w-0 items-center gap-3">
          <h3 className="truncate font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">{note.title || '未命名笔记'}</h3>
          <span className="hidden shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant sm:inline">
            {primaryTag}
          </span>
        </div>
        <p className="max-w-2xl truncate font-body-md text-body-md text-on-surface-variant">{note.excerpt || note.content || '开始输入内容...'}</p>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="font-label-md text-label-md font-medium text-on-surface">{formatUpdatedAt(note.updatedAt)}</p>
        <p className="flex items-center justify-end gap-1 font-label-sm text-label-sm text-outline">
          <Clock3 className="size-3.5" /> 收藏笔记
        </p>
      </div>
    </article>
  )
}
