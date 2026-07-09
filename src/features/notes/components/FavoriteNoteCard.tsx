import { CheckCircle2, Circle, Image, Star, UsersRound } from 'lucide-react'
import type { Note } from '../../../shared/types/note'
import { formatUpdatedAt, getNoteTagNames } from '../../../shared/notes/noteSelectors'

interface FavoriteNoteCardProps {
  note: Note
  variant?: 'featured' | 'gradient' | 'checklist' | 'default'
  onSelect?: (noteId: string) => void
}

function FavoriteTag({ children }: { children: string }) {
  return <span className="inline-block max-w-[120px] truncate rounded-full bg-surface-container-lowest/85 px-2.5 py-1 font-label-sm text-label-sm text-primary shadow-sm backdrop-blur-md">{children}</span>
}

export function FavoriteNoteCard({ note, variant = 'default', onSelect }: FavoriteNoteCardProps) {
  const tags = getNoteTagNames(note, ['收藏'])
  const primaryTag = tags[0]
  const updatedAt = formatUpdatedAt(note.updatedAt)

  if (variant === 'featured') {
    return (
      <article onClick={() => onSelect?.(note.id)} className="group relative col-span-1 row-span-2 flex cursor-pointer flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest transition-all duration-300 hover:shadow-card md:col-span-2">
        <div className="relative h-48 w-full overflow-hidden bg-surface-container-low">
          <img src="https://placewaifu.com/image/800/450" alt="收藏笔记封面" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {primaryTag ? (
            <div className="absolute left-3 top-3 z-10">
              <FavoriteTag>{primaryTag}</FavoriteTag>
            </div>
          ) : null}
          <div className="absolute right-4 top-4 z-10 rounded-full bg-surface/80 p-1.5 text-primary shadow-sm backdrop-blur-sm">
            <Star className="size-5" fill="currentColor" />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="mb-2 font-headline-md text-headline-md text-on-surface transition-colors group-hover:text-primary">
            {note.title || '未命名笔记'}
          </h3>
          <p className="mb-6 line-clamp-3 font-body-md text-body-md text-on-surface-variant">{note.excerpt || note.content}</p>
          <div className="mt-auto flex items-center justify-between border-t border-outline-variant/10 pt-4 font-label-sm text-label-sm text-on-surface-variant">
            <Image className="size-4 text-outline" />
            <span className="ml-auto text-outline">{updatedAt}</span>
          </div>
        </div>
      </article>
    )
  }

  if (variant === 'checklist') {
    return (
      <article onClick={() => onSelect?.(note.id)} className="group relative col-span-1 flex cursor-pointer flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 transition-all duration-300 hover:shadow-card">
        <Star className="absolute right-5 top-5 z-10 size-5 text-primary" fill="currentColor" />
        <div className="mb-3 flex gap-2 pr-8">
          {primaryTag ? <FavoriteTag>{primaryTag}</FavoriteTag> : null}
        </div>
        <h3 className="mb-2 font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">
          {note.title || '未命名笔记'}
        </h3>
        <ul className="mb-4 flex-1 space-y-1 font-body-md text-body-md text-on-surface-variant">
          <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> 悉达多</li>
          <li className="flex items-center gap-2"><Circle className="size-4 text-outline-variant" /> 设计心理学</li>
          <li className="flex items-center gap-2"><Circle className="size-4 text-outline-variant" /> 心流</li>
        </ul>
        <div className="mt-auto flex justify-end border-t border-outline-variant/10 pt-3">
          <span className="font-label-sm text-label-sm text-outline">{updatedAt}</span>
        </div>
      </article>
    )
  }

  return (
    <article
      onClick={() => onSelect?.(note.id)}
      className={`group relative col-span-1 flex cursor-pointer flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 transition-all duration-300 hover:shadow-card ${
        variant === 'gradient' ? 'bg-gradient-to-br from-surface-container-lowest to-surface-container-low' : ''
      }`}
    >
      <Star className="absolute right-5 top-5 z-10 size-5 text-primary" fill="currentColor" />
      <div className="mb-3 flex flex-wrap gap-2 pr-8">
        {primaryTag ? <FavoriteTag>{primaryTag}</FavoriteTag> : null}
      </div>
      <h3 className="mb-2 font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">
        {note.title || '未命名笔记'}
      </h3>
      <p className="mb-4 line-clamp-4 flex-1 font-body-md text-body-md text-on-surface-variant">{note.excerpt || note.content}</p>
      <div className="mt-auto flex items-center justify-between border-t border-outline-variant/10 pt-3">
        {variant === 'gradient' ? (
          <div className="flex -space-x-2">
            <div className="flex size-6 items-center justify-center rounded-full border-2 border-surface bg-primary/20 text-[10px] font-bold text-primary">A</div>
            <div className="flex size-6 items-center justify-center rounded-full border-2 border-surface bg-secondary/20 text-[10px] font-bold text-secondary">B</div>
          </div>
        ) : null}
        {variant === 'default' ? <UsersRound className="hidden size-4 text-outline" /> : null}
        <span className="ml-auto font-label-sm text-label-sm text-outline">{updatedAt}</span>
      </div>
    </article>
  )
}
