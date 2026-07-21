import type { Note } from '../types/note'
import type { NotesRepository } from '../data/notesRepository'

/** 与 noteImport.parseJsonNotes 兼容的备份结构 */
export interface NotesJsonBackup {
  version: 1
  exportedAt: string
  notes: Array<{
    title: string
    content: string
    tags?: Note['tags']
    folderId?: string | null
    cover?: string | null
    pinned?: boolean
    readOnly?: boolean
    isFavorite?: boolean
  }>
}

function formatBackupFileName(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `beiwanglu-notes-backup-${y}${m}${d}.json`
}

function triggerDownloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 导出全部未删除笔记为 JSON 备份（不含回收站）。 */
export async function exportActiveNotesJsonBackup(repository: NotesRepository): Promise<number> {
  const notes = await repository.list()
  const active = notes.filter((note) => !note.isDeleted)

  const backup: NotesJsonBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    notes: active.map((note) => ({
      title: note.title,
      content: note.content,
      tags: note.tags,
      folderId: note.folderId,
      cover: note.cover ?? null,
      pinned: Boolean(note.pinned),
      readOnly: Boolean(note.readOnly),
      isFavorite: note.isFavorite,
    })),
  }

  const blob = new Blob([`${JSON.stringify(backup, null, 2)}\n`], {
    type: 'application/json;charset=utf-8',
  })
  triggerDownloadBlob(blob, formatBackupFileName())
  return active.length
}
