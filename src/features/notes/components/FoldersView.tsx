// 改动：移除 visual 硬编码；透传 onSetCover
import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import type { Folder } from '../../../shared/types/folder'
import type { Note } from '../../../shared/types/note'
import { canMoveFolder, canPlaceFoldersInParent, getValidMoveTargets } from '../../../shared/notes/folderDomain'
import { formatUpdatedAt } from '../../../shared/notes/noteSelectors'
import { useIdSelection } from '../../../shared/ui'
import { ConfirmDialog } from './ConfirmDialog'
import { CreateFolderDialog } from './CreateFolderDialog'
import { DashedCreate } from './DashedCreate'
import { EmptyState } from './EmptyState'
import { FilteredEmptyState } from './FilteredEmptyState'
import { FolderListItem } from './FolderListItem'
import { FolderCard, type FolderItem } from './FolderCard'
import { FoldersEmptyState } from './FoldersEmptyState'
import { FoldersSelectionBar } from './FoldersSelectionBar'
import { MoveFolderDialog, type MoveFolderTargetOption } from './MoveFolderDialog'
import { MoveToFolderDialog, type MoveToFolderOption } from './MoveToFolderDialog'
import { NoteCard } from './NoteCard'
import { NoteListRow } from './NoteListRow'
import { NoteViewSwitcher, type NoteViewMode } from './NoteViewSwitcher'
import { RenameFolderDialog } from './RenameFolderDialog'

