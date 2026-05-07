import { Test, TestingModule } from '@nestjs/testing'
import { AgentController } from '../agent.controller'
import { AgentService } from '../agent.service'
import { HttpException } from '@nestjs/common'
import type { AgentInstance, AgentStatus } from '../types/agent.types'

describe('AgentController', () => {
  let controller: AgentController
  let service: jest.Mocked<AgentService>

  const mockAgentInstance: AgentInstance = {
    id: 'agent-1',
    config: {
      id: 'agent-1',
      name: 'Test Agent',
      command: 'node',
      args: [],
      env: {},
      workingDirectory: '/tmp',
    },
    status: 'stopped' as AgentStatus,
    createdAt: Date.now(),
    messageTimestamps: [],
  }

  // Mock service with all methods
  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    getAgentStatus: jest.fn(),
    create: jest.fn(),
    startAgent: jest.fn(),
    stopAgent: jest.fn(),
    restartAgent: jest.fn(),
    remove: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentController],
      providers: [
        {
          provide: AgentService,
          useValue: mockService,
        },
      ],
    }).compile()

    controller = module.get<AgentController>(AgentController)
    service = module.get<AgentService>(AgentService) as jest.Mocked<AgentService>
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findAll', () => {
    it('should return all agents', () => {
      service.findAll.mockReturnValue([mockAgentInstance as any])
      const result = controller.findAll()
      expect(result).toEqual([mockAgentInstance])
      expect(service.findAll).toHaveBeenCalled()
    })

    it('should return empty array when no agents exist', () => {
      service.findAll.mockReturnValue([])
      const result = controller.findAll()
      expect(result).toEqual([])
    })
  })

  describe('findOne', () => {
    it('should return agent when found', () => {
      service.findOne.mockReturnValue(mockAgentInstance as any)
      const result = controller.findOne('agent-1')
      expect(result).toEqual(mockAgentInstance)
      expect(service.findOne).toHaveBeenCalledWith('agent-1')
    })

    it('should throw HttpException with 404 when agent not found', () => {
      service.findOne.mockReturnValue(undefined as any)
      expect(() => controller.findOne('non-existent')).toThrow(HttpException)
      expect(() => controller.findOne('non-existent')).toThrow('Agent not found')
    })
  })

  describe('getStatus', () => {
    it('should return agent status', () => {
      service.getAgentStatus.mockReturnValue('running')
      const result = controller.getStatus('agent-1')
      expect(result).toEqual({ status: 'running' })
      expect(service.getAgentStatus).toHaveBeenCalledWith('agent-1')
    })

    it('should return stopped status when agent is stopped', () => {
      service.getAgentStatus.mockReturnValue('stopped')
      const result = controller.getStatus('agent-1')
      expect(result).toEqual({ status: 'stopped' })
    })
  })

  describe('create', () => {
    const createAgentDto = {
      name: 'New Agent',
      type: 'assistant',
      config: { command: 'node', args: [] },
    }

    it('should create agent successfully', async () => {
      service.create.mockResolvedValue(mockAgentInstance as any)
      const result = await controller.create(createAgentDto as any)
      expect(result).toEqual(mockAgentInstance)
      expect(service.create).toHaveBeenCalledWith(createAgentDto)
    })

    it('should throw HttpException with 400 when creation fails', async () => {
      service.create.mockRejectedValue(new Error('Invalid config'))
      await expect(controller.create(createAgentDto as any)).rejects.toThrow(HttpException)
      await expect(controller.create(createAgentDto as any)).rejects.toThrow('Invalid config')
    })
  })

  describe('start', () => {
    it('should start agent successfully', async () => {
      (service.findOne as jest.Mock).mockReturnValue(mockAgentInstance);
      (service.startAgent as jest.Mock).mockResolvedValue(undefined)
      const result = await controller.start('agent-1')
      expect(result).toEqual({ success: true, message: 'Agent agent-1 started' })
      expect(service.startAgent).toHaveBeenCalledWith(mockAgentInstance.config)
    })

    it('should throw HttpException with 404 when agent not found', async () => {
      (service.findOne as jest.Mock).mockReturnValue(undefined)
      await expect(controller.start('non-existent')).rejects.toThrow(HttpException)
    })

    it('should throw HttpException with 400 when start fails', async () => {
      (service.findOne as jest.Mock).mockReturnValue(mockAgentInstance);
      (service.startAgent as jest.Mock).mockRejectedValue(new Error('Start failed'))
      await expect(controller.start('agent-1')).rejects.toThrow('Start failed')
    })
  })

  describe('stop', () => {
    it('should stop agent successfully', async () => {
      service.stopAgent.mockResolvedValue(undefined)
      const result = await controller.stop('agent-1')
      expect(result).toEqual({ success: true, message: 'Agent agent-1 stopped' })
      expect(service.stopAgent).toHaveBeenCalledWith('agent-1')
    })

    it('should throw HttpException with 400 when stop fails', async () => {
      service.stopAgent.mockRejectedValue(new Error('Stop failed'))
      await expect(controller.stop('agent-1')).rejects.toThrow('Stop failed')
    })
  })

  describe('restart', () => {
    it('should restart agent successfully', async () => {
      service.restartAgent.mockResolvedValue('agent-1')
      const result = await controller.restart('agent-1')
      expect(result).toEqual({ success: true, message: 'Agent agent-1 restarted', agentId: 'agent-1' })
      expect(service.restartAgent).toHaveBeenCalledWith('agent-1')
    })

    it('should throw HttpException with 400 when restart fails', async () => {
      service.restartAgent.mockRejectedValue(new Error('Restart failed'))
      await expect(controller.restart('agent-1')).rejects.toThrow('Restart failed')
    })
  })

  describe('remove', () => {
    it('should delete agent successfully', async () => {
      service.remove.mockResolvedValue(undefined)
      const result = await controller.remove('agent-1')
      expect(result).toEqual({ success: true, message: 'Agent agent-1 deleted' })
      expect(service.remove).toHaveBeenCalledWith('agent-1')
    })

    it('should throw HttpException with 400 when delete fails', async () => {
      service.remove.mockRejectedValue(new Error('Delete failed'))
      await expect(controller.remove('agent-1')).rejects.toThrow('Delete failed')
    })
  })
})
