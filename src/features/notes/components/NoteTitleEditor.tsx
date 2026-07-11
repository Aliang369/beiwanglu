import { useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { Placeholder } from '@tiptap/extension-placeholder'
import { StarterKit } from '@tiptap/starter-kit'

interface NoteTitleEditorProps {
  noteId: string
  title: string
  onChange: (title: string) => void
  className?: string
  placeholder?: string
}

/**
 * 独立单行标题编辑器：与正文 TipTap 分离，保留「标题 → 标签 → 正文」布局。
 * - 仅纯文本，Enter 不换行
 * - 仅在 noteId 变化时从外部 title 重置，避免异步回写打断输入
 */
export function NoteTitleEditor({
  noteId,
  title,
  onChange,
  className = '',
  placeholder = '给灵感起个名字…',
}: NoteTitleEditorProps) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const lastNoteIdRef = useRef(noteId)
  const debounceRef = useRef<number | undefined>(undefined)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bold: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        dropcursor: false,
        gapcursor: false,
        hardBreak: false,
        heading: false,
        horizontalRule: false,
        italic: false,
        listItem: false,
        listKeymap: false,
        orderedList: false,
        strike: false,
        link: false,
        underline: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: title || '',
    editorProps: {
      attributes: {
        class:
          'tiptap-title w-full border-0 bg-transparent p-0 font-headline-lg text-headline-lg text-on-surface outline-none focus:ring-0',
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: current }) => {
      const next = current.getText().replace(/\n+/g, ' ')
      window.clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(() => {
        onChangeRef.current(next)
      }, 200)
    },
  })

  useEffect(() => {
    if (!editor) {
      return
    }

    if (lastNoteIdRef.current === noteId) {
      return
    }

    lastNoteIdRef.current = noteId
    const current = editor.getText()
    if (current !== title) {
      editor.commands.setContent(title || '', { emitUpdate: false })
    }
  }, [editor, noteId, title])

  useEffect(() => {
    return () => {
      window.clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className={`note-title-editor mb-2 border-b-2 border-transparent py-1 transition-colors focus-within:border-primary ${className}`}>
      <EditorContent editor={editor} />
    </div>
  )
}
