import { RotateCcw, Trash2 } from 'lucide-react'
import type { Note } from '../../../shared/types/note'

interface TrashNoteListItemProps {
  note: Note
  index: number
}

const purgeLabels = ['2天后清除', '15天后清除', '28天后清除', '29天后清除']

function trashTags(note: Note) {
  return note.tags.length > 0 ? note.tags.map((tag) => tag.name) : ['已删除']
}

export function TrashNoteListItem({ note, index }: TrashNoteListItemProps) {
  const tags = trashTags(note)
  const purgeLabel = purgeLabels[index % purgeLabels.length]
  const urgent = index === 0

  return (
    <article className="group flex flex-col gap-4 rounded-xl border border-dashed border-outline-variant/60 bg-white p-5 opacity-80 transition-all duration-300 hover:border-solid hover:border-outline-variant hover:opacity-100 hover:shadow-lg sm:flex-row sm:items-center sm:gap-6">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-error-container/30 text-error">
        <Trash2 className="size-6" />
      </div>

      <div className="min-w-0 flex-1 self-stretch sm:self-auto">
        <div className="mb-1 flex min-w-0 items-center gap-3">
          <h3 className="truncate font-headline-sm text-headline-sm text-on-surface-variant transition-colors group-hover:text-on-surface">{note.title || '未命名笔记'}</h3>
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
          {note.excerpt || note.content || '已删除的笔记内容预览。'}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-stretch sm:self-auto">
        {/* TODO: 接入恢复笔记逻辑。 */}
        <button type="button" className="flex shrink-0 items-center gap-1 rounded-full bg-primary-container/20 px-3 py-1.5 font-label-md text-label-md text-on-primary-fixed-variant transition-colors hover:bg-primary-container/40">
          <RotateCcw className="size-4" /> 恢复
        </button>
        {/* TODO: 接入永久删除逻辑。 */}
        <button type="button" className="flex shrink-0 items-center gap-1 rounded-full bg-error-container/20 px-3 py-1.5 font-label-md text-label-md text-error transition-colors hover:bg-error-container/40">
          <Trash2 className="size-4" /> 永久删除
        </button>
      </div>

    </article>
  )
}
