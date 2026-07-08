import { Plus } from 'lucide-react'
import { EmptyState } from './EmptyState'

export function FoldersEmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Plus}
      title="还没有文件夹"
      description="用文件夹整理不同主题的笔记。"
      variant="folders"
      primaryAction={onCreate ? { label: '新建文件夹', onClick: onCreate } : undefined}
    />
  )
}
