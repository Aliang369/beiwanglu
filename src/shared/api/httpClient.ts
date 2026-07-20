import { API_SUCCESS_CODE, getApiBaseUrl } from './config'
import { getAccessToken } from './tokenStorage'
import { ApiError, type ApiResponse } from './types'

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
  query?: Record<string, string | number | boolean | null | undefined>
  auth?: boolean
  signal?: AbortSignal
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 15_000

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = getApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${base}${normalizedPath}`, window.location.origin)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined) continue
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new ApiError({
      kind: 'parse',
      message: '响应不是合法 JSON',
      status: response.status,
      details: text,
    })
  }
}

function isApiResponseShape(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'data' in value &&
    typeof (value as ApiResponse<unknown>).code === 'number' &&
    typeof (value as ApiResponse<unknown>).message === 'string'
  )
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const {
    method = 'GET',
    path,
    body,
    query,
    auth = true,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = getAccessToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  const onAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onAbort, { once: true })
  }

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })

    if (response.status === 401) {
      throw new ApiError({
        kind: 'unauthorized',
        message: '未授权或登录已过期',
        code: 401,
        status: 401,
      })
    }

    const payload = await parseJsonSafe(response)

    if (!response.ok) {
      if (isApiResponseShape(payload)) {
        throw new ApiError({
          kind: 'business',
          message: payload.message || `请求失败 (${response.status})`,
          code: payload.code,
          status: response.status,
          details: payload.data,
        })
      }

      throw new ApiError({
        kind: 'http',
        message: `HTTP ${response.status}`,
        code: response.status,
        status: response.status,
        details: payload,
      })
    }

    if (!isApiResponseShape(payload)) {
      throw new ApiError({
        kind: 'parse',
        message: '响应缺少统一业务结构 { code, message, data }',
        status: response.status,
        details: payload,
      })
    }

    if (payload.code !== API_SUCCESS_CODE) {
      throw new ApiError({
        kind: payload.code === 401 ? 'unauthorized' : 'business',
        message: payload.message || '业务请求失败',
        code: payload.code,
        status: response.status,
        details: payload.data,
      })
    }

    return payload.data as T
  } catch (error) {
    if (error instanceof ApiError) throw error

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError({
        kind: 'network',
        message: '请求超时或已取消',
      })
    }

    throw new ApiError({
      kind: 'network',
      message: error instanceof Error ? error.message : '网络异常',
      details: error,
    })
  } finally {
    window.clearTimeout(timeoutId)
    if (signal) signal.removeEventListener('abort', onAbort)
  }
}
