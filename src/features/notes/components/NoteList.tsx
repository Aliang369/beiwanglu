// 改动：移除 visual 硬编码；透传 onSetCover
import { FileText } from 'lucide-react'
import { useState } from 'react'
import type { Note } from '../../../shared/types/note'
import { formatUpdatedAt } from '../../../shared/notes/noteSelectors'
import { SelectionBar, useIdSelection } from '../../../shared/ui'
import { DashedCreate } from './DashedCreate'
import { EmptyState } from './EmptyState'
import { FilteredEmptyState } from './FilteredEmptyState'
import { FirstRunGuide } from './FirstRunGuide'
import { MoveToFolderDialog, type MoveToFolderOption } from './MoveToFolderDialog'
import { NoteCard } from './NoteCard'
import { NoteListRow } from './NoteListRow'
import { NoteViewSwitcher, type NoteViewMode } from './NoteViewSwitcher'

interface NoteListProps {
  notes: Note[]
  totalCount: number
  query?: string
  tagId?: string | null
  onCreateNote: () => void
  onClearSearch?: () => void
  onClearTagFilter?: () => void
  onOpenHelp?: () => void
  onSelectNote?: (noteId: string) => void
  onToggleFavorite?: (noteId: string) => void
  onMoveToTrash?: (noteId: string) => void
  onRequestMoveToFolder?: (noteId: string) => void
  onDuplicateNote?: (noteId: string) => void
  onSetCover?: (noteId: string, cover: string | null) => void
  folderOptions?: MoveToFolderOption[]
  onMoveToFolder?: (noteId: string, folderId: string | null) => void | Promise<void>
}

export function NoteList({
  notes,
  totalCount,
  query = '',
  tagId = null,
  onCreateNote,
  onClearSearch,
  onClearTagFilter,
  onOpenHelp,
  onSelectNote,
  onToggleFavorite,
  onMoveToTrash,
  onRequestMoveToFolder,
  onDuplicateNote,
  onSetCover,
  folderOptions = [],
  onMoveToFolder,
}: NoteListProps) {
  const [viewMode, setViewMode] = useState<NoteViewMode>('grid')
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false)
  const selection = useIdSelection()

  const visibleIds = notes.map((note) => note.id)
  const selectedVisibleNoteIds = selection.selectedVisibleIds(visibleIds)
  const selectedVisibleNoteIdSet = new Set(selectedVisibleNoteIds)
  const selectionMode = selectedVisibleNoteIds.length > 0

  const latestUpdatedAt = notes[0]?.updatedAt ? formatUpdatedAt(notes[0].updatedAt) : '暂无更新'
  const trimmedQuery = query.trim()
  const hasSearch = trimmedQuery.length > 0
  const hasFilter = Boolean(tagId)
  const isEmpty = notes.length === 0
  const showFirstRun = totalCount === 0 && !hasSearch && !hasFilter

  const noteActions = {
    onToggleFavorite,
    onMoveToTrash,
    onRequestMoveToFolder,
    onDuplicate: onDuplicateNote,
    onSetCover,
  }
  const selectionActions = {
    selectionMode,
    onToggleSelection: selection.toggle,
    onStartSelection: selection.start,
  }

  function clearNoteSelection() {
    selection.clear()
    setBulkMoveOpen(false)
  }

  async function handleBulkMove(folderId: string | null) {
    if (!onMoveToFolder) {
      return
    }

    await Promise.all(selectedVisibleNoteIds.map((noteId) => onMoveToFolder(noteId, folderId)))
    clearNoteSelection()
  }

  async function handleBulkMoveToTrash() {
    if (!onMoveToTrash) {
      return
    }

    await Promise.all(selectedVisibleNoteIds.map((noteId) => onMoveToTrash(noteId)))
    clearNoteSelection()
  }

  return (
    <section>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="mb-2 font-headline-lg text-headline-lg text-on-surface">所有笔记</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            共 {totalCount} 篇笔记，最近更新于 {latestUpdatedAt}
          </p>
        </div>
        {!isEmpty && !selectionMode ? <NoteViewSwitcher value={viewMode} onChange={setViewMode} /> : null}
      </div>

      {selectionMode ? (
        <SelectionBar
          selectedCount={selectedVisibleNoteIds.length}
          totalCount={notes.length}
          canMove={Boolean(onMoveToFolder)}
          canDelete={Boolean(onMoveToTrash)}
          moveLabel="移动到文件夹"
          onSelectAll={() => selection.selectAllVisible(visibleIds)}
          onClearSelection={() => {
            if (selection.restoreBeforeSelectAll() === 'cleared') {
              setBulkMoveOpen(false)
            }
          }}
          onMove={() => setBulkMoveOpen(true)}
          onDelete={() => void handleBulkMoveToTrash()}
          onClear={clearNoteSelection}
        />
      ) : null}

      {showFirstRun ? (
        <FirstRunGuide onCreateNote={onCreateNote} onOpenHelp={onOpenHelp} />
      ) : isEmpty ? (
        <FilteredEmptyState
          query={query}
          tagId={tagId}
          searchTitle="没有找到相关笔记"
          filterDescription="没有笔记符合当前标签筛选。"
          onClearSearch={onClearSearch}
          onClearTagFilter={onClearTagFilter}
          fallback={
            <EmptyState
              icon={FileText}
              title="还没有笔记"
              description="创建一篇笔记，开始保存你的想法。"
              variant="notes"
              primaryAction={{ label: '新建笔记', onClick: onCreateNote }}
            />
          }
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-4 pb-24">
          {notes.map((note) => (
            <NoteListRow key={note.id} note={note} onSelect={onSelectNote} selected={selectedVisibleNoteIdSet.has(note.id)} {...selectionActions} {...noteActions} />
          ))}
          <DashedCreate layout="list" label="创建新笔记" iconVariant="plusCircle" onClick={onCreateNote} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pb-24 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {notes.map((note, index) => (
            <NoteCard
              key={note.id}
              note={note}
              featured={index === 0}
              onSelect={onSelectNote}
              selected={selectedVisibleNoteIdSet.has(note.id)}
              {...selectionActions}
              {...noteActions}
            />
          ))}
          <DashedCreate layout="card" label="创建新笔记" iconVariant="plusCircle" onClick={onCreateNote} />
        </div>
      )}
      {bulkMoveOpen ? (
        <MoveToFolderDialog
          title="移动所选笔记"
          description={`将 ${selectedVisibleNoteIds.length} 篇笔记移动到目标文件夹。`}
          initialFolderId={null}
          showCurrent={false}
          disableWhenUnchanged={false}
          folderOptions={folderOptions}
          onClose={() => setBulkMoveOpen(false)}
          onMove={handleBulkMove}
        />
      ) : null}
    </section>
  )
}

/** 兼容旧路径：从 NoteList 再导出 MoreControl */
export { NoteListRowMoreControl } from './NoteListRow'
