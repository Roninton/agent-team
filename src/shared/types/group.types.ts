/**
 * 群组状态
 */
export type GroupStatus = 'active' | 'inactive' | 'paused'

/**
 * 群组成员角色
 */
export type GroupMemberRole = 'owner' | 'admin' | 'member' | 'observer'

/**
 * 群组成员
 */
export interface GroupMember {
  agentId: string
  role: GroupMemberRole
  joinedAt: number
  lastActiveAt?: number
}

/**
 * 群组
 */
export interface Group {
  groupId: string
  name: string
  description?: string
  status: GroupStatus
  members: GroupMember[]
  maxMembers?: number
  createdAt: number
  updatedAt: number
  createdBy?: string
  metadata?: Record<string, any>
}

/**
 * 创建群组选项
 */
export interface CreateGroupOptions {
  name: string
  description?: string
  members?: Omit<GroupMember, 'joinedAt'>[]
  maxMembers?: number
  createdBy?: string
  metadata?: Record<string, any>
}

/**
 * 更新群组选项
 */
export interface UpdateGroupOptions {
  name?: string
  description?: string
  status?: GroupStatus
  maxMembers?: number
  metadata?: Record<string, any>
}

/**
 * 添加成员选项
 */
export interface AddMemberOptions {
  agentId: string
  role?: GroupMemberRole
}
