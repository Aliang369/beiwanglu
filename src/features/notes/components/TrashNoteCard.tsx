import { Image, Timer } from 'lucide-react'
import type { Note } from '../../../shared/types/note'
import { formatTrashPurgeLabel, getTrashDaysRemaining, isTrashPurgeUrgent } from '../../../shared/notes/noteDomain'
import { getNoteTagNames } from '../../../shared/notes/noteSelectors'
import { TrashNoteActions } from './TrashNoteActions'

interface TrashNoteCardProps {
  note: Note
  index: number
  onRestore?: (noteId: string) => void
  onPermanentlyDelete?: () => void
}

export function TrashNoteCard({ note, index, onRestore, onPermanentlyDelete }: TrashNoteCardProps) {
  const tags = getNoteTagNames(note, ['已删除'])
  const daysRemaining = getTrashDaysRemaining(note)
  const purgeLabel = formatTrashPurgeLabel(daysRemaining)
  const urgent = isTrashPurgeUrgent(daysRemaining)
  const showImageSnippet = index === 2

  return (
    <article className="group flex h-[220px] min-w-0 flex-col overflow-hidden rounded-xl border border-dashed border-outline-variant/60 bg-gradient-to-br from-surface to-surface-container-low p-stack-md opacity-80 transition-all duration-300 hover:border-solid hover:border-outline-variant hover:opacity-100 hover:shadow-md">
      <div className="mb-stack-sm flex items-start justify-between gap-2">
        <h3 className="truncate font-headline-sm text-headline-sm text-on-surface-variant transition-colors group-hover:text-on-surface">
          {note.title || '未命名笔记'}
        </h3>
        <span
          className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 font-label-sm text-label-sm ${
            urgent ? 'bg-error-container/40 text-error' : 'bg-surface-variant/50 text-on-surface-variant'
          }`}
        >
          <Timer className="size-3.5" /> {purgeLabel}
        </span>
      </div>

      {showImageSnippet ? (
        <div className="mb-stack-sm flex min-w-0 items-start gap-3 grayscale opacity-70 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100">
          <div className="flex size-16 shrink-0 items-center justify-center rounded bg-surface-container text-outline">
            <Image className="size-6" />
          </div>
          <p className="line-clamp-2 break-words text-sm font-body-md text-body-md text-outline transition-colors group-hover:text-on-surface-variant">
            {note.excerpt || note.content || '已删除的笔记内容预览。'}
          </p>
        </div>
      ) : (
        <p className="mb-stack-sm line-clamp-3 break-words font-body-md text-body-md text-outline transition-colors group-hover:text-on-surface-variant">
          {note.excerpt || note.content || '已删除的笔记内容预览。'}
        </p>
      )}

      <div className="mb-auto flex flex-wrap gap-2">
        {tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded bg-surface-variant/50 px-2 py-1 text-[11px] font-medium tracking-wide text-outline">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto border-t border-outline-variant/30 pt-3 transition-colors group-hover:border-outline-variant/60">
        <TrashNoteActions
          onRestore={onRestore ? () => onRestore(note.id) : undefined}
          onPermanentlyDelete={onPermanentlyDelete}
        />
      </div>
    </article>
  )
}
