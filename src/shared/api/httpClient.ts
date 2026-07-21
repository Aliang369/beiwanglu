import { API_SUCCESS_CODE, getApiBaseUrl, isMockApiMode } from './config'
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setCachedUserJson,
  setRefreshToken,
} from './tokenStorage'
import { ApiError, type ApiResponse } from './types'
import type { AuthSession } from '../types/auth'
import { mockAuthApi } from './mock/authMock'

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
  query?: Record<string, string | number | boolean | null | undefined>
  auth?: boolean
  signal?: AbortSignal
  timeoutMs?: number
  /** 为 true 时 401 不触发自动 refresh（用于 /auth/refresh 自身等） */
  skipAuthRefresh?: boolean
}

const DEFAULT_TIMEOUT_MS = 15_000

let refreshPromise: Promise<boolean> | null = null

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

function persistRefreshedSession(session: AuthSession): void {
  setAccessToken(session.accessToken)
  setRefreshToken(session.refreshToken)
  setCachedUserJson(JSON.stringify(session.user))
}

/**
 * 使用 refreshToken 换发新会话。
 * 并发 401 共用一个 promise，避免重复刷新。
 */
async function tryRefreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    try {
      if (isMockApiMode()) {
        const session = await mockAuthApi.refresh({ refreshToken })
        persistRefreshedSession(session)
        return true
      }

      const response = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      const payload = await parseJsonSafe(response)
      if (!response.ok || !isApiResponseShape(payload) || payload.code !== API_SUCCESS_CODE) {
        return false
      }

      const session = payload.data as AuthSession
      if (!session?.accessToken || !session?.refreshToken) return false
      persistRefreshedSession(session)
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function requestOnce(options: RequestOptions): Promise<{ response: Response; payload: unknown; unauthorized: boolean }> {
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
      return { response, payload: null, unauthorized: true }
    }

    const payload = await parseJsonSafe(response)
    return { response, payload, unauthorized: false }
  } finally {
    window.clearTimeout(timeoutId)
    if (signal) signal.removeEventListener('abort', onAbort)
  }
}

function throwFromResponse(response: Response, payload: unknown): never {
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
      message: `请求失败 (${response.status})`,
      status: response.status,
      details: payload,
    })
  }

  if (!isApiResponseShape(payload)) {
    throw new ApiError({
      kind: 'parse',
      message: '响应缺少统一业务结构',
      status: response.status,
      details: payload,
    })
  }

  if (payload.code !== API_SUCCESS_CODE) {
    throw new ApiError({
      kind: 'business',
      message: payload.message || '业务错误',
      code: payload.code,
      status: response.status,
      details: payload.data,
    })
  }

  return payload.data as never
}

export async function request<T>(options: RequestOptions): Promise<T> {
  try {
    let result = await requestOnce(options)

    if (result.unauthorized) {
      const canRefresh = options.auth !== false && !options.skipAuthRefresh
      if (canRefresh) {
        const refreshed = await tryRefreshSession()
        if (refreshed) {
          result = await requestOnce(options)
        }
      }

      if (result.unauthorized) {
        clearAuthStorage()
        throw new ApiError({
          kind: 'unauthorized',
          message: '未授权或登录已过期',
          code: 401,
          status: 401,
        })
      }
    }

    if (!result.response.ok) {
      throwFromResponse(result.response, result.payload)
    }

    if (!isApiResponseShape(result.payload)) {
      throw new ApiError({
        kind: 'parse',
        message: '响应缺少统一业务结构',
        status: result.response.status,
        details: result.payload,
      })
    }

    if (result.payload.code !== API_SUCCESS_CODE) {
      // 业务层 401 类也可尝试 refresh（少数接口用 body code）
      if (
        result.payload.code === 401 &&
        options.auth !== false &&
        !options.skipAuthRefresh
      ) {
        const refreshed = await tryRefreshSession()
        if (refreshed) {
          const retry = await requestOnce(options)
          if (!retry.unauthorized && isApiResponseShape(retry.payload) && retry.payload.code === API_SUCCESS_CODE) {
            return retry.payload.data as T
          }
        }
        clearAuthStorage()
      }
      throw new ApiError({
        kind: 'business',
        message: result.payload.message || '业务错误',
        code: result.payload.code,
        status: result.response.status,
        details: result.payload.data,
      })
    }

    return result.payload.data as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError({ kind: 'network', message: '请求超时或已取消' })
    }
    throw new ApiError({
      kind: 'network',
      message: error instanceof Error ? error.message : '网络错误',
      details: error,
    })
  }
}
