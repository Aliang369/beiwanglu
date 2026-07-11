import { Trash2 } from 'lucide-react'
import type { Note } from '../../../shared/types/note'
import { extractTextFromNoteContent, formatTrashPurgeLabel, getTrashDaysRemaining, isTrashPurgeUrgent } from '../../../shared/notes/noteDomain'
import { getNoteTagNames } from '../../../shared/notes/noteSelectors'
import { highlightSearchMatch } from '../../../shared/ui'
import { TrashNoteActions } from './TrashNoteActions'

interface TrashNoteListItemProps {
  note: Note
  query?: string
  onRestore?: (noteId: string) => void
  onPermanentlyDelete?: () => void
}

export function TrashNoteListItem({ note, query, onRestore, onPermanentlyDelete }: TrashNoteListItemProps) {
  const tags = getNoteTagNames(note, ['已删除'])
  const daysRemaining = getTrashDaysRemaining(note)
  const purgeLabel = formatTrashPurgeLabel(daysRemaining)
  const urgent = isTrashPurgeUrgent(daysRemaining)
  const titleText = note.title || '未命名笔记'
  const previewText =
    note.excerpt || extractTextFromNoteContent(note.content || '') || '已删除的笔记内容预览。'

  return (
    <article className="group flex flex-col gap-4 rounded-xl border border-dashed border-outline-variant/60 bg-white p-5 opacity-80 transition-all duration-300 hover:border-solid hover:border-outline-variant hover:opacity-100 hover:shadow-lg sm:flex-row sm:items-center sm:gap-6">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-error-container/30 text-error">
        <Trash2 className="size-6" />
      </div>

      <div className="min-w-0 flex-1 self-stretch sm:self-auto">
        <div className="mb-1 flex min-w-0 items-center gap-3">
          <h3 className="truncate font-headline-sm text-headline-sm text-on-surface-variant transition-colors group-hover:text-on-surface">
            {highlightSearchMatch(titleText, query)}
          </h3>
          <span
            className={`shrink-0 rounded px-2 py-0.5 font-label-sm text-label-sm ${
              urgent ? 'bg-error-container/40 text-error' : 'bg-surface-variant/50 text-on-surface-variant'
            }`}
          >
            {purgeLabel}
          </span>
          {tags.slice(0, 1).map((tag) => (
            <span key={tag} className="hidden shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant md:inline">
              {tag}
            </span>
          ))}
        </div>
        <p className="max-w-2xl truncate font-body-md text-body-md text-outline transition-colors group-hover:text-on-surface-variant">
          {highlightSearchMatch(previewText, query)}
        </p>
      </div>

      <TrashNoteActions
        className="self-stretch sm:self-auto"
        noteTitle={note.title}
        onRestore={onRestore ? () => onRestore(note.id) : undefined}
        onPermanentlyDelete={onPermanentlyDelete}
      />
    </article>
  )
}
