import { Grid2X2, List } from 'lucide-react'

export type NoteViewMode = 'grid' | 'list'

interface NoteViewSwitcherProps {
  value: NoteViewMode
  onChange: (value: NoteViewMode) => void
}

export function NoteViewSwitcher({ value, onChange }: NoteViewSwitcherProps) {
  return (
    <div className="hidden items-center rounded-full border border-outline-variant bg-surface-container-low p-1 sm:flex">
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`flex items-center gap-1 rounded-full px-4 py-2 transition-all ${
          value === 'grid' ? 'bg-secondary-container font-bold text-on-secondary-container shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <Grid2X2 className="size-4" />
        <span className="font-label-sm text-label-sm">网格</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`flex items-center gap-1 rounded-full px-4 py-2 transition-all ${
          value === 'list' ? 'bg-secondary-container font-bold text-on-secondary-container shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <List className="size-4" />
        <span className="font-label-sm text-label-sm">列表</span>
      </button>
    </div>
  )
}
