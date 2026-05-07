export type SessionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'

export interface Session {
  sessionId: string
  agentId: string
  agentName?: string
  status: SessionStatus
  createdAt: number
  connectedAt?: number
  disconnectedAt?: number
  lastActivityAt: number
  messageCount: number
  metadata?: Record<string, any>
}

export interface CreateSessionOptions {
  agentId: string
  agentName?: string
  metadata?: Record<string, any>
}

export interface SessionMetrics {
  totalSessions: number
  activeSessions: number
  totalMessages: number
  averageSessionDuration: number
}
