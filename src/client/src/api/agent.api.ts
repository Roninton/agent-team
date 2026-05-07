import { httpClient } from './http.client'
import type { AgentConfig, AgentInstance, AgentStatus } from '../../../shared/types/agent.types'
import type { ApiResponse, PagedResult, PaginationParams } from './config'

export const agentApi = {
  async getAgents(params?: PaginationParams): Promise<ApiResponse<PagedResult<AgentInstance>>> {
    return httpClient.get('/agents', params)
  },

  async getAgent(id: string): Promise<ApiResponse<AgentInstance>> {
    return httpClient.get(`/agents/${id}`)
  },

  async createAgent(config: Partial<AgentConfig>): Promise<ApiResponse<AgentInstance>> {
    return httpClient.post('/agents', config)
  },

  async updateAgent(id: string, config: Partial<AgentConfig>): Promise<ApiResponse<AgentInstance>> {
    return httpClient.put(`/agents/${id}`, config)
  },

  async deleteAgent(id: string): Promise<ApiResponse<void>> {
    return httpClient.delete(`/agents/${id}`)
  },

  async startAgent(id: string): Promise<ApiResponse<{ processId: string }>> {
    return httpClient.post(`/agents/${id}/start`)
  },

  async stopAgent(id: string): Promise<ApiResponse<void>> {
    return httpClient.post(`/agents/${id}/stop`)
  },

  async restartAgent(id: string): Promise<ApiResponse<void>> {
    return httpClient.post(`/agents/${id}/restart`)
  },

  async getAgentStatus(id: string): Promise<ApiResponse<{ status: AgentStatus }>> {
    return httpClient.get(`/agents/${id}/status`)
  },

  async sendToAgent(id: string, message: { type: string; content: any }): Promise<ApiResponse<void>> {
    return httpClient.post(`/agents/${id}/send`, message)
  },
}
