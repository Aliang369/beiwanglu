import { FileText, Folder, HelpCircle, Plus, Settings, Star, Trash2 } from 'lucide-react'
import type { ComponentType } from 'react'
import type { NotesView } from '../../../shared/types/note'

interface NavItem {
  id: NotesView
  label: string
  icon: ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { id: 'all', label: '所有笔记', icon: FileText },
  { id: 'favorites', label: '收藏夹', icon: Star },
  { id: 'trash', label: '废纸篓', icon: Trash2 },
  { id: 'folders', label: '文件夹', icon: Folder },
]

interface SidebarProps {
  activeView: NotesView
  activeUtilityView?: 'settings' | 'help' | 'messages' | null
  onViewChange: (view: NotesView) => void
  onCreateNote: () => void
  onSettingsClick?: () => void
  onHelpClick?: () => void
}

const activeNavClass = 'border-primary bg-surface-container-high text-primary active:opacity-80 active:scale-[0.99]'
const inactiveNavClass = 'border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-primary'

export function Sidebar({ activeView, activeUtilityView = null, onViewChange, onCreateNote, onSettingsClick, onHelpClick }: SidebarProps) {
  const noteNavActive = activeUtilityView === null
  const settingsActive = activeUtilityView === 'settings'
  const helpActive = activeUtilityView === 'help'

  return (
    <nav className="fixed top-0 left-0 z-20 hidden h-screen w-sidebar-width flex-col bg-surface-container-low py-stack-lg text-body-md text-primary md:flex">
      <div className="mb-8 flex items-center gap-4 px-gutter">
        <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-primary-container text-on-primary-container">
          <span className="font-label-md text-label-md text-white">灵</span>
        </div>
        <div>
          <h1 className="font-headline-sm text-headline-sm font-bold text-primary">我的记事本</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Productive Serenity</p>
        </div>
      </div>

      <div className="mb-8 px-gutter">
        <button
          type="button"
          onClick={onCreateNote}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-surface-container-high py-3 text-primary transition-all duration-200 hover:bg-primary-container hover:text-on-primary-container active:scale-95 shadow-card"
        >
          <Plus className="size-5" />
          <span className="font-label-md text-label-md">新建笔记</span>
        </button>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto px-4 pb-6">
        {navItems.map((item) => {
          const Icon = item.icon
          const isSelected = noteNavActive && item.id === activeView

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onViewChange(item.id)}
                className={`flex w-full items-center gap-3 rounded-r-full border-l-4 px-4 py-3 text-left font-label-md text-label-md transition-all ${isSelected ? activeNavClass : inactiveNavClass}`}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <ul className="mt-auto space-y-1 border-t border-outline-variant/30 px-4 pt-4 pb-6">
        <li>
          <button
            type="button"
            onClick={onSettingsClick}
            className={`flex w-full items-center gap-3 rounded-r-full border-l-4 px-4 py-3 text-left font-label-md text-label-md transition-all ${settingsActive ? activeNavClass : inactiveNavClass}`}
          >
            <Settings className="size-5" />
            <span>设置</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={onHelpClick}
            className={`flex w-full items-center gap-3 rounded-r-full border-l-4 px-4 py-3 text-left font-label-md text-label-md transition-all ${helpActive ? activeNavClass : inactiveNavClass}`}
          >
            <HelpCircle className="size-5" />
            <span>帮助</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
