import { Eye, RotateCcw, X } from 'lucide-react'

interface EditorHistoryPanelProps {
  onClose: () => void
}

export function EditorHistoryPanel({ onClose }: EditorHistoryPanelProps) {
  const versions = [
    { id: 'current', label: '当前版本', time: '今天 15:42', title: '系统自动保存', active: false },
    { id: 'preview', label: '正在预览', time: '今天 14:30', title: '更新了层级规范说明', active: true },
    { id: 'old-1', label: '历史记录', time: '昨天 18:15', title: '初始草稿提交', active: false },
    { id: 'old-2', label: '历史记录', time: '9月 12日 10:05', title: '大纲构建完成', active: false },
  ]

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-l border-outline-variant bg-surface">
      <div className="flex items-center justify-between border-b border-outline-variant/50 bg-surface-container-lowest px-6 py-5">
        <h2 className="font-headline-sm text-headline-sm text-on-background">版本历史</h2>
        <button type="button" onClick={onClose} className="rounded-full p-1 text-outline transition-colors hover:bg-surface-container hover:text-on-background">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {versions.map((version) => (
          <div key={version.id} className={`relative rounded-xl p-4 transition-all ${version.active ? 'border border-primary bg-secondary-container/20 shadow-sm' : 'border border-transparent hover:border-outline-variant/30 hover:bg-surface-container-lowest'} ${version.id === 'current' ? 'border-outline-variant/30 bg-surface-container-lowest opacity-70' : ''}`}>
            {version.active ? <div className="absolute -left-px top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" /> : null}
            <div className="mb-2 flex items-center justify-between">
              <span className={`font-label-sm text-label-sm ${version.active ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>{version.label}</span>
              <span className={`font-label-sm text-label-sm ${version.active ? 'font-medium text-primary' : 'text-outline'}`}>{version.time}</span>
            </div>
            <p className="mb-3 font-label-md text-label-md text-on-background">{version.title}</p>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant"><Eye className="size-3.5" /> Lin</span>
              {version.active ? (
                <button type="button" className="rounded-lg bg-primary px-3 py-1.5 font-label-sm text-label-sm font-medium text-on-primary shadow-sm hover:bg-primary-container">
                  恢复此版本
                </button>
              ) : version.id !== 'current' ? (
                <button type="button" className="rounded-lg border border-transparent px-3 py-1.5 font-label-sm text-label-sm font-medium text-primary opacity-0 transition-all hover:border-primary/20 hover:bg-secondary-container group-hover:opacity-100">
                  预览
                </button>
              ) : (
                <span className="flex items-center gap-1 font-label-sm text-label-sm text-outline-variant"><RotateCcw className="size-3.5" /> 正在编辑中...</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
