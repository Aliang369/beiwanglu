import { useState } from 'react'
import { ArrowLeft, FileText, SearchX, Star, Tags, Trash2 } from 'lucide-react'
import type { Note } from '../../../shared/types/note'
import { formatUpdatedAt } from '../../../shared/notes/noteSelectors'
import { EmptyState } from './EmptyState'
import { AddFolderListItem, FolderListItem } from './FolderListItem'
import { AddFolderCard, FolderCard, type FolderItem } from './FolderCard'
import { CreateFolderDialog } from './CreateFolderDialog'
import { FoldersEmptyState } from './FoldersEmptyState'
import { FoldersSelectionBar } from './FoldersSelectionBar'
import { NoteCard } from './NoteCard'
import { NoteListRowMoreControl } from './NoteList'
import { NoteViewSwitcher, type NoteViewMode } from './NoteViewSwitcher'

function formatClockTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

interface FoldersViewProps {
  notes: Note[]
  visibleNotes: Note[]
  query?: string
  tagId?: string | null
  onClearSearch?: () => void
  onClearTagFilter?: () => void
  onSelectNote?: (noteId: string) => void
}

export const folderNames: Record<string, { name: string; icon: FolderItem['icon'] }> = {
  inbox: { name: '收件箱', icon: 'folder' },
  work: { name: '工作项目', icon: 'work' },
  study: { name: '学习笔记', icon: 'study' },
  personal: { name: '个人生活', icon: 'folder' },
}

