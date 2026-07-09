import { BookOpen, BriefcaseBusiness, Check, Folder, Lightbulb, Plane, Plus, ReceiptText, Utensils } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import type { FolderIcon } from '../../../shared/types/folder'
import { FolderMoreControl, type FolderItem } from './FolderCard'

interface FolderListItemProps {
  folder: FolderItem
  selectionMode?: boolean
  selected?: boolean
  onToggle?: (folderId: string) => void
  onOpen?: (folderId: string) => void
  onStartSelection?: (folderId: string) => void
  onRename?: (folderId: string) => void
  onMove?: (folderId: string) => void
  onDelete?: (folderId: string) => void
}

const folderIcons: Record<FolderIcon, ComponentType<{ className?: string }>> = {
  work: BriefcaseBusiness,
  study: BookOpen,
  travel: Plane,
  ideas: Lightbulb,
  recipes: Utensils,
  finance: ReceiptText,
  folder: Folder,
}

export function FolderListItem({
  folder,
  selectionMode = false,
  selected = false,
  onToggle,
  onOpen,
  onStartSelection,
  onRename,
  onMove,
  onDelete,
}: FolderListItemProps) {
  const Icon = folderIcons[folder.icon]
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  function handleClick() {
    if (selectionMode) {
      onToggle?.(folder.id)
      return
    }
    onOpen?.(folder.id)
  }

  const metaParts = [`${folder.noteCount} 篇笔记`]
  if ((folder.childCount ?? 0) > 0) {
    metaParts.push(`${folder.childCount} 个子文件夹`)
  }
  metaParts.push(folder.updatedLabel)

  return (
    <article
      onClick={handleClick}
      aria-selected={selectionMode ? selected : undefined}
      className={`group relative flex cursor-pointer items-center gap-6 rounded-xl bg-white p-5 transition-all duration-300 hover:border-primary-fixed-dim hover:shadow-lg ${menuOpen ? 'z-30' : 'z-0'} ${
        selected ? 'border-2 border-primary shadow-[0_4px_12px_rgba(0,66,117,0.08)] ring-1 ring-primary/20' : 'border border-outline-variant'
      }`}
    >
      {selectionMode ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggle?.(folder.id)
          }}
          aria-label={selected ? '取消选择文件夹' : '选择文件夹'}
          aria-pressed={selected}
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${
            selected ? 'border-primary bg-primary text-on-primary shadow-sm' : 'border-outline-variant bg-surface-container-high text-on-surface-variant hover:border-primary hover:text-primary'
          }`}
        >
          {selected ? <Check className="size-5" /> : <Icon className="size-5" />}
        </button>
      ) : (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-highest text-primary transition-colors group-hover:bg-primary-container group-hover:text-on-primary">
          <Icon className="size-6" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="mb-1 truncate font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">{folder.name}</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">{metaParts.join(' · ')}</p>
      </div>

      {!selectionMode ? (
        <div className="shrink-0">
          <FolderMoreControl
            open={menuOpen}
            onToggle={setMenuOpen}
            onClose={closeMenu}
            protectedFolder={folder.protected}
            onStartSelection={onStartSelection ? () => onStartSelection(folder.id) : undefined}
            onRename={onRename ? () => onRename(folder.id) : undefined}
            onMove={onMove ? () => onMove(folder.id) : undefined}
            onDelete={onDelete ? () => onDelete(folder.id) : undefined}
            variant="inline"
          />
        </div>
      ) : null}
    </article>
  )
}

export function AddFolderListItem({ onClick, label = '新建文件夹' }: { onClick?: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant/50 bg-surface-container-lowest p-5 text-primary transition-colors duration-300 hover:border-primary hover:bg-surface-container-low active:scale-[0.99]"
    >
      <Plus className="size-6 opacity-70" />
      <span className="font-label-md text-label-md">{label}</span>
    </button>
  )
}
