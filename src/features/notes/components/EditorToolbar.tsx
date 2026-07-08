import { Bold, CheckSquare, Heading1, Heading2, Image, Italic, Link, List, ListOrdered, Underline } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const textTools: Array<{ icon: LucideIcon; label: string; active: boolean }> = [
  { icon: Bold, label: '粗体', active: true },
  { icon: Italic, label: '斜体', active: false },
  { icon: Underline, label: '下划线', active: false },
]

const headingTools = [Heading1, Heading2]
const listTools = [List, ListOrdered, CheckSquare]
const insertTools = [Image, Link]

export function EditorToolbar() {
  return (
    <div className="mb-6 flex items-center gap-1 border-b border-outline-variant/30 bg-surface-container-lowest py-3">
      {textTools.map(({ icon: Icon, label, active }) => (
        <button key={label} type="button" className={`flex items-center justify-center rounded-full p-2 transition-colors ${active ? 'bg-surface-container-low text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`} title={label}>
          <Icon className="size-5" />
        </button>
      ))}
      <div className="mx-2 h-6 w-px bg-outline-variant/50" />
      {headingTools.map((Icon, index) => (
        <button key={index} type="button" className="flex items-center justify-center rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low" title={`标题 ${index + 1}`}>
          <Icon className="size-5" />
        </button>
      ))}
      <div className="mx-2 h-6 w-px bg-outline-variant/50" />
      {listTools.map((Icon, index) => (
        <button key={index} type="button" className="flex items-center justify-center rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low">
          <Icon className="size-5" />
        </button>
      ))}
      <div className="mx-2 h-6 w-px bg-outline-variant/50" />
      {insertTools.map((Icon, index) => (
        <button key={index} type="button" className="flex items-center justify-center rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low">
          <Icon className="size-5" />
        </button>
      ))}
    </div>
  )
}
