// 改动：透传 onSetCover / updateNote 以支持封面读写；挂载标签筛选
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { AuthModal } from '../auth/AuthModal'
import type { AuthMode } from '../auth/AuthModal'
import type { MockUserAccount } from '../auth/LoginView'
import { EditorView } from './components/EditorView'
import { FavoritesView } from './components/FavoritesView'
import { FoldersView } from './components/FoldersView'
import { HelpView } from './components/HelpView'
import { MessageCenterView } from './components/MessageCenterView'
import { MessageDetailModal } from './components/MessageDetailModal'
import { MoveToFolderDialog, type MoveToFolderOption } from './components/MoveToFolderDialog'
import { NoteList } from './components/NoteList'
import { SettingsView } from './components/SettingsView'
import type { SettingsTab } from './components/SettingsView'
import { Sidebar } from './components/Sidebar'
import { TagFilterBar } from './components/TagFilterBar'
import { Toolbar } from './components/Toolbar'
import { TrashView } from './components/TrashView'
import type { MessageItem } from './components/messageMockData'
import { useNotesStore } from './notesStore'
import { getAllTags, getVisibleNotes } from '../../shared/notes/noteSelectors'

const AUTH_ACCOUNT_STORAGE_KEY = 'beiwanglu.auth.account.v1'

function loadStoredAccount(): MockUserAccount | null {
  try {
    const stored = window.localStorage.getItem(AUTH_ACCOUNT_STORAGE_KEY)
    if (!stored) {
      return null
    }

    const parsed: unknown = JSON.parse(stored)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof Reflect.get(parsed, 'account') !== 'string' ||
      typeof Reflect.get(parsed, 'name') !== 'string' ||
      typeof Reflect.get(parsed, 'email') !== 'string'
    ) {
      return null
    }

    return {
      account: Reflect.get(parsed, 'account'),
      name: Reflect.get(parsed, 'name'),
      email: Reflect.get(parsed, 'email'),
      bio: typeof Reflect.get(parsed, 'bio') === 'string' ? Reflect.get(parsed, 'bio') : '',
      avatarUrl: typeof Reflect.get(parsed, 'avatarUrl') === 'string' ? Reflect.get(parsed, 'avatarUrl') : null,
    }
  } catch {
    return null
  }
}

