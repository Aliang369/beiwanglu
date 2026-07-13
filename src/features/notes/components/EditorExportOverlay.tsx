/**
 * 导出文档覆盖层
 * - 格式：PDF / Word(.docx) / 长图(PNG) 三选一（飞书对齐）
 * - 预览区渲染真实笔记内容（标题 + 元信息 + 正文）
 * - 缩放按钮做实（50%-150%，默认 100%）
 * - 三种格式导出均已实现：PNG/PDF 基于预览 DOM，Word 基于 editor JSON
 */
import { Download, FileImage, FileText, Minus, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import type { Note } from '../../../shared/types/note'
import { exportNoteToDocx, exportNoteToPdf, exportNoteToPng } from '../../../shared/notes/noteExport'

type ExportFormat = 'pdf' | 'docx' | 'png'

interface ExportFormatOption {
  key: ExportFormat
  title: string
  description: string
  icon: LucideIcon
  tone: string
}

const EXPORT_FORMATS: ExportFormatOption[] = [
  { key: 'pdf', title: 'PDF 文档', description: '适合打印与版式保留', icon: FileText, tone: 'bg-error-container text-on-error-container' },
  { key: 'docx', title: 'Word (.docx)', description: '可继续编辑，兼容 Office', icon: FileText, tone: 'bg-primary-container text-on-primary-container' },
  { key: 'png', title: '长图 (PNG)', description: '适合社交媒体分享', icon: FileImage, tone: 'bg-tertiary-container/20 text-tertiary' },
]

interface EditorExportOverlayProps {
  note: Note
  editor: Editor | null
  onClose: () => void
}

const MIN_SCALE = 50
const MAX_SCALE = 150
const SCALE_STEP = 10

export function EditorExportOverlay({ note, editor, onClose }: EditorExportOverlayProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [scale, setScale] = useState(100)
  const [exporting, setExporting] = useState(false)
  const paperRef = useRef<HTMLDivElement>(null)

  const html = useMemo(() => {
    if (!editor) {
      return ''
    }
    return editor.getHTML()
  }, [editor])

  const tagText = note.tags.map((tag) => tag.name).join(', ')
  const formatLabel = EXPORT_FORMATS.find((item) => item.key === format)?.title ?? ''

  function zoomIn() {
    setScale((value) => Math.min(MAX_SCALE, value + SCALE_STEP))
  }

  function zoomOut() {
    setScale((value) => Math.max(MIN_SCALE, value - SCALE_STEP))
  }

  async function handleExport() {
    if (exporting) {
      return
    }

    const fileName = note.title || '未命名笔记'

    // Word 导出：基于 editor JSON，不依赖 DOM 渲染
    if (format === 'docx') {
      if (!editor) {
        return
      }
      setExporting(true)
      try {
        await exportNoteToDocx(editor.getJSON(), note, fileName)
      } finally {
        setExporting(false)
      }
      return
    }

    // PNG / PDF：基于预览 DOM 渲染
    if (!paperRef.current) {
      return
    }
    setExporting(true)
    // 导出时临时重置缩放，保证原始尺寸渲染
    const node = paperRef.current
    const originalTransform = node.style.transform
    node.style.transform = 'scale(1)'
    try {
      if (format === 'png') {
        await exportNoteToPng(node, fileName)
      } else if (format === 'pdf') {
        await exportNoteToPdf(node, fileName)
      }
    } finally {
      node.style.transform = originalTransform
      setExporting(false)
    }
  }

  const exportButtonLabel = exporting ? '导出中...' : '导出文档'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/20 backdrop-blur-sm">
      <div className="flex h-[580px] w-full max-w-[880px] overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-modal">
        <div className="flex w-[360px] flex-col border-r border-outline-variant bg-surface-container-lowest">
          <div className="border-b border-outline-variant/50 px-6 py-5">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">导出选项</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <section>
              <h3 className="mb-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">选择格式</h3>
              <div className="space-y-3">
                {EXPORT_FORMATS.map(({ key, title, description, icon: Icon, tone }) => {
                  const active = format === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormat(key)}
                      className={`flex w-full items-center rounded-lg border p-3 text-left transition-colors hover:bg-surface-container-low ${active ? 'border-primary bg-surface-container-low' : 'border-outline-variant bg-surface-container-lowest'}`}
                    >
                      <div className={`mr-4 flex size-10 items-center justify-center rounded ${tone}`}>
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-label-md text-label-md font-semibold text-on-surface">{title}</div>
                        <div className="mt-0.5 text-[12px] text-on-surface-variant">{description}</div>
                      </div>
                      <div className={`relative size-5 rounded-full border-2 ${active ? 'border-primary after:absolute after:left-1/2 after:top-1/2 after:size-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-primary' : 'border-outline-variant'}`} />
                    </button>
                  )
                })}
              </div>
            </section>
          </div>
          <div className="flex gap-3 border-t border-outline-variant/50 bg-surface-bright p-6">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-outline-variant px-4 py-2.5 font-label-md text-label-md text-primary hover:bg-surface-container-low">取消</button>
            <button type="button" onClick={handleExport} disabled={exporting} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:cursor-wait disabled:opacity-70">
              <Download className="size-4" /> {exportButtonLabel}
            </button>
          </div>
        </div>
        <div className="relative flex flex-1 flex-col bg-[#F1F5F9]">
          <div className="absolute left-0 top-0 z-10 flex w-full items-center justify-between bg-gradient-to-b from-[#F1F5F9] to-transparent p-4">
            <span className="rounded-full border border-outline-variant/20 bg-white/80 px-3 py-1 font-label-sm text-label-sm font-medium text-secondary shadow-sm backdrop-blur-sm">
              预览 - {formatLabel}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={zoomOut}
                disabled={scale <= MIN_SCALE}
                className="flex size-8 items-center justify-center rounded-full border border-outline-variant/20 bg-white/80 shadow-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="缩小预览"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-[44px] text-center font-label-sm text-label-sm text-on-surface-variant">{scale}%</span>
              <button
                type="button"
                onClick={zoomIn}
                disabled={scale >= MAX_SCALE}
                className="flex size-8 items-center justify-center rounded-full border border-outline-variant/20 bg-white/80 shadow-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="放大预览"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-start justify-center overflow-y-auto p-8 pt-16">
            <div
              ref={paperRef}
              className="flex min-h-[500px] w-[380px] origin-top flex-col rounded-sm border border-outline-variant/20 bg-white p-8 shadow-card transition-transform"
              style={{ transform: `scale(${scale / 100})` }}
            >
              <div className="mb-4 border-b border-outline-variant/30 pb-4">
                <h1 className="mb-2 text-[18px] font-bold leading-tight text-on-surface">{note.title || '无标题'}</h1>
                {tagText ? (
                  <div className="flex flex-wrap gap-3 text-[10px] text-on-surface-variant">
                    <span>标签: {tagText}</span>
                  </div>
                ) : null}
              </div>
              <div
                className="tiptap-content export-preview space-y-3 text-[12px] leading-relaxed text-on-surface"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: html || '<p class="text-on-surface-variant">暂无内容</p>' }}
              />
              <div className="mt-auto flex justify-between border-t border-outline-variant/20 pt-8 text-[8px] text-outline">
                <span>灵感笔录</span>
                <span>{note.title || '笔记'} · {formatLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
