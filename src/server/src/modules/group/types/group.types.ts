export type GroupStatus = 'active' | 'inactive' | 'paused'

export type GroupMemberRole = 'owner' | 'admin' | 'member' | 'observer'

export interface GroupMember {
  agentId: string
  role: GroupMemberRole
  joinedAt: number
  lastActiveAt?: number
}

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

export interface CreateGroupOptions {
  name: string
  description?: string
  members?: Omit<GroupMember, 'joinedAt'>[]
  maxMembers?: number
  createdBy?: string
  metadata?: Record<string, any>
}

export interface UpdateGroupOptions {
  name?: string
  description?: string
  status?: GroupStatus
  maxMembers?: number
  metadata?: Record<string, any>
}

export interface AddMemberOptions {
  agentId: string
  role?: GroupMemberRole
}

export interface GroupMessageOptions {
  conversationId: string
  senderId: string
  senderType: 'user' | 'agent' | 'system'
  content: any
  type?: 'text' | 'markdown' | 'code' | 'system' | 'task'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  mentions?: string[]
}
