import type { Session, CreateSessionOptions, SessionStatus } from '../types/Session'
import { randomUUID } from 'crypto'

export class SessionManager {
  private sessions: Map<string, Session> = new Map()
  private userSessions: Map<string, Set<string>> = new Map() // userId -> Set<sessionId>
  private readonly DEFAULT_TIMEOUT = 30 * 60 * 1000 // 默认30分钟超时

  /**
   * 创建新会话
   */
  createSession(options: CreateSessionOptions): Session {
    const sessionId = options.sessionId || randomUUID()

    if (this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`)
    }

    const now = Date.now()
    const session: Session = {
      sessionId,
      userId: options.userId,
      agentIds: [],
      status: 'active',
      createdAt: now,
      lastActiveAt: now,
      timeoutMs: options.timeoutMs || this.DEFAULT_TIMEOUT,
      contextId: options.contextId
    }

    this.sessions.set(sessionId, session)

    // 维护用户会话映射
    if (!this.userSessions.has(options.userId)) {
      this.userSessions.set(options.userId, new Set())
    }
    this.userSessions.get(options.userId)!.add(sessionId)

    return { ...session }
  }

  /**
   * 获取会话信息
   */
  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId)
    return session ? { ...session } : undefined
  }

  /**
   * 更新会话最后活跃时间
   */
  updateSessionLastActive(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.lastActiveAt = Date.now()
    }
  }

  /**
   * 向会话添加代理
   */
  addAgentToSession(sessionId: string, agentId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    if (!session.agentIds.includes(agentId)) {
      session.agentIds.push(agentId)
    }
  }

  /**
   * 从会话移除代理
   */
  removeAgentFromSession(sessionId: string, agentId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.agentIds = session.agentIds.filter(id => id !== agentId)
    }
  }

  /**
   * 销毁会话
   */
  destroySession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      this.sessions.delete(sessionId)
      // 从用户会话映射中移除
      const userSessionSet = this.userSessions.get(session.userId)
      if (userSessionSet) {
        userSessionSet.delete(sessionId)
        if (userSessionSet.size === 0) {
          this.userSessions.delete(session.userId)
        }
      }
    }
  }

  /**
   * 获取用户的所有会话
   */
  listUserSessions(userId: string): Session[] {
    const sessionIds = this.userSessions.get(userId) || new Set()
    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter(Boolean)
      .map(session => ({ ...session! }))
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(): void {
    const now = Date.now()
    const expiredSessionIds: string[] = []

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActiveAt > session.timeoutMs) {
        expiredSessionIds.push(sessionId)
      }
    }

    expiredSessionIds.forEach(sessionId => this.destroySession(sessionId))
  }
}

