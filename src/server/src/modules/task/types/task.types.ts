export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Task {
  taskId: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignedAgentId?: string
  assigneeId?: string // TDD - 测试期望的字段别名
  assignedAgentName?: string
  groupId?: string
  createdBy?: string
  createdAt: number
  updatedAt: number
  startedAt?: number
  completedAt?: number
  deadline?: number
  progress?: number // 0-100
  result?: any
  error?: string
  parentTaskId?: string
  subtasks?: string[]
  tags?: string[]
  metadata?: Record<string, any>
}

export interface CreateTaskOptions {
  title: string
  description?: string
  priority?: TaskPriority
  assignedAgentId?: string
  groupId?: string
  createdBy?: string
  deadline?: number
  parentTaskId?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface UpdateTaskOptions {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignedAgentId?: string
  deadline?: number
  progress?: number
  result?: any
  error?: string
  metadata?: Record<string, any>
}

export interface TaskAssignment {
  taskId: string
  agentId: string
  assignedAt: number
  assignedBy?: string
}

export interface TaskMetrics {
  totalTasks: number
  pendingTasks: number
  inProgressTasks: number
  completedTasks: number
  failedTasks: number
  averageCompletionTime: number
}
