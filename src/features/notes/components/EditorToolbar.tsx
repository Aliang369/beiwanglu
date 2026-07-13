import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  Code2,
  Code,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Sigma,
  Strikethrough,
  Table as TableIcon,
  Underline,
  Undo2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useReducer, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { InsertPopover } from './InsertPopover'

interface EditorToolbarProps {
  editor: Editor | null
  className?: string
  readOnly?: boolean
}


const TEXT_COLORS = [
  { name: '默认', value: '' },
  { name: '红', value: '#dc2626' },
  { name: '橙', value: '#ea580c' },
  { name: '黄', value: '#ca8a04' },
  { name: '绿', value: '#16a34a' },
  { name: '蓝', value: '#2563eb' },
  { name: '紫', value: '#9333ea' },
]

const HIGHLIGHT_COLORS = [
  { name: '清除', value: '' },
  { name: '黄', value: '#fef08a' },
  { name: '绿', value: '#bbf7d0' },
  { name: '蓝', value: '#bfdbfe' },
  { name: '粉', value: '#fbcfe8' },
  { name: '橙', value: '#fed7aa' },
]

function useEditorState(editor: Editor | null) {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)

  useEffect(() => {
    if (!editor) {
      return
    }

    editor.on('transaction', forceUpdate)
    editor.on('selectionUpdate', forceUpdate)
    return () => {
      editor.off('transaction', forceUpdate)
      editor.off('selectionUpdate', forceUpdate)
    }
  }, [editor])
}

interface ToolButtonProps {
  icon: LucideIcon
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}

