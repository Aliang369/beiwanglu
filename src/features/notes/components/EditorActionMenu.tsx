import { Download, FolderInput, History, Info, Trash2 } from 'lucide-react'

interface EditorActionMenuProps {
  onShowInfo: () => void
  onShowHistory: () => void
  onShowExport: () => void
  onMoveToTrash: () => void
}

export function EditorActionMenu({ onShowInfo, onShowHistory, onShowExport, onMoveToTrash }: EditorActionMenuProps) {
  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-2 shadow-modal">
      <button type="button" onClick={onShowInfo} className="flex w-full items-center gap-3 px-4 py-2 text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary">
        <Info className="size-4" /> 笔记信息
      </button>
      <button type="button" onClick={onShowHistory} className="flex w-full items-center gap-3 px-4 py-2 text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary">
        <History className="size-4" /> 版本历史
      </button>
      <button type="button" onClick={onShowExport} className="flex w-full items-center gap-3 px-4 py-2 text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary">
        <Download className="size-4" /> 导出文档
      </button>
      <button type="button" className="flex w-full items-center gap-3 px-4 py-2 text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary">
        <FolderInput className="size-4" /> 移动到文件夹
      </button>
      <div className="my-1 border-t border-outline-variant/20" />
      <button type="button" onClick={onMoveToTrash} className="flex w-full items-center gap-3 px-4 py-2 text-left font-label-md text-label-md text-error hover:bg-error-container/20">
        <Trash2 className="size-4" /> 删除笔记
      </button>
    </div>
  )
}
