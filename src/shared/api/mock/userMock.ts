import type {
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserProfile,
} from '../../types/userProfile'
import { ApiError } from '../types'
import { delay } from './utils'

let profile: UserProfile = {
  id: 'user_demo_001',
  account: 'demo',
  name: '灵感用户',
  bio: '本地 Mock 用户',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export const mockUserApi = {
  async getProfile(): Promise<UserProfile> {
    await delay(120)
    return { ...profile }
  },

  async updateProfile(payload: UpdateProfileRequest): Promise<UserProfile> {
    await delay()
    profile = {
      ...profile,
      ...payload,
      updatedAt: new Date().toISOString(),
    }
    return { ...profile }
  },

  async changePassword(payload: ChangePasswordRequest): Promise<{ success: true }> {
    await delay()
    if (!payload.currentPassword || !payload.newPassword) {
      throw new ApiError({ kind: 'business', code: 40001, message: '密码不能为空' })
    }
    if (payload.newPassword.length < 6) {
      throw new ApiError({ kind: 'business', code: 40002, message: '新密码至少需要 6 位' })
    }
    if (payload.currentPassword === payload.newPassword) {
      throw new ApiError({ kind: 'business', code: 40003, message: '新密码不能与当前密码相同' })
    }
    return { success: true }
  },
}
