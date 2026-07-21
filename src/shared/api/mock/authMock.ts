import type {
  AuthSession,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  User,
} from '../../types/auth'
import { ApiError } from '../types'
import { createId, delay } from './utils'

const MOCK_PASSWORD = '123456'

let mockUser: User = {
  id: 'user_demo_001',
  account: 'demo',
  name: '灵感用户',
  bio: '本地 Mock 用户',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

let mockRefreshToken = 'mock_refresh_demo'

function toSession(user: User): AuthSession {
  mockRefreshToken = `mock_refresh_${user.id}_${Date.now()}`
  return {
    accessToken: `mock_token_${user.id}_${Date.now()}`,
    refreshToken: mockRefreshToken,
    tokenType: 'Bearer',
    expiresIn: 15 * 60,
    user,
  }
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
    mockUser = {
      ...mockUser,
      account,
      name: account,
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
    const now = new Date().toISOString()
    mockUser = {
      id: createId('user'),
      account,
      name: payload.name?.trim() || account,
      bio: '',
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    }
    return toSession(mockUser)
  },

  async refresh(payload: RefreshRequest): Promise<AuthSession> {
    await delay(80)
    if (!payload.refreshToken || payload.refreshToken !== mockRefreshToken) {
      throw new ApiError({ kind: 'unauthorized', code: 401, message: 'refresh token 无效', status: 401 })
    }
    return toSession(mockUser)
  },

  async me(): Promise<User> {
    await delay(120)
    return { ...mockUser }
  },

  async logout(_payload?: RefreshRequest): Promise<{ success: true }> {
    await delay(80)
    mockRefreshToken = `mock_refresh_revoked_${Date.now()}`
    return { success: true }
  },
}
