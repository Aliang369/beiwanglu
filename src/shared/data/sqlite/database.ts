import { SQLITE_SCHEMA_SQL, SQLITE_SCHEMA_VERSION } from './schema'
import {
  isTauriRuntime,
  nativeDbExecuteBatch,
  nativeDbExec,
  nativeDbOpen,
  nativeDbQuery,
} from '../../desktop/tauriBridge'

/** 最小 Database 形状：run/exec 均为 async，兼容 sql.js 与桌面原生 SQLite。 */
export interface SqliteDatabase {
  run(sql: string, params?: unknown): Promise<unknown>
  exec(sql: string, params?: unknown): Promise<Array<{ columns: string[]; values: unknown[][] }>>
  export(): Uint8Array
}

interface SqlJsStaticLike {
  Database: new (data?: ArrayLike<number> | null) => {
    run(sql: string, params?: unknown): unknown
    exec(sql: string, params?: unknown): Array<{ columns: string[]; values: unknown[][] }>
    export(): Uint8Array
  }
}

type InitSqlJsFn = (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsStaticLike>

const DB_STORAGE_KEY = 'beiwanglu.sqlite.v1'
const WASM_PATH = '/sql.js/sql-wasm.wasm'
const SQL_JS_SCRIPT_URL = '/sql.js/sql-wasm.js'

let sqlPromise: Promise<SqlJsStaticLike> | null = null
let dbPromise: Promise<SqliteDatabase> | null = null
let persistTimer: number | null = null
let sqliteAvailable: boolean | null = null
let backendKind: 'native' | 'sqljs' | null = null

function asInitSqlJs(value: unknown): InitSqlJsFn | null {
  if (typeof value === 'function') return value as InitSqlJsFn
  return null
}

function resolveInitSqlJs(mod: unknown): InitSqlJsFn {
  const direct = asInitSqlJs(mod)
  if (direct) return direct

  if (mod && typeof mod === 'object') {
    const record = mod as Record<string, unknown>
    const candidates = [record.default, record.initSqlJs, record['module.exports'], record.Module]
    for (const candidate of candidates) {
      const resolved = asInitSqlJs(candidate)
      if (resolved) return resolved
      if (candidate && typeof candidate === 'object') {
        const nested = candidate as Record<string, unknown>
        const nestedResolved = asInitSqlJs(nested.default) ?? asInitSqlJs(nested.initSqlJs)
        if (nestedResolved) return nestedResolved
      }
    }
  }

  throw new Error('sql.js module does not export initSqlJs')
}

async function loadSqlJsViaFetch(): Promise<InitSqlJsFn> {
  const response = await fetch(SQL_JS_SCRIPT_URL)
  if (!response.ok) throw new Error(`failed to fetch sql.js: ${response.status}`)
  const code = await response.text()
  const module = { exports: {} as unknown }
  const exports = module.exports
  const runner = new Function('module', 'exports', `${code}\n; return module.exports;`)
  const exported = runner(module, exports)
  return resolveInitSqlJs(exported)
}

async function loadSqlJsViaDynamicImport(): Promise<InitSqlJsFn> {
  const mod = await import(/* @vite-ignore */ 'sql.js/dist/sql-wasm.js')
  return resolveInitSqlJs(mod)
}

async function loadSqlJs(): Promise<SqlJsStaticLike> {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      let initSqlJs: InitSqlJsFn
      try {
        initSqlJs = await loadSqlJsViaFetch()
      } catch (fetchError) {
        console.warn('[sqlite] fetch loader failed, try dynamic import', fetchError)
        initSqlJs = await loadSqlJsViaDynamicImport()
      }
      return initSqlJs({
        locateFile: (file: string) => (file.endsWith('.wasm') ? WASM_PATH : `/sql.js/${file}`),
      })
    })()
  }
  return sqlPromise
}

function readPersistedBytes(): Uint8Array | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(DB_STORAGE_KEY)
  if (!raw) return null
  try {
    const binary = atob(raw)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

function persistBytes(db: { export(): Uint8Array }): void {
  if (typeof window === 'undefined') return
  try {
    const bytes = db.export()
    let binary = ''
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }
    window.localStorage.setItem(DB_STORAGE_KEY, btoa(binary))
  } catch (error) {
    console.warn('[sqlite] persist failed', error)
  }
}

