export type ApiMode = 'mock' | 'real'

export const API_SUCCESS_CODE = 0

export function getApiMode(): ApiMode {
  const mode = import.meta.env.VITE_API_MODE
  return mode === 'real' ? 'real' : 'mock'
}

export function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  return typeof baseUrl === 'string' && baseUrl.trim() ? baseUrl.replace(/\/$/, '') : '/api/v1'
}

export function isMockApiMode(): boolean {
  return getApiMode() === 'mock'
}
