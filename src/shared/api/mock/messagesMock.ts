import type { MessageItem, MessageListResult, NotificationSettings } from '../../types/message'
import { ApiError } from '../types'
import { delay } from './utils'

const now = Date.now()

let messages: MessageItem[] = [
  {
    id: 'system-v24-release',
    title: '系统更新：V2.4 版本已发布',
    summary: '灵感笔录 V2.4 现已上线。我们优化了同步引擎的速度，并引入了全新的沉浸式写作模式。',
    content: [
      '亲爱的用户，',
      '我们很高兴地宣布，灵感笔录 V2.4 版本现已正式上线！本次更新带来了多项新功能和性能优化。',
    ],
    time: '10 分钟前',
    createdAt: new Date(now - 10 * 60 * 1000).toISOString(),
    type: 'update',
    category: 'system',
    source: '产品团队',
    tag: '更新公告',
    unread: true,
    primaryAction: '查看更新日志',
  },
  {
    id: 'security-new-device',
    title: '新设备登录提醒',
    summary: '您的账户刚刚在 macOS 设备上完成登录。如果这不是您的操作，请立即更改密码。',
    content: [
      '我们检测到您的账户刚刚在一台新的 macOS 设备上完成登录。',
      '如果这是您本人的操作，可以忽略此提醒；如果不是，请尽快修改密码。',
    ],
    time: '2 小时前',
    createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    type: 'reminder',
    category: 'security',
    source: '安全中心',
    tag: '账户安全',
    unread: true,
    primaryAction: '验证身份',
    secondaryAction: '是我本人的操作',
  },
  {
    id: 'shared-marketing-note',
    title: '新的共享笔记',
    summary: '李磊 与您分享了“2024Q3营销计划”。您可以在协作空间中查看并继续编辑。',
    content: [
      '李磊 与您分享了一篇新的协作笔记：“2024Q3营销计划”。',
      '该笔记包含季度目标、渠道规划和关键时间节点。',
    ],
    time: '1 小时前',
    createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
    type: 'comment',
    category: 'content',
    source: '协作提醒',
    tag: '共享笔记',
    unread: false,
    primaryAction: '查看共享笔记',
  },
]

let notificationSettings: NotificationSettings = {
  systemEnabled: true,
  securityEnabled: true,
  contentEnabled: true,
}

function unreadCount(): number {
  return messages.filter((item) => item.unread).length
}

export const mockMessagesApi = {
  async list(): Promise<MessageListResult> {
    await delay()
    return {
      items: messages.map((item) => ({ ...item, content: [...item.content] })),
      unreadCount: unreadCount(),
    }
  },

  async getById(id: string): Promise<MessageItem> {
    await delay(120)
    const found = messages.find((item) => item.id === id)
    if (!found) {
      throw new ApiError({ kind: 'business', code: 40401, message: '消息不存在' })
    }
    return { ...found, content: [...found.content] }
  },

  async markRead(id: string): Promise<MessageItem> {
    await delay(100)
    const index = messages.findIndex((item) => item.id === id)
    if (index < 0) {
      throw new ApiError({ kind: 'business', code: 40401, message: '消息不存在' })
    }
    messages = messages.map((item, i) => (i === index ? { ...item, unread: false } : item))
    return { ...messages[index], content: [...messages[index].content] }
  },

  async markAllRead(): Promise<{ success: true; unreadCount: number }> {
    await delay(120)
    messages = messages.map((item) => ({ ...item, unread: false }))
    return { success: true, unreadCount: 0 }
  },

  async getNotificationSettings(): Promise<NotificationSettings> {
    await delay(100)
    return { ...notificationSettings }
  },

  async updateNotificationSettings(
    patch: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> {
    await delay(120)
    notificationSettings = { ...notificationSettings, ...patch }
    return { ...notificationSettings }
  },
}
