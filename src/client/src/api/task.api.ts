import { httpClient } from './http.client'
import type { Task, CreateTaskOptions, UpdateTaskOptions, TaskStatus } from '../../../shared/types/task.types'
import type { ApiResponse, PagedResult, PaginationParams } from './config'

export const taskApi = {
  async getTasks(params?: PaginationParams & { status?: TaskStatus; agentId?: string }): Promise<ApiResponse<PagedResult<Task>>> {
    return httpClient.get('/tasks', params)
  },

  async getTask(id: string): Promise<ApiResponse<Task>> {
    return httpClient.get(`/tasks/${id}`)
  },

  async createTask(data: CreateTaskOptions): Promise<ApiResponse<Task>> {
    return httpClient.post('/tasks', data)
  },

  async updateTask(id: string, data: UpdateTaskOptions): Promise<ApiResponse<Task>> {
    return httpClient.put(`/tasks/${id}`, data)
  },

  async assignTask(id: string, agentId: string): Promise<ApiResponse<Task>> {
    return httpClient.post(`/tasks/${id}/assign`, { agentId })
  },

  async cancelTask(id: string): Promise<ApiResponse<Task>> {
    return httpClient.post(`/tasks/${id}/cancel`)
  },
}
