import type {
  AuthSession,
  CodeLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SendCodeRequest,
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

  sendCode(payload: SendCodeRequest): Promise<{ expiresIn: number }> {
    if (isMockApiMode()) return mockAuthApi.sendCode(payload)
    return request<{ expiresIn: number }>({
      method: 'POST',
      path: '/auth/send-code',
      body: payload,
      auth: false,
    })
  },

  loginByCode(payload: CodeLoginRequest): Promise<AuthSession> {
    if (isMockApiMode()) return mockAuthApi.loginByCode(payload)
    return request<AuthSession>({
      method: 'POST',
      path: '/auth/login-by-code',
      body: payload,
      auth: false,
    })
  },

  resetPassword(payload: ResetPasswordRequest): Promise<{ success: true }> {
    if (isMockApiMode()) return mockAuthApi.resetPassword(payload)
    return request<{ success: true }>({
      method: 'POST',
      path: '/auth/reset-password',
      body: payload,
      auth: false,
    })
  },

  me(): Promise<User> {
    if (isMockApiMode()) return mockAuthApi.me()
    return request<User>({
      method: 'GET',
      path: '/auth/me',
    })
  },

  logout(): Promise<{ success: true }> {
    if (isMockApiMode()) return mockAuthApi.logout()
    return request<{ success: true }>({
      method: 'POST',
      path: '/auth/logout',
    })
  },
}
