import { useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import { EditorContent } from '@tiptap/react'

const DEFAULT_EDITOR_CLASS =
  'tiptap-content min-h-[420px] w-full border-none bg-transparent font-body-lg text-body-lg leading-relaxed text-on-surface outline-none focus:ring-0'

interface RichEditorProps {
  editor: Editor | null
  className?: string
  /** ProseMirror 编辑区的 class，可用于覆盖 min-h 等样式。 */
  editorClassName?: string
}

/**
 * 备忘录富文本编辑器（基于 TipTap 3 / ProseMirror）。
 * 纯展示组件：editor 实例由外部 useNotesEditor hook 创建并传入。
 * headless：不自带工具栏，工具栏由 EditorToolbar 用 editor API 驱动。
 */
export function RichEditor({ editor, className, editorClassName }: RichEditorProps) {
  // editorClassName 变化时动态应用到 ProseMirror 编辑区；未传则用默认 class。
  useEffect(() => {
    if (!editor) {
      return
    }
    editor.setOptions({ editorProps: { attributes: { class: editorClassName ?? DEFAULT_EDITOR_CLASS } } })
  }, [editor, editorClassName])

  return (
    <div className={className}>
      <EditorContent editor={editor} />
    </div>
  )
}
