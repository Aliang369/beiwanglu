import type { NoteDraft } from '../types/note'
import type { NotesRepository } from '../data/notesRepository'
import { EMPTY_DOC_JSON } from '../notes/noteDomain'
import { isTauriRuntime, readTextFileNative } from './tauriBridge'

function textToDocJson(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const content = lines.map((line) =>
    line
      ? { type: 'paragraph', content: [{ type: 'text', text: line }] }
      : { type: 'paragraph' },
  )
  return JSON.stringify({ type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] })
}

function stripMdHeading(titleLine: string): string {
  return titleLine.replace(/^#\s+/, '').trim()
}

export function parseMarkdownNote(raw: string, fileName: string): NoteDraft {
  const text = raw.replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/)
  let title = fileName.replace(/\.md$/i, '').replace(/\.markdown$/i, '')
  let bodyStart = 0
  if (lines[0]?.startsWith('# ')) {
    title = stripMdHeading(lines[0]) || title
    bodyStart = 1
    if (lines[1] === '') bodyStart = 2
  }
  const body = lines.slice(bodyStart).join('\n').trim()
  return {
    title: title || '未命名导入',
    content: body ? textToDocJson(body) : EMPTY_DOC_JSON,
    tags: [],
    folderId: null,
  }
}

export function parseJsonNotes(raw: string): NoteDraft[] {
  const data = JSON.parse(raw) as unknown
  const list = Array.isArray(data) ? data : (data as { notes?: unknown }).notes
  if (!Array.isArray(list)) {
    throw new Error('JSON 需为笔记数组，或 { notes: [] }')
  }
  return list.map((item, index) => {
    const rec = item as Record<string, unknown>
    const title = String(rec.title ?? `导入笔记 ${index + 1}`)
    const contentRaw = rec.content
    let content = EMPTY_DOC_JSON
    if (typeof contentRaw === 'string') {
      try {
        const parsed = JSON.parse(contentRaw) as { type?: string }
        content = parsed?.type === 'doc' ? contentRaw : textToDocJson(contentRaw)
      } catch {
        content = textToDocJson(contentRaw)
      }
    } else if (contentRaw && typeof contentRaw === 'object') {
      content = JSON.stringify(contentRaw)
    }
    return {
      title,
      content,
      tags: Array.isArray(rec.tags) ? (rec.tags as NoteDraft['tags']) : [],
      folderId: (rec.folderId as string | null | undefined) ?? null,
      cover: typeof rec.cover === 'string' ? rec.cover : null,
    }
  })
}

export async function pickAndReadImportFiles(): Promise<Array<{ name: string; text: string }>> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.markdown,.json,text/markdown,application/json'
    input.multiple = true
    input.onchange = () => {
      const files = Array.from(input.files ?? [])
      if (!files.length) {
        resolve([])
        return
      }
      void (async () => {
        try {
          const result: Array<{ name: string; text: string }> = []
          for (const file of files) {
            const anyFile = file as File & { path?: string }
            if (isTauriRuntime() && anyFile.path) {
              result.push({ name: file.name, text: await readTextFileNative(anyFile.path) })
            } else {
              result.push({ name: file.name, text: await file.text() })
            }
          }
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })()
    }
    input.click()
  })
}

export async function importNoteFiles(repository: NotesRepository): Promise<number> {
  const files = await pickAndReadImportFiles()
  let count = 0
  for (const file of files) {
    const lower = file.name.toLowerCase()
    if (lower.endsWith('.json')) {
      const drafts = parseJsonNotes(file.text)
      for (const draft of drafts) {
        await repository.create(draft)
        count += 1
      }
    } else {
      const draft = parseMarkdownNote(file.text, file.name)
      await repository.create(draft)
      count += 1
    }
  }
  return count
}
