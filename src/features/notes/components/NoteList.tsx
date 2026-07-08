import { CheckSquare, Copy, FileText, FolderInput, Grid2X2, List, MoreVertical, PlusCircle, SearchX, Star, Tags, Trash2 } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import type { Note } from '../../../shared/types/note'
import { formatUpdatedAt } from '../../../shared/notes/noteSelectors'
import { EmptyState } from './EmptyState'
import { FirstRunGuide } from './FirstRunGuide'
import { NoteCard } from './NoteCard'

type NotesViewMode = 'grid' | 'list'

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
}

export function NoteList({ notes, totalCount, query = '', tagId = null, onCreateNote, onClearSearch, onClearTagFilter, onOpenHelp, onSelectNote, onToggleFavorite }: NoteListProps) {
  const [viewMode, setViewMode] = useState<NotesViewMode>('grid')
  const latestUpdatedAt = notes[0]?.updatedAt ? formatUpdatedAt(notes[0].updatedAt) : '暂无更新'
  const trimmedQuery = query.trim()
  const hasSearch = trimmedQuery.length > 0
  const hasFilter = Boolean(tagId)
  const isEmpty = notes.length === 0
  const showFirstRun = totalCount === 0 && !hasSearch && !hasFilter

  return (
    <section>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="mb-2 font-headline-lg text-headline-lg text-on-surface">所有笔记</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">共 {totalCount} 篇笔记，最近更新于 {latestUpdatedAt}</p>
        </div>
        {!isEmpty ? <div className="hidden items-center rounded-full border border-outline-variant bg-surface-container-low p-1 sm:flex">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1 rounded-full px-4 py-2 transition-all ${
              viewMode === 'grid' ? 'bg-secondary-container font-bold text-on-secondary-container shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <Grid2X2 className="size-4" />
            <span className="font-label-sm text-label-sm">网格</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 rounded-full px-4 py-2 transition-all ${
              viewMode === 'list' ? 'bg-secondary-container font-bold text-on-secondary-container shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <List className="size-4" />
            <span className="font-label-sm text-label-sm">列表</span>
          </button>
        </div> : null}
      </div>

      {showFirstRun ? (
        <FirstRunGuide onCreateNote={onCreateNote} onOpenHelp={onOpenHelp} />
      ) : hasSearch && isEmpty ? (
        <EmptyState
          icon={SearchX}
          title="没有找到相关笔记"
          description={`没有匹配“${trimmedQuery}”的内容。`}
          variant="search"
          primaryAction={onClearSearch ? { label: '清空搜索', onClick: onClearSearch } : undefined}
        />
      ) : hasFilter && isEmpty ? (
        <EmptyState
          icon={Tags}
          title="当前筛选没有结果"
          description="没有笔记符合当前标签筛选。"
          variant="filter"
          primaryAction={onClearTagFilter ? { label: '清除筛选', onClick: onClearTagFilter } : undefined}
        />
      ) : isEmpty ? (
        <EmptyState
          icon={FileText}
          title="还没有笔记"
          description="创建一篇笔记，开始保存你的想法。"
          variant="notes"
          primaryAction={{ label: '新建笔记', onClick: onCreateNote }}
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-4 pb-24">
          {notes.map((note) => (
            <NoteListRow key={note.id} note={note} onSelect={onSelectNote} onToggleFavorite={onToggleFavorite} />
          ))}
          <button
            type="button"
            onClick={onCreateNote}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant/50 bg-surface-container-lowest p-5 text-primary transition-colors duration-300 hover:border-primary hover:bg-surface-container-low active:scale-[0.99]"
          >
            <PlusCircle className="size-6 opacity-70" />
            <span className="font-label-md text-label-md">创建新笔记</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pb-24 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {notes.map((note, index) => (
            <NoteCard
              key={note.id}
              note={note}
              featured={index === 0}
              visual={note.id === 'design-inspo'}
              onSelect={onSelectNote}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
          <button
            type="button"
            onClick={onCreateNote}
            className="flex min-h-44 flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/50 bg-surface-container-lowest p-5 text-primary transition-colors duration-300 hover:border-primary hover:bg-surface-container-low active:scale-[0.99]"
          >
            <PlusCircle className="mb-2 size-9 opacity-70" />
            <span className="font-label-md text-label-md">创建新笔记</span>
          </button>
        </div>
      )}
    </section>
  )
}

function NoteListRow({ note, onSelect, onToggleFavorite }: { note: Note; onSelect?: (noteId: string) => void; onToggleFavorite?: (noteId: string) => void }) {
  const primaryTag = note.tags[0]
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  function handleFavoriteClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onToggleFavorite?.(note.id)
  }

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

      <div className="ml-0 flex shrink-0 items-center gap-1 opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 lg:ml-4">
        <button type="button" onClick={handleFavoriteClick} aria-label={note.isFavorite ? '取消收藏' : '添加收藏'} aria-pressed={note.isFavorite} className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container hover:text-primary">
          <Star className="size-5" fill={note.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button type="button" onClick={(event) => event.stopPropagation()} className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container hover:text-error">
          <Trash2 className="size-5" />
        </button>
        <NoteListRowMoreControl open={menuOpen} onToggle={setMenuOpen} onClose={closeMenu} />
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="font-label-md text-label-md font-medium text-on-surface">{formatUpdatedAt(note.updatedAt)}</p>
        <p className="font-label-sm text-label-sm text-outline">修改于 {formatClockTime(note.updatedAt)}</p>
      </div>
    </article>
  )
}

export function NoteListRowMoreControl({ open, onToggle, onClose }: { open: boolean; onToggle: (open: boolean) => void; onClose: () => void }) {
  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onToggle(!open)
  }

  return (
    <div
      className="relative w-max"
      onClick={(event) => event.stopPropagation()}
      onMouseEnter={() => onToggle(true)}
      onMouseLeave={() => onToggle(false)}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={`flex size-9 items-center justify-center rounded-full text-outline transition-all hover:bg-surface-container-low hover:text-primary focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-fixed ${
          open ? 'bg-surface-container-low text-primary' : ''
        }`}
      >
        <MoreVertical className="size-5" />
      </button>
      <NoteListRowActionMenu open={open} onClose={onClose} />
    </div>
  )
}

function NoteListRowActionMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  function handleItemClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onClose()
  }

  return (
    <div
      className={`absolute top-full right-0 z-40 pt-2 transition-all duration-150 ${
        open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
      }`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="w-44 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-2 shadow-lg">
        <button type="button" onClick={handleItemClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low">
          <FolderInput className="size-4 text-on-surface-variant" />
          <span>移动到文件夹</span>
        </button>
        <button type="button" onClick={handleItemClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low">
          <CheckSquare className="size-4 text-on-surface-variant" />
          <span>多选</span>
        </button>
        <button type="button" onClick={handleItemClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low">
          <Copy className="size-4 text-on-surface-variant" />
          <span>复制笔记</span>
        </button>
      </div>
    </div>
  )
}

function formatClockTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}
