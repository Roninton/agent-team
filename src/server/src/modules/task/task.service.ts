import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { AgentService } from '../agent/agent.service'
import { GroupService } from '../group/group.service'
import type {
  Task,
  CreateTaskOptions,
  UpdateTaskOptions,
  TaskMetrics,
} from './types/task.types'

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name)
  private readonly tasks: Map<string, Task> = new Map()
  private readonly agentTaskMap: Map<string, Set<string>> = new Map() // agentId -> taskId[]
  private readonly groupTaskMap: Map<string, Set<string>> = new Map() // groupId -> taskId[]

  constructor(
    @Inject(forwardRef(() => AgentService))
    private readonly agentService: AgentService,
    @Inject(forwardRef(() => GroupService))
    private readonly groupService: GroupService,
  ) {}

  /**
   * 创建任务
   */
  async createTask(options: CreateTaskOptions): Promise<Task> {
    const taskId = randomUUID()
    const now = Date.now()

    const task: Task = {
      taskId,
      title: options.title,
      description: options.description,
      status: options.assignedAgentId ? 'assigned' : 'pending',
      priority: options.priority || 'normal',
      assignedAgentId: options.assignedAgentId,
      groupId: options.groupId,
      createdBy: options.createdBy,
      createdAt: now,
      updatedAt: now,
      deadline: options.deadline,
      progress: 0,
      parentTaskId: options.parentTaskId,
      subtasks: [],
      tags: options.tags || [],
      metadata: options.metadata,
    }

    this.tasks.set(taskId, task)

    // 更新代理任务映射
    if (options.assignedAgentId) {
      if (!this.agentTaskMap.has(options.assignedAgentId)) {
        this.agentTaskMap.set(options.assignedAgentId, new Set())
      }
      this.agentTaskMap.get(options.assignedAgentId)!.add(taskId)
    }

    // 更新群组任务映射
    if (options.groupId) {
      if (!this.groupTaskMap.has(options.groupId)) {
        this.groupTaskMap.set(options.groupId, new Set())
      }
      this.groupTaskMap.get(options.groupId)!.add(taskId)
    }

    // 如果是子任务，更新父任务
    if (options.parentTaskId) {
      const parentTask = this.tasks.get(options.parentTaskId)
      if (parentTask) {
        parentTask.subtasks = parentTask.subtasks || []
        parentTask.subtasks.push(taskId)
      }
    }

    this.logger.log(`Task created: ${taskId} - ${task.title}`)
    return { ...task }
  }

  /**
   * 获取任务
   */
  async getTask(taskId: string): Promise<Task | undefined> {
    const task = this.tasks.get(taskId)
    return task ? { ...task } : undefined
  }

  /**
   * 获取所有任务
   */
  async getAllTasks(
    filters?: {
      status?: string
      priority?: string
      assignedAgentId?: string
      groupId?: string
    },
  ): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values())

    if (filters) {
      if (filters.status) {
        tasks = tasks.filter(t => t.status === filters.status)
      }
      if (filters.priority) {
        tasks = tasks.filter(t => t.priority === filters.priority)
      }
      if (filters.assignedAgentId) {
        tasks = tasks.filter(t => t.assignedAgentId === filters.assignedAgentId)
      }
      if (filters.groupId) {
        tasks = tasks.filter(t => t.groupId === filters.groupId)
      }
    }

    return tasks.map(t => ({ ...t }))
  }

  /**
   * 更新任务
   */
  async updateTask(taskId: string, options: UpdateTaskOptions): Promise<Task> {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    // 处理代理变更
    if (options.assignedAgentId && options.assignedAgentId !== task.assignedAgentId) {
      // 从旧代理移除
      if (task.assignedAgentId) {
        this.agentTaskMap.get(task.assignedAgentId)?.delete(taskId)
      }
      // 添加到新代理
      if (!this.agentTaskMap.has(options.assignedAgentId)) {
        this.agentTaskMap.set(options.assignedAgentId, new Set())
      }
      this.agentTaskMap.get(options.assignedAgentId)!.add(taskId)
    }

    // 处理状态变更
    if (options.status === 'in_progress' && !task.startedAt) {
      task.startedAt = Date.now()
    }
    if (options.status === 'completed' && !task.completedAt) {
      task.completedAt = Date.now()
      task.progress = 100
    }

    Object.assign(task, options)
    task.updatedAt = Date.now()

    this.logger.debug(`Task updated: ${taskId} - status=${task.status}`)
    return { ...task }
  }

  /**
   * 分配任务给代理
   */
  async assignTask(taskId: string, agentId: string, assignedBy?: string): Promise<Task> {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    // 移除旧代理映射
    if (task.assignedAgentId) {
      this.agentTaskMap.get(task.assignedAgentId)?.delete(taskId)
    }

    // 添加新代理映射
    if (!this.agentTaskMap.has(agentId)) {
      this.agentTaskMap.set(agentId, new Set())
    }
    this.agentTaskMap.get(agentId)!.add(taskId)

    task.assignedAgentId = agentId
    task.status = 'assigned'
    task.updatedAt = Date.now()

    this.logger.log(`Task ${taskId} assigned to agent ${agentId}`)
    return { ...task }
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    task.status = 'cancelled'
    task.updatedAt = Date.now()

    this.logger.log(`Task cancelled: ${taskId}`)
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    // 从映射中移除
    if (task.assignedAgentId) {
      this.agentTaskMap.get(task.assignedAgentId)?.delete(taskId)
    }
    if (task.groupId) {
      this.groupTaskMap.get(task.groupId)?.delete(taskId)
    }

    // 如果是子任务，从父任务中移除
    if (task.parentTaskId) {
      const parentTask = this.tasks.get(task.parentTaskId)
      if (parentTask && parentTask.subtasks) {
        parentTask.subtasks = parentTask.subtasks.filter(id => id !== taskId)
      }
    }

    // 级联删除子任务
    if (task.subtasks) {
      for (const subtaskId of task.subtasks) {
        await this.deleteTask(subtaskId).catch(() => {})
      }
    }

    this.tasks.delete(taskId)
    this.logger.log(`Task deleted: ${taskId}`)
  }

  /**
   * 获取代理的所有任务
   */
  async getAgentTasks(agentId: string): Promise<Task[]> {
    const taskIds = this.agentTaskMap.get(agentId) || new Set()
    const tasks: Task[] = []
    for (const taskId of taskIds) {
      const task = this.tasks.get(taskId)
      if (task) {
        tasks.push({ ...task })
      }
    }
    return tasks
  }

  /**
   * 获取群组的所有任务
   */
  async getGroupTasks(groupId: string): Promise<Task[]> {
    const taskIds = this.groupTaskMap.get(groupId) || new Set()
    const tasks: Task[] = []
    for (const taskId of taskIds) {
      const task = this.tasks.get(taskId)
      if (task) {
        tasks.push({ ...task })
      }
    }
    return tasks
  }

  /**
   * 获取子任务
   */
  async getSubtasks(parentTaskId: string): Promise<Task[]> {
    const parentTask = this.tasks.get(parentTaskId)
    if (!parentTask || !parentTask.subtasks) {
      return []
    }

    const subtasks: Task[] = []
    for (const subtaskId of parentTask.subtasks) {
      const subtask = this.tasks.get(subtaskId)
      if (subtask) {
        subtasks.push({ ...subtask })
      }
    }
    return subtasks
  }

  /**
   * 自动分配任务给空闲代理
   */
  async autoAssignTask(taskId: string): Promise<Task> {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    // 获取群组中的代理列表
    let availableAgents: string[] = []
    if (task.groupId) {
      const members = await this.groupService.getMembers(task.groupId)
      availableAgents = members.map(m => m.agentId)
    }

    if (availableAgents.length === 0) {
      throw new Error('No available agents to assign task')
    }

    // 简单策略：选择任务最少的代理
    let agentWithLeastTasks = availableAgents[0]
    let minTaskCount = this.agentTaskMap.get(agentWithLeastTasks)?.size || 0

    for (const agentId of availableAgents) {
      const taskCount = this.agentTaskMap.get(agentId)?.size || 0
      if (taskCount < minTaskCount) {
        minTaskCount = taskCount
        agentWithLeastTasks = agentId
      }
    }

    return this.assignTask(taskId, agentWithLeastTasks)
  }

  /**
   * 获取任务统计信息
   */
  getTaskMetrics(): TaskMetrics {
    let pendingTasks = 0
    let inProgressTasks = 0
    let completedTasks = 0
    let failedTasks = 0
    let totalCompletedDuration = 0

    for (const task of this.tasks.values()) {
      switch (task.status) {
        case 'pending':
          pendingTasks++
          break
        case 'assigned':
        case 'in_progress':
          inProgressTasks++
          break
        case 'completed':
          completedTasks++
          if (task.startedAt && task.completedAt) {
            totalCompletedDuration += task.completedAt - task.startedAt
          }
          break
        case 'failed':
          failedTasks++
          break
      }
    }

    return {
      totalTasks: this.tasks.size,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      failedTasks,
      averageCompletionTime: completedTasks > 0 ? totalCompletedDuration / completedTasks : 0,
    }
  }

  /**
   * TDD - 按测试期望：更新任务状态
   */
  async updateTaskStatus(taskId: string, status: string): Promise<Task> {
    const task = await this.getTask(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }
    return this.updateTask(taskId, { status: status as any })
  }

  /**
   * TDD - 按测试期望：获取分配给指定代理人的任务
   */
  async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    const results: Task[] = []
    for (const task of this.tasks.values()) {
      if (task.assigneeId === assigneeId) {
        results.push({ ...task })
      }
    }
    return results
  }
}