function ToolButton({ icon: Icon, label, active, disabled, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-9 items-center justify-center rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? 'bg-surface-container-high text-primary'
          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
      }`}
    >
      <Icon className="size-[18px]" />
    </button>
  )
}

function Divider() {
  return <div className="mx-1.5 h-6 w-px shrink-0 bg-outline-variant/40" />
}

function ColorPopover({
  icon: Icon,
  label,
  colors,
  onPick,
  current,
}: {
  icon: LucideIcon
  label: string
  colors: Array<{ name: string; value: string }>
  onPick: (value: string) => void
  current?: string
}) {
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    // 测量按钮位置，下方空间不足则向上弹
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setDropUp(spaceBelow < 220)
    }

    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex size-9 items-center justify-center rounded-full transition-colors ${
          open || current
            ? 'bg-surface-container-high text-primary'
            : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
        }`}
      >
        <Icon className="size-[18px]" />
      </button>
      {open ? (
        <div
          className={`absolute right-0 z-30 flex flex-col gap-1 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2 shadow-modal ${
            dropUp ? 'bottom-11' : 'top-11'
          }`}
        >
          {colors.map((color) => (
            <button
              key={color.name}
              type="button"
              title={color.name}
              aria-label={color.name}
              onClick={() => {
                onPick(color.value)
                setOpen(false)
              }}
              className={`size-7 rounded-full border transition-transform hover:scale-110 ${
                color.value === '' ? 'border-outline-variant bg-surface-container' : 'border-outline-variant/30'
              }`}
              style={color.value ? { backgroundColor: color.value } : undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function EditorToolbar({ editor, className = '', readOnly = false }: EditorToolbarProps) {
  useEditorState(editor)

  if (!editor) {
    return <div className={`h-12 border-b border-outline-variant/30 bg-surface-container-lowest py-3 ${className}`} />
  }

  const e = editor

  function insertTable() {
    e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  function insertMath() {
    e.chain().focus().insertBlockMath({ latex: '' }).run()
  }

  return (
    <div className={`flex flex-wrap items-center gap-1 border-b border-outline-variant/30 bg-surface-container-lowest px-gutter py-2 ${className} ${readOnly ? 'pointer-events-none opacity-40' : ''}`}>
      <ToolButton icon={Undo2} label="撤销" disabled={readOnly || !editor.can().undo()} onClick={() => e.chain().focus().undo().run()} />
      <ToolButton icon={Redo2} label="重做" disabled={readOnly || !editor.can().redo()} onClick={() => e.chain().focus().redo().run()} />

      <Divider />

      <ToolButton icon={Bold} label="粗体" active={editor.isActive('bold')} disabled={readOnly} onClick={() => e.chain().focus().toggleBold().run()} />
      <ToolButton icon={Italic} label="斜体" active={editor.isActive('italic')} disabled={readOnly} onClick={() => e.chain().focus().toggleItalic().run()} />
      <ToolButton icon={Underline} label="下划线" active={editor.isActive('underline')} disabled={readOnly} onClick={() => e.chain().focus().toggleUnderline().run()} />
      <ToolButton icon={Strikethrough} label="删除线" active={editor.isActive('strike')} disabled={readOnly} onClick={() => e.chain().focus().toggleStrike().run()} />
      <ToolButton icon={Code} label="行内代码" active={editor.isActive('code')} disabled={readOnly} onClick={() => e.chain().focus().toggleCode().run()} />

      <Divider />

      <ToolButton icon={Heading1} label="标题 1" active={editor.isActive('heading', { level: 1 })} disabled={readOnly} onClick={() => e.chain().focus().toggleHeading({ level: 1 }).run()} />
      <ToolButton icon={Heading2} label="标题 2" active={editor.isActive('heading', { level: 2 })} disabled={readOnly} onClick={() => e.chain().focus().toggleHeading({ level: 2 }).run()} />

      <Divider />

      <ToolButton icon={List} label="无序列表" active={editor.isActive('bulletList')} disabled={readOnly} onClick={() => e.chain().focus().toggleBulletList().run()} />
      <ToolButton icon={ListOrdered} label="有序列表" active={editor.isActive('orderedList')} disabled={readOnly} onClick={() => e.chain().focus().toggleOrderedList().run()} />
      <ToolButton icon={CheckSquare} label="任务清单" active={editor.isActive('taskList')} disabled={readOnly} onClick={() => e.chain().focus().toggleTaskList().run()} />

      <Divider />

      <ToolButton icon={Quote} label="引用" active={editor.isActive('blockquote')} disabled={readOnly} onClick={() => e.chain().focus().toggleBlockquote().run()} />
      <ToolButton icon={Code2} label="代码块" active={editor.isActive('codeBlock')} disabled={readOnly} onClick={() => e.chain().focus().toggleCodeBlock().run()} />
      <ToolButton icon={Minus} label="分割线" disabled={readOnly} onClick={() => e.chain().focus().setHorizontalRule().run()} />

      <Divider />

      <ToolButton icon={AlignLeft} label="左对齐" active={editor.isActive({ textAlign: 'left' })} disabled={readOnly} onClick={() => e.chain().focus().setTextAlign('left').run()} />
      <ToolButton icon={AlignCenter} label="居中" active={editor.isActive({ textAlign: 'center' })} disabled={readOnly} onClick={() => e.chain().focus().setTextAlign('center').run()} />
      <ToolButton icon={AlignRight} label="右对齐" active={editor.isActive({ textAlign: 'right' })} disabled={readOnly} onClick={() => e.chain().focus().setTextAlign('right').run()} />

      <Divider />

      <ColorPopover
        icon={Highlighter}
        label="高亮颜色"
        colors={HIGHLIGHT_COLORS}
        current={editor.getAttributes('highlight').color as string | undefined}
        onPick={(value) => {
          if (value) {
            e.chain().focus().setHighlight({ color: value }).run()
          } else {
            e.chain().focus().unsetHighlight().run()
          }
        }}
      />
      <ColorPopover
        icon={RemoveFormatting}
        label="文字颜色"
        colors={TEXT_COLORS}
        current={editor.getAttributes('textStyle').color as string | undefined}
        onPick={(value) => {
          if (value) {
            e.chain().focus().setColor(value).run()
          } else {
            e.chain().focus().unsetColor().run()
          }
        }}
      />

      <Divider />

      <InsertPopover editor={e} type="link" />
      <InsertPopover editor={e} type="image" />
      <ToolButton icon={TableIcon} label="表格" disabled={readOnly} onClick={insertTable} />
      <ToolButton icon={Sigma} label="数学公式" disabled={readOnly} onClick={insertMath} />
      <InsertPopover editor={e} type="video" />
    </div>
  )
}
