import type { ApiResponse } from '../types'
import { API_SUCCESS_CODE } from '../config'

export function ok<T>(data: T, message = 'ok'): ApiResponse<T> {
  return {
    code: API_SUCCESS_CODE,
    message,
    data,
  }
}

export function fail(code: number, message: string, data: unknown = null): ApiResponse<unknown> {
  return {
    code,
    message,
    data,
  }
}

export function delay(ms = 280): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
