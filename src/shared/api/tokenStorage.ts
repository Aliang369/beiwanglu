const ACCESS_TOKEN_KEY = 'beiwanglu.auth.accessToken'
const USER_CACHE_KEY = 'beiwanglu.auth.user'

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
  clearCachedUser()
}
