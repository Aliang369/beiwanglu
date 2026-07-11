import { useState } from 'react'
import { getFolderIcon } from '../../../shared/notes/folderIcons'
import { handleSelectableActivate, SelectionCheckbox, SelectionTileIdle } from '../../../shared/ui'
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

  function handleClick() {
    handleSelectableActivate({
      disabled,
      selectionMode,
      onToggle: () => onToggle?.(folder.id),
      onActivate: () => onOpen?.(folder.id),
    })
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
        <SelectionCheckbox
          variant="tile"
          selected={selected}
          entityLabel="文件夹"
          idleIcon={Icon}
          onToggle={() => onToggle?.(folder.id)}
        />
      ) : (
        <SelectionTileIdle>
          <Icon className="size-6" />
        </SelectionTileIdle>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">{folder.name}</h3>
      </div>

      {!selectionMode && !disabled ? (
        <div className="ml-0 flex shrink-0 items-center gap-1 opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 lg:ml-4">
          <FolderMoreControl
            open={menuOpen}
            onToggle={setMenuOpen}
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