export function NotesHome() {
  const {
    notes,
    folders,
    filter,
    isLoaded,
    loadNotes,
    createNote,
    duplicateNote,
    selectNote,
    updateSelectedNote,
    updateNote,
    toggleFavorite,
    togglePinned,
    toggleReadOnly,
    moveToTrash,
    restoreNote,
    permanentlyDeleteNote,
    emptyTrash,
    moveToFolder,
    createFolder,
    renameFolder,
    moveFolders,
    deleteFolders,
    setView,
    setQuery,
    setTagFilter,
    snapshots,
    loadSnapshots,
    createSnapshot,
    restoreSnapshot,
  } = useNotesStore()
  const [editingNoteId, setEditingNoteId] = useState<string | null>(() => new URL(window.location.href).searchParams.get('note'))
  const [utilityView, setUtilityView] = useState<'settings' | 'help' | 'messages' | null>(null)
  const [authModal, setAuthModal] = useState<AuthMode | null>(null)
  const [account, setAccount] = useState<MockUserAccount | null>(loadStoredAccount)
  const isAuthenticated = account !== null
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile')
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null)
  const [movingNoteId, setMovingNoteId] = useState<string | null>(null)
  const [previewingSnapshotId, setPreviewingSnapshotId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) {
      void loadNotes()
    }
  }, [isLoaded, loadNotes])

  useEffect(() => {
    if (!isLoaded || !editingNoteId) {
      return
    }
    const target = notes.find((note) => note.id === editingNoteId && !note.isDeleted)
    if (!target) {
      setEditingNoteId(null)
      setPreviewingSnapshotId(null)
    }
  }, [editingNoteId, isLoaded, notes])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (editingNoteId) {
      url.searchParams.set('note', editingNoteId)
    } else {
      url.searchParams.delete('note')
    }
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }, [editingNoteId])

  useEffect(() => {
    function handlePopState() {
      const noteId = new URL(window.location.href).searchParams.get('note')
      setEditingNoteId(noteId)
      setPreviewingSnapshotId(null)
      setUtilityView(null)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const visibleNotes = getVisibleNotes(notes, filter)
  const allTags = getAllTags(notes.filter((note) => !note.isDeleted || filter.view === 'trash'))
  const activeTotal = notes.filter((note) => !note.isDeleted).length
  const favoriteTotal = notes.filter((note) => note.isFavorite && !note.isDeleted).length
  const trashTotal = notes.filter((note) => note.isDeleted).length
  const editingNote = notes.find((note) => note.id === editingNoteId)
  const movingNote = movingNoteId ? notes.find((note) => note.id === movingNoteId) ?? null : null
  const folderOptions: MoveToFolderOption[] = [
    { id: null, name: '无文件夹', noteCount: notes.filter((note) => !note.folderId && !note.isDeleted).length },
    ...folders
      .slice()
      .sort((a, b) => {
        const ap = a.parentId ? 1 : 0
        const bp = b.parentId ? 1 : 0
        if (ap !== bp) return ap - bp
        return a.name.localeCompare(b.name, 'zh-CN')
      })
      .map((folder) => ({
        id: folder.id,
        name: folder.parentId ? `　${folder.name}` : folder.name,
        noteCount: notes.filter((note) => note.folderId === folder.id && !note.isDeleted).length,
      })),
  ]

  /** 退出编辑页：清除编辑 id 与预览状态 */
  const exitEditor = useCallback(() => {
    setEditingNoteId(null)
    setPreviewingSnapshotId(null)
  }, [])

  function handleViewChange(view: Parameters<typeof setView>[0]) {
    setUtilityView(null)
    exitEditor()
    setView(view)
  }

  function handleShowAllNotes() {
    setUtilityView(null)
    exitEditor()
    setView('all')
  }

  function handleSettingsClick() {
    exitEditor()
    if (!isAuthenticated) {
      setAuthModal('login')
      return
    }
    setSettingsTab('profile')
    setUtilityView('settings')
  }

  function handleHelpClick() {
    exitEditor()
    setUtilityView('help')
  }

  function handleProfileClick() {
    exitEditor()
    setSettingsTab('profile')
    setUtilityView('settings')
  }

  function handleAccountSettingsClick() {
    exitEditor()
    setSettingsTab('security')
    setUtilityView('settings')
  }

  function handleMessagesClick() {
    exitEditor()
    setUtilityView('messages')
  }

  function persistAccount(nextAccount: MockUserAccount) {
    try {
      window.localStorage.setItem(AUTH_ACCOUNT_STORAGE_KEY, JSON.stringify(nextAccount))
      setAccount(nextAccount)
      return true
    } catch {
      return false
    }
  }

  function handleAuthenticated(nextAccount: MockUserAccount) {
    if (!persistAccount(nextAccount)) {
      setAccount(nextAccount)
    }
    setAuthModal(null)
  }

  function handleLogout() {
    window.localStorage.removeItem(AUTH_ACCOUNT_STORAGE_KEY)
    setAccount(null)
    setAuthModal(null)
    setUtilityView(null)
    exitEditor()
    setView('all')
    window.history.replaceState(null, '', '/')
  }

  async function handleCreateNote() {
    setUtilityView(null)
    const note = await createNote()
    setEditingNoteId(note.id)
  }

  let mainContent: ReactNode

  if (editingNoteId) {
    mainContent = (
      <EditorView
        note={editingNote}
        folders={folders}
        availableTags={allTags}
        snapshots={editingNote ? snapshots[editingNote.id] ?? [] : []}
        previewingSnapshotId={previewingSnapshotId}
        onBack={exitEditor}
        onChange={(patch) => {
          if (editingNote) {
            selectNote(editingNote.id)
            void updateSelectedNote(patch)
          }
        }}
        onToggleFavorite={(noteId) => void toggleFavorite(noteId)}
        onTogglePinned={(noteId) => void togglePinned(noteId)}
        onToggleReadOnly={(noteId) => void toggleReadOnly(noteId)}
        onMoveToTrash={(noteId) => {
          void moveToTrash(noteId)
          exitEditor()
        }}
        onRequestMoveToFolder={(noteId) => setMovingNoteId(noteId)}
        onSubmitSearch={(query) => {
          setQuery(query)
          exitEditor()
        }}
        onSaved={(noteId, content, title) => {
          createSnapshot(noteId, content, title)
        }}
        onLoadSnapshots={(noteId) => loadSnapshots(noteId)}
        onPreviewSnapshot={(snapshotId) => setPreviewingSnapshotId(snapshotId)}
        onExitPreview={() => setPreviewingSnapshotId(null)}
        onRestoreSnapshot={async (snapshotId) => {
          if (editingNote) {
            await restoreSnapshot(editingNote.id, snapshotId)
            setPreviewingSnapshotId(null)
          }
        }}
      />
    )
  } else if (utilityView === 'settings' && account) {
    mainContent = (
      <SettingsView
        initialTab={settingsTab}
        account={account}
        onAccountChange={(nextAccount) => {
          if (!persistAccount(nextAccount)) {
            throw new Error('local-storage-full')
          }
        }}
      />
    )
  } else if (utilityView === 'help') {
    mainContent = <HelpView />
  } else if (utilityView === 'messages') {
    mainContent = (
      <>
        <Toolbar
          query={filter.query}
          isAuthenticated={isAuthenticated}
          account={account}
          onQueryChange={setQuery}
          onRefresh={() => loadNotes()}
          onLoginClick={() => setAuthModal('login')}
          onProfileClick={handleProfileClick}
          onAccountSettingsClick={handleAccountSettingsClick}
          onLogoutClick={handleLogout}
          onMessagesClick={handleMessagesClick}
          onMessageOpen={setSelectedMessage}
        />
        <MessageCenterView onMessageOpen={setSelectedMessage} />
      </>
    )
  } else {
    mainContent = (
      <>
        <Toolbar
          query={filter.query}
          isAuthenticated={isAuthenticated}
          account={account}
          onQueryChange={setQuery}
          onRefresh={() => loadNotes()}
          onLoginClick={() => setAuthModal('login')}
          onProfileClick={handleProfileClick}
          onAccountSettingsClick={handleAccountSettingsClick}
          onLogoutClick={handleLogout}
          onMessagesClick={handleMessagesClick}
          onMessageOpen={setSelectedMessage}
        />
        <TagFilterBar tags={allTags} selectedTagId={filter.tagId} onTagChange={setTagFilter} />
        {filter.view === 'favorites' ? (
          <FavoritesView
            notes={visibleNotes}
            totalCount={favoriteTotal}
            query={filter.query}
            tagId={filter.tagId}
            onClearSearch={() => setQuery('')}
            onClearTagFilter={() => setTagFilter(null)}
            onViewAll={handleShowAllNotes}
            onSelectNote={setEditingNoteId}
          />
        ) : filter.view === 'trash' ? (
          <TrashView
            notes={visibleNotes}
            totalCount={trashTotal}
            query={filter.query}
            tagId={filter.tagId}
            onClearSearch={() => setQuery('')}
            onClearTagFilter={() => setTagFilter(null)}
            onViewAll={handleShowAllNotes}
            onRestoreNote={(noteId) => void restoreNote(noteId)}
            onPermanentlyDeleteNote={(noteId) => void permanentlyDeleteNote(noteId)}
            onEmptyTrash={() => void emptyTrash()}
          />
        ) : filter.view === 'folders' ? (
          <FoldersView
            notes={notes}
            folders={folders}
            visibleNotes={visibleNotes}
            query={filter.query}
            tagId={filter.tagId}
            onClearSearch={() => setQuery('')}
            onClearTagFilter={() => setTagFilter(null)}
            onSelectNote={setEditingNoteId}
            onToggleFavorite={(noteId) => toggleFavorite(noteId)}
            onTogglePinned={(noteId) => togglePinned(noteId)}
            onMoveNoteToTrash={(noteId) => moveToTrash(noteId)}
            onRequestMoveNoteToFolder={setMovingNoteId}
            onMoveNoteToFolder={(noteId, folderId) => moveToFolder(noteId, folderId)}
            onDuplicateNote={(noteId) => duplicateNote(noteId)}
            onSetCover={(noteId, cover) => {
              selectNote(noteId)
              void updateNote(noteId, { cover })
            }}
            folderOptions={folderOptions}
            onCreateFolder={async (name, parentId) => { await createFolder({ name, parentId }) }}
            onRenameFolder={(folderId, name) => renameFolder(folderId, name)}
            onMoveFolders={(folderIds, parentId) => moveFolders(folderIds, parentId)}
            onDeleteFolders={(folderIds) => deleteFolders(folderIds)}
          />
        ) : (
          <main className="relative mx-auto w-full max-w-container-max-width flex-1 overflow-y-auto p-gutter">
            <NoteList
              notes={visibleNotes}
              totalCount={activeTotal}
              query={filter.query}
              tagId={filter.tagId}
              onCreateNote={() => void handleCreateNote()}
              onClearSearch={() => setQuery('')}
              onClearTagFilter={() => setTagFilter(null)}
              onOpenHelp={handleHelpClick}
              onSelectNote={setEditingNoteId}
              onToggleFavorite={(noteId) => void toggleFavorite(noteId)}
              onTogglePinned={(noteId) => void togglePinned(noteId)}
              onMoveToTrash={(noteId) => moveToTrash(noteId)}
              onRequestMoveToFolder={setMovingNoteId}
              onDuplicateNote={(noteId) => void duplicateNote(noteId)}
              onSetCover={(noteId, cover) => {
                selectNote(noteId)
                void updateNote(noteId, { cover })
              }}
              folderOptions={folderOptions}
              onMoveToFolder={(noteId, folderId) => moveToFolder(noteId, folderId)}
            />
          </main>
        )}
      </>
    )
  }

  return (
    <div className="h-screen overflow-hidden bg-surface text-on-surface">
      <Sidebar
        activeView={filter.view}
        activeUtilityView={utilityView}
        onViewChange={handleViewChange}
        onCreateNote={() => void handleCreateNote()}
        onSettingsClick={handleSettingsClick}
        onHelpClick={handleHelpClick}
      />
      <div className="flex h-screen flex-col bg-surface-container-lowest md:ml-sidebar-width">
        {mainContent}
      </div>

      <button
        type="button"
        onClick={() => void handleCreateNote()}
        className="fixed right-6 bottom-6 z-30 flex size-14 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-xl transition-all hover:bg-primary active:scale-95 md:hidden"
      >
        <Plus className="size-6" />
      </button>
      {authModal ? <AuthModal mode={authModal} onModeChange={setAuthModal} onAuthenticated={handleAuthenticated} onClose={() => setAuthModal(null)} /> : null}
      {movingNote ? (
        <MoveToFolderDialog
          note={movingNote}
          folderOptions={folderOptions}
          onClose={() => setMovingNoteId(null)}
          onMove={async (folderId) => {
            await moveToFolder(movingNote.id, folderId)
            setMovingNoteId(null)
          }}
        />
      ) : null}
      {selectedMessage ? <MessageDetailModal message={selectedMessage} onClose={() => setSelectedMessage(null)} /> : null}
    </div>
  )
}
