import { Check } from 'lucide-react'
import { useState } from 'react'
import { getFolderIcon } from '../../../shared/notes/folderIcons'
import { DashedCreate } from './DashedCreate'
import { FolderMoreControl, type FolderItem } from './FolderCard'

interface FolderListItemProps {
  folder: FolderItem
  selectionMode?: boolean
  selected?: boolean
  disabled?: boolean
  onToggle?: (folderId: string) => void
  onOpen?: (folderId: string) => void
  onStartSelection?: (folderId: string) => void
  onRename?: (folderId: string) => void
  onMove?: (folderId: string) => void
  onDelete?: (folderId: string) => void
}

export function FolderListItem({
  folder,
  selectionMode = false,
  selected = false,
  disabled = false,
  onToggle,
  onOpen,
  onStartSelection,
  onRename,
  onMove,
  onDelete,
}: FolderListItemProps) {
  const Icon = getFolderIcon(folder.icon)
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  function handleClick() {
    if (disabled) {
      return
    }

    if (selectionMode) {
      onToggle?.(folder.id)
      return
    }
    onOpen?.(folder.id)
  }

  const countLabel = (folder.childCount ?? 0) > 0
    ? `${folder.noteCount} 篇笔记 · ${folder.childCount} 个子文件夹`
    : `${folder.noteCount} 篇笔记`

  return (
    <article
      onClick={handleClick}
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
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-high text-primary shadow-sm">
          <Icon className="size-6" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">{folder.name}</h3>
      </div>

      {!selectionMode && !disabled ? (
        <div className="ml-0 flex shrink-0 items-center gap-1 opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 lg:ml-4">
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

      <div className="hidden shrink-0 text-right sm:block">
        <p className="font-label-md text-label-md font-medium text-on-surface">{folder.updatedLabel}</p>
        <p className="font-label-sm text-label-sm text-outline">{countLabel}</p>
      </div>
    </article>
  )
}

export function AddFolderListItem({ onClick, label = '新建文件夹' }: { onClick?: () => void; label?: string }) {
  return <DashedCreate layout="list" label={label} onClick={onClick} />
}
