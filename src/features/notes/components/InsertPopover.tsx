import { useEffect, useReducer, useRef, useState } from 'react'
import { Image as ImageIcon, Link2, Video as VideoIcon, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Editor } from '@tiptap/react'

interface InsertPopoverProps {
  editor: Editor
  type: 'link' | 'image' | 'video'
}

interface InsertConfig {
  icon: LucideIcon
  label: string
  fields: Array<{ key: string; label: string; placeholder: string; defaultValue?: string }>
}

function getConfig(type: InsertPopoverProps['type'], editor: Editor): InsertConfig {
  switch (type) {
    case 'link':
      return {
        icon: Link2,
        label: '插入链接',
        fields: [
          { key: 'href', label: '地址', placeholder: 'https://', defaultValue: (editor.getAttributes('link').href as string) ?? 'https://' },
          { key: 'text', label: '显示文字（可选）', placeholder: '点击查看详情' },
        ],
      }
    case 'image':
      return {
        icon: ImageIcon,
        label: '插入图片',
        fields: [{ key: 'src', label: '图片地址', placeholder: 'https://example.com/image.png' }],
      }
    case 'video':
      return {
        icon: VideoIcon,
        label: '插入视频',
        fields: [{ key: 'src', label: 'YouTube 地址', placeholder: 'https://www.youtube.com/watch?v=' }],
      }
  }
}

function applyInsert(editor: Editor, type: InsertPopoverProps['type'], values: Record<string, string>) {
  switch (type) {
    case 'link': {
      const href = values.href?.trim()
      if (!href) {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }

      const text = values.text?.trim()
      if (text) {
        editor.chain().focus().extendMarkRange('link').insertContent({ type: 'text', text, marks: [{ type: 'link', attrs: { href } }] }).run()
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
      }

      return
    }
    case 'image': {
      const src = values.src?.trim()
      if (src) {
        editor.chain().focus().setImage({ src }).run()
      }

      return
    }
    case 'video': {
      const src = values.src?.trim()
      if (src) {
        editor.chain().focus().setYoutubeVideo({ src }).run()
      }
    }
  }
}

/**
 * 插入类内容（链接/图片/视频）的浮层表单。
 * 由工具栏按钮触发，点击按钮打开，填表后提交应用，点遮罩/X 关闭。
 */
export function InsertPopover({ editor, type }: InsertPopoverProps) {
  const [open, setOpen] = useState(false)
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)
  const containerRef = useRef<HTMLDivElement>(null)

  const config = getConfig(type, editor)

  useEffect(() => {
    if (!open) {
      return
    }

    // 每次打开时重置表单默认值
    forceUpdate()

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open, type, editor])

  function handleSubmit(form: HTMLFormElement) {
    const formData = new FormData(form)
    const values: Record<string, string> = {}
    for (const field of config.fields) {
      values[field.key] = String(formData.get(field.key) ?? '')
    }
    applyInsert(editor, type, values)
    setOpen(false)
  }

  const TriggerIcon = config.icon

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        title={config.label}
        aria-label={config.label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex size-9 items-center justify-center rounded-full transition-colors ${
          open ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
        }`}
      >
        <TriggerIcon className="size-[18px]" />
      </button>
      {open ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit(event.currentTarget)
          }}
          className="absolute left-0 top-11 z-30 w-72 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3 shadow-modal"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-label-md text-label-md font-semibold text-on-surface">{config.label}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex size-6 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              aria-label="关闭"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="space-y-2.5">
            {config.fields.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">{field.label}</span>
                <input
                  type="text"
                  name={field.key}
                  defaultValue={field.defaultValue ?? ''}
                  placeholder={field.placeholder}
                  autoFocus={field === config.fields[0]}
                  className="w-full rounded-md border border-outline-variant/40 bg-surface-container-low px-3 py-2 font-body-sm text-body-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-3 py-1.5 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low"
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-1.5 font-label-md text-label-md text-on-primary shadow-sm hover:bg-primary-container"
            >
              插入
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
