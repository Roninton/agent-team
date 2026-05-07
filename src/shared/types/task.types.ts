/**
 * 任务状态
 */
export type TaskStatus = 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled'

/**
 * 任务优先级
 */
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * 任务
 */
export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  agentId?: string
  sessionId?: string
  parentTaskId?: string
  dependencies?: string[]
  result?: any
  error?: string
  progress?: number
  createdAt: number
  updatedAt: number
  startedAt?: number
  completedAt?: number
  metadata?: Record<string, any>
}

/**
 * 任务分配
 */
export interface TaskAssignment {
  taskId: string
  agentId: string
  assignedAt: number
  assignedBy?: string
  priority?: TaskPriority
}

/**
 * 创建任务选项
 */
export interface CreateTaskOptions {
  title: string
  description?: string
  priority?: TaskPriority
  agentId?: string
  sessionId?: string
  parentTaskId?: string
  dependencies?: string[]
  metadata?: Record<string, any>
}

/**
 * 更新任务选项
 */
export interface UpdateTaskOptions {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  result?: any
  error?: string
  progress?: number
  metadata?: Record<string, any>
}
