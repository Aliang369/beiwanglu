import type {
  AuthSession,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  User,
} from '../../types/auth'
import { isMockApiMode } from '../config'
import { request } from '../httpClient'
import { mockAuthApi } from '../mock/authMock'

export const authApi = {
  login(payload: LoginRequest): Promise<AuthSession> {
    if (isMockApiMode()) return mockAuthApi.login(payload)
    return request<AuthSession>({
      method: 'POST',
      path: '/auth/login',
      body: payload,
      auth: false,
    })
  },

  register(payload: RegisterRequest): Promise<AuthSession> {
    if (isMockApiMode()) return mockAuthApi.register(payload)
    return request<AuthSession>({
      method: 'POST',
      path: '/auth/register',
      body: payload,
      auth: false,
    })
  },

  refresh(payload: RefreshRequest): Promise<AuthSession> {
    if (isMockApiMode()) return mockAuthApi.refresh(payload)
    return request<AuthSession>({
      method: 'POST',
      path: '/auth/refresh',
      body: payload,
      auth: false,
      // 避免 refresh 自身触发再 refresh
      skipAuthRefresh: true,
    })
  },

  me(): Promise<User> {
    if (isMockApiMode()) return mockAuthApi.me()
    return request<User>({
      method: 'GET',
      path: '/auth/me',
    })
  },

  logout(payload?: RefreshRequest): Promise<{ success: true }> {
    if (isMockApiMode()) return mockAuthApi.logout(payload)
    return request<{ success: true }>({
      method: 'POST',
      path: '/auth/logout',
      body: payload,
      skipAuthRefresh: true,
    })
  },
}
