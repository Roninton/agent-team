import { AgentManager } from '../core/AgentManager'
import type { AgentConfig } from '../types/agent.types'

describe('AgentManager', () => {
  let agentManager: AgentManager
  let mockConfig: AgentConfig

  beforeEach(() => {
    agentManager = new AgentManager()
    mockConfig = {
      id: 'test-agent',
      name: 'Test Agent',
      command: 'node',
      args: ['--version'],
      env: {},
      workingDirectory: process.cwd()
    }

    //  mock child_process
    jest.mock('node:child_process', () => ({
      spawn: jest.fn(() => {
        const process = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn(),
          kill: jest.fn(),
          pid: 1234
        }
        // 立刻触发spawn事件
        setTimeout(() => {
          const spawnHandlers = process.on.mock.calls.filter(([event]) => event === 'spawn').map(([_, cb]) => cb)
          spawnHandlers.forEach(cb => cb())
        }, 0)
        // 处理exit事件
        process.on.mockImplementation((event, callback) => {
          if (event === 'exit') setTimeout(() => callback(0), 0)
        })
        return process
      })
    }))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('startAgent', () => {
    it('should start an agent successfully with valid config', async () => {
      const agentId = await agentManager.startAgent(mockConfig)
      expect(agentId).toBe('test-agent')
      expect(agentManager.getAgentStatus('test-agent')).toBe('running')
    })

    it('should throw error when agent with same id is already running', async () => {
      await agentManager.startAgent(mockConfig)
      await expect(agentManager.startAgent(mockConfig)).rejects.toThrow('Agent test-agent is already running')
    })

    it('should throw error when config is invalid', async () => {
      const invalidConfig = { ...mockConfig, command: '' } as AgentConfig
      await expect(agentManager.startAgent(invalidConfig)).rejects.toThrow('Invalid agent configuration')
    })
  })

  describe('stopAgent', () => {
    it('should stop a running agent successfully', async () => {
      await agentManager.startAgent(mockConfig)
      await agentManager.stopAgent('test-agent')
      expect(agentManager.getAgentStatus('test-agent')).toBe('stopped')
    })

    it('should throw error when stopping non-existent agent', async () => {
      await expect(agentManager.stopAgent('non-existent')).rejects.toThrow('Agent non-existent not found')
    })
  })

  describe('getAgentStatus', () => {
    it('should return correct status for existing agent', async () => {
      expect(agentManager.getAgentStatus('test-agent')).toBe('not_found')
      await agentManager.startAgent(mockConfig)
      expect(agentManager.getAgentStatus('test-agent')).toBe('running')
      await agentManager.stopAgent('test-agent')
      expect(agentManager.getAgentStatus('test-agent')).toBe('stopped')
    })

    it('should return not_found for non-existent agent', () => {
      expect(agentManager.getAgentStatus('non-existent')).toBe('not_found')
    })
  })

  describe('rate limiting', () => {
    it('should allow sending message when under rate limit', async () => {
      await agentManager.startAgent(mockConfig)
      const canSend = agentManager.canSendMessage('test-agent')
      expect(canSend).toBe(true)
    })

    it('should reject sending message when exceeding rate limit (5 messages per minute)', async () => {
      await agentManager.startAgent(mockConfig)
      // 发送5条消息
      for (let i = 0; i < 5; i++) {
        agentManager.recordMessageSent('test-agent')
      }
      // 第6条应该被拒绝
      const canSend = agentManager.canSendMessage('test-agent')
      expect(canSend).toBe(false)
    })

    it('should reset rate limit after 1 minute', async () => {
      await agentManager.startAgent(mockConfig)
      // 发送5条消息
      for (let i = 0; i < 5; i++) {
        agentManager.recordMessageSent('test-agent')
      }
      expect(agentManager.canSendMessage('test-agent')).toBe(false)

      // 模拟时间过去1分钟
      jest.useFakeTimers()
      jest.advanceTimersByTime(60 * 1000)

      expect(agentManager.canSendMessage('test-agent')).toBe(true)
      jest.useRealTimers()
    })
  })

  describe('listAgents', () => {
    it('should return list of all agents', async () => {
      expect(agentManager.listAgents()).toHaveLength(0)
      
      await agentManager.startAgent(mockConfig)
      const agents = agentManager.listAgents()
      
      expect(agents).toHaveLength(1)
      expect(agents[0].id).toBe('test-agent')
      expect(agents[0].name).toBe('Test Agent')
      expect(agents[0].status).toBe('running')
    })
  })
})
