import { Test, TestingModule } from "@nestjs/testing"
import { MessageService } from '../message.service'
import { AgentService } from '../../agent/agent.service'
import type { SendMessageOptions } from '../types/message.types'

describe('MessageService', () => {
  let service: MessageService
  let mockCanSendMessage: jest.Mock
  let mockRecordMessage: jest.Mock

  beforeEach(async () => {
    // Create fresh mocks for each test
    mockCanSendMessage = jest.fn().mockReturnValue(true)
    mockRecordMessage = jest.fn()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: AgentService,
          useValue: {
            canSendMessage: mockCanSendMessage,
            recordMessage: mockRecordMessage,
          },
        },
      ],
    }).compile()

    service = module.get<MessageService>(MessageService)
  })

  describe('sendMessage', () => {
    const baseMessage: SendMessageOptions = {
      conversationId: 'conv-1',
      senderId: 'user-1',
      senderType: 'user',
      receiverId: 'agent-1',
      receiverType: 'agent',
      content: 'Hello, World!',
    }

    it('should send a message successfully', async () => {
      const result = await service.sendMessage(baseMessage)
      expect(result.messageId).toBeDefined()
      expect(result.content).toBe('Hello, World!')
      expect(result.status).toBe('sent')
    })

    it('should assign default values', async () => {
      const result = await service.sendMessage(baseMessage)
      expect(result.type).toBe('text')
      expect(result.priority).toBe('normal')
      expect(result.mentions).toEqual([])
      expect(result.attachments).toEqual([])
    })

    it('should build indexes correctly', async () => {
      await service.sendMessage(baseMessage)
      
      const userMessages = await service.getUserMessages('user-1')
      expect(userMessages).toHaveLength(1)

      const convMessages = await service.getConversationMessages('conv-1')
      expect(convMessages).toHaveLength(1)
    })

    it('should throw error for null content', async () => {
      await expect(
        service.sendMessage({ ...baseMessage, content: null as any }),
      ).rejects.toThrow('Message content cannot be null or undefined')
    })

    it('should check rate limit for agent messages', async () => {
      mockCanSendMessage.mockReturnValueOnce(false)
      
      await expect(
        service.sendMessage({
          ...baseMessage,
          senderType: 'agent',
          senderId: 'agent-1',
        }),
      ).rejects.toThrow('has exceeded rate limit')
    })

    it('should bypass rate limit for urgent priority', async () => {
      mockCanSendMessage.mockReturnValueOnce(false)
      
      const result = await service.sendMessage({
        ...baseMessage,
        senderType: 'agent',
        senderId: 'agent-1',
        priority: 'urgent',
      })
      expect(result.messageId).toBeDefined()
    })

    it('should record message for agent sender', async () => {
      await service.sendMessage({
        ...baseMessage,
        senderType: 'agent',
        senderId: 'agent-1',
      })
      expect(mockRecordMessage).toHaveBeenCalledWith('agent-1')
    })
  })

  describe('getMessage', () => {
    it('should return message by id', async () => {
      const baseMessage: SendMessageOptions = {
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderType: 'user',
        receiverId: 'agent-1',
        receiverType: 'agent',
        content: 'Test',
      }
      const created = await service.sendMessage(baseMessage)
      const found = await service.getMessage(created.messageId)
      expect(found?.messageId).toBe(created.messageId)
    })

    it('should return undefined for non-existent message', async () => {
      const found = await service.getMessage('non-existent')
      expect(found).toBeUndefined()
    })
  })

  describe('updateMessageStatus', () => {
    it('should update message status', async () => {
      const baseMessage: SendMessageOptions = {
        conversationId: 'conv-1',
        senderId: 'user-1',
        senderType: 'user',
        receiverId: 'agent-1',
        receiverType: 'agent',
        content: 'Test',
      }
      const created = await service.sendMessage(baseMessage)
      // Small delay to ensure timestamp is different
      await new Promise(resolve => setTimeout(resolve, 1))
      await service.updateMessageStatus(created.messageId, 'delivered')
      
      const updated = await service.getMessage(created.messageId)
      expect(updated?.status).toBe('delivered')
      expect(updated?.updatedAt).toBeGreaterThanOrEqual(created.createdAt)
    })

    it('should throw error for non-existent message', async () => {
      await expect(
        service.updateMessageStatus('non-existent', 'delivered'),
      ).rejects.toThrow('not found')
    })
  })

  describe('getConversationMessages', () => {
    it('should return messages ordered by time', async () => {
      for (let i = 0; i < 3; i++) {
        await service.sendMessage({
          conversationId: 'conv-order',
          senderId: 'user-1',
          senderType: 'user',
          receiverId: 'agent-1',
          receiverType: 'agent',
          content: `Message ${i}`,
        })
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      const messages = await service.getConversationMessages('conv-order')
      expect(messages).toHaveLength(3)
      expect(messages[0].content).toBe('Message 0')
      expect(messages[2].content).toBe('Message 2')
    })
  })

  describe('deleteMessage', () => {
    it('should delete message and remove from indexes', async () => {
      const baseMessage: SendMessageOptions = {
        conversationId: 'conv-del',
        senderId: 'user-1',
        senderType: 'user',
        receiverId: 'agent-1',
        receiverType: 'agent',
        content: 'To delete',
      }
      const created = await service.sendMessage(baseMessage)
      
      await service.deleteMessage(created.messageId)
      
      const found = await service.getMessage(created.messageId)
      expect(found).toBeUndefined()

      const userMessages = await service.getUserMessages('user-1')
      expect(userMessages).toHaveLength(0)
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      const baseMessage: SendMessageOptions = {
        conversationId: 'conv-stats',
        senderId: 'user-1',
        senderType: 'user',
        receiverId: 'agent-1',
        receiverType: 'agent',
        content: 'Test',
      }
      await service.sendMessage(baseMessage)
      
      const stats = service.getStats()
      expect(stats.totalMessages).toBe(1)
      expect(stats.totalConversations).toBe(1)
      expect(stats.totalUsers).toBe(1)
    })
  })
})
