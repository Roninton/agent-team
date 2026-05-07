import { Test, TestingModule } from '@nestjs/testing'
import { ContextController } from '../context.controller'
import { ContextService } from '../context.service'
import { HttpException } from '@nestjs/common'

describe('ContextController', () => {
  let controller: ContextController
  let service: jest.Mocked<ContextService>

  const mockContext = {
    contextId: 'context-1',
    scope: 'session',
    targetId: 'session-1',
    key: 'test',
    value: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  // Mock service with all methods
  const mockService = {
    setContext: jest.fn(),
    getContextByKey: jest.fn(),
    queryContext: jest.fn(),
    deleteContext: jest.fn(),
    deleteContextByTarget: jest.fn(),
    // TDD controller methods
    getContext: jest.fn(),
    updateContext: jest.fn(),
    clearContext: jest.fn(),
    mergeContext: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContextController],
      providers: [
        {
          provide: ContextService,
          useValue: mockService,
        },
      ],
    }).compile()

    controller = module.get<ContextController>(ContextController)
    service = module.get<ContextService>(ContextService) as jest.Mocked<ContextService>
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getContext', () => {
    it('should return context for session', async () => {
      const expectedEntries = []
      ;(service.queryContext as jest.Mock).mockResolvedValue(expectedEntries)
      const result = await controller.getContext('session-1')
      expect(result).toEqual({ sessionId: 'session-1', entries: expectedEntries })
      expect(service.queryContext).toHaveBeenCalledWith({ scope: 'session', targetId: 'session-1' })
    })

    it('should throw HttpException when queryContext fails', async () => {
      ;(service.queryContext as jest.Mock).mockRejectedValue(new Error('Failed'))
      await expect(controller.getContext('session-1')).rejects.toThrow()
    })
  })

  describe('updateContext', () => {
    const updateDto = { key: 'value' }

    it('should update context successfully', async () => {
      const result = await controller.updateContext('session-1', updateDto)
      expect(result.success).toBe(true)
      expect(result.sessionId).toBe('session-1')
    })
  })

  describe('clearContext', () => {
    it('should clear context successfully', async () => {
      ;(service.deleteContextByTarget as jest.Mock).mockResolvedValue(1)
      const result = await controller.clearContext('session-1')
      expect(result).toEqual({ success: true })
      expect(service.deleteContextByTarget).toHaveBeenCalledWith('session', 'session-1')
    })
  })

  describe('mergeContext', () => {
    const mergeDto = { entries: [] }

    it('should merge context successfully', async () => {
      const result = await controller.mergeContext('session-1', mergeDto)
      expect(result.success).toBe(true)
      expect(result.sessionId).toBe('session-1')
    })
  })
})
