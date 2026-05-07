import { Test, TestingModule } from '@nestjs/testing'
import { SessionController } from '../session.controller'
import { SessionService } from '../session.service'
import { HttpException } from '@nestjs/common'

describe('SessionController', () => {
  let controller: SessionController
  let service: jest.Mocked<SessionService>

  const mockSession = {
    sessionId: 'session-1',
    agentId: 'agent-1',
    agentName: 'Test Agent',
    status: 'connected',
    createdAt: Date.now(),
  }

  const mockMessage = {
    messageId: 'msg-1',
    content: 'Hello',
    role: 'user',
    createdAt: Date.now(),
  }

  // Mock service with all methods
  const mockService = {
    getAllSessions: jest.fn(),
    getSession: jest.fn(),
    getSessionByAgent: jest.fn(),
    createSession: jest.fn(),
    updateSessionStatus: jest.fn(),
    closeSession: jest.fn(),
    deleteSession: jest.fn(),
    getActiveSessions: jest.fn(),
    recordMessageActivity: jest.fn(),
    // TDD - controller methods
    getSessionMessages: jest.fn(),
    sendSessionMessage: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        {
          provide: SessionService,
          useValue: mockService,
        },
      ],
    }).compile()

    controller = module.get<SessionController>(SessionController)
    service = module.get<SessionService>(SessionService) as jest.Mocked<SessionService>
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getAllSessions', () => {
    it('should return all sessions', async () => {
      jest.spyOn(service, 'getAllSessions').mockResolvedValue([mockSession] as any)
      const result = await controller.getAllSessions()
      expect(result).toEqual([mockSession])
    })

    it('should return empty array when no sessions', async () => {
      jest.spyOn(service, 'getAllSessions').mockResolvedValue([])
      const result = await controller.getAllSessions()
      expect(result).toEqual([])
    })
  })

  describe('getSession', () => {
    it('should return session when found', async () => {
      jest.spyOn(service, 'getSession').mockResolvedValue(mockSession as any)
      const result = await controller.getSession('session-1')
      expect(result).toEqual(mockSession)
    })

    it('should throw 404 when session not found', async () => {
      jest.spyOn(service, 'getSession').mockRejectedValue(new Error('Session not found'))
      await expect(controller.getSession('non-existent')).rejects.toThrow()
    })
  })

  describe('createSession', () => {
    const createDto = { agentId: 'agent-1' }

    it('should create session successfully', async () => {
      jest.spyOn(service, 'createSession').mockResolvedValue(mockSession as any)
      const result = await controller.createSession(createDto as any)
      expect(result).toEqual(mockSession)
    })

    it('should throw HttpException when creation fails', async () => {
      jest.spyOn(service, 'createSession').mockRejectedValue(new Error('Failed'))
      await expect(controller.createSession(createDto as any)).rejects.toThrow()
    })
  })

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      jest.spyOn(service, 'deleteSession').mockResolvedValue(undefined)
      const result = await controller.deleteSession('session-1')
      expect(result).toEqual({ success: true })
    })

    it('should throw HttpException when delete fails', async () => {
      jest.spyOn(service, 'deleteSession').mockRejectedValue(new Error('Failed'))
      await expect(controller.deleteSession('session-1')).rejects.toThrow()
    })
  })

  describe('getSessionMessages', () => {
    it('should return session messages', async () => {
      jest.spyOn(service, 'getSessionMessages').mockResolvedValue([mockMessage] as any)
      const result = await controller.getSessionMessages('session-1')
      expect(result).toEqual([mockMessage])
    })

    it('should throw HttpException when fails', async () => {
      jest.spyOn(service, 'getSessionMessages').mockRejectedValue(new Error('Failed'))
      await expect(controller.getSessionMessages('session-1')).rejects.toThrow()
    })
  })

  describe('sendSessionMessage', () => {
    const sendDto = { content: 'Hello' }

    it('should send message successfully', async () => {
      jest.spyOn(service, 'sendSessionMessage').mockResolvedValue(mockMessage as any)
      const result = await controller.sendSessionMessage('session-1', sendDto as any)
      expect(result).toEqual(mockMessage)
    })

    it('should throw HttpException when send fails', async () => {
      jest.spyOn(service, 'sendSessionMessage').mockRejectedValue(new Error('Failed'))
      await expect(controller.sendSessionMessage('session-1', sendDto as any)).rejects.toThrow()
    })
  })
})
