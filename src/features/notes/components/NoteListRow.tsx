// 改动：列表菜单封面操作改用 CoverDialog / ConfirmDialog；支持搜索高亮
import { CheckSquare, Copy, FileText, FolderInput, ImageOff, ImagePlus, Pin, Star, Trash2 } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import type { Note } from '../../../shared/types/note'
import { extractTextFromNoteContent } from '../../../shared/notes/noteDomain'
import { formatClockTime, formatUpdatedAt } from '../../../shared/notes/noteSelectors'
import { handleSelectableActivate, highlightSearchMatch, HoverActionMenu, SelectionCheckbox, SelectionTileIdle, type HoverMenuItem } from '../../../shared/ui'
import { ConfirmDialog } from './ConfirmDialog'
import { CoverDialog } from './CoverDialog'

interface NoteListRowProps {
  note: Note
  query?: string
  onSelect?: (noteId: string) => void
  onToggleFavorite?: (noteId: string) => void | Promise<void>
  onTogglePinned?: (noteId: string) => void | Promise<void>
  onMoveToTrash?: (noteId: string) => void | Promise<void>
  onRequestMoveToFolder?: (noteId: string) => void
  onDuplicate?: (noteId: string) => void | Promise<void>
  onSetCover?: (noteId: string, cover: string | null) => void
  selectionMode?: boolean
  selected?: boolean
  disabled?: boolean
  onToggleSelection?: (noteId: string) => void
  onStartSelection?: (noteId: string) => void
}

export function NoteListRow({
  note,
  query,
  onSelect,
  onToggleFavorite,
  onTogglePinned,
  onMoveToTrash,
  onRequestMoveToFolder,
  onDuplicate,
  onSetCover,
  selectionMode = false,
  selected = false,
  disabled = false,
  onToggleSelection,
  onStartSelection,
}: NoteListRowProps) {
  const primaryTag = note.tags[0]
  const [menuOpen, setMenuOpen] = useState(false)
  const [coverDialogOpen, setCoverDialogOpen] = useState(false)
  const [removeCoverOpen, setRemoveCoverOpen] = useState(false)
  const titleText = note.title || '未命名笔记'
  const previewText =
    note.excerpt || extractTextFromNoteContent(note.content || '') || '开始输入内容...'

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

  return (
    <article
      onClick={() =>
        handleSelectableActivate({
          disabled,
          selectionMode,
          onToggle: () => onToggleSelection?.(note.id),
          onActivate: () => onSelect?.(note.id),
        })
      }
      aria-disabled={disabled || undefined}
      aria-selected={selectionMode ? selected : undefined}
      className={`group relative flex items-center gap-4 rounded-xl border bg-surface-container-lowest p-4 transition-all duration-300 sm:gap-6 sm:p-5 ${
        disabled ? 'pointer-events-none cursor-not-allowed opacity-45' : 'cursor-pointer hover:border-primary-fixed-dim hover:shadow-lg'
      } ${menuOpen ? 'z-30' : 'z-0'} ${
        selected ? 'border-2 border-primary shadow-[0_4px_12px_rgba(0,66,117,0.08)] ring-1 ring-primary/20' : 'border-outline-variant'
      }`}
    >
      {selectionMode && !disabled ? (
        <SelectionCheckbox
          variant="tile"
          selected={selected}
          entityLabel="笔记"
          idleIcon={FileText}
          idleIconProps={{ className: 'size-5', strokeWidth: 1.8 }}
          onToggle={() => onToggleSelection?.(note.id)}
        />
      ) : (
        <SelectionTileIdle>
          <FileText className="size-5" strokeWidth={1.8} />
        </SelectionTileIdle>
      )}

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex min-w-0 items-center gap-1.5">
          {note.pinned ? <Pin className="size-4 shrink-0 text-primary" /> : null}
          <h3 className="truncate font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">
            {highlightSearchMatch(titleText, query)}
          </h3>
          {primaryTag ? <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">{primaryTag.name}</span> : null}
        </div>
        <p className="max-w-2xl truncate font-body-md text-body-md text-on-surface-variant">
          {highlightSearchMatch(previewText, query)}
        </p>
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
            hasCover={Boolean(note.cover)}
            isPinned={Boolean(note.pinned)}
            onSetCover={onSetCover ? () => setCoverDialogOpen(true) : undefined}
            onRemoveCover={onSetCover && note.cover ? () => setRemoveCoverOpen(true) : undefined}
            onTogglePinned={onTogglePinned ? () => void onTogglePinned(note.id) : undefined}
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
      {coverDialogOpen && onSetCover ? (
        <CoverDialog
          mode={note.cover ? 'change' : 'set'}
          initialUrl={note.cover}
          onClose={() => setCoverDialogOpen(false)}
          onSubmit={(url) => {
            onSetCover(note.id, url)
            setCoverDialogOpen(false)
          }}
        />
      ) : null}
      {removeCoverOpen && onSetCover ? (
        <ConfirmDialog
          isDestructive
          confirmLabel="移除封面"
          description={
            <>
              将移除「{titleText}」的封面图。
              <span className="mt-1 block">此操作不会删除笔记本身，可随时重新设置封面。</span>
            </>
          }
          onClose={() => setRemoveCoverOpen(false)}
          onConfirm={() => {
            onSetCover(note.id, null)
            setRemoveCoverOpen(false)
          }}
        />
      ) : null}
    </article>
  )
}

export function NoteListRowMoreControl({
  open,
  onOpenChange,
  hasCover = false,
  isPinned = false,
  onSetCover,
  onRemoveCover,
  onTogglePinned,
  onMoveToFolder,
  onStartSelection,
  onDuplicate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasCover?: boolean
  isPinned?: boolean
  onSetCover?: () => void
  onRemoveCover?: () => void
  onTogglePinned?: () => void
  onMoveToFolder?: () => void
  onStartSelection?: () => void
  onDuplicate?: () => void
}) {
  const items: HoverMenuItem[] = []

  if (onTogglePinned) {
    items.push({ key: 'pin', label: isPinned ? '取消置顶' : '置顶笔记', icon: Pin, onSelect: onTogglePinned })
  }
  if (onSetCover) {
    items.push({ key: 'cover-set', label: hasCover ? '更换封面' : '设置封面', icon: ImagePlus, onSelect: onSetCover })
  }
  if (onRemoveCover && hasCover) {
    items.push({ key: 'cover-remove', label: '移除封面', icon: ImageOff, onSelect: onRemoveCover })
  }
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
