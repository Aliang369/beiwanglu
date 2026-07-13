import { useEffect, useRef, type MutableRefObject } from 'react'
import { useEditor } from '@tiptap/react'
import { Color } from '@tiptap/extension-color'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Highlight } from '@tiptap/extension-highlight'
import { Image } from '@tiptap/extension-image'
import { Mathematics } from '@tiptap/extension-mathematics'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TableKit } from '@tiptap/extension-table'
import { TaskItem } from '@tiptap/extension-task-item'
import { TaskList } from '@tiptap/extension-task-list'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Youtube } from '@tiptap/extension-youtube'
import { StarterKit } from '@tiptap/starter-kit'
import { createLowlight } from 'lowlight'
import { common as commonGrammars } from 'lowlight'
import 'katex/dist/katex.min.css'
import type { Note } from '../../../shared/types/note'

const lowlight = createLowlight(commonGrammars)

/**
 * 将 note.content 解析为 TipTap 可用的初始内容。
 * - ProseMirror doc JSON 字符串：返回对象。
 * - 解析失败或非 doc：返回原字符串（当作 HTML/纯文本，兼容历史数据）。
 */
function parseContent(content: string): string | object {
  if (!content) {
    return ''
  }

  try {
    const parsed = JSON.parse(content)

    if (parsed && parsed.type === 'doc') {
      return parsed
    }

    return content
  } catch {
    return content
  }
}

/**
 * 备忘录编辑器 hook：创建 TipTap editor 实例并管理内容同步。
 * - 初始内容取自 note.content；切换笔记时 setContent 重置（emitUpdate:false 避免回环）。
 * - onUpdate debounce 400ms 调用 onChange，参数为 JSON.stringify(editor.getJSON())。
 * - 保存成功后调用 onSaved（用于触发自动快照）。
 * - skipRef 为真时跳过下一次 onUpdate（用于预览/恢复时 setContent 不触发保存与快照）。
 * - 返回的 editor 实例稳定，可安全传给工具栏与编辑区。
 */
export function useNotesEditor(
  note: Note | undefined,
  onChange: (json: string) => void,
  onSaved?: (noteId: string, content: string, title: string) => void,
  skipRef?: MutableRefObject<number>,
) {
  const onChangeRef = useRef(onChange)
  const onSavedRef = useRef(onSaved)
  onChangeRef.current = onChange
  onSavedRef.current = onSaved
  const timerRef = useRef<number | undefined>(undefined)
  const lastNoteIdRef = useRef<string | undefined>(note?.id)
  const lastSyncedContentRef = useRef<string>(note?.content ?? '')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: { openOnClick: false, autolink: true, HTMLAttributes: { class: 'text-primary underline' } },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false, allowBase64: true }),
      TableKit.configure({ table: { resizable: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Mathematics.configure({ katexOptions: { throwOnError: false } }),
      Youtube,
      Placeholder.configure({
        placeholder: '开始写下你的想法，灵感会慢慢清晰…',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: parseContent(note?.content ?? ''),
    editorProps: {
      attributes: {
        class: 'tiptap-content min-h-[420px] w-full border-none bg-transparent font-body-lg text-body-lg leading-relaxed text-on-surface outline-none focus:ring-0',
      },
    },
    onUpdate: ({ editor }) => {
      // 预览/恢复时的 setContent 应跳过保存与快照（用计数器应对多次 onUpdate）
      if (skipRef && skipRef.current > 0) {
        skipRef.current -= 1
        window.clearTimeout(timerRef.current)
        return
      }
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        const json = JSON.stringify(editor.getJSON())
        // 记录本次保存的 json，避免 store 更新 note.content 后被当作外部变化再同步
        lastSyncedContentRef.current = json
        onChangeRef.current(json)
        if (note?.id) {
          onSavedRef.current?.(note.id, json, note.title)
        }
      }, 400)
    },
  })

  // 切换笔记时重置内容（emitUpdate:false 避免触发 onUpdate 回环）
  useEffect(() => {
    if (!editor || !note) {
      return
    }

    if (lastNoteIdRef.current === note.id) {
      return
    }

    lastNoteIdRef.current = note.id
    lastSyncedContentRef.current = note.content
    editor.commands.setContent(parseContent(note.content), { emitUpdate: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在切换笔记 id 时重置内容
  }, [note?.id, editor])

  // 同笔记 content 外部变化时同步（如恢复历史版本后）；跳过自己编辑保存的回环
  useEffect(() => {
    if (!editor || !note) {
      return
    }
    if (lastNoteIdRef.current !== note.id) {
      return
    }
    if (lastSyncedContentRef.current === note.content) {
      return
    }
    lastSyncedContentRef.current = note.content
    if (skipRef) {
      skipRef.current += 1
    }
    editor.commands.setContent(parseContent(note.content), { emitUpdate: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在 note.content 变化时同步
  }, [note?.content, editor])

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current)
    }
  }, [])

  return editor
}
