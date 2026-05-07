import { httpClient } from './http.client'
import type { ApiResponse } from './config'

export interface ContextEntry {
  key: string
  value: any
  type: 'variable' | 'function' | 'file' | 'memory'
  timestamp: number
}

export interface ContextSnapshot {
  sessionId: string
  entries: ContextEntry[]
  createdAt: number
}

export const contextApi = {
  async getContext(sessionId: string): Promise<ApiResponse<ContextSnapshot>> {
    return httpClient.get(`/sessions/${sessionId}/context`)
  },

  async updateContext(sessionId: string, data: { key: string; value: any; type?: string }): Promise<ApiResponse<ContextSnapshot>> {
    return httpClient.put(`/sessions/${sessionId}/context`, data)
  },

  async clearContext(sessionId: string): Promise<ApiResponse<void>> {
    return httpClient.delete(`/sessions/${sessionId}/context`)
  },

  async mergeContext(sessionId: string, entries: ContextEntry[]): Promise<ApiResponse<ContextSnapshot>> {
    return httpClient.post(`/sessions/${sessionId}/context/merge`, { entries })
  },
}
