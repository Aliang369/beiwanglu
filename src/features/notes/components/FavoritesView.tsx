import { Star } from 'lucide-react'
import { useState } from 'react'
import type { Note } from '../../../shared/types/note'
import { EmptyState } from './EmptyState'
import { FilteredEmptyState } from './FilteredEmptyState'
import { FavoriteNoteCard } from './FavoriteNoteCard'
import { FavoriteNoteListItem } from './FavoriteNoteListItem'
import { NoteViewSwitcher, type NoteViewMode } from './NoteViewSwitcher'

interface FavoritesViewProps {
  notes: Note[]
  totalCount: number
  query?: string
  tagId?: string | null
  onClearSearch?: () => void
  onClearTagFilter?: () => void
  onViewAll?: () => void
  onSelectNote?: (noteId: string) => void
}

export function FavoritesView({ notes, totalCount, query = '', tagId = null, onClearSearch, onClearTagFilter, onViewAll, onSelectNote }: FavoritesViewProps) {
  const [viewMode, setViewMode] = useState<NoteViewMode>('grid')
  const trimmedQuery = query.trim()
  const hasSearch = trimmedQuery.length > 0
  const hasFilter = Boolean(tagId)
  const countLabel = hasSearch || hasFilter ? `当前显示 ${notes.length} / 共 ${totalCount} 篇收藏笔记` : `您标记为重要的 ${totalCount} 篇笔记`

  return (
    <main className="relative mx-auto w-full max-w-container-max-width flex-1 overflow-y-auto bg-surface-container-lowest p-gutter">
      <div className="mx-auto max-w-container-max-width">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="mb-2 font-headline-lg text-headline-lg text-on-surface">收藏夹</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{countLabel}</p>
          </div>
          {notes.length > 0 ? <NoteViewSwitcher value={viewMode} onChange={setViewMode} /> : null}
        </div>

        {notes.length > 0 ? (
          <>
            {viewMode === 'list' ? (
              <div className="space-y-4 pb-24">
                {notes.map((note) => (
                  <FavoriteNoteListItem key={note.id} note={note} onSelect={onSelectNote} />
                ))}
              </div>
            ) : (
              <div className="grid auto-rows-note-card grid-cols-1 gap-6 pb-24 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {notes.map((note, index) => (
                  <FavoriteNoteCard
                    key={note.id}
                    note={note}
                    variant={index === 0 ? 'featured' : 'default'}
                    onSelect={onSelectNote}
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
            searchDescription={`没有匹配“${trimmedQuery}”的收藏内容。`}
            filterDescription="收藏夹中没有符合当前标签筛选的笔记。"
            onClearSearch={onClearSearch}
            onClearTagFilter={onClearTagFilter}
            fallback={
              <EmptyState icon={Star} title="还没有收藏" description="把重要笔记标记为收藏后，它们会出现在这里。" variant="favorites" primaryAction={onViewAll ? { label: '查看所有笔记', onClick: onViewAll } : undefined} />
            }
          />
        )}
      </div>
    </main>
  )
}
