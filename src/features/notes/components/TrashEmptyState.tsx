import { Trash2 } from 'lucide-react'
import { EmptyState } from './EmptyState'

export function TrashEmptyState({ onViewAll }: { onViewAll?: () => void }) {
  return (
    <EmptyState
      icon={Trash2}
      title="废纸篓是空的"
      description="删除的笔记会暂时保存在这里，方便你恢复或彻底清理。"
      variant="trash"
      primaryAction={onViewAll ? { label: '返回所有笔记', onClick: onViewAll } : undefined}
    />
  )
}
