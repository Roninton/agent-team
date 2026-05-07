/**
 * 消息类型
 */
export type MessageType = 'text' | 'markdown' | 'code' | 'system' | 'task' | 'tool_call' | 'tool_result'

/**
 * 消息状态
 */
export type MessageStatus = 'sending' | 'completed' | 'failed'

/**
 * 发送者类型
 */
export type SenderType = 'user' | 'agent' | 'system'

/**
 * 消息附件
 */
export interface MessageAttachment {
  type: string
  path?: string
  content?: string
  name?: string
}

/**
 * 基础消息
 */
export interface Message {
  id: string
  sessionId: string
  senderId: string
  senderType: SenderType
  senderName?: string
  senderAvatar?: string
  content: any
  type: MessageType
  attachments?: MessageAttachment[]
  status: MessageStatus
  timestamp: number
  metadata?: Record<string, any>
}

/**
 * 聊天消息
 */
export interface ChatMessage extends Message {
  mentions?: string[]
  replyTo?: string
}

/**
 * 系统消息
 */
export interface SystemMessage extends Message {
  systemType: 'info' | 'warning' | 'error' | 'success'
}

/**
 * 群组消息选项
 */
export interface GroupMessageOptions {
  conversationId: string
  senderId: string
  senderType: SenderType
  content: any
  type?: MessageType
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  mentions?: string[]
}
