export interface User {
  id: string
  account: string
  name: string
  email: string
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

export interface CodeLoginRequest {
  account: string
  code: string
}

export type SendCodeScene = 'login' | 'register' | 'reset_password'

export interface SendCodeRequest {
  account: string
  scene: SendCodeScene
}

export interface ResetPasswordRequest {
  account: string
  code: string
  newPassword: string
}

export interface AuthSession {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: User
}
