import { Image, RotateCcw, Timer, Trash2 } from 'lucide-react'
import type { Note } from '../../../shared/types/note'

interface TrashNoteCardProps {
  note: Note
  index: number
}

const purgeLabels = ['2天后清除', '15天后清除', '28天后清除', '29天后清除']

function trashTags(note: Note) {
  return note.tags.length > 0 ? note.tags.map((tag) => tag.name) : ['已删除']
}

export function TrashNoteCard({ note, index }: TrashNoteCardProps) {
  const tags = trashTags(note)
  const purgeLabel = purgeLabels[index % purgeLabels.length]
  const showImageSnippet = index === 2
  const urgent = index === 0

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

      <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-outline-variant/30 pt-3 transition-colors group-hover:border-outline-variant/60">
        {/* TODO: 接入恢复笔记逻辑。 */}
        <button
          type="button"
          className="flex shrink-0 items-center gap-1 rounded-full bg-primary-container/20 px-3 py-1.5 font-label-md text-label-md text-on-primary-fixed-variant transition-colors hover:bg-primary-container/40"
        >
          <RotateCcw className="size-4" /> 恢复
        </button>
        {/* TODO: 接入永久删除逻辑。 */}
        <button
          type="button"
          className="flex shrink-0 items-center gap-1 rounded-full bg-error-container/20 px-3 py-1.5 font-label-md text-label-md text-error transition-colors hover:bg-error-container/40"
        >
          <Trash2 className="size-4" /> 永久删除
        </button>
      </div>
    </article>
  )
}
