import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { SessionManager } from '../core/SessionManager'
import type { CreateSessionOptions } from '../types/Session'

describe('SessionManager', () => {
  let sessionManager: SessionManager
  let mockOptions: CreateSessionOptions

  beforeEach(() => {
    sessionManager = new SessionManager()
    mockOptions = {
      userId: 'test-user-123'
    }

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('createSession', () => {
    it('should create session successfully with valid options', () => {
      const session = sessionManager.createSession(mockOptions)
      
      expect(session.sessionId).toBeDefined()
      expect(session.userId).toBe('test-user-123')
      expect(session.status).toBe('active')
      expect(session.agentIds).toEqual([])
      expect(session.timeoutMs).toBe(30 * 60 * 1000) // 默认30分钟超时
    })

    it('should use custom sessionId when provided', () => {
      const customId = 'custom-session-id-456'
      const session = sessionManager.createSession({ ...mockOptions, sessionId: customId })
      
      expect(session.sessionId).toBe(customId)
    })

    it('should use custom timeout when provided', () => {
      const customTimeout = 60 * 60 * 1000 // 1小时
      const session = sessionManager.createSession({ ...mockOptions, timeoutMs: customTimeout })
      
      expect(session.timeoutMs).toBe(customTimeout)
    })

    it('should throw error when creating duplicate sessionId', () => {
      const customId = 'duplicate-id'
      sessionManager.createSession({ ...mockOptions, sessionId: customId })
      
      expect(() => sessionManager.createSession({ ...mockOptions, sessionId: customId }))
        .toThrow('Session duplicate-id already exists')
    })
  })

  describe('getSession', () => {
    it('should return session when sessionId exists', () => {
      const session = sessionManager.createSession(mockOptions)
      const foundSession = sessionManager.getSession(session.sessionId)
      
      expect(foundSession).toEqual(session)
    })

    it('should return undefined when sessionId does not exist', () => {
      const session = sessionManager.getSession('non-existent-id')
      expect(session).toBeUndefined()
    })
  })

  describe('updateSessionLastActive', () => {
    it('should update lastActiveAt timestamp', () => {
      const session = sessionManager.createSession(mockOptions)
      const originalTime = session.lastActiveAt
      
      vi.advanceTimersByTime(1000)
      sessionManager.updateSessionLastActive(session.sessionId)
      
      const updatedSession = sessionManager.getSession(session.sessionId)!
      expect(updatedSession.lastActiveAt).toBeGreaterThan(originalTime)
    })

    it('should not throw error for non-existent sessionId', () => {
      expect(() => sessionManager.updateSessionLastActive('non-existent-id'))
        .not.toThrow()
    })
  })

  describe('addAgentToSession', () => {
    it('should add agent to session successfully', () => {
      const session = sessionManager.createSession(mockOptions)
      const agentId = 'test-agent-789'
      
      sessionManager.addAgentToSession(session.sessionId, agentId)
      
      const updatedSession = sessionManager.getSession(session.sessionId)!
      expect(updatedSession.agentIds).toContain(agentId)
    })

    it('should not add duplicate agent to session', () => {
      const session = sessionManager.createSession(mockOptions)
      const agentId = 'test-agent-789'
      
      sessionManager.addAgentToSession(session.sessionId, agentId)
      sessionManager.addAgentToSession(session.sessionId, agentId) // 重复添加
      
      const updatedSession = sessionManager.getSession(session.sessionId)!
      expect(updatedSession.agentIds).toHaveLength(1)
    })

    it('should throw error when adding agent to non-existent session', () => {
      expect(() => sessionManager.addAgentToSession('non-existent-id', 'agent-123'))
        .toThrow('Session non-existent-id not found')
    })
  })

  describe('removeAgentFromSession', () => {
    it('should remove agent from session successfully', () => {
      const session = sessionManager.createSession(mockOptions)
      const agentId = 'test-agent-789'
      
      sessionManager.addAgentToSession(session.sessionId, agentId)
      sessionManager.removeAgentFromSession(session.sessionId, agentId)
      
      const updatedSession = sessionManager.getSession(session.sessionId)!
      expect(updatedSession.agentIds).not.toContain(agentId)
    })

    it('should not throw error when removing non-existent agent', () => {
      const session = sessionManager.createSession(mockOptions)
      
      expect(() => sessionManager.removeAgentFromSession(session.sessionId, 'non-existent-agent'))
        .not.toThrow()
    })
  })

  describe('destroySession', () => {
    it('should destroy session successfully', () => {
      const session = sessionManager.createSession(mockOptions)
      
      sessionManager.destroySession(session.sessionId)
      
      const foundSession = sessionManager.getSession(session.sessionId)
      expect(foundSession).toBeUndefined()
    })

    it('should not throw error when destroying non-existent session', () => {
      expect(() => sessionManager.destroySession('non-existent-id'))
        .not.toThrow()
    })
  })

  describe('listUserSessions', () => {
    it('should return all sessions for a specific user', () => {
      const userId = 'user-123'
      const otherUserId = 'user-456'
      
      // 创建3个用户1的会话
      const session1 = sessionManager.createSession({ userId })
      const session2 = sessionManager.createSession({ userId })
      const session3 = sessionManager.createSession({ userId })
      // 创建1个其他用户的会话
      sessionManager.createSession({ userId: otherUserId })
      
      const userSessions = sessionManager.listUserSessions(userId)
      
      expect(userSessions).toHaveLength(3)
      expect(userSessions.map(s => s.sessionId)).toEqual(
        expect.arrayContaining([session1.sessionId, session2.sessionId, session3.sessionId])
      )
    })

    it('should return empty array when user has no sessions', () => {
      const sessions = sessionManager.listUserSessions('non-existent-user')
      expect(sessions).toEqual([])
    })
  })

  describe('session timeout cleanup', () => {
    it('should automatically destroy expired sessions', () => {
      const timeoutMs = 1000 // 1秒超时
      const session = sessionManager.createSession({ ...mockOptions, timeoutMs })
      
      expect(sessionManager.getSession(session.sessionId)).toBeDefined()
      
      // 时间过去1.5秒
      vi.advanceTimersByTime(1500)
      sessionManager.cleanupExpiredSessions()
      
      const foundSession = sessionManager.getSession(session.sessionId)
      expect(foundSession).toBeUndefined()
    })

    it('should not destroy sessions that are still active', () => {
      const timeoutMs = 5000 // 5秒超时
      const session = sessionManager.createSession({ ...mockOptions, timeoutMs })
      
      // 时间过去3秒
      vi.advanceTimersByTime(3000)
      sessionManager.cleanupExpiredSessions()
      
      expect(sessionManager.getSession(session.sessionId)).toBeDefined()
    })

    it('should reset timeout when session is active', () => {
      const timeoutMs = 2000 // 2秒超时
      const session = sessionManager.createSession({ ...mockOptions, timeoutMs })
      
      // 时间过去1.5秒，会话还没超时
      vi.advanceTimersByTime(1500)
      // 更新最后活跃时间
      sessionManager.updateSessionLastActive(session.sessionId)
      
      // 再过去1秒，会话还没超时
      vi.advanceTimersByTime(1000)
      sessionManager.cleanupExpiredSessions()
      
      expect(sessionManager.getSession(session.sessionId)).toBeDefined()
      
      // 再过去1.5秒，会话超时
      vi.advanceTimersByTime(1500)
      sessionManager.cleanupExpiredSessions()
      
      expect(sessionManager.getSession(session.sessionId)).toBeUndefined()
    })
  })
})
