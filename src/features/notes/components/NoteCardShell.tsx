import { Image } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Note } from '../../../shared/types/note'

const cardFooterClass =
  'mt-auto flex shrink-0 items-center border-t border-outline-variant/20 pt-4'

/** body-md 行高 1.6：N 行用 N * 1.6em 锁高，避免 flex 撑高露半行 */
const excerptClamp = {
  small: 'max-h-[3.2em] line-clamp-2',
  featuredCover: 'max-h-[8em] line-clamp-5',
  featuredPlain: 'max-h-[16em] line-clamp-10',
} as const

function getCardPreviewText(note: Note) {
  // 直接用正文（压空白），展示截断交给 CSS line-clamp，不再二次 slice 字数
  const raw = (note.content || note.excerpt || '').replace(/\s+/g, ' ').trim()
  return raw || '开始输入内容...'
}

function CardPrimaryTag({ children }: { children?: string }) {
  if (!children) {
    return null
  }
  return (
    <span className="inline-block max-w-[120px] truncate rounded-full border border-white/50 bg-surface-container-lowest/85 px-2.5 py-1 font-label-sm text-label-sm text-primary shadow-sm backdrop-blur-md">
      {children}
    </span>
  )
}

export interface NoteCardShellProps {
  note: Note
  featured?: boolean
  primaryTag?: string
  updatedLabel: string
  imgAltPrefix?: string
  onActivate?: () => void
  cornerSlot?: ReactNode
  trailing?: ReactNode
  variant: 'note' | 'favorite'
  selected?: boolean
  disabled?: boolean
  selectionMode?: boolean
  elevated?: boolean
}

/**
 * 笔记卡片壳层：四个分支（大卡/小卡 × 有封面/无封面）+ 公共布局。
 * NoteCard 传菜单/选择框/dialogs，FavoriteNoteCard 传五角星。
 */
