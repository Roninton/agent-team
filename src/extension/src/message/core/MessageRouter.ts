import type { AgentManager } from '../../agent/core/AgentManager'
import type { Message, SendMessageOptions, MessageStatus, MessagePriority } from '../types/Message'
import { randomUUID } from 'crypto'

export class MessageRouter {
  private messages: Map<string, Message> = new Map()
  private userMessageIndex: Map<string, Set<string>> = new Map() // userId -> messageId set
  private agentMessageIndex: Map<string, Set<string>> = new Map() // agentId -> messageId set
  private conversationMessageIndex: Map<string, Set<string>> = new Map() // conversationId -> messageId set

  constructor(private agentManager: AgentManager) {}

  /**
   * 发送消息
   */
  async sendMessage(options: SendMessageOptions): Promise<Message> {
    // 安全校验
    this.validateMessageContent(options.content)

    // Agent限流校验
    if (options.senderType === 'agent' && options.priority !== 'urgent') {
      const canSend = this.agentManager.canSendMessage(options.senderId)
      if (!canSend) {
        throw new Error(`Agent ${options.senderId} has exceeded rate limit (5 messages per minute)`)
      }
    }

    const messageId = randomUUID()
    const now = Date.now()

    const message: Message = {
      messageId,
      conversationId: options.conversationId,
      senderId: options.senderId,
      senderType: options.senderType,
      receiverId: options.receiverId,
      receiverType: options.receiverType,
      type: options.type || 'text',
      content: this.filterSensitiveContent(options.content),
      priority: options.priority || 'normal',
      status: 'sent',
      mentions: options.mentions || [],
      attachments: options.attachments || [],
      replyToMessageId: options.replyToMessageId,
      createdAt: now,
      updatedAt: now
    }

    // 存储消息
    this.messages.set(messageId, message)

    // 记录Agent发送消息
    if (options.senderType === 'agent') {
      this.agentManager.recordMessageSent(options.senderId)
    }

    // 建立索引
    await this.buildMessageIndexes(message)

    return { ...message }
  }

  /**
   * 获取消息详情
   */
  async getMessage(messageId: string): Promise<Message | undefined> {
    const message = this.messages.get(messageId)
    return message ? { ...message } : undefined
  }

  /**
   * 更新消息状态
   */
  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<void> {
    const message = this.messages.get(messageId)
    if (!message) {
      throw new Error(`Message ${messageId} not found`)
    }

    message.status = status
    message.updatedAt = Date.now()
  }

  /**
   * 获取用户的所有消息
   */
  async getUserMessages(userId: string): Promise<Message[]> {
    const messageIds = this.userMessageIndex.get(userId) || new Set()
    return Array.from(messageIds)
      .map(id => this.messages.get(id))
      .filter(Boolean)
      .map(m => ({ ...m! }))
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * 获取代理的所有消息
   */
  async getAgentMessages(agentId: string): Promise<Message[]> {
    const messageIds = this.agentMessageIndex.get(agentId) || new Set()
    return Array.from(messageIds)
      .map(id => this.messages.get(id))
      .filter(Boolean)
      .map(m => ({ ...m! }))
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * 获取会话历史消息
   */
  async getConversationHistory(conversationId: string): Promise<Message[]> {
    const messageIds = this.conversationMessageIndex.get(conversationId) || new Set()
    return Array.from(messageIds)
      .map(id => this.messages.get(id))
      .filter(Boolean)
      .map(m => ({ ...m! }))
      .sort((a, b) => b.createdAt - a.createdAt) // 按时间倒序
  }

  /**
   * 校验消息内容合法性
   */
  private validateMessageContent(content: any): void {
    if (typeof content === 'string') {
      // 检测恶意代码
      const maliciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on(click|load|error|mouseover|submit|keydown|keyup|change)/gi,
        /rm\s+-rf\b/gi,
        /\b(fork|exec|system|eval)\(/gi
      ]

      for (const pattern of maliciousPatterns) {
        if (pattern.test(content)) {
          throw new Error('Message contains malicious content')
        }
      }
    }
  }

  /**
   * 过滤敏感内容
   */
  private filterSensitiveContent(content: any): any {
    if (typeof content === 'string') {
      // 敏感字段过滤
      const sensitivePatterns = [
        /password\s*=\s*[^&\s]+/gi,
        /passwd\s*=\s*[^&\s]+/gi,
        /token\s*=\s*[^&\s]+/gi,
        /secret\s*=\s*[^&\s]+/gi,
        /api[_-]?key\s*=\s*[^&\s]+/gi,
        /credit\s*card\s*=\s*[^&\s]+/gi,
        /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g // 银行卡号
      ]

      let filtered = content
      for (const pattern of sensitivePatterns) {
        filtered = filtered.replace(pattern, match => {
          const prefix = match.split('=')[0]
          return `${prefix}=***`
        })
      }

      return filtered
    }
    return content
  }

  /**
   * 建立消息索引
   */
  private async buildMessageIndexes(message: Message): Promise<void> {
    // 会话索引
    if (!this.conversationMessageIndex.has(message.conversationId)) {
      this.conversationMessageIndex.set(message.conversationId, new Set())
    }
    this.conversationMessageIndex.get(message.conversationId)!.add(message.messageId)

    if (message.receiverType === 'group') {
      // 群消息，路由到所有群成员
      const memberIds = await this.getGroupMemberIds(message.receiverId)
      for (const memberId of memberIds) {
        // 判断成员类型是用户还是代理
        if (memberId.startsWith('user-')) {
          this.addToUserIndex(memberId, message.messageId)
        } else if (memberId.startsWith('agent-')) {
          this.addToAgentIndex(memberId, message.messageId)
        }
      }
    } else {
      // 单聊消息
      if (message.receiverType === 'user') {
        this.addToUserIndex(message.receiverId, message.messageId)
      } else if (message.receiverType === 'agent') {
        this.addToAgentIndex(message.receiverId, message.messageId)
      }
    }
  }

  /**
   * 添加到用户消息索引
   */
  private addToUserIndex(userId: string, messageId: string): void {
    if (!this.userMessageIndex.has(userId)) {
      this.userMessageIndex.set(userId, new Set())
    }
    this.userMessageIndex.get(userId)!.add(messageId)
  }

  /**
   * 添加到代理消息索引
   */
  private addToAgentIndex(agentId: string, messageId: string): void {
    if (!this.agentMessageIndex.has(agentId)) {
      this.agentMessageIndex.set(agentId, new Set())
    }
    this.agentMessageIndex.get(agentId)!.add(messageId)
  }

  /**
   * 获取群成员ID列表（测试用mock方法，真实实现调用Group模块）
   */
  protected async getGroupMemberIds(groupId: string): Promise<string[]> {
    // 真实场景应该调用Group模块的接口获取群成员
    // 这里默认返回测试用的成员列表
    return ['user-1', 'user-2', 'agent-3']
  }
}
