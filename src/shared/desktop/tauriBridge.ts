/** Tauri 桌面桥：仅在桌面壳内可用；Web 环境全部 no-op / false。 */

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

async function getInvoke(): Promise<((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null> {
  if (!isTauriRuntime()) return null
  try {
    const mod = await import('@tauri-apps/api/core')
    return mod.invoke as (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
  } catch {
    return null
  }
}

export async function nativeDbOpen(fileName = 'beiwanglu.sqlite'): Promise<string | null> {
  const invoke = await getInvoke()
  if (!invoke) return null
  return (await invoke('native_db_open', { fileName })) as string
}

export async function nativeDbPath(): Promise<string | null> {
  const invoke = await getInvoke()
  if (!invoke) return null
  return (await invoke('native_db_path')) as string | null
}

export async function nativeDbExec(sql: string, params?: unknown[]): Promise<void> {
  const invoke = await getInvoke()
  if (!invoke) throw new Error('not in tauri')
  await invoke('native_db_exec', { sql, params: params ?? null })
}

export async function nativeDbQuery(
  sql: string,
  params?: unknown[],
): Promise<Array<{ columns: string[]; values: unknown[][] }>> {
  const invoke = await getInvoke()
  if (!invoke) throw new Error('not in tauri')
  return (await invoke('native_db_query', { sql, params: params ?? null })) as Array<{
    columns: string[]
    values: unknown[][]
  }>
}

export async function nativeDbExecuteBatch(sql: string): Promise<void> {
  const invoke = await getInvoke()
  if (!invoke) throw new Error('not in tauri')
  await invoke('native_db_execute_batch', { sql })
}

export async function readTextFileNative(path: string): Promise<string> {
  const invoke = await getInvoke()
  if (!invoke) throw new Error('not in tauri')
  return (await invoke('read_text_file', { path })) as string
}

export async function listenDesktopMenu(
  event: 'menu://new-note' | 'menu://import' | 'menu://settings' | 'menu://focus-search',
  handler: () => void,
): Promise<() => void> {
  if (!isTauriRuntime()) return () => undefined
  try {
    const { listen } = await import('@tauri-apps/api/event')
    const un = await listen(event, () => handler())
    return () => {
      void un()
    }
  } catch {
    return () => undefined
  }
}
