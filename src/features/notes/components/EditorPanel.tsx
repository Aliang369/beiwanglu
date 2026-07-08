import { Clock, MoreHorizontal, Share2, Star, Trash2 } from 'lucide-react'
import type { Note } from '../../../shared/types/note'
import { formatUpdatedAt } from '../../../shared/notes/noteSelectors'
import { TagChip } from './TagChip'

interface EditorPanelProps {
  note: Note | undefined
  onChange: (patch: Partial<Pick<Note, 'title' | 'content'>>) => void
  onToggleFavorite: (noteId: string) => void
  onMoveToTrash: (noteId: string) => void
}

export function EditorPanel({ note, onChange, onToggleFavorite, onMoveToTrash }: EditorPanelProps) {
  if (!note) {
    return (
      <section className="hidden min-w-[360px] max-w-[480px] flex-1 items-center justify-center border-l border-outline-variant/40 bg-white px-margin-page text-body-md text-on-surface-variant lg:flex">
        选择或新建一篇笔记开始编辑
      </section>
    )
  }

  return (
    <section className="hidden min-w-[360px] max-w-[480px] flex-1 flex-col border-l border-outline-variant/40 bg-white lg:flex">
      <div className="flex h-16 items-center justify-between border-b border-outline-variant/30 px-gutter">
        <div className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
          <Clock className="size-4" />
          <span>{formatUpdatedAt(note.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <button
            type="button"
            onClick={() => onToggleFavorite(note.id)}
            className={`rounded-full p-2 transition-colors hover:bg-surface-container-low hover:text-primary ${note.isFavorite ? 'text-primary' : ''}`}
          >
            <Star className="size-5" fill={note.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button type="button" className="rounded-full p-2 transition-colors hover:bg-surface-container-low hover:text-primary">
            <Share2 className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => onMoveToTrash(note.id)}
            className="rounded-full p-2 transition-colors hover:bg-error-container/40 hover:text-error"
          >
            <Trash2 className="size-5" />
          </button>
          <button type="button" className="rounded-full p-2 transition-colors hover:bg-surface-container-low hover:text-primary">
            <MoreHorizontal className="size-5" />
          </button>
        </div>
      </div>

      <article className="min-h-0 flex-1 overflow-y-auto px-margin-page py-stack-lg">
        <div className="mb-stack-md flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>

        <input
          value={note.title}
          onChange={(event) => onChange({ title: event.target.value })}
          className="mb-stack-md w-full border-0 border-b border-outline-variant bg-transparent pb-3 font-headline-lg text-headline-lg text-on-surface transition-colors placeholder:text-on-surface-variant/60 focus:border-b-2 focus:border-primary focus:outline-none"
          placeholder="无标题笔记"
        />

        <textarea
          value={note.content}
          onChange={(event) => onChange({ content: event.target.value })}
          className="min-h-[520px] w-full resize-none border-0 bg-transparent font-body-lg text-body-lg text-on-surface caret-primary placeholder:text-on-surface-variant/60 focus:outline-none"
          placeholder="开始输入内容..."
        />
      </article>
    </section>
  )
}
