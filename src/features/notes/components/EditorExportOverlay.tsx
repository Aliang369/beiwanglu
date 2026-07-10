// 改动：移除右上角 X，关闭统一用底部取消
import { Download, FileImage, FileText, Image, Minus, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface EditorExportOverlayProps {
  onClose: () => void
}

const exportFormats: Array<{ title: string; description: string; icon: LucideIcon; tone: string; active: boolean }> = [
  { title: 'PDF 文档', description: '适合打印与版式保留', icon: FileText, tone: 'bg-error-container text-on-error-container', active: true },
  { title: 'Markdown', description: '纯文本，适合再次编辑', icon: FileText, tone: 'bg-surface-variant text-on-surface', active: false },
  { title: '长图 (PNG)', description: '适合社交媒体分享', icon: FileImage, tone: 'bg-tertiary-container/20 text-tertiary', active: false },
]

export function EditorExportOverlay({ onClose }: EditorExportOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-background/20 backdrop-blur-sm">
      <div className="flex h-[580px] w-full max-w-[880px] overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-modal">
        <div className="flex w-[360px] flex-col border-r border-outline-variant bg-surface-container-lowest">
          <div className="border-b border-outline-variant/50 px-6 py-5">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">导出选项</h2>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <section>
              <h3 className="mb-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">选择格式</h3>
              <div className="space-y-3">
                {exportFormats.map(({ title, description, icon: Icon, tone, active }) => (
                  <label key={title} className="block cursor-pointer">
                    <div className={`flex items-center rounded-lg border p-3 transition-colors hover:bg-surface-container-low ${active ? 'border-primary bg-surface-container-low' : 'border-outline-variant bg-surface-container-lowest'}`}>
                      <div className={`mr-4 flex size-10 items-center justify-center rounded ${tone}`}><Icon className="size-5" /></div>
                      <div className="flex-1">
                        <div className="font-label-md text-label-md font-semibold text-on-surface">{title}</div>
                        <div className="mt-0.5 text-[12px] text-on-surface-variant">{description}</div>
                      </div>
                      <div className={`relative size-5 rounded-full border-2 ${active ? 'border-primary after:absolute after:left-1/2 after:top-1/2 after:size-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-primary' : 'border-outline-variant'}`} />
                    </div>
                  </label>
                ))}
              </div>
            </section>
            <section>
              <h3 className="mb-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">包含内容</h3>
              {['文档标题', '创建时间与标签', '背景图案 (仅图片)'].map((label, index) => (
                <div key={label} className="mb-4 flex items-center justify-between">
                  <span className={`font-label-md text-label-md text-on-surface ${index === 2 ? 'opacity-60' : ''}`}>{label}</span>
                  <div className={`h-6 w-10 rounded-full p-0.5 ${index < 2 ? 'bg-primary' : 'bg-surface-variant/50'}`}>
                    <div className={`size-5 rounded-full bg-white ${index < 2 ? 'translate-x-4' : 'opacity-70'}`} />
                  </div>
                </div>
              ))}
            </section>
          </div>
          <div className="flex gap-3 border-t border-outline-variant/50 bg-surface-bright p-6">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-outline-variant px-4 py-2.5 font-label-md text-label-md text-primary hover:bg-surface-container-low">取消</button>
            <button type="button" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 font-label-md text-label-md text-on-primary shadow-sm hover:bg-primary-container">
              <Download className="size-4" /> 导出文档
            </button>
          </div>
        </div>
        <div className="relative flex flex-1 flex-col bg-[#F1F5F9]">
          <div className="absolute left-0 top-0 z-10 flex w-full items-center justify-between bg-gradient-to-b from-[#F1F5F9] to-transparent p-4">
            <span className="rounded-full border border-outline-variant/20 bg-white/80 px-3 py-1 font-label-sm text-label-sm font-medium text-secondary shadow-sm backdrop-blur-sm">预览 - A4 纵向</span>
            <div className="flex gap-2"><button className="flex size-8 items-center justify-center rounded-full border border-outline-variant/20 bg-white/80 shadow-sm"><Minus className="size-4" /></button><button className="flex size-8 items-center justify-center rounded-full border border-outline-variant/20 bg-white/80 shadow-sm"><Plus className="size-4" /></button></div>
          </div>
          <div className="flex flex-1 items-start justify-center overflow-y-auto p-8 pt-16">
            <div className="flex min-h-[500px] w-[380px] flex-col rounded-sm border border-outline-variant/20 bg-white p-8 shadow-card">
              <div className="mb-4 border-b border-outline-variant/30 pb-4"><h1 className="mb-2 text-[18px] font-bold leading-tight text-on-surface">设计系统中的空间与排版韵律</h1><div className="flex gap-3 text-[10px] text-on-surface-variant"><span>2023年10月24日</span><span>标签: UI设计, 理论</span></div></div>
              <div className="space-y-4">{[100, 91, 100, 80].map((width, index) => <div key={index} className="h-2 rounded-full bg-surface-container-high" style={{ width: `${width}%` }} />)}<div className="flex h-[120px] items-center justify-center rounded bg-surface-variant"><Image className="size-8 text-outline-variant" /></div></div>
              <div className="mt-auto flex justify-between border-t border-outline-variant/20 pt-8 text-[8px] text-outline"><span>灵感笔录 Inspiration Notes</span><span>第 1 页</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
