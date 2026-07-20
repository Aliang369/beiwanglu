import { isApiError } from '../../shared/api/types'

export function getAuthErrorMessage(error: unknown, fallback = '请求失败，请稍后重试'): string {
  if (isApiError(error)) {
    return error.message || fallback
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
