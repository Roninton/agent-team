/**
 * Agent status enum
 */
export type AgentStatus = 'not_found' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error'

/**
 * Configuration for a single ACP agent.
 */
export interface AgentConfigEntry {
  /** NPX package to run (e.g., "@anthropic-ai/claude-code@latest") */
  command: string;
  /** Command-line arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Display name */
  displayName?: string;
}

/**
 * Complete agent configuration
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
 * Agent instance runtime information
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
