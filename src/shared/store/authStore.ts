import { create } from 'zustand'
import { authApi } from '../api/modules/authApi'
import {
  clearAuthStorage,
  getAccessToken,
  getCachedUserJson,
  setAccessToken,
  setCachedUserJson,
} from '../api/tokenStorage'
import type {
  AuthSession,
  CodeLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SendCodeRequest,
  User,
} from '../types/auth'

export interface AuthState {
  accessToken: string | null
  user: User | null
  isAuthenticated: boolean
  isHydrated: boolean
  isLoading: boolean
  hydrate: () => void
  setSession: (session: AuthSession) => void
  clearSession: () => void
  login: (payload: LoginRequest) => Promise<AuthSession>
  register: (payload: RegisterRequest) => Promise<AuthSession>
  loginByCode: (payload: CodeLoginRequest) => Promise<AuthSession>
  sendCode: (payload: SendCodeRequest) => Promise<{ expiresIn: number }>
  resetPassword: (payload: ResetPasswordRequest) => Promise<{ success: true }>
  fetchMe: () => Promise<User>
  setUser: (user: User) => void
  logout: () => Promise<void>
}

function parseCachedUser(json: string | null): User | null {
  if (!json) return null
  try {
    return JSON.parse(json) as User
  } catch {
    return null
  }
}

function persistSession(session: AuthSession): void {
  setAccessToken(session.accessToken)
  setCachedUserJson(JSON.stringify(session.user))
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,

  hydrate: () => {
    const accessToken = getAccessToken()
    const user = parseCachedUser(getCachedUserJson())
    set({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken),
      isHydrated: true,
    })
  },

  setSession: (session) => {
    persistSession(session)
    set({
      accessToken: session.accessToken,
      user: session.user,
      isAuthenticated: true,
    })
  },

  clearSession: () => {
    clearAuthStorage()
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    })
  },

  login: async (payload) => {
    set({ isLoading: true })
    try {
      const session = await authApi.login(payload)
      get().setSession(session)
      return session
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (payload) => {
    set({ isLoading: true })
    try {
      // 注册成功不自动登录：由 UI 引导回登录页
      return await authApi.register(payload)
    } finally {
      set({ isLoading: false })
    }
  },

  loginByCode: async (payload) => {
    set({ isLoading: true })
    try {
      const session = await authApi.loginByCode(payload)
      get().setSession(session)
      return session
    } finally {
      set({ isLoading: false })
    }
  },

  sendCode: async (payload) => {
    return authApi.sendCode(payload)
  },

  resetPassword: async (payload) => {
    set({ isLoading: true })
    try {
      return await authApi.resetPassword(payload)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchMe: async () => {
    const user = await authApi.me()
    setCachedUserJson(JSON.stringify(user))
    set({ user, isAuthenticated: true })
    return user
  },

  setUser: (user) => {
    setCachedUserJson(JSON.stringify(user))
    set({ user })
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      try {
        await authApi.logout()
      } catch {
        // 退出以本地清会话为准，远端失败不阻断
      }
      get().clearSession()
    } finally {
      set({ isLoading: false })
    }
  },
}))