function normalizeParams(params?: unknown): unknown[] {
  if (params === undefined) return []
  return Array.isArray(params) ? params : [params]
}

function wrapSqlJs(raw: {
  run(sql: string, params?: unknown): unknown
  exec(sql: string, params?: unknown): Array<{ columns: string[]; values: unknown[][] }>
  export(): Uint8Array
}): SqliteDatabase {
  return {
    async run(sql: string, params?: unknown) {
      return raw.run(sql, params as never)
    },
    async exec(sql: string, params?: unknown) {
      return raw.exec(sql, params as never)
    },
    export() {
      return raw.export()
    },
  }
}

class NativeSqliteDatabase implements SqliteDatabase {
  async run(sql: string, params?: unknown) {
    await nativeDbExec(sql, normalizeParams(params))
    return undefined
  }

  async exec(sql: string, params?: unknown) {
    return nativeDbQuery(sql, normalizeParams(params))
  }

  export() {
    return new Uint8Array()
  }
}

async function ensureSchema(db: SqliteDatabase): Promise<void> {
  await db.run(SQLITE_SCHEMA_SQL)
  const versionRow = await db.exec('SELECT value FROM meta WHERE key = ?', ['schema_version'])
  const current = versionRow[0]?.values?.[0]?.[0]
  if (String(current ?? '') !== String(SQLITE_SCHEMA_VERSION)) {
    await db.run(
      `INSERT INTO meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ['schema_version', String(SQLITE_SCHEMA_VERSION)],
    )
  }
}

async function openNativeDatabase(): Promise<SqliteDatabase> {
  const path = await nativeDbOpen('beiwanglu.sqlite')
  if (!path) throw new Error('native open failed')
  const db = new NativeSqliteDatabase()
  // 原生端 execute_batch 更适合整段 schema
  await nativeDbExecuteBatch(SQLITE_SCHEMA_SQL)
  const versionRow = await db.exec('SELECT value FROM meta WHERE key = ?', ['schema_version'])
  const current = versionRow[0]?.values?.[0]?.[0]
  if (String(current ?? '') !== String(SQLITE_SCHEMA_VERSION)) {
    await db.run(
      `INSERT INTO meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ['schema_version', String(SQLITE_SCHEMA_VERSION)],
    )
  }
  backendKind = 'native'
  console.info('[sqlite] using native SQLite at', path)
  return db
}

async function openSqlJsDatabase(): Promise<SqliteDatabase> {
  const SQL = await loadSqlJs()
  const bytes = readPersistedBytes()
  const raw = bytes ? new SQL.Database(bytes) : new SQL.Database()
  const db = wrapSqlJs(raw)
  await ensureSchema(db)
  backendKind = 'sqljs'
  console.info('[sqlite] using sql.js')
  return db
}

export function getSqliteBackendKind(): 'native' | 'sqljs' | null {
  return backendKind
}

export async function openSqliteDatabase(): Promise<SqliteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      if (isTauriRuntime()) {
        try {
          return await openNativeDatabase()
        } catch (error) {
          console.warn('[sqlite] native open failed, fallback sql.js', error)
        }
      }
      return openSqlJsDatabase()
    })()
  }
  return dbPromise
}

export function schedulePersist(db: SqliteDatabase): void {
  if (backendKind === 'native') return
  if (typeof window === 'undefined') return
  if (persistTimer != null) window.clearTimeout(persistTimer)
  persistTimer = window.setTimeout(() => {
    persistTimer = null
    try {
      persistBytes(db)
    } catch (error) {
      console.warn('[sqlite] schedulePersist failed', error)
    }
  }, 250)
}

export async function probeSqliteAvailable(): Promise<boolean> {
  if (sqliteAvailable != null) return sqliteAvailable
  try {
    if (isTauriRuntime()) {
      await nativeDbOpen('beiwanglu.sqlite')
      sqliteAvailable = true
      return true
    }
    await loadSqlJs()
    sqliteAvailable = true
    return true
  } catch (error) {
    console.warn('[sqlite] probe failed', error)
    sqliteAvailable = false
    return false
  }
}