export function NoteCardShell({
  note,
  featured = false,
  primaryTag,
  updatedLabel,
  imgAltPrefix = '未命名笔记',
  onActivate,
  cornerSlot,
  trailing,
  variant,
  selected = false,
  disabled = false,
  selectionMode = false,
  elevated = false,
}: NoteCardShellProps) {
  const hasCover = Boolean(note.cover)
  const previewText = getCardPreviewText(note)
  const isFavorite = variant === 'favorite'

  // 收藏夹标题有 hover 变色，所有笔记没有
  const titleHoverClass = isFavorite ? 'transition-colors group-hover:text-primary' : ''

  const shellClass = `group relative min-h-0 ${elevated ? 'z-50' : 'z-0'} ${
    featured
      ? 'col-span-1 row-span-2 h-note-card-featured md:col-span-2'
      : 'h-note-card'
  } ${disabled ? 'pointer-events-none opacity-45' : ''}`

  const selectedBorder = selected
    ? 'border-2 border-primary shadow-[0_4px_12px_rgba(0,66,117,0.08)] ring-1 ring-primary/20'
    : 'border border-outline-variant/50'

  const articleBase = `group relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl transition-all duration-300 ${
    disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card'
  } ${selectedBorder} ${
    featured && !isFavorite ? 'bg-surface-bright' : 'bg-gradient-to-br from-surface-container-lowest to-surface-container-low'
  }`

  // 所有笔记才有 aria 属性
  const ariaDisabled = isFavorite ? undefined : (disabled || undefined)
  const ariaSelected = isFavorite ? undefined : (selectionMode ? selected : undefined)

  // 分支 1：大卡 + 有封面
  if (featured && hasCover) {
    return (
      <>
        <div className={shellClass}>
          <article onClick={onActivate} aria-disabled={ariaDisabled} aria-selected={ariaSelected} className={articleBase}>
            <div className="relative h-note-card-cover-featured w-full shrink-0 overflow-hidden bg-surface-container-low">
              <img
                src={note.cover!}
                alt={`${note.title || imgAltPrefix}封面`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            {primaryTag ? (
              <div className="absolute left-6 top-6 z-10">
                <CardPrimaryTag>{primaryTag}</CardPrimaryTag>
              </div>
            ) : null}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
              <h3 className={`mb-2 shrink-0 line-clamp-1 font-headline-md text-headline-md text-on-surface ${titleHoverClass}`}>
                {note.title || '未命名笔记'}
              </h3>
              <p className={`mb-4 shrink-0 overflow-hidden font-body-md text-body-md leading-[1.6] text-on-surface-variant ${excerptClamp.featuredCover}`}>
                {previewText}
              </p>
              <div className="min-h-0 flex-1" aria-hidden />
              <div className={`${cardFooterClass} justify-between`}>
                <Image className="size-4 text-outline" />
                <span className="font-label-sm text-label-sm text-outline">{updatedLabel}</span>
              </div>
            </div>
          </article>
          {cornerSlot}
        </div>
        {trailing}
      </>
    )
  }

  // 分支 2：小卡 + 有封面
  if (hasCover) {
    return (
      <>
        <div className={shellClass}>
          <article onClick={onActivate} aria-disabled={ariaDisabled} aria-selected={ariaSelected} className={articleBase}>
            <div className="relative h-note-card-cover w-full shrink-0 overflow-hidden rounded-t-xl bg-surface-container-low">
              <img src={note.cover!} alt={`${note.title || imgAltPrefix}封面`} className="h-full w-full object-cover" />
            </div>
            {primaryTag ? (
              <div className="absolute left-5 top-5 z-10">
                <CardPrimaryTag>{primaryTag}</CardPrimaryTag>
              </div>
            ) : null}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5 pt-4">
              <div className="flex min-h-0 flex-1 items-center">
                <h3 className={`line-clamp-2 w-full font-headline-sm text-headline-sm text-on-surface ${titleHoverClass}`}>
                  {note.title || '未命名笔记'}
                </h3>
              </div>
              <div className={`${cardFooterClass} justify-between`}>
                <Image className="size-4 text-outline" />
                <span className="font-label-sm text-label-sm text-outline">{updatedLabel}</span>
              </div>
            </div>
          </article>
          {cornerSlot}
        </div>
        {trailing}
      </>
    )
  }

  // 分支 3：无封面（大卡/小卡合并，用三元区分尺寸）
  return (
    <>
      <div className={shellClass}>
        <article
          onClick={onActivate}
          aria-disabled={ariaDisabled}
          aria-selected={ariaSelected}
          className={`${articleBase} ${featured ? 'p-6' : 'p-5'}`}
        >
          {featured ? (
            <div className="absolute top-0 right-0 size-32 rounded-bl-full bg-primary-container/10 transition-transform group-hover:scale-110" />
          ) : null}
          <div className={`relative z-10 flex shrink-0 items-start justify-between gap-3 ${featured ? 'mb-4' : 'mb-3'}`}>
            <div className="min-w-0 flex-1">
              <CardPrimaryTag>{primaryTag}</CardPrimaryTag>
            </div>
            <div className="size-8 shrink-0" />
          </div>
          <h3 className={`relative z-10 shrink-0 line-clamp-1 text-on-surface ${titleHoverClass} ${featured ? 'mb-3 font-headline-md text-headline-md' : 'mb-2 font-headline-sm text-headline-sm'}`}>
            {note.title || '未命名笔记'}
          </h3>
          {featured ? (
            <>
              <p className={`relative z-10 mb-4 shrink-0 overflow-hidden font-body-md text-body-md leading-[1.6] text-on-surface-variant ${excerptClamp.featuredPlain}`}>
                {previewText}
              </p>
              <div className="relative z-10 min-h-0 flex-1" aria-hidden />
            </>
          ) : (
            <>
              <p className={`relative z-10 mb-3 shrink-0 overflow-hidden font-body-md text-body-md leading-[1.6] text-on-surface-variant ${excerptClamp.small}`}>
                {previewText}
              </p>
              <div className="relative z-10 min-h-0 flex-1" aria-hidden />
            </>
          )}
          <div className={`relative z-10 ${cardFooterClass} justify-end gap-3`}>
            <span className="font-label-sm text-label-sm text-outline">{updatedLabel}</span>
          </div>
        </article>
        {cornerSlot}
      </div>
      {trailing}
    </>
  )
}
