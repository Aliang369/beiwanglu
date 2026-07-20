import { create } from 'zustand'
import { messagesApi } from '../api/modules/messagesApi'
import {
  cloneMessage,
  createGuestMessages,
  createGuestNotificationSettings,
} from '../api/mock/guestMessages'
import { isApiError } from '../api/types'
import type { MessageItem, NotificationSettings } from '../types/message'

export type MessagesSource = 'guest' | 'api'

export interface MessagesState {
  items: MessageItem[]
  unreadCount: number
  settings: NotificationSettings
  source: MessagesSource
  isLoading: boolean
  error: string | null
  isLoaded: boolean
  load: (authenticated: boolean) => Promise<void>
  getById: (id: string) => Promise<MessageItem>
  markRead: (id: string) => Promise<MessageItem>
  markAllRead: () => Promise<void>
  updateSettings: (patch: Partial<NotificationSettings>) => Promise<NotificationSettings>
  clearError: () => void
}

function countUnread(items: MessageItem[]): number {
  return items.filter((item) => item.unread).length
}

function errorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) return error.message || fallback
  if (error instanceof Error && error.message) return error.message
  return fallback
}

let guestItems = createGuestMessages()
let guestSettings = createGuestNotificationSettings()

export const useMessagesStore = create<MessagesState>((set, get) => ({
  items: [],
  unreadCount: 0,
  settings: createGuestNotificationSettings(),
  source: 'guest',
  isLoading: false,
  error: null,
  isLoaded: false,

  load: async (authenticated) => {
    set({ isLoading: true, error: null })
    try {
      if (authenticated) {
        const [list, settings] = await Promise.all([
          messagesApi.list(),
          messagesApi.getNotificationSettings(),
        ])
        set({
          items: list.items,
          unreadCount: list.unreadCount,
          settings,
          source: 'api',
          isLoaded: true,
          isLoading: false,
          error: null,
        })
        return
      }

      set({
        items: guestItems.map(cloneMessage),
        unreadCount: countUnread(guestItems),
        settings: { ...guestSettings },
        source: 'guest',
        isLoaded: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: errorMessage(error, '消息加载失败'),
      })
    }
  },

  getById: async (id) => {
    const { source, items } = get()
    if (source === 'guest') {
      const found = guestItems.find((item) => item.id === id) ?? items.find((item) => item.id === id)
      if (!found) throw new Error('消息不存在')
      return cloneMessage(found)
    }
    return messagesApi.getById(id)
  },

  markRead: async (id) => {
    const { source } = get()
    try {
      if (source === 'guest') {
        guestItems = guestItems.map((item) => (item.id === id ? { ...item, unread: false } : item))
        const updated = guestItems.find((item) => item.id === id)
        if (!updated) throw new Error('消息不存在')
        set({
          items: guestItems.map(cloneMessage),
          unreadCount: countUnread(guestItems),
          error: null,
        })
        return cloneMessage(updated)
      }

      const updated = await messagesApi.markRead(id)
      set((state) => {
        const items = state.items.map((item) => (item.id === id ? updated : item))
        return {
          items,
          unreadCount: countUnread(items),
          error: null,
        }
      })
      return updated
    } catch (error) {
      const message = errorMessage(error, '标记已读失败')
      set({ error: message })
      throw error
    }
  },

  markAllRead: async () => {
    const { source } = get()
    try {
      if (source === 'guest') {
        guestItems = guestItems.map((item) => ({ ...item, unread: false }))
        set({
          items: guestItems.map(cloneMessage),
          unreadCount: 0,
          error: null,
        })
        return
      }

      const result = await messagesApi.markAllRead()
      set((state) => ({
        items: state.items.map((item) => ({ ...item, unread: false })),
        unreadCount: result.unreadCount,
        error: null,
      }))
    } catch (error) {
      const message = errorMessage(error, '全部标为已读失败')
      set({ error: message })
      throw error
    }
  },

  updateSettings: async (patch) => {
    const { source } = get()
    try {
      if (source === 'guest') {
        guestSettings = { ...guestSettings, ...patch }
        set({ settings: { ...guestSettings }, error: null })
        return { ...guestSettings }
      }

      const settings = await messagesApi.updateNotificationSettings(patch)
      set({ settings, error: null })
      return settings
    } catch (error) {
      const message = errorMessage(error, '通知设置保存失败')
      set({ error: message })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
