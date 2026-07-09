import { useMemo, useState } from 'react'
import { ArrowLeft, FileText, SearchX, Star, Tags, Trash2 } from 'lucide-react'
import type { Folder } from '../../../shared/types/folder'
import { isProtectedFolderId } from '../../../shared/types/folder'
import type { Note } from '../../../shared/types/note'
import { canMoveFolder, getValidMoveTargets } from '../../../shared/notes/folderDomain'
import { formatUpdatedAt } from '../../../shared/notes/noteSelectors'
import { ConfirmDialog } from './ConfirmDialog'
import { CreateFolderDialog } from './CreateFolderDialog'
import { EmptyState } from './EmptyState'
import { AddFolderListItem, FolderListItem } from './FolderListItem'
import { AddFolderCard, FolderCard, type FolderItem } from './FolderCard'
import { FoldersEmptyState } from './FoldersEmptyState'
import { FoldersSelectionBar } from './FoldersSelectionBar'
import { MoveFolderDialog, type MoveFolderTargetOption } from './MoveFolderDialog'
import { NoteCard } from './NoteCard'
import { NoteListRowMoreControl } from './NoteList'
import { NoteViewSwitcher, type NoteViewMode } from './NoteViewSwitcher'
import { RenameFolderDialog } from './RenameFolderDialog'

function formatClockTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

interface FoldersViewProps {
  notes: Note[]
  folders: Folder[]
  visibleNotes: Note[]
  query?: string
  tagId?: string | null
  onClearSearch?: () => void
  onClearTagFilter?: () => void
  onSelectNote?: (noteId: string) => void
  onCreateFolder?: (name: string, parentId: string | null) => void | Promise<void>
  onRenameFolder?: (folderId: string, name: string) => void | Promise<void>
  onMoveFolders?: (folderIds: string[], parentId: string | null) => void | Promise<void>
  onDeleteFolders?: (folderIds: string[]) => void | Promise<void>
}

/** @deprecated 保留导出名供旧引用兼容；真源改为 store folders。 */
export const folderNames: Record<string, { name: string; icon: FolderItem['icon'] }> = {
  inbox: { name: '收件箱', icon: 'folder' },
  work: { name: '工作项目', icon: 'work' },
  study: { name: '学习笔记', icon: 'study' },
  personal: { name: '个人生活', icon: 'folder' },
}

