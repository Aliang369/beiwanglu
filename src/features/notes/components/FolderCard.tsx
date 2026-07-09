import { BookOpen, BriefcaseBusiness, Check, CheckSquare, Edit3, Folder, FolderInput, Lightbulb, MoreVertical, Plane, Plus, ReceiptText, Trash2, Utensils } from 'lucide-react'
import { useState, type ComponentType, type MouseEvent } from 'react'

export interface FolderItem {
  id: string
  name: string
  noteCount: number
  updatedLabel: string
  icon: 'work' | 'study' | 'travel' | 'ideas' | 'recipes' | 'finance' | 'folder'
}

interface FolderCardProps {
  folder: FolderItem
  selectionMode: boolean
  selected: boolean
  onToggle: (folderId: string) => void
  onStartSelection?: (folderId: string) => void
  onOpen?: (folderId: string) => void
  onRename?: (folderId: string) => void
}

const folderIcons: Record<FolderItem['icon'], ComponentType<{ className?: string }>> = {
  work: BriefcaseBusiness,
  study: BookOpen,
  travel: Plane,
  ideas: Lightbulb,
  recipes: Utensils,
  finance: ReceiptText,
  folder: Folder,
}

export function FolderCard({ folder, selectionMode, selected, onToggle, onStartSelection, onOpen, onRename }: FolderCardProps) {
  const Icon = folderIcons[folder.icon]
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <article
      onClick={() => (selectionMode ? onToggle(folder.id) : onOpen?.(folder.id))}
      className={`group relative flex cursor-pointer flex-col rounded-xl p-5 transition-all ${menuOpen ? 'z-30' : 'z-0'} ${
        selected
          ? 'border-2 border-primary bg-inverse-on-surface shadow-[0_4px_12px_rgba(0,66,117,0.08)] ring-1 ring-primary/20'
          : 'border border-outline-variant bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-primary-fixed-dim hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]'
      }`}
    >
      {selectionMode ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggle(folder.id)
          }}
          className={`absolute right-4 top-4 z-10 flex size-6 items-center justify-center rounded-full transition-colors ${
            selected ? 'bg-primary text-on-primary shadow-sm' : 'border-2 border-outline-variant bg-surface group-hover:border-outline'
          }`}
        >
          {selected ? <Check className="size-4" /> : null}
        </button>
      ) : (
        <FolderMoreControl
          open={menuOpen}
          onToggle={setMenuOpen}
          onClose={closeMenu}
          onStartSelection={onStartSelection ? () => onStartSelection(folder.id) : undefined}
          onRename={onRename ? () => onRename(folder.id) : undefined}
        />
      )}

      <div
        className={`mb-4 flex size-12 items-center justify-center rounded-lg transition-colors ${
          selected ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-primary group-hover:bg-primary-container group-hover:text-on-primary'
        }`}
      >
        <Icon className="size-6" />
      </div>
      <h3 className="mb-1 truncate pr-8 font-headline-sm text-headline-sm text-on-surface">{folder.name}</h3>
      <p className={`font-label-sm text-label-sm ${selected ? 'text-primary opacity-80' : 'text-on-surface-variant'}`}>
        {folder.noteCount} 篇笔记 · {folder.updatedLabel}
      </p>
    </article>
  )
}

export function FolderMoreControl({
  open,
  onToggle,
  onClose,
  onStartSelection,
  onRename,
  variant = 'card',
}: {
  open: boolean
  onToggle: (open: boolean) => void
  onClose: () => void
  onStartSelection?: () => void
  onRename?: () => void
  variant?: 'card' | 'inline'
}) {
  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onToggle(!open)
  }

  return (
    <div
      className={`z-30 w-max ${variant === 'card' ? 'absolute right-4 top-4' : 'relative'}`}
      onClick={(event) => event.stopPropagation()}
      onMouseEnter={() => onToggle(true)}
      onMouseLeave={() => onToggle(false)}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={`flex size-8 items-center justify-center rounded-full text-on-surface-variant transition-all hover:bg-surface-container-highest hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed ${
          open ? 'bg-surface-container-highest text-on-surface' : ''
        }`}
      >
        <MoreVertical className="size-4" />
      </button>
      <FolderActionMenu open={open} onClose={onClose} onStartSelection={onStartSelection} onRename={onRename} />
    </div>
  )
}

function FolderActionMenu({
  open,
  onClose,
  onStartSelection,
  onRename,
}: {
  open: boolean
  onClose: () => void
  onStartSelection?: () => void
  onRename?: () => void
}) {
  function handleItemClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onClose()
  }

  function handleRename(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onRename?.()
    onClose()
  }

  function handleStartSelection(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onStartSelection?.()
    onClose()
  }

  return (
    <div
      className={`absolute right-0 top-full z-40 pt-2 transition-all duration-150 ${
        open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
      }`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="w-48 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-2 shadow-lg">
        <button type="button" onClick={handleRename} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low">
          <Edit3 className="size-4 text-on-surface-variant" />
          <span>重命名</span>
        </button>
        <button type="button" onClick={handleItemClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low">
          <FolderInput className="size-4 text-on-surface-variant" />
          <span>移动</span>
        </button>
        <button type="button" onClick={handleStartSelection} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low">
          <CheckSquare className="size-4 text-on-surface-variant" />
          <span>多选</span>
        </button>
        <div className="my-1 border-t border-outline-variant/30" />
        <button type="button" onClick={handleItemClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-label-md text-error transition-colors hover:bg-error-container/30">
          <Trash2 className="size-4" />
          <span>删除</span>
        </button>
      </div>
    </div>
  )
}

export function AddFolderCard({ disabled = false, onClick }: { disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-all ${
        disabled
          ? 'cursor-not-allowed border-outline-variant bg-surface opacity-50 text-outline'
          : 'cursor-pointer border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:bg-surface-container-low hover:text-primary'
      }`}
    >
      <div className={`mb-3 flex size-12 items-center justify-center rounded-full ${disabled ? 'bg-surface-container' : 'bg-surface-container-highest'}`}>
        <Plus className="size-6" />
      </div>
      <span className="font-label-md text-label-md">新建文件夹</span>
    </button>
  )
}

export function EmptyFolderIcon() {
  return (
    <div className="relative mb-8 flex size-32 items-center justify-center rounded-full bg-surface-container-low shadow-inner">
      <div className="absolute inset-0 animate-pulse rounded-full bg-primary/5" />
      <Folder className="relative z-10 size-16 text-primary/40" fill="currentColor" />
    </div>
  )
}
