// 改动：增加设置/更换/移除封面菜单项；增加置顶/取消置顶菜单项
import { Download, FolderInput, History, ImageOff, ImagePlus, Info, Pin, Trash2 } from 'lucide-react'

interface EditorActionMenuProps {
  hasCover?: boolean
  isPinned?: boolean
  onShowInfo: () => void
  onShowHistory: () => void
  onShowExport: () => void
  onSetCover?: () => void
  onRemoveCover?: () => void
  onTogglePinned?: () => void
  onMoveToFolder?: () => void
  onMoveToTrash: () => void
}

export function EditorActionMenu({
  hasCover = false,
  isPinned = false,
  onShowInfo,
  onShowHistory,
  onShowExport,
  onSetCover,
  onRemoveCover,
  onTogglePinned,
  onMoveToFolder,
  onMoveToTrash,
}: EditorActionMenuProps) {
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
      {onTogglePinned ? (
        <button type="button" onClick={onTogglePinned} className="flex w-full items-center gap-3 px-4 py-2 text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary">
          <Pin className="size-4" /> {isPinned ? '取消置顶' : '置顶笔记'}
        </button>
      ) : null}
      {onMoveToFolder ? (
        <button type="button" onClick={onMoveToFolder} className="flex w-full items-center gap-3 px-4 py-2 text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary">
          <FolderInput className="size-4" /> 移动到文件夹
        </button>
      ) : null}
      {onSetCover ? (
        <button type="button" onClick={onSetCover} className="flex w-full items-center gap-3 px-4 py-2 text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary">
          <ImagePlus className="size-4" /> {hasCover ? '更换封面' : '设置封面'}
        </button>
      ) : null}
      {onRemoveCover && hasCover ? (
        <button type="button" onClick={onRemoveCover} className="flex w-full items-center gap-3 px-4 py-2 text-left font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary">
          <ImageOff className="size-4" /> 移除封面
        </button>
      ) : null}
      <div className="my-1 border-t border-outline-variant/20" />
      <button type="button" onClick={onMoveToTrash} className="flex w-full items-center gap-3 px-4 py-2 text-left font-label-md text-label-md text-error hover:bg-error-container/20">
        <Trash2 className="size-4" /> 删除笔记
      </button>
    </div>
  )
}
