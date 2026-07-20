import type { MessageItem, NotificationSettings } from '../../types/message'

const now = Date.now()

export function createGuestMessages(): MessageItem[] {
  return [
    {
      id: 'guest-system-v24-release',
      title: '系统更新：V2.4 版本已发布',
      summary: '灵感笔录 V2.4 现已上线。我们优化了同步引擎的速度，并引入了全新的沉浸式写作模式。',
      content: [
        '亲爱的用户，',
        '我们很高兴地宣布，灵感笔录 V2.4 版本现已正式上线！本次更新带来了多项新功能和性能优化，旨在为您提供更加流畅、沉浸式的写作体验。',
        '主要更新包括全新画廊视图、深度专注模式、同步性能提升，以及增强的 Markdown 支持。网页版用户刷新页面即可体验新版本。',
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
      id: 'guest-security-new-device',
      title: '新设备登录提醒',
      summary: '您的账户刚刚在 macOS 设备上完成登录。如果这不是您的操作，请立即更改密码。',
      content: [
        '我们检测到您的账户刚刚在一台新的 macOS 设备上完成登录。',
        '如果这是您本人的操作，可以忽略此提醒；如果不是，请尽快修改密码并检查账户安全设置。',
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
      id: 'guest-shared-marketing-note',
      title: '新的共享笔记',
      summary: '李磊 与您分享了“2024Q3营销计划”。您可以在协作空间中查看并继续编辑。',
      content: [
        '李磊 与您分享了一篇新的协作笔记：“2024Q3营销计划”。',
        '该笔记包含季度目标、渠道规划和关键时间节点。您可以打开协作空间查看详情，并补充自己的想法。',
      ],
      time: '1 小时前',
      createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
      type: 'comment',
      category: 'content',
      source: '协作提醒',
      tag: '共享笔记',
      unread: true,
      primaryAction: '查看共享笔记',
    },
    {
      id: 'guest-trash-cleanup-complete',
      title: '空间清理完成',
      summary: '废纸篓已自动清空超过 30 天的笔记（共 12 篇）。已释放 2.4MB 存储空间。',
      content: [
        '系统已完成一次自动空间清理。',
        '本次清理移除了废纸篓中超过 30 天的笔记，共 12 篇，释放 2.4MB 存储空间。此操作不会影响您当前保留的笔记。',
      ],
      time: '昨天',
      createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      type: 'system',
      category: 'system',
      source: '系统通知',
      tag: '系统',
      unread: false,
    },
  ]
}

export function createGuestNotificationSettings(): NotificationSettings {
  return {
    systemEnabled: true,
    securityEnabled: true,
    contentEnabled: true,
    emailEnabled: false,
  }
}

export function cloneMessage(item: MessageItem): MessageItem {
  return { ...item, content: [...item.content] }
}
