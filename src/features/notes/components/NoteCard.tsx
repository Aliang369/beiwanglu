import { Check, CheckSquare, Copy, FolderInput, Image, MoreVertical, Star, Trash2 } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import type { Note } from '../../../shared/types/note'
import { formatUpdatedAt } from '../../../shared/notes/noteSelectors'

interface NoteCardProps {
  note: Note
  featured?: boolean
  visual?: boolean
  onSelect?: (noteId: string) => void
  onToggleFavorite?: (noteId: string) => void
  onMoveToTrash?: (noteId: string) => void
  onRequestMoveToFolder?: (noteId: string) => void
  onDuplicate?: (noteId: string) => void
  selectionMode?: boolean
  selected?: boolean
  onToggleSelection?: (noteId: string) => void
  onStartSelection?: (noteId: string) => void
}

export function NoteCard({ note, featured = false, visual = false, onSelect, onToggleFavorite, onMoveToTrash, onRequestMoveToFolder, onDuplicate, selectionMode = false, selected = false, onToggleSelection, onStartSelection }: NoteCardProps) {
  const primaryTag = note.tags[0]
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  function handleCardClick() {
    if (selectionMode) {
      onToggleSelection?.(note.id)
      return
    }

    onSelect?.(note.id)
  }

  function handleSelectionClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onToggleSelection?.(note.id)
  }

  const selectionControl = selectionMode ? (
    <button
      type="button"
      onClick={handleSelectionClick}
      aria-label={selected ? '取消选择笔记' : '选择笔记'}
      aria-pressed={selected}
      className={`absolute top-3 right-3 z-50 flex size-8 items-center justify-center rounded-full transition-colors ${
        selected ? 'bg-primary text-on-primary shadow-sm' : 'border-2 border-outline-variant bg-surface-container-lowest/85 text-on-surface-variant backdrop-blur-md hover:border-primary hover:text-primary'
      }`}
    >
      {selected ? <Check className="size-4" /> : null}
    </button>
  ) : null

  const cardMoreControl = selectionMode ? null : (
    <CardMoreControl
      note={note}
      open={menuOpen}
      onToggle={setMenuOpen}
      onClose={closeMenu}
      onToggleFavorite={onToggleFavorite}
      onMoveToTrash={onMoveToTrash}
      onRequestMoveToFolder={onRequestMoveToFolder}
      onDuplicate={onDuplicate}
      onStartSelection={onStartSelection ? () => onStartSelection(note.id) : undefined}
    />
  )

  if (visual) {
    return (
      <div className={`group relative ${menuOpen ? 'z-50' : 'z-0'}`}>
        <article
          onClick={handleCardClick}
          aria-selected={selectionMode ? selected : undefined}
          className={`group flex cursor-pointer flex-col overflow-hidden rounded-xl bg-surface-bright transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card ${
            selected ? 'border-2 border-primary shadow-[0_4px_12px_rgba(0,66,117,0.08)] ring-1 ring-primary/20' : 'border border-outline-variant/50'
          }`}
        >
          <div className="relative h-32 w-full overflow-hidden rounded-t-xl bg-surface-container-low">
            <img src="https://placewaifu.com/image/800/450" alt="设计灵感收集封面" className="h-full w-full object-cover" />
            <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardPrimaryTag tag={primaryTag} />
              </div>
              <div className="size-8 shrink-0" />
            </div>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <h3 className="mb-2 line-clamp-1 font-headline-sm text-headline-sm text-on-surface">{note.title || '未命名笔记'}</h3>
            <p className="mb-4 line-clamp-2 flex-1 font-body-md text-body-md text-on-surface-variant">
              {note.excerpt || note.content || '开始输入内容...'}
            </p>
            <div className="mt-auto flex items-center justify-between">
              <Image className="size-4 text-outline" />
              <span className="font-label-sm text-label-sm text-outline">{formatUpdatedAt(note.updatedAt)}</span>
            </div>
          </div>
        </article>
        {selectionMode ? selectionControl : cardMoreControl}
      </div>
    )
  }

  return (
    <div className={`group relative ${menuOpen ? 'z-50' : 'z-0'} ${featured ? 'col-span-1 row-span-2 md:col-span-2' : ''}`}>
      <article
        onClick={handleCardClick}
        aria-selected={selectionMode ? selected : undefined}
        className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl bg-surface-bright transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card ${
        featured ? 'p-6' : 'p-5'
      } ${selected ? 'border-2 border-primary shadow-[0_4px_12px_rgba(0,66,117,0.08)] ring-1 ring-primary/20' : 'border border-outline-variant/50'}`}
      >
        {featured ? (
          <div className="absolute top-0 right-0 size-32 rounded-bl-full bg-primary-container/10 transition-transform group-hover:scale-110" />
        ) : null}
        <div className={`relative z-10 flex items-start justify-between gap-3 ${featured ? 'mb-4' : 'mb-3'}`}>
          <div className="min-w-0 flex-1">
            <CardPrimaryTag tag={primaryTag} />
          </div>
          <div className="size-8 shrink-0" />
        </div>
        <h3 className={`relative z-10 line-clamp-1 text-on-surface ${featured ? 'mb-3 font-headline-md text-headline-md' : 'mb-2 font-headline-sm text-headline-sm'}`}>
          {note.title || '未命名笔记'}
        </h3>
        <p
          className={`relative z-10 flex-1 whitespace-pre-line font-body-md text-body-md text-on-surface-variant ${
            featured ? 'mb-6 line-clamp-3' : 'mb-4 line-clamp-2'
          }`}
        >
          {note.excerpt || note.content || '开始输入内容...'}
        </p>
        <div className={`relative z-10 mt-auto flex items-center justify-end gap-3 ${featured ? 'border-t border-outline-variant/20 pt-4' : ''}`}>
          <span className="font-label-sm text-label-sm text-outline">{formatUpdatedAt(note.updatedAt)}</span>
        </div>
      </article>
      {selectionMode ? selectionControl : cardMoreControl}
    </div>
  )
}

function CardPrimaryTag({ tag }: { tag?: Note['tags'][number] }) {
  if (!tag) {
    return null
  }

  return (
    <span className="inline-block max-w-[120px] truncate rounded-full border border-white/50 bg-surface-container-lowest/85 px-2.5 py-1 font-label-sm text-label-sm text-primary shadow-sm backdrop-blur-md">
      {tag.name}
    </span>
  )
}

function CardMoreControl({ note, open, onToggle, onClose, onToggleFavorite, onMoveToTrash, onRequestMoveToFolder, onDuplicate, onStartSelection }: { note: Note; open: boolean; onToggle: (open: boolean) => void; onClose: () => void; onToggleFavorite?: (noteId: string) => void; onMoveToTrash?: (noteId: string) => void; onRequestMoveToFolder?: (noteId: string) => void; onDuplicate?: (noteId: string) => void; onStartSelection?: () => void }) {
  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onToggle(!open)
  }

  return (
    <div
      className="absolute top-3 right-3 z-50 w-max"
      onClick={(event) => event.stopPropagation()}
      onMouseEnter={() => onToggle(true)}
      onMouseLeave={() => onToggle(false)}
    >
      <CardMoreButton open={open} onClick={handleToggle} />
      <CardActionMenu note={note} open={open} onClose={onClose} onToggleFavorite={onToggleFavorite} onMoveToTrash={onMoveToTrash} onRequestMoveToFolder={onRequestMoveToFolder} onDuplicate={onDuplicate} onStartSelection={onStartSelection} />
    </div>
  )
}

function CardMoreButton({ open, onClick }: { open: boolean; onClick: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex size-8 shrink-0 items-center justify-center rounded-full border border-white/40 bg-surface-container-lowest/60 text-on-surface-variant shadow-sm backdrop-blur-md transition-all hover:bg-surface-container-lowest/85 hover:text-primary focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-fixed group-hover:opacity-100 ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <MoreVertical className="size-5" />
    </button>
  )
}

function CardActionMenu({ note, open, onClose, onToggleFavorite, onMoveToTrash, onRequestMoveToFolder, onDuplicate, onStartSelection }: { note: Note; open: boolean; onClose: () => void; onToggleFavorite?: (noteId: string) => void; onMoveToTrash?: (noteId: string) => void; onRequestMoveToFolder?: (noteId: string) => void; onDuplicate?: (noteId: string) => void; onStartSelection?: () => void }) {
  function handleFavoriteClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onToggleFavorite?.(note.id)
    onClose()
  }

  function handleMoveToFolderClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onRequestMoveToFolder?.(note.id)
    onClose()
  }

  function handleStartSelectionClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onStartSelection?.()
    onClose()
  }

  function handleDuplicateClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onDuplicate?.(note.id)
    onClose()
  }

  function handleMoveToTrashClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onMoveToTrash?.(note.id)
    onClose()
  }

  return (
    <div
      className={`absolute top-full right-0 pt-2 transition-all duration-150 ${
        open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
      }`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="w-48 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-2 shadow-lg">
        {onToggleFavorite ? (
          <button type="button" onClick={handleFavoriteClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low">
            <Star className="size-4" fill={note.isFavorite ? 'currentColor' : 'none'} />
            <span>{note.isFavorite ? '取消收藏' : '添加收藏'}</span>
          </button>
        ) : null}
        <button type="button" onClick={handleMoveToFolderClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low">
          <FolderInput className="size-4" />
          <span>移动到文件夹</span>
        </button>
        <button type="button" onClick={handleStartSelectionClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low">
          <CheckSquare className="size-4" />
          <span>多选</span>
        </button>
        <button type="button" onClick={handleDuplicateClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low">
          <Copy className="size-4" />
          <span>复制笔记</span>
        </button>
        <div className="my-1 border-t border-outline-variant/30" />
        <button type="button" onClick={handleMoveToTrashClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-label-md text-error transition-colors hover:bg-error-container/30">
          <Trash2 className="size-4" />
          <span>删除</span>
        </button>
      </div>
    </div>
  )
}
