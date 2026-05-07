/**
 * 代理状态枚举
 */
export type AgentStatus = 'not_found' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error'

/**
 * 单个代理配置条目
 */
export interface AgentConfigEntry {
  command: string
  args?: string[]
  env?: Record<string, string>
  displayName?: string
}

/**
 * 完整代理配置
 */
export interface AgentConfig {
  id: string
  name: string
  command: string
  args: string[]
  env: Record<string, string>
  workingDirectory: string
  description?: string
  icon?: string
  maxConcurrentTasks?: number
  rateLimit?: number
  rateLimitWindow?: number
}

/**
 * 代理实例运行时信息
 */
export interface AgentInstance {
  id: string
  config: AgentConfig
  status: AgentStatus
  processId?: number
  createdAt: number
  startedAt?: number
  stoppedAt?: number
  messageTimestamps: number[]
}
