import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { AgentService } from '../agent/agent.service'
import type { Message, SendMessageOptions, MessageStatus } from './types/message.types'

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name)
  private readonly messages: Map<string, Message> = new Map()
  private readonly userMessageIndex: Map<string, Set<string>> = new Map() // userId -> messageId set
  private readonly agentMessageIndex: Map<string, Set<string>> = new Map() // agentId -> messageId set
  private readonly conversationMessageIndex: Map<string, Set<string>> = new Map() // conversationId -> messageId set
  private readonly MAX_CONTENT_LENGTH = 100000 // 100KB content limit

  constructor(
    @Inject(forwardRef(() => AgentService))
    private readonly agentService: AgentService,
  ) {}

  /**
   * 发送消息
   */
  async sendMessage(options: SendMessageOptions): Promise<Message> {
    // 安全校验
    this.validateMessageContent(options.content)

    // Agent限流校验
    if (options.senderType === 'agent' && options.priority !== 'urgent') {
      const canSend = this.agentService.canSendMessage(options.senderId)
      if (!canSend) {
        throw new Error(`Agent ${options.senderId} has exceeded rate limit`)
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
      updatedAt: now,
    }

    // 存储消息
    this.messages.set(messageId, message)

    // 记录Agent发送消息
    if (options.senderType === 'agent') {
      this.agentService.recordMessage(options.senderId)
    }

    // 建立索引
    await this.buildMessageIndexes(message)

    this.logger.debug(`Message sent: ${messageId} from ${options.senderType} ${options.senderId}`)
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
    this.logger.debug(`Message ${messageId} status updated to ${status}`)
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
   * 获取会话的所有消息
   */
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const messageIds = this.conversationMessageIndex.get(conversationId) || new Set()
    return Array.from(messageIds)
      .map(id => this.messages.get(id))
      .filter(Boolean)
      .map(m => ({ ...m! }))
      .sort((a, b) => a.createdAt - b.createdAt) // 会话消息按时间正序排列
  }

  /**
   * 删除消息
   */
  async deleteMessage(messageId: string): Promise<void> {
    const message = this.messages.get(messageId)
    if (!message) {
      return
    }

    // 从索引中移除
    this.userMessageIndex.get(message.senderId)?.delete(messageId)
    this.agentMessageIndex.get(message.senderId)?.delete(messageId)
    this.conversationMessageIndex.get(message.conversationId)?.delete(messageId)

    this.messages.delete(messageId)
    this.logger.debug(`Message deleted: ${messageId}`)
  }

  /**
   * 建立消息索引
   */
  private async buildMessageIndexes(message: Message): Promise<void> {
    // 用户索引
    if (message.senderType === 'user') {
      if (!this.userMessageIndex.has(message.senderId)) {
        this.userMessageIndex.set(message.senderId, new Set())
      }
      this.userMessageIndex.get(message.senderId)!.add(message.messageId)
    }

    // 代理索引
    if (message.senderType === 'agent') {
      if (!this.agentMessageIndex.has(message.senderId)) {
        this.agentMessageIndex.set(message.senderId, new Set())
      }
      this.agentMessageIndex.get(message.senderId)!.add(message.messageId)
    }

    // 会话索引
    if (!this.conversationMessageIndex.has(message.conversationId)) {
      this.conversationMessageIndex.set(message.conversationId, new Set())
    }
    this.conversationMessageIndex.get(message.conversationId)!.add(message.messageId)
  }

  /**
   * 校验消息内容
   */
  private validateMessageContent(content: any): void {
    if (content === null || content === undefined) {
      throw new Error('Message content cannot be null or undefined')
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content)
    if (contentStr.length > this.MAX_CONTENT_LENGTH) {
      throw new Error(`Message content exceeds maximum length of ${this.MAX_CONTENT_LENGTH} bytes`)
    }
  }

  /**
   * 过滤敏感内容
   */
  private filterSensitiveContent(content: any): any {
    if (typeof content === 'string') {
      // 简单的敏感信息过滤（可扩展）
      return content
        .replace(/(password|token|secret)["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, '$1: [REDACTED]')
    }
    return content
  }

  /**
   * 获取所有消息 (TDD - 测试期望)
   */
  async getAllMessages(): Promise<Message[]> {
    return Array.from(this.messages.values())
      .map(m => ({ ...m }))
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * 按会话获取消息 (TDD - 测试期望)
   */
  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return this.getConversationMessages(sessionId)
  }

  /**
   * 获取所有消息统计
   */
  getStats(): {
    totalMessages: number
    totalConversations: number
    totalAgents: number
    totalUsers: number
  } {
    return {
      totalMessages: this.messages.size,
      totalConversations: this.conversationMessageIndex.size,
      totalAgents: this.agentMessageIndex.size,
      totalUsers: this.userMessageIndex.size,
    }
  }
}
