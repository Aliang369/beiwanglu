import { CalendarDays, Edit3, FolderOpen } from 'lucide-react'
import type { Note } from '../../../shared/types/note'
import { formatUpdatedAt } from '../../../shared/notes/noteSelectors'

interface EditorMetaBarProps {
  note: Note
  className?: string
}

export function EditorMetaBar({ note, className }: EditorMetaBarProps) {
  const wordCount = note.content.replace(/\s+/g, '').length

  return (
    <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 font-label-md text-label-md text-on-surface-variant ${className ?? ''}`}>
      <span className="flex items-center gap-1.5 hover:text-primary">
        <FolderOpen className="size-4" /> {note.folderId ?? '未归档'}
      </span>
      <span className="flex items-center gap-1.5">
        <CalendarDays className="size-4" /> {formatUpdatedAt(note.updatedAt)}
      </span>
      <span className="flex items-center gap-1.5">
        <Edit3 className="size-4" /> 约 {wordCount || 0} 字
      </span>
    </div>
  )
}
