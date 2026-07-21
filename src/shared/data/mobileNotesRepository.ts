/**
 * 移动端本地仓储入口（与 Web/桌面统一 SQLite schema）。
 * 当前复用 sqlite 实现；原生 App 接入时只替换 database 适配层。
 */
export { SqliteNotesRepository as MobileNotesRepository, sqliteNotesRepository as mobileNotesRepository } from './sqlite/sqliteNotesRepository'
