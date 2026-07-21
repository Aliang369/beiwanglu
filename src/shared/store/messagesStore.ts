import { create } from 'zustand'
import { messagesApi } from '../api/modules/messagesApi'
import {
  cloneMessage,
  createGuestMessages,
  createGuestNotificationSettings,
} from '../api/mock/guestMessages'
import { isApiError } from '../api/types'
import type { MessageItem, NotificationSettings } from '../types/message'
import { getLocalBackendKind } from '../data/localBackend'
import { openSqliteDatabase, schedulePersist } from '../data/sqlite/database'
import { enqueueSyncChange } from '../sync/syncQueue'
import { useSyncStore } from './syncStore'

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

async function enqueueMessageSync(payload: unknown, entityId: string) {
  if (getLocalBackendKind() !== 'sqlite') return
  try {
    const db = await openSqliteDatabase()
    await enqueueSyncChange(db, 'message', entityId, 'upsert', payload)
    schedulePersist(db)
    useSyncStore.getState().scheduleSync()
  } catch {
    // ignore
  }
}

async function enqueueSettingsSync(patch: Partial<NotificationSettings>) {
  if (getLocalBackendKind() !== 'sqlite') return
  try {
    const db = await openSqliteDatabase()
    await enqueueSyncChange(db, 'notification_settings', 'settings', 'upsert', patch)
    schedulePersist(db)
    useSyncStore.getState().scheduleSync()
  } catch {
    // ignore
  }
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

    try {
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
      const local = get().items.find((item) => item.id === id)
      if (local) {
        const updated = { ...local, unread: false }
        set((state) => {
          const items = state.items.map((item) => (item.id === id ? updated : item))
          return { items, unreadCount: countUnread(items), error: null }
        })
        await enqueueMessageSync(updated, id)
        return updated
      }
      const message = errorMessage(error, '标记已读失败')
      set({ error: message })
      throw error
    }
  },

  markAllRead: async () => {
    const { source } = get()
    if (source === 'guest') {
      guestItems = guestItems.map((item) => ({ ...item, unread: false }))
      set({
        items: guestItems.map(cloneMessage),
        unreadCount: 0,
        error: null,
      })
      return
    }

    try {
      const result = await messagesApi.markAllRead()
      set((state) => ({
        items: state.items.map((item) => ({ ...item, unread: false })),
        unreadCount: result.unreadCount,
        error: null,
      }))
    } catch (error) {
      set((state) => ({
        items: state.items.map((item) => ({ ...item, unread: false })),
        unreadCount: 0,
        error: null,
      }))
      await enqueueMessageSync({ action: 'markAllRead', unread: false }, 'mark-all-read')
      // 不抛出：离线也可全部已读
      void error
    }
  },

  updateSettings: async (patch) => {
    const { source } = get()
    if (source === 'guest') {
      guestSettings = { ...guestSettings, ...patch }
      set({ settings: { ...guestSettings }, error: null })
      return { ...guestSettings }
    }

    try {
      const settings = await messagesApi.updateNotificationSettings(patch)
      set({ settings, error: null })
      return settings
    } catch (error) {
      const settings = { ...get().settings, ...patch }
      set({ settings, error: null })
      await enqueueSettingsSync(patch)
      void error
      return settings
    }
  },

  clearError: () => set({ error: null }),
}))
