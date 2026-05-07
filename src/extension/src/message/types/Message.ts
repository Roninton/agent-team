export type MessageType = 'text' | 'markdown' | 'code' | 'system' | 'task'

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent' // urgent优先级豁免限流

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  messageId: string
  conversationId: string
  senderId: string
  senderType: 'user' | 'agent' | 'system'
  receiverId: string // 单聊为用户/代理ID，群聊为群ID
  receiverType: 'user' | 'agent' | 'group'
  type: MessageType
  content: any
  priority: MessagePriority
  status: MessageStatus
  mentions: string[] // @的用户/代理ID列表
  attachments: string[] // 附件ID列表
  replyToMessageId?: string
  createdAt: number
  updatedAt: number
}

export interface SendMessageOptions {
  conversationId: string
  senderId: string
  senderType: 'user' | 'agent' | 'system'
  receiverId: string
  receiverType: 'user' | 'agent' | 'group'
  content: any
  type?: MessageType
  priority?: MessagePriority
  mentions?: string[]
  attachments?: string[]
  replyToMessageId?: string
}
