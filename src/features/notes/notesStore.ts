import { webNotesRepository } from '../../shared/data/webNotesRepository'
import { createNotesStore } from '../../shared/store/notesStore'

// 默认先挂 localStorage，避免静态依赖 sql.js 导致首屏白屏；
// bootstrap / NotesHome 在探测 SQLite 成功后会 setRepository 切到 sqlite。
export const useNotesStore = createNotesStore(webNotesRepository)
