const ACCESS_TOKEN_KEY = 'beiwanglu.auth.accessToken'
const REFRESH_TOKEN_KEY = 'beiwanglu.auth.refreshToken'
const USER_CACHE_KEY = 'beiwanglu.auth.user'

/**
 * Token 存储说明：
 * - 当前使用 localStorage，实现简单、与现有会话恢复一致。
 * - 风险：XSS 可读取 token；后续可升级为 HttpOnly Cookie 承载 refresh。
 */

export function getAccessToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAccessToken(token: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearAccessToken(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setRefreshToken(token: string): void {
  window.localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function clearRefreshToken(): void {
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getCachedUserJson(): string | null {
  try {
    return window.localStorage.getItem(USER_CACHE_KEY)
  } catch {
    return null
  }
}

export function setCachedUserJson(json: string): void {
  window.localStorage.setItem(USER_CACHE_KEY, json)
}

export function clearCachedUser(): void {
  window.localStorage.removeItem(USER_CACHE_KEY)
}

export function clearAuthStorage(): void {
  clearAccessToken()
  clearRefreshToken()
  clearCachedUser()
}
