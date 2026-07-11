const SEARCH_HISTORY_KEY = 'beiwanglu.searchHistory.v1'
export const SEARCH_HISTORY_LIMIT = 8

export function loadSearchHistory(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, SEARCH_HISTORY_LIMIT)
  } catch {
    return []
  }
}

export function saveSearchHistory(items: string[]) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(items.slice(0, SEARCH_HISTORY_LIMIT)))
  } catch {
    // ignore quota / private mode failures
  }
}

export function pushSearchHistory(query: string, current: string[] = loadSearchHistory()): string[] {
  const normalized = query.trim()
  if (!normalized) {
    return current
  }

  const next = [normalized, ...current.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(
    0,
    SEARCH_HISTORY_LIMIT,
  )
  saveSearchHistory(next)
  return next
}

export function removeSearchHistoryItem(query: string, current: string[] = loadSearchHistory()): string[] {
  const next = current.filter((item) => item !== query)
  saveSearchHistory(next)
  return next
}

export function clearSearchHistory() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch {
    // ignore
  }
}
