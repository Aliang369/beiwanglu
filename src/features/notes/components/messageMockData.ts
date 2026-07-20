/**
 * @deprecated 业务请使用 shared/types/message 与 useMessagesStore。
 * 本文件仅保留兼容 re-export，避免旧引用立即炸掉。
 */
export type { MessageItem, MessageType, MessageCategory } from '../../../shared/types/message'
export { createGuestMessages as createMessageItems } from '../../../shared/api/mock/guestMessages'
