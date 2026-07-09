import { Check, CheckSquare, Copy, FileText, FolderInput, Star, Trash2 } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import type { Note } from '../../../shared/types/note'
import { formatClockTime, formatUpdatedAt } from '../../../shared/notes/noteSelectors'
import { HoverActionMenu, type HoverMenuItem } from '../../../shared/ui'

interface NoteListRowProps {
  note: Note
  onSelect?: (noteId: string) => void
  onToggleFavorite?: (noteId: string) => void | Promise<void>
  onMoveToTrash?: (noteId: string) => void | Promise<void>
  onRequestMoveToFolder?: (noteId: string) => void
  onDuplicate?: (noteId: string) => void | Promise<void>
  selectionMode?: boolean
  selected?: boolean
  disabled?: boolean
  onToggleSelection?: (noteId: string) => void
  onStartSelection?: (noteId: string) => void
}

export function NoteListRow({
  note,
  onSelect,
  onToggleFavorite,
  onMoveToTrash,
  onRequestMoveToFolder,
  onDuplicate,
  selectionMode = false,
  selected = false,
  disabled = false,
  onToggleSelection,
  onStartSelection,
}: NoteListRowProps) {
  const primaryTag = note.tags[0]
  const [menuOpen, setMenuOpen] = useState(false)

  function handleFavoriteClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (disabled) {
      return
    }
    void onToggleFavorite?.(note.id)
  }

  function handleMoveToTrashClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (disabled) {
      return
    }
    void onMoveToTrash?.(note.id)
  }

  function handleRowClick() {
    if (disabled) {
      return
    }

    if (selectionMode) {
      onToggleSelection?.(note.id)
      return
    }

    onSelect?.(note.id)
  }

  function handleSelectionClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (disabled) {
      return
    }
    onToggleSelection?.(note.id)
  }

  return (
    <article
      onClick={handleRowClick}
      aria-disabled={disabled || undefined}
      aria-selected={selectionMode ? selected : undefined}
      className={`group relative flex items-center gap-6 rounded-xl bg-white p-5 transition-all duration-300 ${
        disabled ? 'pointer-events-none cursor-not-allowed opacity-45' : 'cursor-pointer hover:border-primary-fixed-dim hover:shadow-lg'
      } ${menuOpen ? 'z-30' : 'z-0'} ${
        selected ? 'border-2 border-primary shadow-[0_4px_12px_rgba(0,66,117,0.08)] ring-1 ring-primary/20' : 'border border-outline-variant'
      }`}
    >
      {selectionMode && !disabled ? (
        <button
          type="button"
          onClick={handleSelectionClick}
          aria-label={selected ? '取消选择笔记' : '选择笔记'}
          aria-pressed={selected}
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${
            selected ? 'border-primary bg-primary text-on-primary shadow-sm' : 'border-outline-variant bg-surface-container-high text-on-surface-variant hover:border-primary hover:text-primary'
          }`}
        >
          {selected ? <Check className="size-5" /> : <FileText className="size-5" strokeWidth={1.8} />}
        </button>
      ) : (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-high text-primary shadow-sm">
          <FileText className="size-5" strokeWidth={1.8} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex min-w-0 items-center gap-3">
          <h3 className="truncate font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">{note.title || '未命名笔记'}</h3>
          {primaryTag ? <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">{primaryTag.name}</span> : null}
        </div>
        <p className="max-w-2xl truncate font-body-md text-body-md text-on-surface-variant">{note.excerpt || note.content || '开始输入内容...'}</p>
      </div>

      {!selectionMode && !disabled ? (
        <div className="ml-0 flex shrink-0 items-center gap-1 opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 lg:ml-4">
          {onToggleFavorite ? (
            <button type="button" onClick={handleFavoriteClick} aria-label={note.isFavorite ? '取消收藏' : '添加收藏'} aria-pressed={note.isFavorite} className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container hover:text-primary">
              <Star className="size-5" fill={note.isFavorite ? 'currentColor' : 'none'} />
            </button>
          ) : null}
          {onMoveToTrash ? (
            <button type="button" onClick={handleMoveToTrashClick} aria-label="删除" className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container hover:text-error">
              <Trash2 className="size-5" />
            </button>
          ) : null}
          <NoteListRowMoreControl
            open={menuOpen}
            onOpenChange={setMenuOpen}
            onMoveToFolder={onRequestMoveToFolder ? () => onRequestMoveToFolder(note.id) : undefined}
            onStartSelection={onStartSelection ? () => onStartSelection(note.id) : undefined}
            onDuplicate={onDuplicate ? () => void onDuplicate(note.id) : undefined}
          />
        </div>
      ) : null}

      <div className="hidden shrink-0 text-right sm:block">
        <p className="font-label-md text-label-md font-medium text-on-surface">{formatUpdatedAt(note.updatedAt)}</p>
        <p className="font-label-sm text-label-sm text-outline">修改于 {formatClockTime(note.updatedAt)}</p>
      </div>
    </article>
  )
}

export function NoteListRowMoreControl({
  open,
  onOpenChange,
  onMoveToFolder,
  onStartSelection,
  onDuplicate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMoveToFolder?: () => void
  onStartSelection?: () => void
  onDuplicate?: () => void
}) {
  const items: HoverMenuItem[] = []

  if (onMoveToFolder) {
    items.push({ key: 'move', label: '移动到文件夹', icon: FolderInput, onSelect: onMoveToFolder })
  }
  if (onStartSelection) {
    items.push({ key: 'multi', label: '多选', icon: CheckSquare, onSelect: onStartSelection })
  }
  if (onDuplicate) {
    items.push({ key: 'duplicate', label: '复制笔记', icon: Copy, onSelect: onDuplicate })
  }

  return <HoverActionMenu open={open} onOpenChange={onOpenChange} items={items} triggerVariant="list" menuWidthClassName="w-44" />
}
