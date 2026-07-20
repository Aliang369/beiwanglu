export type MessageType = 'system' | 'comment' | 'reminder' | 'update'
export type MessageCategory = 'system' | 'security' | 'content'

export interface MessageItem {
  id: string
  title: string
  summary: string
  content: string[]
  time: string
  createdAt: string
  type: MessageType
  category: MessageCategory
  source: string
  tag: string
  unread: boolean
  primaryAction?: string
  secondaryAction?: string
}

export interface NotificationSettings {
  systemEnabled: boolean
  securityEnabled: boolean
  contentEnabled: boolean
  emailEnabled: boolean
}

export interface MessageListResult {
  items: MessageItem[]
  unreadCount: number
}
