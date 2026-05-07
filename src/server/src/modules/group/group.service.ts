import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { AgentService } from '../agent/agent.service'
import { MessageService } from '../message/message.service'
import type {
  Group,
  GroupMember,
  CreateGroupOptions,
  UpdateGroupOptions,
  AddMemberOptions,
  GroupMessageOptions,
} from './types/group.types'
import type { Message } from '../message/types/message.types'

@Injectable()
export class GroupService {
  private readonly logger = new Logger(GroupService.name)
  private readonly groups: Map<string, Group> = new Map()
  private readonly DEFAULT_MAX_MEMBERS = 10

  constructor(
    @Inject(forwardRef(() => AgentService))
    private readonly agentService: AgentService,
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
  ) {}

  /**
   * 创建群组
   */
  async createGroup(options: CreateGroupOptions): Promise<Group> {
    const groupId = randomUUID()
    const now = Date.now()

    const group: Group = {
      groupId,
      name: options.name,
      description: options.description,
      status: 'active',
      members: (options.members || []).map(m => ({
        ...m,
        joinedAt: now,
      })),
      maxMembers: options.maxMembers || this.DEFAULT_MAX_MEMBERS,
      createdAt: now,
      updatedAt: now,
      createdBy: options.createdBy,
      metadata: options.metadata,
    }

    this.groups.set(groupId, group)
    this.logger.log(`Group created: ${groupId} (${group.name}) with ${group.members.length} members`)
    return { ...group }
  }

  /**
   * 获取群组信息
   */
  async getGroup(groupId: string): Promise<Group | undefined> {
    const group = this.groups.get(groupId)
    return group ? { ...group } : undefined
  }

  /**
   * 获取所有群组
   */
  async getAllGroups(): Promise<Group[]> {
    return Array.from(this.groups.values()).map(g => ({ ...g }))
  }

  /**
   * 更新群组信息
   */
  async updateGroup(groupId: string, options: UpdateGroupOptions): Promise<Group> {
    const group = this.groups.get(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }

    Object.assign(group, options)
    group.updatedAt = Date.now()

    this.logger.log(`Group updated: ${groupId}`)
    return { ...group }
  }

  /**
   * 删除群组
   */
  async deleteGroup(groupId: string): Promise<void> {
    if (!this.groups.has(groupId)) {
      throw new Error(`Group ${groupId} not found`)
    }

    this.groups.delete(groupId)
    this.logger.log(`Group deleted: ${groupId}`)
  }

  /**
   * 添加成员
   */
  async addMember(groupId: string, options: AddMemberOptions): Promise<GroupMember> {
    const group = this.groups.get(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }

    // 检查成员数限制
    if (group.members.length >= group.maxMembers!) {
      throw new Error(`Group ${groupId} has reached maximum members (${group.maxMembers})`)
    }

    // 检查成员是否已存在
    const existing = group.members.find(m => m.agentId === options.agentId)
    if (existing) {
      throw new Error(`Agent ${options.agentId} is already a member of group ${groupId}`)
    }

    const member: GroupMember = {
      agentId: options.agentId,
      role: options.role || 'member',
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
    }

    group.members.push(member)
    group.updatedAt = Date.now()

    this.logger.log(`Member added: ${options.agentId} to group ${groupId}`)
    return { ...member }
  }

  /**
   * 移除成员
   */
  async removeMember(groupId: string, agentId: string): Promise<void> {
    const group = this.groups.get(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }

    const index = group.members.findIndex(m => m.agentId === agentId)
    if (index === -1) {
      throw new Error(`Agent ${agentId} is not a member of group ${groupId}`)
    }

    // 不能移除最后一个owner
    const isOwner = group.members[index].role === 'owner'
    const ownerCount = group.members.filter(m => m.role === 'owner').length
    if (isOwner && ownerCount <= 1) {
      throw new Error('Cannot remove the last owner from the group')
    }

    group.members.splice(index, 1)
    group.updatedAt = Date.now()

    this.logger.log(`Member removed: ${agentId} from group ${groupId}`)
  }

