import { httpClient } from './http.client'
import type { ApiResponse, PagedResult, PaginationParams } from './config'
import type { Message } from '../../../shared/types/message.types'

export interface Session {
  id: string
  agentId: string
  status: 'idle' | 'running' | 'stopped'
  createdAt: number
  startedAt?: number
  stoppedAt?: number
}

export const sessionApi = {
  async getSessions(params?: PaginationParams): Promise<ApiResponse<PagedResult<Session>>> {
    return httpClient.get('/sessions', params)
  },

  async getSession(id: string): Promise<ApiResponse<Session>> {
    return httpClient.get(`/sessions/${id}`)
  },

  async createSession(agentId: string): Promise<ApiResponse<Session>> {
    return httpClient.post('/sessions', { agentId })
  },

  async deleteSession(id: string): Promise<ApiResponse<void>> {
    return httpClient.delete(`/sessions/${id}`)
  },

  async getSessionMessages(sessionId: string, params?: PaginationParams): Promise<ApiResponse<PagedResult<Message>>> {
    return httpClient.get(`/sessions/${sessionId}/messages`, params)
  },

  async sendSessionMessage(sessionId: string, message: { content: string; type?: string }): Promise<ApiResponse<Message>> {
    return httpClient.post(`/sessions/${sessionId}/messages`, message)
  },
}
