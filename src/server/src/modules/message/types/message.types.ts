export type MessageType = 'text' | 'markdown' | 'code' | 'system' | 'task'

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent' // urgent优先级豁免限流

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export type SenderType = 'user' | 'agent' | 'system'
export type ReceiverType = 'user' | 'agent' | 'group'

export interface Message {
  messageId: string
  conversationId: string
  senderId: string
  senderType: SenderType
  receiverId: string // 单聊为用户/代理ID，群聊为群ID
  receiverType: ReceiverType
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
  senderType: SenderType
  receiverId: string
  receiverType: ReceiverType
  content: any
  type?: MessageType
  priority?: MessagePriority
  mentions?: string[]
  attachments?: string[]
  replyToMessageId?: string
}
