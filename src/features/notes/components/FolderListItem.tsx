import { BookOpen, BriefcaseBusiness, Folder, Lightbulb, Plane, Plus, ReceiptText, Utensils } from 'lucide-react'
import { useState } from 'react'
import type { ComponentType } from 'react'
import { FolderMoreControl, type FolderItem } from './FolderCard'

interface FolderListItemProps {
  folder: FolderItem
  onOpen?: (folderId: string) => void
  onStartSelection?: (folderId: string) => void
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

export function FolderListItem({ folder, onOpen, onStartSelection }: FolderListItemProps) {
  const Icon = folderIcons[folder.icon]
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <article onClick={() => onOpen?.(folder.id)} className={`group relative flex cursor-pointer items-center gap-6 rounded-xl border border-outline-variant bg-white p-5 transition-all duration-300 hover:border-primary-fixed-dim hover:shadow-lg ${menuOpen ? 'z-30' : 'z-0'}`}>
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-highest text-primary transition-colors group-hover:bg-primary-container group-hover:text-on-primary">
        <Icon className="size-6" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="mb-1 truncate font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">{folder.name}</h3>
        <p className="font-body-md text-body-md text-on-surface-variant">{folder.noteCount} 篇笔记 · {folder.updatedLabel}</p>
      </div>

      <div className="shrink-0">
        <FolderMoreControl
          open={menuOpen}
          onToggle={setMenuOpen}
          onClose={closeMenu}
          onStartSelection={onStartSelection ? () => onStartSelection(folder.id) : undefined}
          variant="inline"
        />
      </div>
    </article>
  )
}

export function AddFolderListItem({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant/50 bg-surface-container-lowest p-5 text-primary transition-colors duration-300 hover:border-primary hover:bg-surface-container-low active:scale-[0.99]"
    >
      <Plus className="size-6 opacity-70" />
      <span className="font-label-md text-label-md">新建文件夹</span>
    </button>
  )
}
