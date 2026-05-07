import { Test, TestingModule } from '@nestjs/testing'
import { MessageController } from '../message.controller'
import { MessageService } from '../message.service'
import { HttpException } from '@nestjs/common'

describe('MessageController', () => {
  let controller: MessageController
  let service: jest.Mocked<MessageService>

  const mockMessage = {
    messageId: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    senderType: 'user',
    content: 'Hello World',
    status: 'sent',
    createdAt: Date.now(),
  }

  // Mock service with all methods
  const mockService = {
    sendMessage: jest.fn(),
    getMessage: jest.fn(),
    updateMessageStatus: jest.fn(),
    getUserMessages: jest.fn(),
    getAgentMessages: jest.fn(),
    getConversationMessages: jest.fn(),
    deleteMessage: jest.fn(),
    getStats: jest.fn(),
    // TDD aliases
    getAllMessages: jest.fn(),
    getMessagesBySession: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [
        {
          provide: MessageService,
          useValue: mockService,
        },
      ],
    }).compile()

    controller = module.get<MessageController>(MessageController)
    service = module.get<MessageService>(MessageService) as jest.Mocked<MessageService>
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getAllMessages', () => {
    it('should return all messages', async () => {
      jest.spyOn(service, 'getAllMessages').mockResolvedValue([mockMessage] as any)
      const result = await controller.getAllMessages()
      expect(result).toEqual([mockMessage])
    })

    it('should return empty array when no messages', async () => {
      jest.spyOn(service, 'getAllMessages').mockResolvedValue([])
      const result = await controller.getAllMessages()
      expect(result).toEqual([])
    })
  })

  describe('getMessage', () => {
    it('should return message when found', async () => {
      jest.spyOn(service, 'getMessage').mockResolvedValue(mockMessage as any)
      const result = await controller.getMessage('msg-1')
      expect(result).toEqual(mockMessage)
    })

    it('should throw 404 when message not found', async () => {
      jest.spyOn(service, 'getMessage').mockRejectedValue(new Error('Message not found'))
      await expect(controller.getMessage('non-existent')).rejects.toThrow()
    })
  })

  describe('getMessagesBySession', () => {
    it('should return messages by session', async () => {
      jest.spyOn(service, 'getMessagesBySession').mockResolvedValue([mockMessage] as any)
      const result = await controller.getMessagesBySession('session-1')
      expect(result).toEqual([mockMessage])
    })

    it('should throw HttpException when fails', async () => {
      jest.spyOn(service, 'getMessagesBySession').mockRejectedValue(new Error('Failed'))
      await expect(controller.getMessagesBySession('session-1')).rejects.toThrow()
    })
  })

  describe('updateMessageStatus', () => {
    const statusDto = { status: 'delivered' }

    it('should update message status successfully', async () => {
      jest.spyOn(service, 'updateMessageStatus').mockResolvedValue({ ...mockMessage, status: 'delivered' } as any)
      const result = await controller.updateMessageStatus('msg-1', statusDto as any)
      expect(result.status).toBe('delivered')
    })

    it('should throw HttpException when update fails', async () => {
      jest.spyOn(service, 'updateMessageStatus').mockRejectedValue(new Error('Failed'))
      await expect(controller.updateMessageStatus('msg-1', statusDto as any)).rejects.toThrow()
    })
  })

  describe('deleteMessage', () => {
    it('should delete message successfully', async () => {
      jest.spyOn(service, 'deleteMessage').mockResolvedValue(undefined)
      const result = await controller.deleteMessage('msg-1')
      expect(result).toEqual({ success: true })
    })

    it('should throw HttpException when delete fails', async () => {
      jest.spyOn(service, 'deleteMessage').mockRejectedValue(new Error('Failed'))
      await expect(controller.deleteMessage('msg-1')).rejects.toThrow()
    })
  })
})
