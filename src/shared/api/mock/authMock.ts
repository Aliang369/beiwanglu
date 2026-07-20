import type {
  AuthSession,
  CodeLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SendCodeRequest,
  User,
} from '../../types/auth'
import { ApiError } from '../types'
import { createId, delay } from './utils'

const MOCK_PASSWORD = '123456'
const MOCK_CODE = '123456'

let mockUser: User = {
  id: 'user_demo_001',
  account: 'demo',
  name: '灵感用户',
  email: 'demo@example.com',
  bio: '本地 Mock 用户',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function toSession(user: User): AuthSession {
  return {
    accessToken: `mock_token_${user.id}_${Date.now()}`,
    tokenType: 'Bearer',
    expiresIn: 7 * 24 * 60 * 60,
    user,
  }
}

function normalizeAccount(account: string): string {
  return account.trim().toLowerCase()
}

export const mockAuthApi = {
  async login(payload: LoginRequest): Promise<AuthSession> {
    await delay()
    if (!payload.account.trim() || !payload.password) {
      throw new ApiError({ kind: 'business', code: 40001, message: '账号或密码不能为空' })
    }
    if (payload.password !== MOCK_PASSWORD) {
      throw new ApiError({ kind: 'business', code: 40101, message: '账号或密码错误' })
    }

    const account = payload.account.trim()
    const isEmail = account.includes('@')
    mockUser = {
      ...mockUser,
      account,
      name: isEmail ? account.split('@')[0] : account,
      email: isEmail ? account : `${normalizeAccount(account)}@example.com`,
      updatedAt: new Date().toISOString(),
    }
    return toSession(mockUser)
  },

  async register(payload: RegisterRequest): Promise<AuthSession> {
    await delay()
    if (!payload.account.trim() || !payload.password) {
      throw new ApiError({ kind: 'business', code: 40001, message: '账号或密码不能为空' })
    }
    if (payload.password.length < 6) {
      throw new ApiError({ kind: 'business', code: 40002, message: '密码至少需要 6 位' })
    }

    const account = payload.account.trim()
    const isEmail = account.includes('@')
    const now = new Date().toISOString()
    mockUser = {
      id: createId('user'),
      account,
      name: payload.name?.trim() || (isEmail ? account.split('@')[0] : account),
      email: isEmail ? account : `${normalizeAccount(account)}@example.com`,
      bio: '',
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    }
    return toSession(mockUser)
  },

  async sendCode(payload: SendCodeRequest): Promise<{ expiresIn: number }> {
    await delay(180)
    if (!payload.account.trim()) {
      throw new ApiError({ kind: 'business', code: 40001, message: '账号不能为空' })
    }
    return { expiresIn: 300 }
  },

  async loginByCode(payload: CodeLoginRequest): Promise<AuthSession> {
    await delay()
    if (!payload.account.trim() || !payload.code.trim()) {
      throw new ApiError({ kind: 'business', code: 40001, message: '账号或验证码不能为空' })
    }
    if (payload.code.trim() !== MOCK_CODE) {
      throw new ApiError({ kind: 'business', code: 40102, message: '验证码错误' })
    }

    const account = payload.account.trim()
    const isEmail = account.includes('@')
    mockUser = {
      ...mockUser,
      account,
      name: isEmail ? account.split('@')[0] : account,
      email: isEmail ? account : `${normalizeAccount(account)}@example.com`,
      updatedAt: new Date().toISOString(),
    }
    return toSession(mockUser)
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<{ success: true }> {
    await delay()
    if (!payload.account.trim() || !payload.code.trim() || !payload.newPassword) {
      throw new ApiError({ kind: 'business', code: 40001, message: '参数不完整' })
    }
    if (payload.code.trim() !== MOCK_CODE) {
      throw new ApiError({ kind: 'business', code: 40102, message: '验证码错误' })
    }
    if (payload.newPassword.length < 6) {
      throw new ApiError({ kind: 'business', code: 40002, message: '密码至少需要 6 位' })
    }
    return { success: true }
  },

  async me(): Promise<User> {
    await delay(120)
    return { ...mockUser }
  },

  async logout(): Promise<{ success: true }> {
    await delay(80)
    return { success: true }
  },
}
