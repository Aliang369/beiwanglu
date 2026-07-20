import type {
  ChangePasswordRequest,
  SecuritySettings,
  UpdateProfileRequest,
  UserProfile,
} from '../../types/userProfile'
import { isMockApiMode } from '../config'
import { request } from '../httpClient'
import { mockUserApi } from '../mock/userMock'

export const userApi = {
  getProfile(): Promise<UserProfile> {
    if (isMockApiMode()) return mockUserApi.getProfile()
    return request<UserProfile>({
      method: 'GET',
      path: '/user/profile',
    })
  },

  updateProfile(payload: UpdateProfileRequest): Promise<UserProfile> {
    if (isMockApiMode()) return mockUserApi.updateProfile(payload)
    return request<UserProfile>({
      method: 'PATCH',
      path: '/user/profile',
      body: payload,
    })
  },

  getSecuritySettings(): Promise<SecuritySettings> {
    if (isMockApiMode()) return mockUserApi.getSecuritySettings()
    return request<SecuritySettings>({
      method: 'GET',
      path: '/user/security',
    })
  },

  changePassword(payload: ChangePasswordRequest): Promise<{ success: true }> {
    if (isMockApiMode()) return mockUserApi.changePassword(payload)
    return request<{ success: true }>({
      method: 'POST',
      path: '/user/change-password',
      body: payload,
    })
  },
}
