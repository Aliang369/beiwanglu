import { CalendarDays, Eye, FileText, Pin, Timer, X } from 'lucide-react'
import type { Note, NoteTag } from '../../../shared/types/note'
import { formatUpdatedAt } from '../../../shared/notes/noteSelectors'
import { countVisibleNoteChars } from '../../../shared/notes/noteDomain'
import { NoteEditorTags } from './NoteEditorTags'

interface EditorInfoPanelProps {
  note: Note
  availableTags?: NoteTag[]
  onChangeTags?: (tags: NoteTag[]) => void
  onClose: () => void
}

export function EditorInfoPanel({ note, availableTags = [], onChangeTags, onClose }: EditorInfoPanelProps) {
  const chars = countVisibleNoteChars(note.title, note.content)
  const readingMinutes = Math.max(1, Math.ceil(chars / 500))


  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-outline-variant/40 bg-surface shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-outline-variant/30 px-6">
        <div className="flex items-center gap-2 text-on-surface">
          <FileText className="size-5 text-primary" />
          <h2 className="font-headline-sm text-headline-sm text-on-surface">笔记信息</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-1 text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-6">
        <section>
          <h3 className="mb-4 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">基本属性</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
              <FileText className="mb-2 size-5 text-tertiary-container" />
              <span className="block font-label-sm text-label-sm text-on-surface-variant">字符数</span>
              <span className="font-headline-sm text-[18px] font-semibold text-on-surface">{chars}</span>
            </div>
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
              <Timer className="mb-2 size-5 text-tertiary-container" />
              <span className="block font-label-sm text-label-sm text-on-surface-variant">预计阅读时间</span>
              <span className="font-headline-sm text-[18px] font-semibold text-on-surface">{readingMinutes} 分钟</span>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant"><CalendarDays className="size-4" />创建日期</span>
              <span className="text-[14px] text-on-surface">{formatUpdatedAt(note.createdAt)}</span>
            </div>
            <div className="my-3 h-px bg-outline-variant/20" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant"><CalendarDays className="size-4" />最后修改时间</span>
              <span className="text-[14px] text-on-surface">{formatUpdatedAt(note.updatedAt)}</span>
            </div>
          </div>
        </section>
        <section>
          {onChangeTags ? (
            <NoteEditorTags
              tags={note.tags}
              availableTags={availableTags}
              onChange={onChangeTags}
              variant="panel"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <span key={tag.id} className="inline-flex items-center rounded-full border border-outline-variant/30 bg-surface-container-low px-3 py-1.5 text-[13px] text-on-surface-variant">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </section>
        <section className="mt-auto border-t border-outline-variant/30 pt-6">
          <h3 className="mb-4 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">偏好设置</h3>
          {[['只读模式', '锁定内容防止意外修改', Eye], ['置顶笔记', '在列表顶部优先显示', Pin]].map(([title, desc, Icon], index) => (
            <div key={title as string} className="-mx-2 flex items-center justify-between rounded-lg p-2 hover:bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-surface-container text-on-surface-variant"><Icon className="size-4" /></div>
                <div>
                  <span className="block font-label-md text-label-md text-on-surface">{title as string}</span>
                  <span className="font-label-sm text-[11px] text-on-surface-variant">{desc as string}</span>
                </div>
              </div>
              <div className={`h-6 w-11 rounded-full p-0.5 ${index === 1 ? 'bg-primary' : 'bg-outline-variant/50'}`}>
                <div className={`size-5 rounded-full bg-white transition-transform ${index === 1 ? 'translate-x-5' : ''}`} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </aside>
  )
}
