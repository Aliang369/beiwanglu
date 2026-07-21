export interface User {
  id: string
  account: string
  name: string
  bio: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  account: string
  password: string
}

export interface RegisterRequest {
  account: string
  password: string
  name?: string
}

export interface RefreshRequest {
  refreshToken: string
}

/**
 * 双 Token 会话。
 * access / refresh 当前存 localStorage（与既有架构一致）；
 * XSS 风险高于 HttpOnly Cookie，后续可升级。
 */
export interface AuthSession {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: User
}
