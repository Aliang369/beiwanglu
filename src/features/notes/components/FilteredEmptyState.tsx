import type { LucideIcon } from 'lucide-react'
import { SearchX, Tags } from 'lucide-react'
import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'

interface FilteredEmptyStateProps {
  query?: string
  tagId?: string | null
  /** 搜索无结果时的描述；默认带 query 插值 */
  searchTitle?: string
  searchDescription?: string
  filterTitle?: string
  filterDescription?: string
  onClearSearch?: () => void
  onClearTagFilter?: () => void
  compact?: boolean
  /** 无搜索/筛选时的兜底空状态 */
  fallback?: ReactNode
}

/**
 * 统一「搜索无结果 / 筛选无结果 / 领域空态」分支。
 * 有搜索或筛选且调用方已判断列表为空时使用。
 */
export function FilteredEmptyState({
  query = '',
  tagId = null,
  searchTitle = '没有找到相关内容',
  searchDescription,
  filterTitle = '当前筛选没有结果',
  filterDescription = '没有内容符合当前标签筛选。',
  onClearSearch,
  onClearTagFilter,
  compact,
  fallback = null,
}: FilteredEmptyStateProps) {
  const trimmedQuery = query.trim()
  const hasSearch = trimmedQuery.length > 0
  const hasFilter = Boolean(tagId)

  if (hasSearch) {
    return (
      <EmptyState
        icon={SearchX as LucideIcon}
        title={searchTitle}
        description={searchDescription ?? `没有匹配“${trimmedQuery}”的内容。`}
        variant="search"
        compact={compact}
        primaryAction={onClearSearch ? { label: '清空搜索', onClick: onClearSearch } : undefined}
      />
    )
  }

  if (hasFilter) {
    return (
      <EmptyState
        icon={Tags as LucideIcon}
        title={filterTitle}
        description={filterDescription}
        variant="filter"
        compact={compact}
        primaryAction={onClearTagFilter ? { label: '清除筛选', onClick: onClearTagFilter } : undefined}
      />
    )
  }

  return <>{fallback}</>
}
