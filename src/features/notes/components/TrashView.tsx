import { Info, Trash } from 'lucide-react'
import { useState } from 'react'
import type { Note } from '../../../shared/types/note'
import { ConfirmDialog } from './ConfirmDialog'
import { FilteredEmptyState } from './FilteredEmptyState'
import { NoteViewSwitcher, type NoteViewMode } from './NoteViewSwitcher'
import { TrashEmptyState } from './TrashEmptyState'
import { TrashNoteCard } from './TrashNoteCard'
import { TrashNoteListItem } from './TrashNoteListItem'

interface TrashViewProps {
  notes: Note[]
  totalCount: number
  query?: string
  tagId?: string | null
  onClearSearch?: () => void
  onClearTagFilter?: () => void
  onViewAll?: () => void
  onRestoreNote?: (noteId: string) => void
  onPermanentlyDeleteNote?: (noteId: string) => void | Promise<void>
  onEmptyTrash?: () => void | Promise<void>
}

type TrashConfirmState =
  | { type: 'delete'; note: Note }
  | { type: 'empty' }
  | null

export function TrashView({ notes, totalCount, query = '', tagId = null, onClearSearch, onClearTagFilter, onViewAll, onRestoreNote, onPermanentlyDeleteNote, onEmptyTrash }: TrashViewProps) {
  const [viewMode, setViewMode] = useState<NoteViewMode>('grid')
  const [confirmState, setConfirmState] = useState<TrashConfirmState>(null)
  const trimmedQuery = query.trim()
  const hasSearch = trimmedQuery.length > 0
  const hasFilter = Boolean(tagId)
  const countLabel = hasSearch || hasFilter ? `当前显示 ${notes.length} / 共 ${totalCount} 篇已删除笔记` : '笔记将在 30 天后永久删除'

  async function handleConfirm() {
    if (!confirmState) {
      return
    }

    if (confirmState.type === 'delete') {
      await onPermanentlyDeleteNote?.(confirmState.note.id)
    } else {
      await onEmptyTrash?.()
    }

    setConfirmState(null)
  }

  return (
    <main className="relative mx-auto w-full max-w-container-max-width flex-1 overflow-y-auto bg-surface-container-lowest p-gutter">
      <div className="mx-auto max-w-container-max-width">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="mb-2 font-headline-lg text-headline-lg text-on-surface">废纸篓</h1>
            <p className="flex items-center gap-1 font-body-md text-body-md text-on-surface-variant">
              <Info className="size-[18px]" />
              {countLabel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {notes.length > 0 ? (
              <button
                type="button"
                onClick={() => setConfirmState({ type: 'empty' })}
                className="flex cursor-pointer items-center gap-2 rounded-full bg-error-container/40 px-6 py-2.5 font-label-md text-label-md text-error shadow-sm transition-colors duration-200 hover:bg-error-container/60 hover:shadow-md active:scale-95"
              >
                <Trash className="size-5" />
                清空废纸篓
              </button>
            ) : null}
            {notes.length > 0 ? <NoteViewSwitcher value={viewMode} onChange={setViewMode} /> : null}
          </div>
        </div>

        {notes.length > 0 ? (
          <>
            {viewMode === 'list' ? (
              <div className="space-y-4 pb-24">
                {notes.map((note) => (
                  <TrashNoteListItem
                    key={note.id}
                    note={note}
                    onRestore={onRestoreNote}
                    onPermanentlyDelete={() => setConfirmState({ type: 'delete', note })}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 pb-24 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {notes.map((note, index) => (
                  <TrashNoteCard
                    key={note.id}
                    note={note}
                    index={index}
                    onRestore={onRestoreNote}
                    onPermanentlyDelete={() => setConfirmState({ type: 'delete', note })}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <FilteredEmptyState
            query={query}
            tagId={tagId}
            searchTitle="没有找到相关笔记"
            searchDescription={`废纸篓中没有匹配“${trimmedQuery}”的内容。`}
            filterDescription="废纸篓中没有符合当前标签筛选的笔记。"
            onClearSearch={onClearSearch}
            onClearTagFilter={onClearTagFilter}
            fallback={<TrashEmptyState onViewAll={onViewAll} />}
          />
        )}
      </div>

      {confirmState?.type === 'delete' ? (
        <ConfirmDialog
          description={
            <>
              将永久删除“{confirmState.note.title || '未命名笔记'}”。
              <span className="mt-1 block text-error">删除后无法恢复，请确认后再继续。</span>
            </>
          }
          confirmLabel="永久删除"
          isDestructive
          onClose={() => setConfirmState(null)}
          onConfirm={handleConfirm}
        />
      ) : null}

      {confirmState?.type === 'empty' ? (
        <ConfirmDialog
          description={
            <>
              将清空废纸篓中的 {notes.length} 篇笔记。
              <span className="mt-1 block text-error">此操作不可撤销，所有内容会立刻从本地移除。</span>
            </>
          }
          confirmLabel="清空废纸篓"
          isDestructive
          onClose={() => setConfirmState(null)}
          onConfirm={handleConfirm}
        />
      ) : null}
    </main>
  )
}