  /**
   * 更新成员角色
   */
  async updateMemberRole(
    groupId: string,
    agentId: string,
    role: 'owner' | 'admin' | 'member' | 'observer',
  ): Promise<void> {
    const group = this.groups.get(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }

    const member = group.members.find(m => m.agentId === agentId)
    if (!member) {
      throw new Error(`Agent ${agentId} is not a member of group ${groupId}`)
    }

    // 如果是降级owner，检查是否是最后一个
    if (member.role === 'owner' && role !== 'owner') {
      const ownerCount = group.members.filter(m => m.role === 'owner').length
      if (ownerCount <= 1) {
        throw new Error('Cannot demote the last owner')
      }
    }

    member.role = role
    member.lastActiveAt = Date.now()
    group.updatedAt = Date.now()

    this.logger.log(`Member role updated: ${agentId} in group ${groupId} -> ${role}`)
  }

  /**
   * 获取群组成员
   */
  async getMembers(groupId: string): Promise<GroupMember[]> {
    const group = this.groups.get(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }
    return group.members.map(m => ({ ...m }))
  }

  /**
   * 发送群组消息（广播给所有成员）
   */
  async sendGroupMessage(groupId: string, options: GroupMessageOptions): Promise<Message[]> {
    const group = this.groups.get(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }

    if (group.status !== 'active') {
      throw new Error(`Group ${groupId} is not active`)
    }

    // 验证发送者是否是群组成员
    const senderMember = group.members.find(m => m.agentId === options.senderId)
    if (options.senderType === 'agent' && !senderMember) {
      throw new Error(`Agent ${options.senderId} is not a member of group ${groupId}`)
    }

    // 更新发送者最后活跃时间
    if (senderMember) {
      senderMember.lastActiveAt = Date.now()
    }

    // 发送消息给群组（MessageService会处理）
    const message = await this.messageService.sendMessage({
      conversationId: options.conversationId || `conv-${groupId}`,
      senderId: options.senderId,
      senderType: options.senderType,
      receiverId: groupId,
      receiverType: 'group',
      content: options.content,
      type: options.type,
      priority: options.priority,
      mentions: options.mentions,
    })

    this.logger.debug(`Group message sent to ${groupId}: ${message.messageId}`)
    return [message]
  }

  /**
   * 获取群组消息历史
   */
  async getGroupMessages(groupId: string, conversationId?: string): Promise<Message[]> {
    const convId = conversationId || `conv-${groupId}`
    return this.messageService.getConversationMessages(convId)
  }

  /**
   * 更新群组状态
   */
  async setGroupStatus(groupId: string, status: 'active' | 'inactive' | 'paused'): Promise<void> {
    const group = this.groups.get(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }

    group.status = status
    group.updatedAt = Date.now()

    this.logger.log(`Group status updated: ${groupId} -> ${status}`)
  }

  /**
   * 获取用户/代理所在的所有群组
   */
  async getGroupsForAgent(agentId: string): Promise<Group[]> {
    const groups: Group[] = []
    for (const group of this.groups.values()) {
      if (group.members.some(m => m.agentId === agentId)) {
        groups.push({ ...group })
      }
    }
    return groups
  }

  /**
   * 获取群组统计信息
   */
  getGroupStats(groupId?: string): {
    totalGroups: number
    activeGroups: number
    totalMembers: number
    averageMembersPerGroup: number
  } {
    let totalMembers = 0
    let activeGroups = 0

    for (const group of this.groups.values()) {
      totalMembers += group.members.length
      if (group.status === 'active') {
        activeGroups++
      }
    }

    return {
      totalGroups: this.groups.size,
      activeGroups,
      totalMembers,
      averageMembersPerGroup: this.groups.size > 0 ? totalMembers / this.groups.size : 0,
    }
  }
}
