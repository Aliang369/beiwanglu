import type { MessageItem, MessageListResult, NotificationSettings } from '../../types/message'
import { isMockApiMode } from '../config'
import { request } from '../httpClient'
import { mockMessagesApi } from '../mock/messagesMock'

export const messagesApi = {
  list(): Promise<MessageListResult> {
    if (isMockApiMode()) return mockMessagesApi.list()
    return request<MessageListResult>({
      method: 'GET',
      path: '/messages',
    })
  },

  getById(id: string): Promise<MessageItem> {
    if (isMockApiMode()) return mockMessagesApi.getById(id)
    return request<MessageItem>({
      method: 'GET',
      path: `/messages/${id}`,
    })
  },

  markRead(id: string): Promise<MessageItem> {
    if (isMockApiMode()) return mockMessagesApi.markRead(id)
    return request<MessageItem>({
      method: 'POST',
      path: `/messages/${id}/read`,
    })
  },

  markAllRead(): Promise<{ success: true; unreadCount: number }> {
    if (isMockApiMode()) return mockMessagesApi.markAllRead()
    return request<{ success: true; unreadCount: number }>({
      method: 'POST',
      path: '/messages/read-all',
    })
  },

  getNotificationSettings(): Promise<NotificationSettings> {
    if (isMockApiMode()) return mockMessagesApi.getNotificationSettings()
    return request<NotificationSettings>({
      method: 'GET',
      path: '/notifications/settings',
    })
  },

  updateNotificationSettings(
    patch: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> {
    if (isMockApiMode()) return mockMessagesApi.updateNotificationSettings(patch)
    return request<NotificationSettings>({
      method: 'PATCH',
      path: '/notifications/settings',
      body: patch,
    })
  },
}
