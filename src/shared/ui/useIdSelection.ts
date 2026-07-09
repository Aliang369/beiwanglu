import { useCallback, useRef, useState } from 'react'

interface UseIdSelectionOptions {
  /** 在修改选择前调用，例如互斥清空另一套选择 */
  onBeforeChange?: () => void
}

/**
 * 通用多选状态机：toggle / start / selectAll / restore / clear。
 * 可见集合由调用方传入，hook 本身不绑定数据源。
 */
export function useIdSelection(options: UseIdSelectionOptions = {}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const beforeSelectAllRef = useRef<string[] | null>(null)
  const onBeforeChangeRef = useRef(options.onBeforeChange)
  onBeforeChangeRef.current = options.onBeforeChange

  const runBeforeChange = useCallback(() => {
    onBeforeChangeRef.current?.()
  }, [])

  const selectedVisibleIds = useCallback(
    (visibleIds: readonly string[]) => {
      const visible = new Set(visibleIds)
      return selectedIds.filter((id) => visible.has(id))
    },
    [selectedIds],
  )

  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds])

  const toggle = useCallback(
    (id: string) => {
      runBeforeChange()
      setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
    },
    [runBeforeChange],
  )

  const start = useCallback(
    (id: string) => {
      runBeforeChange()
      setSelectedIds((current) => (current.includes(id) ? current : [...current, id]))
    },
    [runBeforeChange],
  )

  const clear = useCallback(() => {
    beforeSelectAllRef.current = null
    setSelectedIds([])
  }, [])

  const selectAllVisible = useCallback(
    (visibleIds: readonly string[]) => {
      runBeforeChange()
      const visibleSet = new Set(visibleIds)
      beforeSelectAllRef.current = selectedIds.filter((id) => visibleSet.has(id))
      setSelectedIds([...visibleIds])
    },
    [runBeforeChange, selectedIds],
  )

  const restoreBeforeSelectAll = useCallback((): 'restored' | 'cleared' => {
    const snapshot = beforeSelectAllRef.current
    beforeSelectAllRef.current = null

    if (snapshot && snapshot.length > 0) {
      setSelectedIds(snapshot)
      return 'restored'
    }

    clear()
    return 'cleared'
  }, [clear])

  return {
    selectedIds,
    selectedVisibleIds,
    isSelected,
    selectionMode: selectedIds.length > 0,
    toggle,
    start,
    clear,
    selectAllVisible,
    restoreBeforeSelectAll,
  }
}

export type IdSelection = ReturnType<typeof useIdSelection>
