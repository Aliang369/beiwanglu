import { mockNotes } from './mockNotes'
import type { NotesRepository } from './notesRepository'
import { applyNotePatch, buildNewNote, normalizeNotes, purgeExpiredTrashNotes, sortNotesByUpdatedAt } from '../notes/noteDomain'
import type { Note, NoteDraft } from '../types/note'

const STORAGE_KEY = 'beiwanglu.notes.v1'

export class WebNotesRepository implements NotesRepository {
  private readonly storage: Storage

  constructor(storage: Storage = window.localStorage) {
    this.storage = storage
  }

  async list() {
    const notes = this.purgeAndPersist(this.read())
    return sortNotesByUpdatedAt(notes)
  }

  async create(draft: NoteDraft) {
    const note = buildNewNote(draft, this.createId(), new Date().toISOString())
    const notes = [note, ...this.read()]
    this.write(notes)
    return note
  }

  async update(
    id: string,
    patch: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'folderId' | 'isFavorite' | 'isDeleted' | 'deletedAt'>>,
  ) {
    const notes = this.read()
    const index = notes.findIndex((note) => note.id === id)

    if (index < 0) {
      throw new Error(`Note not found: ${id}`)
    }

    const updated = applyNotePatch(notes[index], patch, new Date().toISOString())
    notes[index] = updated
    this.write(notes)
    return updated
  }

  async delete(id: string) {
    const notes = this.read()
    const nextNotes = notes.filter((note) => note.id !== id)

    if (nextNotes.length === notes.length) {
      throw new Error(`Note not found: ${id}`)
    }

    this.write(nextNotes)
  }

  private createId() {
    return window.crypto.randomUUID()
  }

  private read() {
    const raw = this.storage.getItem(STORAGE_KEY)

    if (!raw) {
      this.write(mockNotes)
      return normalizeNotes(mockNotes)
    }

    try {
      return normalizeNotes(this.withoutTrashTestNote(JSON.parse(raw) as Note[]))
    } catch {
      this.write(mockNotes)
      return normalizeNotes(mockNotes)
    }
  }

  private purgeAndPersist(notes: Note[]) {
    const nextNotes = purgeExpiredTrashNotes(notes)

    if (nextNotes.length !== notes.length) {
      this.write(nextNotes)
    }

    return nextNotes
  }

  private withoutTrashTestNote(notes: Note[]) {
    const nextNotes = notes.filter((note) => note.id !== 'trash-test-note')

    if (nextNotes.length === notes.length) {
      return notes
    }

    this.write(nextNotes)
    return nextNotes
  }

  private write(notes: Note[]) {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }
}

export const webNotesRepository = new WebNotesRepository()
