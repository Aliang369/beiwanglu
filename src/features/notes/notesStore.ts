import { webNotesRepository } from '../../shared/data/webNotesRepository'
import { createNotesStore } from '../../shared/store/notesStore'

export const useNotesStore = createNotesStore(webNotesRepository)
