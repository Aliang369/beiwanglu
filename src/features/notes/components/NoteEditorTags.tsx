/**
 * 笔记内标签编辑（note-scoped）：
 * - 标签存在于当前笔记的 tags[]，不是独立全局标签表
 * - 同名时复用已有 id（从 availableTags / 当前 tags 聚合），避免重复实体
 * - 筛选条候选项来自各笔记 tags 的聚合结果
 */
import { Plus, X } from 'lucide-react'

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import type { NoteTag } from '../../../shared/types/note'
import { TagChip } from './TagChip'

interface NoteEditorTagsProps {
  tags: NoteTag[]
  availableTags: NoteTag[]
  onChange: (tags: NoteTag[]) => void
  variant?: 'editor' | 'panel'
  /** 编辑页：放在「添加标签」后的元信息等 */
  trailing?: ReactNode
  className?: string
}

/** 与 TagChip size="editor" 完全同高：h-7 + px-2.5 + label-sm */
const EDITOR_TAG_SIZE =
  'box-border inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 font-label-sm text-label-sm leading-none'

function createTagId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
  const base = slug || 'tag'
  return `${base}-${Date.now().toString(36)}`
}

function normalizeTagName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

export function NoteEditorTags({
  tags,
  availableTags,
  onChange,
  variant = 'editor',
  trailing,
  className = '',
}: NoteEditorTagsProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelId = useId()

  const selectedIds = useMemo(() => new Set(tags.map((tag) => tag.id)), [tags])

  const knownTags = useMemo(() => {
    const map = new Map<string, NoteTag>()
    for (const tag of availableTags) {
      map.set(tag.id, tag)
    }
    for (const tag of tags) {
      map.set(tag.id, tag)
    }
    return [...map.values()]
  }, [availableTags, tags])

  useEffect(() => {
    if (!open) {
      return
    }

    inputRef.current?.focus()

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setDraft('')
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        setDraft('')
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function addTag(tag: NoteTag) {
    if (selectedIds.has(tag.id)) {
      setDraft('')
      setOpen(false)
      return
    }
    onChange([...tags, { id: tag.id, name: tag.name }])
    setDraft('')
    setOpen(false)
  }

  function createAndAddTag() {
    const name = normalizeTagName(draft)
    if (!name) {
      return
    }

    const existing = knownTags.find((tag) => tag.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      addTag(existing)
      return
    }

    addTag({ id: createTagId(name), name })
  }

  function removeTag(tagId: string) {
    onChange(tags.filter((tag) => tag.id !== tagId))
  }

  const addButtonClass =
    variant === 'panel'
      ? 'inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-primary transition-colors duration-200 hover:bg-primary-container/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      : `${EDITOR_TAG_SIZE} cursor-pointer border-dashed border-outline-variant/50 bg-surface-container-low text-on-surface-variant transition-colors duration-200 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`

  if (variant === 'panel') {
    return (
      <div ref={rootRef} className={`relative ${className}`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">标签</h3>
          <button type="button" onClick={() => setOpen((value) => !value)} className={addButtonClass} aria-label="添加标签" aria-expanded={open} aria-controls={panelId}>
            <Plus className="size-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tags.length > 0 ? (
            tags.map((tag) => <TagChip key={tag.id} tag={tag} size="editor" onRemove={removeTag} />)
          ) : (
            <span className="font-label-sm text-label-sm text-on-surface-variant">暂无标签</span>
          )}
        </div>
        {renderPicker()}
      </div>
    )
  }

  return (
    <div ref={rootRef} className={`relative flex flex-wrap items-center gap-x-2 gap-y-1.5 ${className}`}>
      {tags.map((tag) => (
        <TagChip key={tag.id} tag={tag} size="editor" onRemove={removeTag} />
      ))}
      <button type="button" onClick={() => setOpen((value) => !value)} className={addButtonClass} aria-expanded={open} aria-controls={panelId}>
        添加标签
      </button>
      {trailing ? <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 pl-2">{trailing}</div> : null}
      {renderPicker()}
    </div>
  )

  function renderPicker() {
    if (!open) {
      return null
    }

    return (
      <div
        id={panelId}
        className={`absolute z-40 w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-low p-2 shadow-lg ${
          variant === 'panel' ? 'right-0 top-8' : 'left-0 top-[calc(100%+8px)]'
        }`}
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                createAndAddTag()
              }
            }}
            className="h-9 min-w-0 flex-1 rounded-full border-none bg-surface px-3 font-body-md text-body-md text-on-surface outline-none ring-1 ring-outline-variant/30 placeholder:text-on-surface-variant/70 focus:ring-2 focus:ring-primary"
            placeholder="输入标签名，回车添加"
            aria-label="输入标签名"
          />
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setDraft('')
            }}
            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="关闭"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    )
  }
}
