import { Test, TestingModule } from "@nestjs/testing"
import { SessionService } from '../session.service'
import { AgentService } from '../../agent/agent.service'
import type { CreateSessionOptions } from '../types/session.types'

// Mock AgentService
const mockAgentService = {
  canSendMessage: jest.fn().mockReturnValue(true),
  recordMessage: jest.fn(),
}

describe('SessionService', () => {
  let service: SessionService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: AgentService,
          useValue: mockAgentService,
        },
      ],
    }).compile()

    service = module.get<SessionService>(SessionService)
    jest.clearAllMocks()
  })

  describe('createSession', () => {
    const baseOptions: CreateSessionOptions = {
      agentId: 'agent-1',
      agentName: 'Test Agent',
    }

    it('should create a session successfully', async () => {
      const result = await service.createSession(baseOptions)
      expect(result.sessionId).toBeDefined()
      expect(result.agentId).toBe('agent-1')
      expect(result.status).toBe('connecting')
    })

    it('should throw error when agent already has active session', async () => {
      await service.createSession(baseOptions)
      const session = await service.getSessionByAgent('agent-1')
      await service.updateSessionStatus(session!.sessionId, 'connected')

      await expect(service.createSession(baseOptions)).rejects.toThrow(
        'already has an active session',
      )
    })
  })

  describe('getSession', () => {
    it('should return session by id', async () => {
      const created = await service.createSession({ agentId: 'agent-1' })
      const found = await service.getSession(created.sessionId)
      expect(found?.sessionId).toBe(created.sessionId)
    })

    it('should return undefined for non-existent session', async () => {
      const found = await service.getSession('non-existent')
      expect(found).toBeUndefined()
    })
  })

  describe('getSessionByAgent', () => {
    it('should return session by agent id', async () => {
      await service.createSession({ agentId: 'agent-1' })
      const found = await service.getSessionByAgent('agent-1')
      expect(found?.agentId).toBe('agent-1')
    })

    it('should return undefined for agent with no session', async () => {
      const found = await service.getSessionByAgent('no-session-agent')
      expect(found).toBeUndefined()
    })
  })

  describe('getAllSessions', () => {
    it('should return all sessions', async () => {
      await service.createSession({ agentId: 'agent-1' })
      await service.createSession({ agentId: 'agent-2' })

      const sessions = await service.getAllSessions()
      expect(sessions).toHaveLength(2)
    })
  })

  describe('updateSessionStatus', () => {
    it('should update session status', async () => {
      const created = await service.createSession({ agentId: 'agent-1' })
      expect(created.status).toBe('connecting')

      await service.updateSessionStatus(created.sessionId, 'connected')
      const updated = await service.getSession(created.sessionId)
      expect(updated?.status).toBe('connected')
      expect(updated?.connectedAt).toBeDefined()
    })

    it('should set disconnectedAt when status becomes disconnected', async () => {
      const created = await service.createSession({ agentId: 'agent-1' })
      await service.updateSessionStatus(created.sessionId, 'disconnected')
      const updated = await service.getSession(created.sessionId)
      expect(updated?.disconnectedAt).toBeDefined()
    })

    it('should throw error for non-existent session', async () => {
      await expect(
        service.updateSessionStatus('non-existent', 'connected'),
      ).rejects.toThrow('not found')
    })
  })

  describe('recordMessageActivity', () => {
    it('should increment message count', async () => {
      const created = await service.createSession({ agentId: 'agent-1' })
      expect(created.messageCount).toBe(0)

      await service.recordMessageActivity(created.sessionId)
      await service.recordMessageActivity(created.sessionId)

      const updated = await service.getSession(created.sessionId)
      expect(updated?.messageCount).toBe(2)
    })

    it('should not throw for non-existent session', async () => {
      await expect(
        service.recordMessageActivity('non-existent'),
      ).resolves.not.toThrow()
    })
  })

  describe('closeSession', () => {
    it('should close session and update status', async () => {
      const created = await service.createSession({ agentId: 'agent-1' })
      await service.closeSession(created.sessionId)

      const closed = await service.getSession(created.sessionId)
      expect(closed?.status).toBe('disconnected')
      expect(closed?.disconnectedAt).toBeDefined()
    })

    it('should remove agent from session map', async () => {
      const created = await service.createSession({ agentId: 'agent-1' })
      await service.closeSession(created.sessionId)

      const found = await service.getSessionByAgent('agent-1')
      expect(found).toBeUndefined()
    })

    it('should throw error for non-existent session', async () => {
      await expect(service.closeSession('non-existent')).rejects.toThrow(
        'not found',
      )
    })
  })

  describe('getActiveSessions', () => {
    it('should return only connected sessions', async () => {
      const s1 = await service.createSession({ agentId: 'agent-1' })
      const s2 = await service.createSession({ agentId: 'agent-2' })

      await service.updateSessionStatus(s1.sessionId, 'connected')
      // s2 remains in 'connecting' state

      const active = await service.getActiveSessions()
      expect(active).toHaveLength(1)
      expect(active[0].agentId).toBe('agent-1')
    })
  })

  describe('getSessionMetrics', () => {
    it('should return correct metrics', async () => {
      const s1 = await service.createSession({ agentId: 'agent-1' })
      await service.updateSessionStatus(s1.sessionId, 'connected')
      await service.recordMessageActivity(s1.sessionId)
      await service.recordMessageActivity(s1.sessionId)

      const metrics = service.getSessionMetrics()
      expect(metrics.totalSessions).toBe(1)
      expect(metrics.activeSessions).toBe(1)
      expect(metrics.totalMessages).toBe(2)
    })
  })

  describe('cleanupIdleSessions', () => {
    it('should cleanup idle sessions', async () => {
      const s1 = await service.createSession({ agentId: 'agent-1' })
      await service.updateSessionStatus(s1.sessionId, 'connected')

      // Manually update lastActivityAt to simulate idle
      const session = (service as any).sessions.get(s1.sessionId)
      session.lastActivityAt = Date.now() - 7200000 // 2 hours ago

      const cleaned = await service.cleanupIdleSessions(3600000) // 1 hour
      expect(cleaned).toBe(1)

      const closed = await service.getSession(s1.sessionId)
      expect(closed?.status).toBe('disconnected')
    })
  })
})
