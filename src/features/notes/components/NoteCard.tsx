import { CheckSquare, Copy, FolderInput, ImageOff, ImagePlus, Pin, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Note } from '../../../shared/types/note'
import { formatUpdatedAt } from '../../../shared/notes/noteSelectors'
import { handleSelectableActivate, HoverActionMenu, SelectionCheckbox, type HoverMenuItem } from '../../../shared/ui'
import { ConfirmDialog } from './ConfirmDialog'
import { CoverDialog } from './CoverDialog'
import { NoteCardShell } from './NoteCardShell'

interface NoteCardProps {
  note: Note
  featured?: boolean
  query?: string
  onSelect?: (noteId: string) => void
  onToggleFavorite?: (noteId: string) => void
  onTogglePinned?: (noteId: string) => void
  onMoveToTrash?: (noteId: string) => void
  onRequestMoveToFolder?: (noteId: string) => void
  onDuplicate?: (noteId: string) => void
  onSetCover?: (noteId: string, cover: string | null) => void
  selectionMode?: boolean
  selected?: boolean
  disabled?: boolean
  onToggleSelection?: (noteId: string) => void
  onStartSelection?: (noteId: string) => void
}

export function NoteCard({
  note,
  featured = false,
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
}: NoteCardProps) {
  const primaryTag = note.tags[0]?.name
  const [menuOpen, setMenuOpen] = useState(false)
  const [coverDialogOpen, setCoverDialogOpen] = useState(false)
  const [removeCoverOpen, setRemoveCoverOpen] = useState(false)
  const hasCover = Boolean(note.cover)
  const updatedLabel = formatUpdatedAt(note.updatedAt)

  function handleCardClick() {
    handleSelectableActivate({
      disabled,
      selectionMode,
      onToggle: () => onToggleSelection?.(note.id),
      onActivate: () => onSelect?.(note.id),
    })
  }

  const selectionControl =
    selectionMode && !disabled ? (
      <SelectionCheckbox
        variant="badge"
        selected={selected}
        entityLabel="笔记"
        onToggle={() => onToggleSelection?.(note.id)}
      />
    ) : null

  const cardMoreControl = selectionMode || disabled ? null : (
    <CardMoreControl
      note={note}
      open={menuOpen}
      onToggle={setMenuOpen}
      onToggleFavorite={onToggleFavorite}
      onTogglePinned={onTogglePinned}
      onMoveToTrash={onMoveToTrash}
      onRequestMoveToFolder={onRequestMoveToFolder}
      onDuplicate={onDuplicate}
      onOpenCoverDialog={onSetCover ? () => setCoverDialogOpen(true) : undefined}
      onOpenRemoveCover={onSetCover && hasCover ? () => setRemoveCoverOpen(true) : undefined}
      onStartSelection={onStartSelection ? () => onStartSelection(note.id) : undefined}
    />
  )

  const dialogs = (
    <>
      {coverDialogOpen && onSetCover ? (
        <CoverDialog
          mode={hasCover ? 'change' : 'set'}
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
              将移除「{note.title || '未命名笔记'}」的封面图。
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
    </>
  )

  return (
    <NoteCardShell
      note={note}
      featured={featured}
      query={query}
      primaryTag={primaryTag}
      updatedLabel={updatedLabel}
      onActivate={handleCardClick}
      cornerSlot={selectionMode ? selectionControl : cardMoreControl}
      trailing={dialogs}
      variant="note"
      selected={selected}
      disabled={disabled}
      selectionMode={selectionMode}
      elevated={menuOpen}
    />
  )
}

function CardMoreControl({
  note,
  open,
  onToggle,
  onToggleFavorite,
  onTogglePinned,
  onMoveToTrash,
  onRequestMoveToFolder,
  onDuplicate,
  onOpenCoverDialog,
  onOpenRemoveCover,
  onStartSelection,
}: {
  note: Note
  open: boolean
  onToggle: (open: boolean) => void
  onToggleFavorite?: (noteId: string) => void
  onTogglePinned?: (noteId: string) => void
  onMoveToTrash?: (noteId: string) => void
  onRequestMoveToFolder?: (noteId: string) => void
  onDuplicate?: (noteId: string) => void
  onOpenCoverDialog?: () => void
  onOpenRemoveCover?: () => void
  onStartSelection?: () => void
}) {
  const hasCover = Boolean(note.cover)

  const items: HoverMenuItem[] = [
    {
      key: 'favorite',
      label: note.isFavorite ? '取消收藏' : '添加收藏',
      icon: Star,
      iconFill: note.isFavorite ? 'currentColor' : 'none',
      hidden: !onToggleFavorite,
      onSelect: () => onToggleFavorite?.(note.id),
    },
    {
      key: 'pin',
      label: note.pinned ? '取消置顶' : '置顶笔记',
      icon: Pin,
      hidden: !onTogglePinned,
      onSelect: () => onTogglePinned?.(note.id),
    },
    {
      key: 'cover-set',
      label: hasCover ? '更换封面' : '设置封面',
      icon: ImagePlus,
      hidden: !onOpenCoverDialog,
      onSelect: () => onOpenCoverDialog?.(),
    },
    {
      key: 'cover-remove',
      label: '移除封面',
      icon: ImageOff,
      hidden: !onOpenRemoveCover,
      onSelect: () => onOpenRemoveCover?.(),
    },
    {
      key: 'move',
      label: '移动到文件夹',
      icon: FolderInput,
      hidden: !onRequestMoveToFolder,
      onSelect: () => onRequestMoveToFolder?.(note.id),
    },
    {
      key: 'multi',
      label: '多选',
      icon: CheckSquare,
      hidden: !onStartSelection,
      onSelect: () => onStartSelection?.(),
    },
    {
      key: 'duplicate',
      label: '复制笔记',
      icon: Copy,
      hidden: !onDuplicate,
      onSelect: () => onDuplicate?.(note.id),
    },
    {
      key: 'trash',
      label: '删除',
      icon: Trash2,
      danger: true,
      hidden: !onMoveToTrash,
      onSelect: () => onMoveToTrash?.(note.id),
    },
  ]

  return (
    <div className="absolute top-3 right-3 z-50">
      <HoverActionMenu open={open} onOpenChange={onToggle} items={items} triggerVariant="card" />
    </div>
  )
}