interface FoldersViewProps {
  notes: Note[]
  folders: Folder[]
  visibleNotes: Note[]
  query?: string
  tagId?: string | null
  onClearSearch?: () => void
  onClearTagFilter?: () => void
  onSelectNote?: (noteId: string) => void
  onToggleFavorite?: (noteId: string) => void | Promise<void>
  onTogglePinned?: (noteId: string) => void | Promise<void>
  onMoveNoteToTrash?: (noteId: string) => void | Promise<void>
  onRequestMoveNoteToFolder?: (noteId: string) => void
  onMoveNoteToFolder?: (noteId: string, folderId: string | null) => void | Promise<void>
  onDuplicateNote?: (noteId: string) => void | Promise<void>
  onSetCover?: (noteId: string, cover: string | null) => void
  folderOptions?: MoveToFolderOption[]
  onCreateFolder?: (name: string, parentId: string | null) => void | Promise<void>
  onRenameFolder?: (folderId: string, name: string) => void | Promise<void>
  onMoveFolders?: (folderIds: string[], parentId: string | null) => void | Promise<void>
  onDeleteFolders?: (folderIds: string[]) => void | Promise<void>
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
  onToggleFavorite,
  onTogglePinned,
  onMoveNoteToTrash,
  onRequestMoveNoteToFolder,
  onMoveNoteToFolder,
  onDuplicateNote,
  onSetCover,
  folderOptions = [],
  onCreateFolder,
  onRenameFolder,
  onMoveFolders,
  onDeleteFolders,
}: FoldersViewProps) {
  const [viewMode, setViewMode] = useState<NoteViewMode>('grid')
  const [detailViewMode, setDetailViewMode] = useState<NoteViewMode>('grid')
  const [createOpen, setCreateOpen] = useState(false)
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [movingFolderIds, setMovingFolderIds] = useState<string[] | null>(null)
  const [deletingFolderIds, setDeletingFolderIds] = useState<string[] | null>(null)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [bulkMoveNoteOpen, setBulkMoveNoteOpen] = useState(false)

  // 两套多选互斥：通过 ref 避免初始化时的循环引用
  const noteSelectionRef = useRef<ReturnType<typeof useIdSelection> | null>(null)
  const folderSelectionRef = useRef<ReturnType<typeof useIdSelection> | null>(null)

  const noteSelection = useIdSelection({
    onBeforeChange: () => {
      folderSelectionRef.current?.clear()
    },
  })
  const folderSelection = useIdSelection({
    onBeforeChange: () => {
      noteSelectionRef.current?.clear()
      setBulkMoveNoteOpen(false)
    },
  })
  noteSelectionRef.current = noteSelection
  folderSelectionRef.current = folderSelection

  const folderSelectionMode = folderSelection.selectedIds.length > 0
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
  const activeFolderNoteIds = activeFolderNotes.map((note) => note.id)
  const selectedVisibleNoteIds = noteSelection.selectedVisibleIds(activeFolderNoteIds)
  const selectedVisibleNoteIdSet = new Set(selectedVisibleNoteIds)
  const noteSelectionMode = selectedVisibleNoteIds.length > 0
  const selectionMode = folderSelectionMode || noteSelectionMode

  const renamingFolder = renamingFolderId ? folderItemMap.get(renamingFolderId) ?? null : null
  const createParentId = activeFolder && !isActiveChild ? activeFolder.id : null
  const createExistingNames = folders.filter((folder) => folder.parentId === createParentId).map((folder) => folder.name)
  const renameExistingNames = renamingFolder
    ? folders.filter((folder) => folder.parentId === renamingFolder.parentId).map((folder) => folder.name)
    : []

  function folderMatchesFilter(folder: FolderItem) {
    return (folder.visibleNoteCount ?? 0) > 0 || (hasSearch && folder.name.toLowerCase().includes(trimmedQuery.toLowerCase()))
  }

  function hasMatchingChild(folderId: string) {
    return folderItems.some((child) => child.parentId === folderId && folderMatchesFilter(child))
  }

  const visibleRootFolderItems = hasSearch || hasFilter
    ? rootFolderItems.filter((folder) => folderMatchesFilter(folder) || hasMatchingChild(folder.id))
    : rootFolderItems
  const visibleChildFolderItems = activeFolderId && (hasSearch || hasFilter)
    ? childFolderItems.filter(folderMatchesFilter)
    : childFolderItems

  function clearNoteSelection() {
    noteSelection.clear()
    setBulkMoveNoteOpen(false)
  }

  function clearSelection() {
    folderSelection.clear()
  }

  function toggleFolder(folderId: string) {
    folderSelection.toggle(folderId)
  }

  function startSelection(folderId: string) {
    folderSelection.start(folderId)
  }

  function selectAllVisible() {
    const items = activeFolder ? visibleChildFolderItems : visibleRootFolderItems
    folderSelection.selectAllVisible(items.map((folder) => folder.id))
  }

  function restoreSelectionBeforeSelectAll() {
    folderSelection.restoreBeforeSelectAll()
  }

  function toggleNote(noteId: string) {
    noteSelection.toggle(noteId)
  }

  function startNoteSelection(noteId: string) {
    noteSelection.start(noteId)
  }

  function selectAllVisibleNotes() {
    noteSelection.selectAllVisible(activeFolderNotes.map((note) => note.id))
  }

  function restoreNoteSelectionBeforeSelectAll() {
    if (noteSelection.restoreBeforeSelectAll() === 'cleared') {
      setBulkMoveNoteOpen(false)
    }
  }

  async function handleBulkMoveNotes(folderId: string | null) {
    if (!onMoveNoteToFolder) {
      return
    }

    await Promise.all(selectedVisibleNoteIds.map((noteId) => onMoveNoteToFolder(noteId, folderId)))
    clearNoteSelection()
  }

  async function handleBulkMoveNotesToTrash() {
    if (!onMoveNoteToTrash) {
      return
    }

    await Promise.all(selectedVisibleNoteIds.map((noteId) => onMoveNoteToTrash(noteId)))
    clearNoteSelection()
  }

  function openFolder(folderId: string) {
    clearSelection()
    clearNoteSelection()
    setActiveFolderId(folderId)
  }

  async function handleCreate(name: string) {
    await onCreateFolder?.(name, createParentId)
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
    if (folderIds.length === 0) {
      return
    }
    setDeletingFolderIds(folderIds)
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

  const noteActions = {
    onToggleFavorite: folderSelectionMode ? undefined : onToggleFavorite,
    onTogglePinned: folderSelectionMode ? undefined : onTogglePinned,
    onMoveToTrash: folderSelectionMode ? undefined : onMoveNoteToTrash,
    onRequestMoveToFolder: folderSelectionMode ? undefined : onRequestMoveNoteToFolder,
    onDuplicate: folderSelectionMode ? undefined : onDuplicateNote,
    onSetCover: folderSelectionMode ? undefined : onSetCover,
    selectionMode: noteSelectionMode,
    onToggleSelection: folderSelectionMode ? undefined : toggleNote,
    onStartSelection: folderSelectionMode ? undefined : startNoteSelection,
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
        disabled: !movingFolderIds.every((id) => canMoveFolder(folders, id, null, new Set(movingFolderIds))) || !canPlaceFoldersInParent(folders, movingFolderIds, null),
      },
    ]

    if (!targets.rootOnly) {
      for (const folder of targets.rootFolders) {
        const movable = movingFolderIds.every((id) => canMoveFolder(folders, id, folder.id, new Set(movingFolderIds)))
          && canPlaceFoldersInParent(folders, movingFolderIds, folder.id)
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

  const selectableItems = activeFolder ? visibleChildFolderItems : visibleRootFolderItems
  const selectedVisibleIds = folderSelection.selectedIds.filter((id) => selectableItems.some((folder) => folder.id === id))
  const canDeleteSelected = selectedVisibleIds.length > 0
  const canMoveSelected = selectedVisibleIds.length > 0

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
              selectionMode={folderSelectionMode}
              selected={folderSelection.selectedIds.includes(folder.id)}
              onToggle={toggleFolder}
              onOpen={openFolder}
              onStartSelection={startSelection}
              onRename={setRenamingFolderId}
              onMove={(folderId) => openMove([folderId])}
              onDelete={(folderId) => openDelete([folderId])}
            />
          ))}
          {allowCreate && !selectionMode ? <DashedCreate layout="list" label={createLabel} onClick={() => setCreateOpen(true)} /> : null}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-6 pb-24 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            selectionMode={folderSelectionMode}
            selected={folderSelection.selectedIds.includes(folder.id)}
            onToggle={toggleFolder}
            onStartSelection={startSelection}
            onOpen={openFolder}
            onRename={setRenamingFolderId}
            onMove={(folderId) => openMove([folderId])}
            onDelete={(folderId) => openDelete([folderId])}
          />
        ))}
        {allowCreate ? <DashedCreate layout="card" label={createLabel} disabled={selectionMode} onClick={() => setCreateOpen(true)} /> : null}
      </div>
    )
  }

  const renderActiveFolderContent = () => {
    const showChildren = !isActiveChild
    const foldersToShow = showChildren ? visibleChildFolderItems : []
    const hasFolders = foldersToShow.length > 0
    const hasNotes = activeFolderNotes.length > 0
    const allowCreateChild = showChildren && !selectionMode
    const isEmpty = !hasFolders && !hasNotes

    if (isEmpty) {
      return (
        <div className="pb-24">
          <FilteredEmptyState
            query={query}
            tagId={tagId}
            searchTitle="没有找到相关内容"
            searchDescription={`这个文件夹中没有匹配“${trimmedQuery}”的子文件夹或笔记。`}
            filterDescription="这个文件夹中没有符合当前标签筛选的内容。"
            onClearSearch={onClearSearch}
            onClearTagFilter={onClearTagFilter}
            compact
            fallback={
              <EmptyState
                icon={FileText}
                title="这个文件夹还是空的"
                description={showChildren ? '可以在这里新建子文件夹，或把笔记归类进来。' : '归类到这里的笔记会显示在这个页面。'}
                variant="folders"
                compact
                primaryAction={showChildren ? { label: createLabel, onClick: () => setCreateOpen(true) } : undefined}
              />
            }
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
              selectionMode={folderSelectionMode}
              selected={folderSelection.selectedIds.includes(folder.id)}
              disabled={noteSelectionMode}
              onToggle={toggleFolder}
              onOpen={openFolder}
              onStartSelection={noteSelectionMode ? undefined : startSelection}
              onRename={setRenamingFolderId}
              onMove={(folderId) => openMove([folderId])}
              onDelete={(folderId) => openDelete([folderId])}
            />
          ))}
          {activeFolderNotes.map((note) => (
            <NoteListRow
              key={`note-${note.id}`}
              note={note}
              query={query}
              onSelect={onSelectNote}
              selected={selectedVisibleNoteIdSet.has(note.id)}
              disabled={folderSelectionMode}
              {...noteActions}
            />
          ))}
          {allowCreateChild ? <DashedCreate layout="list" label={createLabel} onClick={() => setCreateOpen(true)} /> : null}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-6 pb-24 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {foldersToShow.map((folder) => (
          <FolderCard
            key={`folder-${folder.id}`}
            folder={folder}
            selectionMode={folderSelectionMode}
            selected={folderSelection.selectedIds.includes(folder.id)}
            disabled={noteSelectionMode}
            onToggle={toggleFolder}
            onStartSelection={noteSelectionMode ? undefined : startSelection}
            onOpen={openFolder}
            onRename={setRenamingFolderId}
            onMove={(folderId) => openMove([folderId])}
            onDelete={(folderId) => openDelete([folderId])}
          />
        ))}
        {activeFolderNotes.map((note) => (
          <NoteCard
            key={`note-${note.id}`}
            note={note}
            onSelect={onSelectNote}
            selected={selectedVisibleNoteIdSet.has(note.id)}
            disabled={folderSelectionMode}
            {...noteActions}
          />
        ))}
        {showChildren ? <DashedCreate layout="card" label={createLabel} disabled={selectionMode} onClick={() => setCreateOpen(true)} /> : null}
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
                  ? `当前显示 ${activeFolderNotes.length + (!isActiveChild ? visibleChildFolderItems.length : 0)} 项`
                  : `共 ${activeFolderTotalNotes.length} 篇笔记${ !isActiveChild && childFolderItems.length > 0 ? ` · ${childFolderItems.length} 个子文件夹` : ''} · ${activeFolder.updatedLabel}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  clearSelection()
                  clearNoteSelection()
                  setActiveFolderId(activeFolderRecord?.parentId ?? null)
                }}
                className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:border-primary hover:bg-surface-container-low hover:text-primary"
              >
                <ArrowLeft className="size-4" />
                返回
              </button>
              {!selectionMode && (activeFolderNotes.length > 0 || childFolderItems.length > 0) ? (
                <NoteViewSwitcher value={detailViewMode} onChange={setDetailViewMode} />
              ) : null}
            </div>
          </div>

          {folderSelectionMode ? (
            <FoldersSelectionBar
              selectedCount={selectedVisibleIds.length}
              totalCount={selectableItems.length}
              canMove={canMoveSelected}
              canDelete={canDeleteSelected}
              onSelectAll={selectAllVisible}
              onClearSelection={restoreSelectionBeforeSelectAll}
              onMove={() => openMove(selectedVisibleIds)}
              onDelete={() => openDelete(selectedVisibleIds)}
              onClear={clearSelection}
            />
          ) : null}

          {noteSelectionMode ? (
            <FoldersSelectionBar
              selectedCount={selectedVisibleNoteIds.length}
              totalCount={activeFolderNotes.length}
              canMove={Boolean(onMoveNoteToFolder)}
              canDelete={Boolean(onMoveNoteToTrash)}
              moveLabel="移动到文件夹"
              onSelectAll={selectAllVisibleNotes}
              onClearSelection={restoreNoteSelectionBeforeSelectAll}
              onMove={() => setBulkMoveNoteOpen(true)}
              onDelete={() => void handleBulkMoveNotesToTrash()}
              onClear={clearNoteSelection}
            />
          ) : null}

          {renderActiveFolderContent()}
        </div>

        {createOpen ? <CreateFolderDialog existingNames={createExistingNames} onClose={() => setCreateOpen(false)} onCreate={(name) => void handleCreate(name)} /> : null}
        {renamingFolder ? (
          <RenameFolderDialog initialName={renamingFolder.name} existingNames={renameExistingNames} onClose={() => setRenamingFolderId(null)} onRename={(name) => void handleRename(name)} />
        ) : null}
        {movingFolderIds ? (
          <MoveFolderDialog
            description={`将 ${movingFolderIds.length} 个文件夹移动到目标位置（含子文件夹与笔记）。`}
            options={moveOptions}
            onClose={() => setMovingFolderIds(null)}
            onMove={handleMove}
          />
        ) : null}
        {bulkMoveNoteOpen ? (
          <MoveToFolderDialog
            title="移动所选笔记"
            description={`将 ${selectedVisibleNoteIds.length} 篇笔记移动到目标文件夹。`}
            initialFolderId={null}
            showCurrent={false}
            disableWhenUnchanged={false}
            folderOptions={folderOptions}
            onClose={() => setBulkMoveNoteOpen(false)}
            onMove={handleBulkMoveNotes}
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
        {createOpen ? <CreateFolderDialog existingNames={createExistingNames} onClose={() => setCreateOpen(false)} onCreate={(name) => void handleCreate(name)} /> : null}
      </main>
    )
  }

  return (
    <main className="relative mx-auto w-full max-w-container-max-width flex-1 overflow-y-auto bg-surface-container-lowest p-gutter">
      <div className="mx-auto max-w-container-max-width">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="mb-2 font-headline-lg text-headline-lg text-on-surface">我的文件夹</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">管理和整理您分类保存的笔记。</p>
          </div>
          {selectionMode ? null : <NoteViewSwitcher value={viewMode} onChange={setViewMode} />}
        </div>

        {folderSelectionMode ? (
          <FoldersSelectionBar
            selectedCount={selectedVisibleIds.length}
            totalCount={selectableItems.length}
            canMove={canMoveSelected}
            canDelete={canDeleteSelected}
            onSelectAll={selectAllVisible}
            onClearSelection={restoreSelectionBeforeSelectAll}
            onMove={() => openMove(selectedVisibleIds)}
            onDelete={() => openDelete(selectedVisibleIds)}
            onClear={clearSelection}
          />
        ) : null}

        {visibleRootFolderItems.length === 0 && (hasSearch || hasFilter) ? (
          <FilteredEmptyState
            query={query}
            tagId={tagId}
            searchTitle="没有找到相关文件夹"
            searchDescription={`没有匹配“${trimmedQuery}”的文件夹或笔记。`}
            filterDescription="没有文件夹包含当前标签筛选的笔记。"
            onClearSearch={onClearSearch}
            onClearTagFilter={onClearTagFilter}
          />
        ) : (
          listSection(visibleRootFolderItems, true)
        )}
      </div>

      {createOpen ? <CreateFolderDialog existingNames={createExistingNames} onClose={() => setCreateOpen(false)} onCreate={(name) => void handleCreate(name)} /> : null}
      {renamingFolder ? (
        <RenameFolderDialog initialName={renamingFolder.name} existingNames={renameExistingNames} onClose={() => setRenamingFolderId(null)} onRename={(name) => void handleRename(name)} />
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
