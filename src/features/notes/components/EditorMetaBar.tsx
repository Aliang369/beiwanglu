import { CalendarDays, Folder } from 'lucide-react'
import type { Note } from '../../../shared/types/note'
import { countVisibleNoteChars } from '../../../shared/notes/noteDomain'

interface EditorMetaBarProps {
  note: Note
  folderName?: string | null
  className?: string
  /** 与标签行同排时的紧凑样式 */
  compact?: boolean
  saveState?: 'saved' | 'editing'
}

/** 创建日期：同年 M月D日；跨年 YYYY年M月D日。不显示时刻。 */
function formatCreatedDate(iso: string) {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  const now = new Date()
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (date.getFullYear() !== now.getFullYear()) {
    return `${date.getFullYear()}年${month}月${day}日`
  }

  return `${month}月${day}日`
}

export function EditorMetaBar({ note, folderName, className = '', compact = false, saveState }: EditorMetaBarProps) {
  const chars = countVisibleNoteChars(note.title, note.content)
  const displayFolderName = folderName?.trim() || '未分类'
  const itemClass = compact
    ? 'inline-flex items-center gap-1 whitespace-nowrap font-label-sm text-label-sm text-on-surface-variant/80'
    : 'flex items-center gap-1.5'
  const iconClass = compact ? 'size-3.5 shrink-0' : 'size-4'
  const wrapClass = compact
    ? `inline-flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 ${className}`
    : `flex flex-wrap items-center gap-4 text-[13px] ${className}`

  return (
    <div className={wrapClass}>
      <span className={itemClass}>
        <Folder className={iconClass} />
        <span className="max-w-[8rem] truncate">{displayFolderName}</span>
      </span>
      <span className={itemClass}>
        <CalendarDays className={iconClass} />
        {formatCreatedDate(note.createdAt)}
      </span>
      <span className={itemClass}>共计{chars}字</span>
      {saveState ? (
        <span className={`${itemClass} ${saveState === 'editing' ? 'text-primary' : ''}`}>
          {saveState === 'editing' ? '保存中' : '已保存'}
        </span>
      ) : null}
    </div>
  )
}
