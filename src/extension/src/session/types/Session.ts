export type SessionStatus = 'creating' | 'active' | 'inactive' | 'destroyed'

export interface Session {
  sessionId: string
  userId: string
  agentIds: string[]
  status: SessionStatus
  createdAt: number
  lastActiveAt: number
  timeoutMs: number // 会话超时时间，默认30分钟
  contextId?: string // 关联的上下文ID
}

export interface CreateSessionOptions {
  userId: string
  sessionId?: string
  timeoutMs?: number
  contextId?: string
}
