import { httpClient } from './http.client'
import type { Group, CreateGroupOptions, UpdateGroupOptions } from '../../../shared/types/group.types'
import type { ApiResponse, PagedResult, PaginationParams } from './config'

export const groupApi = {
  async getGroups(params?: PaginationParams): Promise<ApiResponse<PagedResult<Group>>> {
    return httpClient.get('/groups', params)
  },

  async getGroup(id: string): Promise<ApiResponse<Group>> {
    return httpClient.get(`/groups/${id}`)
  },

  async createGroup(data: CreateGroupOptions): Promise<ApiResponse<Group>> {
    return httpClient.post('/groups', data)
  },

  async updateGroup(id: string, data: UpdateGroupOptions): Promise<ApiResponse<Group>> {
    return httpClient.put(`/groups/${id}`, data)
  },

  async deleteGroup(id: string): Promise<ApiResponse<void>> {
    return httpClient.delete(`/groups/${id}`)
  },

  async addMember(groupId: string, agentId: string): Promise<ApiResponse<Group>> {
    return httpClient.post(`/groups/${groupId}/members`, { agentId })
  },

  async removeMember(groupId: string, agentId: string): Promise<ApiResponse<Group>> {
    return httpClient.delete(`/groups/${groupId}/members/${agentId}`)
  },

  async sendGroupMessage(groupId: string, message: { content: string; type?: string }): Promise<ApiResponse<void>> {
    return httpClient.post(`/groups/${groupId}/messages`, message)
  },
}
