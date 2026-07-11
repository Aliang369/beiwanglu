import type { ReactNode } from 'react'
import { parseSearchTerms } from '../notes/noteSelectors'

const highlightClassName =
  'rounded-sm bg-secondary-container px-0.5 font-medium text-primary [box-decoration-break:clone]'

/**
 * 将文本中与搜索词匹配的片段用 mark 高亮。
 * 多关键词按 OR 匹配；无 query 时原样返回。
 */
export function highlightSearchMatch(text: string, query?: string | null): ReactNode {
  const source = text ?? ''
  const terms = parseSearchTerms(query ?? '')

  if (!source || terms.length === 0) {
    return source
  }

  const uniqueTerms = [...new Set(terms)].sort((a, b) => b.length - a.length)
  const escaped = uniqueTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = source.split(pattern)

  if (parts.length === 1) {
    return source
  }

  const lowerTerms = new Set(uniqueTerms)

  return parts.map((part, index) => {
    if (!part) {
      return null
    }

    if (lowerTerms.has(part.toLowerCase())) {
      return (
        <mark key={`${part}-${index}`} className={highlightClassName}>
          {part}
        </mark>
      )
    }

    return <span key={`${part}-${index}`}>{part}</span>
  })
}
