import { create } from 'zustand'
import { authApi } from '../api/modules/authApi'
import {
  clearAuthStorage,
  getAccessToken,
  getCachedUserJson,
  getRefreshToken,
  setAccessToken,
  setCachedUserJson,
  setRefreshToken,
} from '../api/tokenStorage'
import type {
  AuthSession,
  LoginRequest,
  RegisterRequest,
  User,
} from '../types/auth'

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  isAuthenticated: boolean
  isHydrated: boolean
  isLoading: boolean
  hydrate: () => void
  setSession: (session: AuthSession) => void
  clearSession: () => void
  login: (payload: LoginRequest) => Promise<AuthSession>
  register: (payload: RegisterRequest) => Promise<AuthSession>
  fetchMe: () => Promise<User>
  setUser: (user: User) => void
  logout: () => Promise<void>
}

function parseCachedUser(json: string | null): User | null {
  if (!json) return null
  try {
    const raw = JSON.parse(json) as User & { email?: string }
    const { email: _ignoredEmail, ...user } = raw
    void _ignoredEmail
    return user
  } catch {
    return null
  }
}

function persistSession(session: AuthSession): void {
  setAccessToken(session.accessToken)
  setRefreshToken(session.refreshToken)
  setCachedUserJson(JSON.stringify(session.user))
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,

  hydrate: () => {
    const accessToken = getAccessToken()
    const refreshToken = getRefreshToken()
    const user = parseCachedUser(getCachedUserJson())
    set({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: Boolean(accessToken || refreshToken),
      isHydrated: true,
    })
  },

  setSession: (session) => {
    persistSession(session)
    set({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
      isAuthenticated: true,
    })
  },

  clearSession: () => {
    clearAuthStorage()
    set({
      accessToken: null,
      refreshToken: null,
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
      const refreshToken = get().refreshToken ?? getRefreshToken()
      try {
        await authApi.logout(refreshToken ? { refreshToken } : undefined)
      } catch {
        // 退出以本地清会话为准
      }
      get().clearSession()
    } finally {
      set({ isLoading: false })
    }
  },
}))
