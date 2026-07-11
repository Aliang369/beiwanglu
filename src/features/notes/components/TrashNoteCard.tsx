import { Timer } from 'lucide-react'
import type { Note } from '../../../shared/types/note'
import { extractTextFromNoteContent, formatTrashPurgeLabel, getTrashDaysRemaining, isTrashPurgeUrgent } from '../../../shared/notes/noteDomain'
import { getNoteTagNames } from '../../../shared/notes/noteSelectors'
import { highlightSearchMatch } from '../../../shared/ui'
import { TrashNoteActions } from './TrashNoteActions'

interface TrashNoteCardProps {
  note: Note
  index: number
  query?: string
  onRestore?: (noteId: string) => void
  onPermanentlyDelete?: () => void
}

export function TrashNoteCard({ note, query, onRestore, onPermanentlyDelete }: TrashNoteCardProps) {
  const tags = getNoteTagNames(note, ['已删除'])
  const daysRemaining = getTrashDaysRemaining(note)
  const purgeLabel = formatTrashPurgeLabel(daysRemaining)
  const urgent = isTrashPurgeUrgent(daysRemaining)
  const titleText = note.title || '未命名笔记'
  const previewText =
    note.excerpt || extractTextFromNoteContent(note.content || '') || '已删除的笔记内容预览。'

  return (
    <article className="group flex h-[220px] min-w-0 flex-col overflow-hidden rounded-xl border border-dashed border-outline-variant/60 bg-gradient-to-br from-surface to-surface-container-low p-stack-md opacity-80 transition-all duration-300 hover:border-solid hover:border-outline-variant hover:opacity-100 hover:shadow-md">
      <div className="mb-stack-sm flex items-center justify-between gap-2">
        <h3 className="truncate font-headline-sm text-headline-sm text-on-surface-variant transition-colors group-hover:text-on-surface">
          {highlightSearchMatch(titleText, query)}
        </h3>
        <span
          className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 font-label-sm text-label-sm ${
            urgent ? 'bg-error-container/40 text-error' : 'bg-surface-variant/50 text-on-surface-variant'
          }`}
        >
          <Timer className="size-3.5" /> {purgeLabel}
        </span>
      </div>

      <p className="mb-stack-sm line-clamp-3 break-words font-body-md text-body-md text-outline transition-colors group-hover:text-on-surface-variant">
        {highlightSearchMatch(previewText, query)}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant/30 pt-3 transition-colors group-hover:border-outline-variant/60">
        {tags[0] ? (
          <span className="min-w-0 truncate rounded-full bg-surface-container-lowest/85 px-2.5 py-1 font-label-sm text-label-sm text-primary shadow-sm backdrop-blur-md">
            {tags[0]}
          </span>
        ) : <span />}
        <TrashNoteActions
          noteTitle={note.title}
          onRestore={onRestore ? () => onRestore(note.id) : undefined}
          onPermanentlyDelete={onPermanentlyDelete}
        />
      </div>
    </article>
  )
}