export function FoldersView({ notes, visibleNotes, query = '', tagId = null, onClearSearch, onClearTagFilter, onSelectNote }: FoldersViewProps) {
  const [customFolders, setCustomFolders] = useState<Array<Omit<FolderItem, 'noteCount'>>>([])
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<NoteViewMode>('grid')
  const [detailViewMode, setDetailViewMode] = useState<NoteViewMode>('grid')
  const [createOpen, setCreateOpen] = useState(false)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const selectionMode = selectedFolderIds.length > 0
  const noteFolders = Array.from(
    new Set(notes.filter((note) => note.folderId && !note.isDeleted).map((note) => note.folderId as string)),
  ).map((folderId) => {
    const latestNote = notes
      .filter((note) => note.folderId === folderId && !note.isDeleted)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
    const folderMeta = folderNames[folderId] ?? { name: folderId, icon: 'folder' as const }

    return {
      id: folderId,
      name: folderMeta.name,
      updatedLabel: latestNote ? formatUpdatedAt(latestNote.updatedAt) : '暂无更新',
      icon: folderMeta.icon,
    }
  })
  const folders = [...customFolders, ...noteFolders.filter((folder) => !customFolders.some((custom) => custom.id === folder.id))]
  const folderItems = folders.map((folder) => ({
    ...folder,
    noteCount: notes.filter((note) => note.folderId === folder.id && !note.isDeleted).length,
    visibleNoteCount: visibleNotes.filter((note) => note.folderId === folder.id && !note.isDeleted).length,
  }))
  const activeFolder = activeFolderId ? folderItems.find((folder) => folder.id === activeFolderId) ?? null : null
  const activeFolderTotalNotes = activeFolder ? notes.filter((note) => note.folderId === activeFolder.id && !note.isDeleted) : []
  const activeFolderNotes = activeFolder ? visibleNotes.filter((note) => note.folderId === activeFolder.id && !note.isDeleted) : []
  const trimmedQuery = query.trim()
  const hasSearch = trimmedQuery.length > 0
  const hasFilter = Boolean(tagId)

  function createFolder(name: string) {
    setCustomFolders((current) => [
      { id: `folder-${Date.now()}`, name, updatedLabel: '刚刚创建', icon: 'folder' },
      ...current,
    ])
    setCreateOpen(false)
  }

  const existingNames = folders.map((folder) => folder.name)

  function toggleFolder(folderId: string) {
    setSelectedFolderIds((current) =>
      current.includes(folderId) ? current.filter((id) => id !== folderId) : [...current, folderId],
    )
  }

  function startSelection(folderId: string) {
    setSelectedFolderIds((current) => (current.includes(folderId) ? current : [...current, folderId]))
  }

  function openFolder(folderId: string) {
    setSelectedFolderIds([])
    setActiveFolderId(folderId)
  }

  if (activeFolder) {
    return (
      <main className="relative mx-auto w-full max-w-container-max-width flex-1 overflow-y-auto bg-surface-container-lowest p-gutter">
        <div className="mx-auto max-w-container-max-width">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h1 className="mb-2 font-headline-lg text-headline-lg text-on-surface">{activeFolder.name}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {hasSearch || hasFilter ? `当前显示 ${activeFolderNotes.length} / 共 ${activeFolderTotalNotes.length} 篇笔记` : `共 ${activeFolderTotalNotes.length} 篇笔记 · ${activeFolder.updatedLabel}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveFolderId(null)}
                className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:border-primary hover:bg-surface-container-low hover:text-primary"
              >
                <ArrowLeft className="size-4" />
                返回文件夹
              </button>
              {activeFolderNotes.length > 0 ? <NoteViewSwitcher value={detailViewMode} onChange={setDetailViewMode} /> : null}
            </div>
          </div>

          {activeFolderNotes.length === 0 ? (
            hasSearch ? (
              <EmptyState icon={SearchX} title="没有找到相关笔记" description={`这个文件夹中没有匹配“${trimmedQuery}”的内容。`} variant="search" primaryAction={onClearSearch ? { label: '清空搜索', onClick: onClearSearch } : undefined} compact />
            ) : hasFilter ? (
              <EmptyState icon={Tags} title="当前筛选没有结果" description="这个文件夹中没有符合当前标签筛选的笔记。" variant="filter" primaryAction={onClearTagFilter ? { label: '清除筛选', onClick: onClearTagFilter } : undefined} compact />
            ) : (
              <EmptyState icon={FileText} title="这个文件夹还没有笔记" description="归类到这里的笔记会显示在这个页面。" variant="folders" compact />
            )
          ) : detailViewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 pb-24 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {activeFolderNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  visual={note.id === 'design-inspo'}
                  onSelect={onSelectNote}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4 pb-24">
              {activeFolderNotes.map((note) => (
                <FolderNoteListRow key={note.id} note={note} onSelect={onSelectNote} />
              ))}
            </div>
          )}
        </div>
      </main>
    )
  }

  const visibleFolderItems = hasSearch || hasFilter ? folderItems.filter((folder) => folder.visibleNoteCount > 0) : folderItems

  if (folderItems.length === 0) {
    return (
      <main className="relative mx-auto w-full max-w-container-max-width flex-1 overflow-y-auto bg-surface-container-lowest p-gutter">
        <div className="mx-auto flex min-h-full max-w-container-max-width flex-col items-center justify-center">
          {hasSearch ? (
            <EmptyState icon={SearchX} title="没有找到相关文件夹" description={`没有匹配“${trimmedQuery}”的文件夹或笔记。`} variant="search" primaryAction={onClearSearch ? { label: '清空搜索', onClick: onClearSearch } : undefined} />
          ) : hasFilter ? (
            <EmptyState icon={Tags} title="当前筛选没有结果" description="没有文件夹包含当前标签筛选的笔记。" variant="filter" primaryAction={onClearTagFilter ? { label: '清除筛选', onClick: onClearTagFilter } : undefined} />
          ) : (
            <FoldersEmptyState onCreate={() => setCreateOpen(true)} />
          )}
        </div>
        {createOpen ? <CreateFolderDialog existingNames={existingNames} onClose={() => setCreateOpen(false)} onCreate={createFolder} /> : null}
      </main>
    )
  }

  if (visibleFolderItems.length === 0 && (hasSearch || hasFilter)) {
    return (
      <main className="relative mx-auto w-full max-w-container-max-width flex-1 overflow-y-auto bg-surface-container-lowest p-gutter">
        <div className="mx-auto max-w-container-max-width">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h1 className="mb-2 font-headline-lg text-headline-lg text-on-surface">我的文件夹</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">管理和整理您分类保存的笔记。</p>
            </div>
          </div>
          {hasSearch ? (
            <EmptyState icon={SearchX} title="没有找到相关文件夹" description={`没有匹配“${trimmedQuery}”的文件夹或笔记。`} variant="search" primaryAction={onClearSearch ? { label: '清空搜索', onClick: onClearSearch } : undefined} />
          ) : (
            <EmptyState icon={Tags} title="当前筛选没有结果" description="没有文件夹包含当前标签筛选的笔记。" variant="filter" primaryAction={onClearTagFilter ? { label: '清除筛选', onClick: onClearTagFilter } : undefined} />
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="relative mx-auto w-full max-w-container-max-width flex-1 overflow-y-auto bg-surface-container-lowest p-gutter">
      <div className="mx-auto max-w-container-max-width">
        {selectionMode ? <FoldersSelectionBar selectedCount={selectedFolderIds.length} onClear={() => setSelectedFolderIds([])} /> : null}

        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="mb-2 font-headline-lg text-headline-lg text-on-surface">我的文件夹</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">管理和整理您分类保存的笔记。</p>
          </div>
          {selectionMode ? null : <NoteViewSwitcher value={viewMode} onChange={setViewMode} />}
        </div>

        {viewMode === 'list' && !selectionMode ? (
          <div className="space-y-4 pb-24">
            {visibleFolderItems.map((folder) => (
              <FolderListItem key={folder.id} folder={folder} onOpen={openFolder} onStartSelection={startSelection} />
            ))}
            <AddFolderListItem onClick={() => setCreateOpen(true)} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 pb-24 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleFolderItems.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                selectionMode={selectionMode}
                selected={selectedFolderIds.includes(folder.id)}
                onToggle={toggleFolder}
                onStartSelection={startSelection}
                onOpen={openFolder}
              />
            ))}
            <AddFolderCard disabled={selectionMode} onClick={() => setCreateOpen(true)} />
          </div>
        )}
      </div>
      {createOpen ? <CreateFolderDialog existingNames={existingNames} onClose={() => setCreateOpen(false)} onCreate={createFolder} /> : null}
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
