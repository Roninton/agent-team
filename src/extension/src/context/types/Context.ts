export type ContextType = 'conversation' | 'group' | 'agent' | 'task'

export interface Context {
  contextId: string
  type: ContextType
  relationId: string // 关联的会话/群/代理/任务ID
  version: string // 语义化版本号，如1.2.0
  content: Record<string, any> // 上下文内容
  creatorId: string
  createdAt: number
  updatedAt: number
  lastModifierId: string
  changeLog: ContextChange[] // 变更历史
}

export interface ContextChange {
  changeId: string
  version: string
  previousVersion: string
  modifierId: string
  changes: ContextDiff[] // 具体变更内容
  changedAt: number
  description?: string
}

export interface ContextDiff {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
  path: string // JSON Path
  value?: any
  from?: string // 移动/复制时的源路径
}

export interface ContextFilterRule {
  // 裁剪规则：保留哪些路径，排除哪些路径
  includePaths: string[]
  excludePaths: string[]
  maxContentLength?: number // 单字段最大长度，超过截断
  removeSensitiveData: boolean // 是否移除敏感数据
  trimDeprecatedFields: boolean // 是否移除废弃字段
}

export interface SyncResult {
  success: boolean
  currentVersion: string
  conflicts?: ContextConflict[]
  changesApplied: ContextChange[]
}

export interface ContextConflict {
  path: string
  ourValue: any
  theirValue: any
  resolution: 'auto-merge' | 'use-ours' | 'use-theirs' | 'manual'
}
