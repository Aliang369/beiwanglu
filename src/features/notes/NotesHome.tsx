import { useEffect, useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { AuthModal } from '../auth/AuthModal'
import type { AuthMode } from '../auth/AuthModal'
import { EditorView } from './components/EditorView'
import { FavoritesView } from './components/FavoritesView'
import { FoldersView } from './components/FoldersView'
import { HelpView } from './components/HelpView'
import { MessageCenterView } from './components/MessageCenterView'
import { MessageDetailModal } from './components/MessageDetailModal'
import { NoteList } from './components/NoteList'
import { SettingsView } from './components/SettingsView'
import type { SettingsTab } from './components/SettingsView'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { TrashView } from './components/TrashView'
import type { MessageItem } from './components/messageMockData'
import { useNotesStore } from './notesStore'
import { getVisibleNotes } from '../../shared/notes/noteSelectors'

export function NotesHome() {
  const {
    notes,
    filter,
    isLoaded,
    loadNotes,
    createNote,
    selectNote,
    updateSelectedNote,
    toggleFavorite,
    moveToTrash,
    setView,
    setQuery,
    setTagFilter,
  } = useNotesStore()
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [utilityView, setUtilityView] = useState<'settings' | 'help' | 'messages' | null>(null)
  const [authModal, setAuthModal] = useState<AuthMode | null>(null)
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile')
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null)

  useEffect(() => {
    if (!isLoaded) {
      void loadNotes()
    }
  }, [isLoaded, loadNotes])

  const visibleNotes = getVisibleNotes(notes, filter)
  const activeTotal = notes.filter((note) => !note.isDeleted).length
  const favoriteTotal = notes.filter((note) => note.isFavorite && !note.isDeleted).length
  const trashTotal = notes.filter((note) => note.isDeleted).length
  const editingNote = notes.find((note) => note.id === editingNoteId)

  function handleViewChange(view: Parameters<typeof setView>[0]) {
    setUtilityView(null)
    setEditingNoteId(null)
    setView(view)
  }

  function handleShowAllNotes() {
    setUtilityView(null)
    setEditingNoteId(null)
    setView('all')
  }

  function handleSettingsClick() {
    setEditingNoteId(null)
    setSettingsTab('profile')
    setUtilityView('settings')
  }

  function handleHelpClick() {
    setEditingNoteId(null)
    setUtilityView('help')
  }

  function handleProfileClick() {
    setEditingNoteId(null)
    setSettingsTab('profile')
    setUtilityView('settings')
  }

  function handleAccountSettingsClick() {
    setEditingNoteId(null)
    setSettingsTab('security')
    setUtilityView('settings')
  }

  function handleMessagesClick() {
    setEditingNoteId(null)
    setUtilityView('messages')
  }

  function handleSwitchAccount() {
    setAuthModal('login')
  }

  function handleLogout() {
    // TODO: 接入真实退出登录逻辑。
    setAuthModal(null)
  }

  let mainContent: ReactNode

  if (editingNoteId) {
    mainContent = (
      <EditorView
        note={editingNote}
        onBack={() => setEditingNoteId(null)}
        onChange={(patch) => {
          if (editingNote) {
            selectNote(editingNote.id)
            void updateSelectedNote(patch)
          }
        }}
        onToggleFavorite={(noteId) => void toggleFavorite(noteId)}
        onMoveToTrash={(noteId) => {
          void moveToTrash(noteId)
          setEditingNoteId(null)
        }}
      />
    )
  } else if (utilityView === 'settings') {
    mainContent = <SettingsView initialTab={settingsTab} />
  } else if (utilityView === 'help') {
    mainContent = <HelpView />
  } else if (utilityView === 'messages') {
    mainContent = (
      <>
        <Toolbar
          query={filter.query}
          onQueryChange={setQuery}
          onProfileClick={handleProfileClick}
          onAccountSettingsClick={handleAccountSettingsClick}
          onSwitchAccountClick={handleSwitchAccount}
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
          onQueryChange={setQuery}
          onProfileClick={handleProfileClick}
          onAccountSettingsClick={handleAccountSettingsClick}
          onSwitchAccountClick={handleSwitchAccount}
          onLogoutClick={handleLogout}
          onMessagesClick={handleMessagesClick}
          onMessageOpen={setSelectedMessage}
        />
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
          />
        ) : filter.view === 'folders' ? (
          <FoldersView
            notes={notes}
            visibleNotes={visibleNotes}
            query={filter.query}
            tagId={filter.tagId}
            onClearSearch={() => setQuery('')}
            onClearTagFilter={() => setTagFilter(null)}
            onSelectNote={setEditingNoteId}
          />
        ) : (
          <main className="relative mx-auto w-full max-w-container-max-width flex-1 overflow-y-auto p-gutter">
            <NoteList
              notes={visibleNotes}
              totalCount={activeTotal}
              query={filter.query}
              tagId={filter.tagId}
              onCreateNote={() => void createNote()}
              onClearSearch={() => setQuery('')}
              onClearTagFilter={() => setTagFilter(null)}
              onOpenHelp={handleHelpClick}
              onSelectNote={setEditingNoteId}
              onToggleFavorite={(noteId) => void toggleFavorite(noteId)}
              onMoveToTrash={(noteId) => void moveToTrash(noteId)}
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
        onCreateNote={() => void createNote()}
        onSettingsClick={handleSettingsClick}
        onHelpClick={handleHelpClick}
      />
      <div className="flex h-screen flex-col bg-surface-container-lowest md:ml-sidebar-width">
        {mainContent}
      </div>

      <button
        type="button"
        onClick={() => void createNote()}
        className="fixed right-6 bottom-6 z-30 flex size-14 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-xl transition-all hover:bg-primary active:scale-95 md:hidden"
      >
        <Plus className="size-6" />
      </button>
      {authModal ? <AuthModal mode={authModal} onModeChange={setAuthModal} onClose={() => setAuthModal(null)} /> : null}
      {selectedMessage ? <MessageDetailModal message={selectedMessage} onClose={() => setSelectedMessage(null)} /> : null}
    </div>
  )
}
