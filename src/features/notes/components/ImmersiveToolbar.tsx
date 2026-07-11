import { Bold, CheckSquare, Code2, Heading1, Italic, List, Redo2, Strikethrough, Underline, Undo2 } from 'lucide-react'
import { useEffect, useReducer } from 'react'
import type { Editor } from '@tiptap/react'
import { InsertPopover } from './InsertPopover'

interface ImmersiveToolbarProps {
  editor: Editor | null
  saveState: 'saved' | 'editing'
}

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

function MiniButton({ icon: Icon, label, active, command }: {
  icon: typeof Bold
  label: string
  active: boolean
  command: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={command}
      className={`flex size-9 items-center justify-center rounded-full transition-colors ${
        active ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
      }`}
    >
      <Icon className="size-[18px]" />
    </button>
  )
}

/**
 * 沉浸模式底部浮动工具栏：接 editor 命令，提供常用格式 + 插入 + 撤销重做 + 保存状态。
 */
export function ImmersiveToolbar({ editor, saveState }: ImmersiveToolbarProps) {
  useEditorState(editor)

  if (!editor) {
    return null
  }

  const e = editor

  return (
    <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full border border-outline-variant/20 bg-surface-container-lowest/90 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl">
      <div className="flex items-center gap-0.5">
        <MiniButton icon={Undo2} label="撤销" active={false} command={() => e.chain().focus().undo().run()} />
        <MiniButton icon={Redo2} label="重做" active={false} command={() => e.chain().focus().redo().run()} />

        <div className="mx-1.5 h-6 w-px bg-outline-variant/30" />

        <MiniButton icon={Bold} label="粗体" active={e.isActive('bold')} command={() => e.chain().focus().toggleBold().run()} />
        <MiniButton icon={Italic} label="斜体" active={e.isActive('italic')} command={() => e.chain().focus().toggleItalic().run()} />
        <MiniButton icon={Underline} label="下划线" active={e.isActive('underline')} command={() => e.chain().focus().toggleUnderline().run()} />
        <MiniButton icon={Strikethrough} label="删除线" active={e.isActive('strike')} command={() => e.chain().focus().toggleStrike().run()} />

        <div className="mx-1.5 h-6 w-px bg-outline-variant/30" />

        <MiniButton icon={Heading1} label="标题" active={e.isActive('heading', { level: 1 })} command={() => e.chain().focus().toggleHeading({ level: 1 }).run()} />
        <MiniButton icon={List} label="无序列表" active={e.isActive('bulletList')} command={() => e.chain().focus().toggleBulletList().run()} />
        <MiniButton icon={CheckSquare} label="任务清单" active={e.isActive('taskList')} command={() => e.chain().focus().toggleTaskList().run()} />
        <MiniButton icon={Code2} label="代码块" active={e.isActive('codeBlock')} command={() => e.chain().focus().toggleCodeBlock().run()} />

        <div className="mx-1.5 h-6 w-px bg-outline-variant/30" />

        <InsertPopover editor={e} type="link" />
        <InsertPopover editor={e} type="image" />
        <InsertPopover editor={e} type="video" />

        <div className="mx-1.5 h-6 w-px bg-outline-variant/30" />
        <div className="flex items-center gap-1.5 px-3 pr-4">
          <span className={`size-2 rounded-full ${saveState === 'editing' ? 'bg-outline-variant' : 'bg-primary'}`} />
          <span className="font-label-sm text-label-sm text-on-surface-variant">{saveState === 'editing' ? '保存中' : '已保存'}</span>
        </div>
      </div>
    </div>
  )
}
