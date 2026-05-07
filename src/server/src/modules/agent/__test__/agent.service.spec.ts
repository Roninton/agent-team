import { Test, TestingModule } from "@nestjs/testing"
import { AgentService } from '../agent.service'
import * as cp from 'child_process'
import type { AgentConfig } from '../types/agent.types'

jest.mock('child_process', () => ({
  spawn: jest.fn(() => {
    const eventHandlers: Record<string, Function[]> = {}
    const process = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((event: string, cb: Function) => {
        if (!eventHandlers[event]) {
          eventHandlers[event] = []
        }
        eventHandlers[event].push(cb)
      }),
      kill: jest.fn(() => {
        // Trigger exit event when kill is called
        if (eventHandlers['exit']) {
          eventHandlers['exit'].forEach((cb) => cb(0, 'SIGTERM'))
        }
      }),
      pid: 1234,
    }
    // 立刻触发spawn事件
    setTimeout(() => {
      if (eventHandlers['spawn']) {
        eventHandlers['spawn'].forEach((cb) => cb())
      }
    }, 0)
    return process
  }),
}))

describe('AgentService', () => {
  let service: AgentService
  let mockConfig: AgentConfig

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentService],
    }).compile()

    service = module.get<AgentService>(AgentService)
    mockConfig = {
      id: 'test-agent',
      name: 'Test Agent',
      command: 'node',
      args: ['--version'],
      env: {},
      workingDirectory: process.cwd(),
      rateLimit: 5,
      rateLimitWindow: 60000,
    }

    jest.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup - reset service state
    jest.clearAllMocks()
  })

  describe('startAgent', () => {
    it('should start an agent successfully with valid config', async () => {
      const agentId = await service.startAgent(mockConfig)
      expect(agentId).toBe('test-agent')
      expect(service.getAgentStatus('test-agent')).toBe('running')
    })

    it('should throw error when agent with same id is already running', async () => {
      await service.startAgent(mockConfig)
      await expect(service.startAgent(mockConfig)).rejects.toThrow(
        'Agent test-agent is already running',
      )
    })

    it('should throw error when config is invalid', async () => {
      const invalidConfig = { ...mockConfig, command: '' } as AgentConfig
      await expect(service.startAgent(invalidConfig)).rejects.toThrow(
        'Invalid agent configuration',
      )
    })
  })

  describe('stopAgent', () => {
    it('should stop a running agent successfully', async () => {
      await service.startAgent(mockConfig)
      await service.stopAgent('test-agent')
      expect(service.getAgentStatus('test-agent')).toBe('stopped')
    })

    it('should throw error when stopping non-existent agent', async () => {
      await expect(service.stopAgent('non-existent')).rejects.toThrow(
        'Agent non-existent not found',
      )
    })
  })

  describe('getAgentStatus', () => {
    it('should return correct status for existing agent', async () => {
      expect(service.getAgentStatus('test-agent')).toBe('not_found')
      await service.startAgent(mockConfig)
      expect(service.getAgentStatus('test-agent')).toBe('running')
      await service.stopAgent('test-agent')
      expect(service.getAgentStatus('test-agent')).toBe('stopped')
    })

    it('should return not_found for non-existent agent', () => {
      expect(service.getAgentStatus('non-existent')).toBe('not_found')
    })
  })

  describe('rate limiting', () => {
    it('should allow sending message when under rate limit', async () => {
      await service.startAgent(mockConfig)
      const canSend = service.canSendMessage('test-agent')
      expect(canSend).toBe(true)
    })

    it('should reject sending message when exceeding rate limit', async () => {
      await service.startAgent(mockConfig)
      // Fill up rate limit
      for (let i = 0; i < 5; i++) {
        service.recordMessage('test-agent')
      }
      const canSend = service.canSendMessage('test-agent')
      expect(canSend).toBe(false)
    })
  })

  describe('findAll and findOne', () => {
    it('should return all agents', async () => {
      await service.startAgent(mockConfig)
      const agents = service.findAll()
      expect(agents).toHaveLength(1)
      expect(agents[0].id).toBe('test-agent')
    })

    it('should return single agent by id', async () => {
      await service.startAgent(mockConfig)
      const agent = service.findOne('test-agent')
      expect(agent).toBeDefined()
      expect(agent?.id).toBe('test-agent')
    })

    it('should return undefined for non-existent agent', () => {
      expect(service.findOne('non-existent')).toBeUndefined()
    })
  })
})
