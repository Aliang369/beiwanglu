export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export type ApiErrorKind = 'business' | 'network' | 'unauthorized' | 'http' | 'parse'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly code: number
  readonly status?: number
  readonly details?: unknown

  constructor(options: {
    kind: ApiErrorKind
    message: string
    code?: number
    status?: number
    details?: unknown
  }) {
    super(options.message)
    this.name = 'ApiError'
    this.kind = options.kind
    this.code = options.code ?? -1
    this.status = options.status
    this.details = options.details
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
