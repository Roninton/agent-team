export type ContextScope = 'agent' | 'group' | 'global' | 'conversation' | 'session'

export interface ContextEntry {
  contextId: string
  scope: ContextScope
  targetId: string // agentId, groupId, conversationId, or 'global'
  key: string
  value: any
  valueType?: 'string' | 'number' | 'boolean' | 'object' | 'array'
  createdAt: number
  updatedAt: number
  expiresAt?: number
  createdBy?: string
  metadata?: Record<string, any>
}

export interface ContextDiff {
  diffId: string
  contextId: string
  changeType: 'add' | 'update' | 'delete'
  oldValue?: any
  newValue?: any
  changedAt: number
  changedBy?: string
}

export interface SetContextOptions {
  scope: ContextScope
  targetId: string
  key: string
  value: any
  expiresAt?: number
  createdBy?: string
  metadata?: Record<string, any>
}

export interface QueryContextOptions {
  scope?: ContextScope
  targetId?: string
  key?: string
  prefix?: string
}

export interface ContextSnapshot {
  snapshotId: string
  createdAt: number
  entries: ContextEntry[]
  createdBy?: string
}

export interface ContextMetrics {
  totalEntries: number
  byScope: Record<ContextScope, number>
  expiredEntries: number
  totalChanges: number
}