export function FoldersView({
  notes,
  folders,
  visibleNotes,
  query = '',
  tagId = null,
  onClearSearch,
  onClearTagFilter,
  onSelectNote,
  onCreateFolder,
  onRenameFolder,
  onMoveFolders,
  onDeleteFolders,
}: FoldersViewProps) {
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<NoteViewMode>('grid')
  const [detailViewMode, setDetailViewMode] = useState<NoteViewMode>('grid')
  const [createOpen, setCreateOpen] = useState(false)
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [movingFolderIds, setMovingFolderIds] = useState<string[] | null>(null)
  const [deletingFolderIds, setDeletingFolderIds] = useState<string[] | null>(null)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)

  const selectionMode = selectedFolderIds.length > 0
  const trimmedQuery = query.trim()
  const hasSearch = trimmedQuery.length > 0
  const hasFilter = Boolean(tagId)

  const folderItems: FolderItem[] = useMemo(() => {
    return folders.map((folder) => {
      const folderNotes = notes.filter((note) => note.folderId === folder.id && !note.isDeleted)
      const latestNote = [...folderNotes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      const childCount = folders.filter((item) => item.parentId === folder.id).length

      return {
        id: folder.id,
        name: folder.name,
        icon: folder.icon,
        parentId: folder.parentId,
        noteCount: folderNotes.length,
        childCount,
        updatedLabel: latestNote ? formatUpdatedAt(latestNote.updatedAt) : formatUpdatedAt(folder.updatedAt),
        protected: isProtectedFolderId(folder.id),
        visibleNoteCount: visibleNotes.filter((note) => note.folderId === folder.id && !note.isDeleted).length,
      }
    })
  }, [folders, notes, visibleNotes])

  const folderItemMap = useMemo(() => new Map(folderItems.map((folder) => [folder.id, folder])), [folderItems])

  const rootFolderItems = folderItems.filter((folder) => !folder.parentId)
  const activeFolder = activeFolderId ? folderItemMap.get(activeFolderId) ?? null : null
  const activeFolderRecord = activeFolderId ? folders.find((folder) => folder.id === activeFolderId) ?? null : null
  const isActiveChild = Boolean(activeFolderRecord?.parentId)
  const childFolderItems = activeFolderId ? folderItems.filter((folder) => folder.parentId === activeFolderId) : []
  const activeFolderTotalNotes = activeFolder ? notes.filter((note) => note.folderId === activeFolder.id && !note.isDeleted) : []
  const activeFolderNotes = activeFolder ? visibleNotes.filter((note) => note.folderId === activeFolder.id && !note.isDeleted) : []

  const renamingFolder = renamingFolderId ? folderItemMap.get(renamingFolderId) ?? null : null
  const existingNames = folders.map((folder) => folder.name)

  const visibleRootFolderItems = hasSearch || hasFilter
    ? rootFolderItems.filter((folder) => {
        const selfMatch = (folder.visibleNoteCount ?? 0) > 0 || folder.name.includes(trimmedQuery)
        const childMatch = folders.some((child) => child.parentId === folder.id && (
          child.name.includes(trimmedQuery) ||
          visibleNotes.some((note) => note.folderId === child.id && !note.isDeleted)
        ))
        return selfMatch || childMatch
      })
    : rootFolderItems

  function toggleFolder(folderId: string) {
    setSelectedFolderIds((current) => (current.includes(folderId) ? current.filter((id) => id !== folderId) : [...current, folderId]))
  }

  function startSelection(folderId: string) {
    setSelectedFolderIds((current) => (current.includes(folderId) ? current : [...current, folderId]))
  }

  function clearSelection() {
    setSelectedFolderIds([])
  }

  function selectAllVisible() {
    const ids = (activeFolder ? childFolderItems : visibleRootFolderItems).map((folder) => folder.id)
    setSelectedFolderIds(ids)
  }

  function openFolder(folderId: string) {
    setSelectedFolderIds([])
    setActiveFolderId(folderId)
  }

  async function handleCreate(name: string) {
    const parentId = activeFolder && !isActiveChild ? activeFolder.id : null
    await onCreateFolder?.(name, parentId)
    setCreateOpen(false)
  }

  async function handleRename(name: string) {
    if (!renamingFolder) {
      return
    }
    await onRenameFolder?.(renamingFolder.id, name)
    setRenamingFolderId(null)
  }

  function openMove(folderIds: string[]) {
    setMovingFolderIds(folderIds)
  }

  function openDelete(folderIds: string[]) {
    const deletable = folderIds.filter((id) => !isProtectedFolderId(id))
    if (deletable.length === 0) {
      return
    }
    setDeletingFolderIds(deletable)
  }

  async function handleMove(parentId: string | null) {
    if (!movingFolderIds?.length) {
      return
    }
    await onMoveFolders?.(movingFolderIds, parentId)
    setMovingFolderIds(null)
    clearSelection()
  }

  async function handleDeleteConfirm() {
    if (!deletingFolderIds?.length) {
      return
    }
    await onDeleteFolders?.(deletingFolderIds)
    setDeletingFolderIds(null)
    clearSelection()
    if (activeFolderId && deletingFolderIds.includes(activeFolderId)) {
      setActiveFolderId(null)
    }
  }

  const moveOptions: MoveFolderTargetOption[] = useMemo(() => {
    if (!movingFolderIds?.length) {
      return []
    }
    const targets = getValidMoveTargets(folders, movingFolderIds)
    const options: MoveFolderTargetOption[] = [
      {
        id: null,
        name: '顶层',
        description: '作为根文件夹显示',
      },
    ]

    if (!targets.rootOnly) {
      for (const folder of targets.rootFolders) {
        const movable = movingFolderIds.every((id) => canMoveFolder(folders, id, folder.id, new Set(movingFolderIds)))
        options.push({
          id: folder.id,
          name: folder.name,
          description: '移动到该文件夹下（一层）',
          disabled: !movable,
        })
      }
    }

    return options
  }, [folders, movingFolderIds])

  const selectableItems = activeFolder ? childFolderItems : visibleRootFolderItems
  const selectedVisibleIds = selectedFolderIds.filter((id) => selectableItems.some((folder) => folder.id === id))
  const canDeleteSelected = selectedVisibleIds.some((id) => !isProtectedFolderId(id))
  const canMoveSelected = selectedVisibleIds.some((id) => !isProtectedFolderId(id))

  const createLabel = activeFolder && !isActiveChild ? '新建子文件夹' : '新建文件夹'
  const deletingNames = (deletingFolderIds ?? []).map((id) => folderItemMap.get(id)?.name ?? id)

  const listSection = (items: FolderItem[], allowCreate: boolean, mode: NoteViewMode = viewMode) => {
    if (mode === 'list') {
      return (
        <div className="space-y-4 pb-24">
          {items.map((folder) => (
            <FolderListItem
              key={folder.id}
              folder={folder}
              selectionMode={selectionMode}
              selected={selectedFolderIds.includes(folder.id)}
              onToggle={toggleFolder}
              onOpen={openFolder}
              onStartSelection={startSelection}
              onRename={setRenamingFolderId}
              onMove={(folderId) => openMove([folderId])}
              onDelete={(folderId) => openDelete([folderId])}
            />
          ))}
          {allowCreate && !selectionMode ? <AddFolderListItem label={createLabel} onClick={() => setCreateOpen(true)} /> : null}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-6 pb-24 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            selectionMode={selectionMode}
            selected={selectedFolderIds.includes(folder.id)}
            onToggle={toggleFolder}
            onStartSelection={startSelection}
            onOpen={openFolder}
            onRename={setRenamingFolderId}
            onMove={(folderId) => openMove([folderId])}
            onDelete={(folderId) => openDelete([folderId])}
          />
        ))}
        {allowCreate ? <AddFolderCard disabled={selectionMode} label={createLabel} onClick={() => setCreateOpen(true)} /> : null}
      </div>
    )
  }

  const renderActiveFolderContent = () => {
    const showChildren = !isActiveChild
    const foldersToShow = showChildren ? childFolderItems : []
    const hasFolders = foldersToShow.length > 0
    const hasNotes = activeFolderNotes.length > 0
    const allowCreateChild = showChildren && !selectionMode
    const isEmpty = !hasFolders && !hasNotes

    if (isEmpty) {
      if (hasSearch) {
        return (
          <EmptyState
            icon={SearchX}
            title="没有找到相关内容"
            description={`这个文件夹中没有匹配“${trimmedQuery}”的子文件夹或笔记。`}
            variant="search"
            primaryAction={onClearSearch ? { label: '清空搜索', onClick: onClearSearch } : undefined}
            compact
          />
        )
      }

      if (hasFilter) {
        return (
          <EmptyState
            icon={Tags}
            title="当前筛选没有结果"
            description="这个文件夹中没有符合当前标签筛选的内容。"
            variant="filter"
            primaryAction={onClearTagFilter ? { label: '清除筛选', onClick: onClearTagFilter } : undefined}
            compact
          />
        )
      }

      return (
        <div className="pb-24">
          <EmptyState
            icon={FileText}
            title="这个文件夹还是空的"
            description={showChildren ? '可以在这里新建子文件夹，或把笔记归类进来。' : '归类到这里的笔记会显示在这个页面。'}
            variant="folders"
            compact
            primaryAction={showChildren ? { label: createLabel, onClick: () => setCreateOpen(true) } : undefined}
          />
        </div>
      )
    }

    // 子文件夹与笔记作为同类混排：先文件夹，后笔记；同一网格/列表，无分区标题
    if (detailViewMode === 'list') {
      return (
        <div className="space-y-4 pb-24">
          {foldersToShow.map((folder) => (
            <FolderListItem
              key={`folder-${folder.id}`}
              folder={folder}
              selectionMode={selectionMode}
              selected={selectedFolderIds.includes(folder.id)}
              onToggle={toggleFolder}
              onOpen={openFolder}
              onStartSelection={startSelection}
              onRename={setRenamingFolderId}
              onMove={(folderId) => openMove([folderId])}
              onDelete={(folderId) => openDelete([folderId])}
            />
          ))}
          {activeFolderNotes.map((note) => (
            <FolderNoteListRow key={`note-${note.id}`} note={note} onSelect={onSelectNote} />
          ))}
          {allowCreateChild ? <AddFolderListItem label={createLabel} onClick={() => setCreateOpen(true)} /> : null}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-6 pb-24 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {foldersToShow.map((folder) => (
          <FolderCard
            key={`folder-${folder.id}`}
            folder={folder}
            selectionMode={selectionMode}
            selected={selectedFolderIds.includes(folder.id)}
            onToggle={toggleFolder}
            onStartSelection={startSelection}
            onOpen={openFolder}
            onRename={setRenamingFolderId}
            onMove={(folderId) => openMove([folderId])}
            onDelete={(folderId) => openDelete([folderId])}
          />
        ))}
        {activeFolderNotes.map((note) => (
          <NoteCard key={`note-${note.id}`} note={note} visual={note.id === 'design-inspo'} onSelect={onSelectNote} />
        ))}
        {showChildren ? <AddFolderCard disabled={selectionMode} label={createLabel} onClick={() => setCreateOpen(true)} /> : null}
      </div>
    )
  }

  if (activeFolder) {
    return (
      <main className="relative mx-auto w-full max-w-container-max-width flex-1 overflow-y-auto bg-surface-container-lowest p-gutter">
        <div className="mx-auto max-w-container-max-width">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h1 className="mb-2 font-headline-lg text-headline-lg text-on-surface">{activeFolder.name}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {hasSearch || hasFilter
                  ? `当前显示 ${activeFolderNotes.length + (!isActiveChild ? childFolderItems.length : 0)} 项`
                  : `共 ${activeFolderTotalNotes.length} 篇笔记${ !isActiveChild && childFolderItems.length > 0 ? ` · ${childFolderItems.length} 个子文件夹` : ''} · ${activeFolder.updatedLabel}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  clearSelection()
                  setActiveFolderId(activeFolderRecord?.parentId ?? null)
                }}
                className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:border-primary hover:bg-surface-container-low hover:text-primary"
              >
                <ArrowLeft className="size-4" />
                返回
              </button>
              {activeFolderNotes.length > 0 || childFolderItems.length > 0 ? (
                <NoteViewSwitcher value={detailViewMode} onChange={setDetailViewMode} />
              ) : null}
            </div>
          </div>

          {selectionMode ? (
            <FoldersSelectionBar
              selectedCount={selectedVisibleIds.length}
              totalCount={selectableItems.length}
              canMove={canMoveSelected}
              canDelete={canDeleteSelected}
              onSelectAll={selectAllVisible}
              onMove={() => openMove(selectedVisibleIds.filter((id) => !isProtectedFolderId(id)))}
              onDelete={() => openDelete(selectedVisibleIds)}
              onClear={clearSelection}
            />
          ) : null}

          {renderActiveFolderContent()}
        </div>

        {createOpen ? <CreateFolderDialog existingNames={existingNames} onClose={() => setCreateOpen(false)} onCreate={(name) => void handleCreate(name)} /> : null}
        {renamingFolder ? (
          <RenameFolderDialog initialName={renamingFolder.name} existingNames={existingNames} onClose={() => setRenamingFolderId(null)} onRename={(name) => void handleRename(name)} />
        ) : null}
        {movingFolderIds ? (
          <MoveFolderDialog
            description={`将 ${movingFolderIds.length} 个文件夹移动到目标位置（含子文件夹与笔记）。`}
            options={moveOptions}
            onClose={() => setMovingFolderIds(null)}
            onMove={handleMove}
          />
        ) : null}
        {deletingFolderIds ? (
          <ConfirmDialog
            description={
              <>
                将删除 {deletingNames.join('、')}。
                <span className="mt-1 block text-error">子文件夹会一并删除，其中的笔记会进入废纸篓。</span>
              </>
            }
            confirmLabel="删除文件夹"
            isDestructive
            onClose={() => setDeletingFolderIds(null)}
            onConfirm={handleDeleteConfirm}
          />
        ) : null}
      </main>
    )
  }

  if (folderItems.length === 0) {
    return (
      <main className="relative mx-auto w-full max-w-container-max-width flex-1 overflow-y-auto bg-surface-container-lowest p-gutter">
        <div className="mx-auto max-w-container-max-width">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h1 className="mb-2 font-headline-lg text-headline-lg text-on-surface">我的文件夹</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">管理和整理您分类保存的笔记。</p>
            </div>
          </div>
          <FoldersEmptyState onCreate={() => setCreateOpen(true)} />
        </div>
        {createOpen ? <CreateFolderDialog existingNames={existingNames} onClose={() => setCreateOpen(false)} onCreate={(name) => void handleCreate(name)} /> : null}
      </main>
    )
  }

  return (
    <main className="relative mx-auto w-full max-w-container-max-width flex-1 overflow-y-auto bg-surface-container-lowest p-gutter">
      <div className="mx-auto max-w-container-max-width">
        {selectionMode ? (
          <FoldersSelectionBar
            selectedCount={selectedVisibleIds.length}
            totalCount={selectableItems.length}
            canMove={canMoveSelected}
            canDelete={canDeleteSelected}
            onSelectAll={selectAllVisible}
            onMove={() => openMove(selectedVisibleIds.filter((id) => !isProtectedFolderId(id)))}
            onDelete={() => openDelete(selectedVisibleIds)}
            onClear={clearSelection}
          />
        ) : null}

        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="mb-2 font-headline-lg text-headline-lg text-on-surface">我的文件夹</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">管理和整理您分类保存的笔记。</p>
          </div>
          {selectionMode ? null : <NoteViewSwitcher value={viewMode} onChange={setViewMode} />}
        </div>

        {visibleRootFolderItems.length === 0 && (hasSearch || hasFilter) ? (
          hasSearch ? (
            <EmptyState icon={SearchX} title="没有找到相关文件夹" description={`没有匹配“${trimmedQuery}”的文件夹或笔记。`} variant="search" primaryAction={onClearSearch ? { label: '清空搜索', onClick: onClearSearch } : undefined} />
          ) : (
            <EmptyState icon={Tags} title="当前筛选没有结果" description="没有文件夹包含当前标签筛选的笔记。" variant="filter" primaryAction={onClearTagFilter ? { label: '清除筛选', onClick: onClearTagFilter } : undefined} />
          )
        ) : (
          listSection(visibleRootFolderItems, true)
        )}
      </div>

      {createOpen ? <CreateFolderDialog existingNames={existingNames} onClose={() => setCreateOpen(false)} onCreate={(name) => void handleCreate(name)} /> : null}
      {renamingFolder ? (
        <RenameFolderDialog initialName={renamingFolder.name} existingNames={existingNames} onClose={() => setRenamingFolderId(null)} onRename={(name) => void handleRename(name)} />
      ) : null}
      {movingFolderIds ? (
        <MoveFolderDialog
          description={`将 ${movingFolderIds.length} 个文件夹移动到目标位置（含子文件夹与笔记）。`}
          options={moveOptions}
          onClose={() => setMovingFolderIds(null)}
          onMove={handleMove}
        />
      ) : null}
      {deletingFolderIds ? (
        <ConfirmDialog
          description={
            <>
              将删除 {deletingNames.join('、')}。
              <span className="mt-1 block text-error">子文件夹会一并删除，其中的笔记会进入废纸篓。</span>
            </>
          }
          confirmLabel="删除文件夹"
          isDestructive
          onClose={() => setDeletingFolderIds(null)}
          onConfirm={handleDeleteConfirm}
        />
      ) : null}
    </main>
  )
}

function FolderNoteListRow({ note, onSelect }: { note: Note; onSelect?: (noteId: string) => void }) {
  const primaryTag = note.tags[0]
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <article
      onClick={() => onSelect?.(note.id)}
      className={`group relative flex cursor-pointer items-center gap-6 rounded-xl border border-outline-variant bg-white p-5 transition-all duration-300 hover:border-primary-fixed-dim hover:shadow-lg ${menuOpen ? 'z-30' : 'z-0'}`}
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-high text-primary shadow-sm">
        <FileText className="size-5" strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex min-w-0 items-center gap-3">
          <h3 className="truncate font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">{note.title || '未命名笔记'}</h3>
          {primaryTag ? <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">{primaryTag.name}</span> : null}
        </div>
        <p className="max-w-2xl truncate font-body-md text-body-md text-on-surface-variant">{note.excerpt || note.content || '开始输入内容...'}</p>
      </div>

      <div className="ml-0 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 lg:ml-4">
        <button type="button" onClick={(event) => event.stopPropagation()} className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container hover:text-primary">
          <Star className="size-5" fill={note.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button type="button" onClick={(event) => event.stopPropagation()} className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container hover:text-error">
          <Trash2 className="size-5" />
        </button>
        <NoteListRowMoreControl open={menuOpen} onToggle={setMenuOpen} onClose={() => setMenuOpen(false)} />
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="font-label-md text-label-md font-medium text-on-surface">{formatUpdatedAt(note.updatedAt)}</p>
        <p className="font-label-sm text-label-sm text-outline">修改于 {formatClockTime(note.updatedAt)}</p>
      </div>
    </article>
  )
}
