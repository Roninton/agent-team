import { Test, TestingModule } from "@nestjs/testing"
import { GroupService } from '../group.service'
import { AgentService } from '../../agent/agent.service'
import { MessageService } from '../../message/message.service'
import type { CreateGroupOptions, AddMemberOptions } from '../types/group.types'

// Mock services
const mockAgentService = {
  canSendMessage: jest.fn().mockReturnValue(true),
  recordMessage: jest.fn(),
}

const mockMessageService = {
  sendMessage: jest.fn().mockResolvedValue({ messageId: 'msg-1' }),
  getConversationMessages: jest.fn().mockResolvedValue([]),
}

describe('GroupService', () => {
  let service: GroupService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        {
          provide: AgentService,
          useValue: mockAgentService,
        },
        {
          provide: MessageService,
          useValue: mockMessageService,
        },
      ],
    }).compile()

    service = module.get<GroupService>(GroupService)
    jest.clearAllMocks()
  })

  describe('createGroup', () => {
    const baseOptions: CreateGroupOptions = {
      name: 'Test Group',
      description: 'A test group',
      members: [
        { agentId: 'agent-1', role: 'owner' },
        { agentId: 'agent-2', role: 'member' },
      ],
    }

    it('should create a group successfully', async () => {
      const result = await service.createGroup(baseOptions)
      expect(result.groupId).toBeDefined()
      expect(result.name).toBe('Test Group')
      expect(result.members).toHaveLength(2)
      expect(result.status).toBe('active')
    })

    it('should set default maxMembers', async () => {
      const result = await service.createGroup({ name: 'Minimal Group' })
      expect(result.maxMembers).toBe(10)
    })
  })

  describe('getGroup', () => {
    it('should return group by id', async () => {
      const created = await service.createGroup({ name: 'Test' })
      const found = await service.getGroup(created.groupId)
      expect(found?.groupId).toBe(created.groupId)
    })

    it('should return undefined for non-existent group', async () => {
      const found = await service.getGroup('non-existent')
      expect(found).toBeUndefined()
    })
  })

  describe('getAllGroups', () => {
    it('should return all groups', async () => {
      await service.createGroup({ name: 'Group 1' })
      await service.createGroup({ name: 'Group 2' })
      
      const groups = await service.getAllGroups()
      expect(groups).toHaveLength(2)
    })
  })

  describe('addMember', () => {
    it('should add member to group', async () => {
      const group = await service.createGroup({ name: 'Test' })
      
      const member = await service.addMember(group.groupId, { agentId: 'new-agent' })
      expect(member.agentId).toBe('new-agent')
      expect(member.role).toBe('member')
      
      const members = await service.getMembers(group.groupId)
      expect(members).toHaveLength(1)
    })

    it('should throw error for non-existent group', async () => {
      await expect(
        service.addMember('non-existent', { agentId: 'agent-1' }),
      ).rejects.toThrow('not found')
    })

    it('should throw error when member already exists', async () => {
      const group = await service.createGroup({
        name: 'Test',
        members: [{ agentId: 'agent-1', role: 'member' }],
      })

      await expect(
        service.addMember(group.groupId, { agentId: 'agent-1' }),
      ).rejects.toThrow('already a member')
    })

    it('should throw error when max members reached', async () => {
      const group = await service.createGroup({
        name: 'Test',
        maxMembers: 2,
        members: [
          { agentId: 'agent-1', role: 'member' },
          { agentId: 'agent-2', role: 'member' },
        ],
      })

      await expect(
        service.addMember(group.groupId, { agentId: 'agent-3' }),
      ).rejects.toThrow('maximum members')
    })
  })

  describe('removeMember', () => {
    it('should remove member from group', async () => {
      const group = await service.createGroup({
        name: 'Test',
        members: [
          { agentId: 'agent-1', role: 'owner' },
          { agentId: 'agent-2', role: 'member' },
        ],
      })

      await service.removeMember(group.groupId, 'agent-2')
      
      const members = await service.getMembers(group.groupId)
      expect(members).toHaveLength(1)
      expect(members[0].agentId).toBe('agent-1')
    })

    it('should throw error when removing non-existent member', async () => {
      const group = await service.createGroup({ name: 'Test' })
      
      await expect(
        service.removeMember(group.groupId, 'non-existent'),
      ).rejects.toThrow('is not a member')
    })

    it('should throw error when removing last owner', async () => {
      const group = await service.createGroup({
        name: 'Test',
        members: [{ agentId: 'agent-1', role: 'owner' }],
      })

      await expect(
        service.removeMember(group.groupId, 'agent-1'),
      ).rejects.toThrow('last owner')
    })
  })

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      const group = await service.createGroup({
        name: 'Test',
        members: [{ agentId: 'agent-1', role: 'member' }],
      })

      await service.updateMemberRole(group.groupId, 'agent-1', 'admin')
      
      const members = await service.getMembers(group.groupId)
      expect(members[0].role).toBe('admin')
    })

    it('should throw error when demoting last owner', async () => {
      const group = await service.createGroup({
        name: 'Test',
        members: [{ agentId: 'agent-1', role: 'owner' }],
      })

      await expect(
        service.updateMemberRole(group.groupId, 'agent-1', 'member'),
      ).rejects.toThrow('last owner')
    })
  })

  describe('sendGroupMessage', () => {
    it('should send message to group', async () => {
      const group = await service.createGroup({
        name: 'Test',
        members: [{ agentId: 'agent-1', role: 'member' }],
      })

      const messages = await service.sendGroupMessage(group.groupId, {
        conversationId: 'conv-1',
        senderId: 'agent-1',
        senderType: 'agent',
        content: 'Hello group!',
      })

      expect(messages).toHaveLength(1)
      expect(mockMessageService.sendMessage).toHaveBeenCalled()
    })

    it('should throw error for inactive group', async () => {
      const group = await service.createGroup({ name: 'Test' })
      await service.setGroupStatus(group.groupId, 'inactive')

      await expect(
        service.sendGroupMessage(group.groupId, {
          conversationId: 'conv-1',
          senderId: 'agent-1',
          senderType: 'agent',
          content: 'Hello',
        }),
      ).rejects.toThrow('not active')
    })
  })

  describe('setGroupStatus', () => {
    it('should update group status', async () => {
      const group = await service.createGroup({ name: 'Test' })
      expect(group.status).toBe('active')

      await service.setGroupStatus(group.groupId, 'paused')
      
      const updated = await service.getGroup(group.groupId)
      expect(updated?.status).toBe('paused')
    })
  })

  describe('getGroupsForAgent', () => {
    it('should return all groups for an agent', async () => {
      await service.createGroup({
        name: 'Group 1',
        members: [{ agentId: 'agent-1', role: 'member' }],
      })
      await service.createGroup({
        name: 'Group 2',
        members: [{ agentId: 'agent-1', role: 'member' }],
      })
      await service.createGroup({ name: 'Group 3' })

      const groups = await service.getGroupsForAgent('agent-1')
      expect(groups).toHaveLength(2)
    })
  })

  describe('getGroupStats', () => {
    it('should return correct statistics', async () => {
      await service.createGroup({
        name: 'Group 1',
        members: [
          { agentId: 'agent-1', role: 'member' },
          { agentId: 'agent-2', role: 'member' },
        ],
      })
      await service.createGroup({ name: 'Group 2' })

      const stats = service.getGroupStats()
      expect(stats.totalGroups).toBe(2)
      expect(stats.activeGroups).toBe(2)
      expect(stats.totalMembers).toBe(2)
      expect(stats.averageMembersPerGroup).toBe(1)
    })
  })
})
