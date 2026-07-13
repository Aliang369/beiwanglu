/**
 * 版本历史面板
 * - 顶部固定显示"当前版本（正在编辑中）"条目
 * - 列表渲染真实快照（时间、标题、序号）
 * - 支持"预览"（编辑区替换为只读历史内容）和"恢复此版本"
 */
import { Eye, RotateCcw, X } from 'lucide-react'
import type { Snapshot } from '../../../shared/types/snapshot'

interface EditorHistoryPanelProps {
  snapshots: Snapshot[]
  /** 当前正在预览的快照 id；null 表示未在预览状态。 */
  previewingSnapshotId: string | null
  onPreview: (snapshotId: string) => void
  onRestore: (snapshotId: string) => void
  onExitPreview: () => void
  onClose: () => void
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    return `今天 ${hh}:${mm}`
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    return `昨天 ${hh}:${mm}`
  }
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${month}月${day}日 ${hh}:${mm}`
}

export function EditorHistoryPanel({
  snapshots,
  previewingSnapshotId,
  onPreview,
  onRestore,
  onExitPreview,
  onClose,
}: EditorHistoryPanelProps) {
  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-l border-outline-variant bg-surface">
      <div className="flex items-center justify-between border-b border-outline-variant/50 bg-surface-container-lowest px-6 py-5">
        <h2 className="font-headline-sm text-headline-sm text-on-background">版本历史</h2>
        <button type="button" onClick={onClose} className="rounded-full p-1 text-outline transition-colors hover:bg-surface-container hover:text-on-background">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {/* 当前版本（正在编辑中） */}
        <div className="relative rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 opacity-70">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">当前版本</span>
          </div>
          <p className="mb-3 font-label-md text-label-md text-on-background">正在编辑</p>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
              <RotateCcw className="size-3.5" /> 正在编辑中...
            </span>
            {previewingSnapshotId ? (
              <button
                type="button"
                onClick={onExitPreview}
                className="rounded-lg border border-primary/20 bg-secondary-container px-3 py-1.5 font-label-sm text-label-sm font-medium text-primary hover:bg-secondary-container/70"
              >
                退出预览
              </button>
            ) : null}
          </div>
        </div>

        {snapshots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant/30 p-6 text-center font-label-sm text-label-sm text-on-surface-variant">
            暂无历史版本
          </div>
        ) : null}

        {snapshots.map((snapshot) => {
          const active = previewingSnapshotId === snapshot.id
          return (
            <div
              key={snapshot.id}
              className={`group relative rounded-xl p-4 transition-all ${active ? 'border border-primary bg-secondary-container/20 shadow-sm' : 'border border-transparent hover:border-outline-variant/30 hover:bg-surface-container-lowest'}`}
            >
              {active ? <div className="absolute -left-px top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" /> : null}
              <div className="mb-2 flex items-center justify-between">
                <span className={`font-label-sm text-label-sm ${active ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>
                  历史记录
                </span>
                <span className={`font-label-sm text-label-sm ${active ? 'font-medium text-primary' : 'text-outline'}`}>{formatTime(snapshot.createdAt)}</span>
              </div>
              <p className="mb-3 font-label-md text-label-md text-on-background">{snapshot.title}</p>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant"><Eye className="size-3.5" /> {snapshot.noteTitle || '无标题'}</span>
                {active ? (
                  <button
                    type="button"
                    onClick={() => onRestore(snapshot.id)}
                    className="rounded-lg bg-primary px-3 py-1.5 font-label-sm text-label-sm font-medium text-on-primary shadow-sm hover:bg-primary-container"
                  >
                    恢复此版本
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onPreview(snapshot.id)}
                    className="rounded-lg border border-transparent px-3 py-1.5 font-label-sm text-label-sm font-medium text-primary opacity-0 transition-all hover:border-primary/20 hover:bg-secondary-container group-hover:opacity-100"
                  >
                    预览
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
