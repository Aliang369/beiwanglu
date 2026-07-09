import { Plus, PlusCircle } from 'lucide-react'

interface DashedCreateProps {
  label: string
  onClick?: () => void
  disabled?: boolean
  layout: 'card' | 'list'
  /** card 布局下用 Plus 圆圈，list 用 PlusCircle 行内 */
  iconVariant?: 'plus' | 'plusCircle'
}

/** 网格/列表共用的虚线「新建」入口 */
export function DashedCreate({ label, onClick, disabled = false, layout, iconVariant }: DashedCreateProps) {
  const useCircle = iconVariant === 'plusCircle' || (iconVariant === undefined && layout === 'list')

  if (layout === 'list') {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 transition-colors duration-300 active:scale-[0.99] ${
          disabled
            ? 'cursor-not-allowed border-outline-variant bg-surface opacity-50 text-outline'
            : 'border-outline-variant/50 bg-surface-container-lowest text-primary hover:border-primary hover:bg-surface-container-low'
        }`}
      >
        {useCircle ? <PlusCircle className="size-6 opacity-70" /> : <Plus className="size-6 opacity-70" />}
        <span className="font-label-md text-label-md">{label}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-all ${
        disabled
          ? 'cursor-not-allowed border-outline-variant bg-surface opacity-50 text-outline'
          : 'cursor-pointer border-outline-variant/50 bg-surface-container-lowest text-primary hover:border-primary hover:bg-surface-container-low'
      }`}
    >
      {useCircle ? (
        <PlusCircle className="mb-2 size-9 opacity-70" />
      ) : (
        <div className={`mb-3 flex size-12 items-center justify-center rounded-full ${disabled ? 'bg-surface-container' : 'bg-surface-container-highest'}`}>
          <Plus className="size-6" />
        </div>
      )}
      <span className="font-label-md text-label-md">{label}</span>
    </button>
  )
}
