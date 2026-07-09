/**
 * 多选/打开 点击分流：disabled → 忽略；selectionMode → toggle；否则 activate。
 */
export function handleSelectableActivate(options: {
  disabled?: boolean
  selectionMode?: boolean
  onToggle?: () => void
  onActivate?: () => void
}) {
  if (options.disabled) {
    return
  }
  if (options.selectionMode) {
    options.onToggle?.()
    return
  }
  options.onActivate?.()
}
