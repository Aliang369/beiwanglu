/**
 * SQLite 笔记仓储入口。
 * Web 使用 sql.js 实现；桌面/移动端后续替换 database 适配层即可。
 */
export { SqliteNotesRepository, sqliteNotesRepository } from './sqlite/sqliteNotesRepository'
export type { SyncEntity } from './sqlite/schema'
