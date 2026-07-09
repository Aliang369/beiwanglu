import { CheckSquare, Edit3, FolderInput, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FolderIcon } from '../../../shared/types/folder'
import { getFolderIcon } from '../../../shared/notes/folderIcons'
import { handleSelectableActivate, HoverActionMenu, SelectionCheckbox, type HoverMenuItem } from '../../../shared/ui'
import { DashedCreate } from './DashedCreate'

export interface FolderItem {
  id: string
  name: string
  noteCount: number
  childCount?: number
  visibleNoteCount?: number
  updatedLabel: string
  icon: FolderIcon
  parentId?: string | null
  protected?: boolean
}

interface FolderCardProps {
  folder: FolderItem
  selectionMode: boolean
  selected: boolean
  disabled?: boolean
  onToggle: (folderId: string) => void
  onStartSelection?: (folderId: string) => void
  onOpen?: (folderId: string) => void
  onRename?: (folderId: string) => void
  onMove?: (folderId: string) => void
  onDelete?: (folderId: string) => void
}

export function FolderCard({ folder, selectionMode, selected, disabled = false, onToggle, onStartSelection, onOpen, onRename, onMove, onDelete }: FolderCardProps) {
  const Icon = getFolderIcon(folder.icon)
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  const countLabel = (folder.childCount ?? 0) > 0
    ? `${folder.noteCount} 篇笔记 · ${folder.childCount} 个子文件夹`
    : `${folder.noteCount} 篇笔记`

  return (
    <div className={`group relative h-full ${menuOpen ? 'z-30' : 'z-0'} ${disabled ? 'pointer-events-none opacity-45' : ''}`}>
      <article
        onClick={() => {
          handleSelectableActivate({
            disabled,
            selectionMode,
            onToggle: () => onToggle(folder.id),
            onActivate: () => onOpen?.(folder.id),
          })
        }}
        aria-disabled={disabled || undefined}
        aria-selected={selectionMode ? selected : undefined}
        className={`flex h-full min-h-44 flex-col rounded-xl p-5 transition-all ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } ${
          selected
            ? 'border-2 border-primary bg-inverse-on-surface shadow-[0_4px_12px_rgba(0,66,117,0.08)] ring-1 ring-primary/20'
            : 'border border-outline-variant bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-primary-fixed-dim hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-lg transition-colors ${
              selected ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-primary group-hover:bg-primary-container group-hover:text-on-primary'
            }`}
          >
            <Icon className="size-6" />
          </div>
          {/* 与笔记卡片一致：预留右上角菜单/选择控件空间 */}
          <div className="size-8 shrink-0" />
        </div>

        <h3 className="mb-2 line-clamp-2 min-h-[2.75rem] font-headline-sm text-headline-sm text-on-surface">{folder.name}</h3>

        <div className={`mt-auto flex items-end justify-between gap-3 pt-4 ${selected ? 'text-primary' : 'text-on-surface-variant'}`}>
          <p className="min-w-0 flex-1 truncate font-label-sm text-label-sm opacity-90">{countLabel}</p>
          <p className="shrink-0 font-label-sm text-label-sm text-outline">{folder.updatedLabel}</p>
        </div>
      </article>

      {selectionMode && !disabled ? (
        <SelectionCheckbox
          variant="badge"
          selected={selected}
          entityLabel="文件夹"
          onToggle={() => onToggle(folder.id)}
        />
      ) : !selectionMode && !disabled ? (
        <div className="absolute top-3 right-3 z-50">
          <FolderMoreControl
            open={menuOpen}
            onToggle={setMenuOpen}
            onClose={closeMenu}
            protectedFolder={folder.protected}
            onStartSelection={onStartSelection ? () => onStartSelection(folder.id) : undefined}
            onRename={onRename ? () => onRename(folder.id) : undefined}
            onMove={onMove ? () => onMove(folder.id) : undefined}
            onDelete={onDelete ? () => onDelete(folder.id) : undefined}
          />
        </div>
      ) : null}
    </div>
  )
}

export function FolderMoreControl({
  open,
  onToggle,
  onClose,
  onStartSelection,
  onRename,
  onMove,
  onDelete,
  protectedFolder = false,
  variant = 'card',
}: {
  open: boolean
  onToggle: (open: boolean) => void
  onClose: () => void
  onStartSelection?: () => void
  onRename?: () => void
  onMove?: () => void
  onDelete?: () => void
  protectedFolder?: boolean
  variant?: 'card' | 'inline'
}) {
  void onClose
  const items: HoverMenuItem[] = [
    { key: 'rename', label: '重命名', icon: Edit3, hidden: !onRename, onSelect: () => onRename?.() },
    { key: 'move', label: '移动', icon: FolderInput, hidden: protectedFolder || !onMove, onSelect: () => onMove?.() },
    { key: 'multi', label: '多选', icon: CheckSquare, hidden: !onStartSelection, onSelect: () => onStartSelection?.() },
    { key: 'delete', label: '删除', icon: Trash2, danger: true, hidden: protectedFolder || !onDelete, onSelect: () => onDelete?.() },
  ]

  return (
    <HoverActionMenu
      open={open}
      onOpenChange={onToggle}
      items={items}
      triggerVariant={variant === 'inline' ? 'list' : 'always'}
    />
  )
}

export function AddFolderCard({ disabled = false, onClick, label = '新建文件夹' }: { disabled?: boolean; onClick?: () => void; label?: string }) {
  return <DashedCreate layout="card" label={label} disabled={disabled} onClick={onClick} />
}

export function EmptyFolderIcon() {
  const FolderIcon = getFolderIcon('folder')
  return (
    <div className="relative mb-8 flex size-32 items-center justify-center rounded-full bg-surface-container-low shadow-inner">
      <div className="absolute inset-0 animate-pulse rounded-full bg-primary/5" />
      <FolderIcon className="relative z-10 size-16 text-primary/40" fill="currentColor" />
    </div>
  )
}
