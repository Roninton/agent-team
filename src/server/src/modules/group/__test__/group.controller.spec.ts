import { Test, TestingModule } from '@nestjs/testing'
import { GroupController } from '../group.controller'
import { GroupService } from '../group.service'
import { HttpException } from '@nestjs/common'

describe('GroupController', () => {
  let controller: GroupController
  let service: jest.Mocked<GroupService>

  const mockGroup = {
    groupId: 'group-1',
    name: 'Test Group',
    description: 'A test group',
    members: [],
    status: 'active',
    createdAt: Date.now(),
  }

  const mockMember = {
    agentId: 'agent-1',
    role: 'admin',
  }

  // Mock service with all methods
  const mockService = {
    createGroup: jest.fn(),
    getGroup: jest.fn(),
    getAllGroups: jest.fn(),
    updateGroup: jest.fn(),
    deleteGroup: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
    updateMemberRole: jest.fn(),
    getMembers: jest.fn(),
    sendGroupMessage: jest.fn(),
    getGroupMessages: jest.fn(),
    setGroupStatus: jest.fn(),
    getGroupsForAgent: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupController],
      providers: [
        {
          provide: GroupService,
          useValue: mockService,
        },
      ],
    }).compile()

    controller = module.get<GroupController>(GroupController)
    service = module.get<GroupService>(GroupService) as jest.Mocked<GroupService>
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('createGroup', () => {
    const createGroupDto = { name: 'New Group', description: 'Test' }

    it('should create group successfully', async () => {
      jest.spyOn(service, 'createGroup').mockResolvedValue(mockGroup as any)
      const result = await controller.createGroup(createGroupDto as any)
      expect(result).toEqual(mockGroup)
      expect(service.createGroup).toHaveBeenCalledWith(createGroupDto)
    })

    it('should throw HttpException when creation fails', async () => {
      jest.spyOn(service, 'createGroup').mockRejectedValue(new Error('Failed'))
      await expect(controller.createGroup(createGroupDto as any)).rejects.toThrow(HttpException)
    })
  })

  describe('getAllGroups', () => {
    it('should return all groups', async () => {
      jest.spyOn(service, 'getAllGroups').mockResolvedValue([mockGroup] as any)
      const result = await controller.getAllGroups()
      expect(result).toEqual([mockGroup])
    })

    it('should return empty array when no groups', async () => {
      jest.spyOn(service, 'getAllGroups').mockResolvedValue([])
      const result = await controller.getAllGroups()
      expect(result).toEqual([])
    })
  })

  describe('getGroup', () => {
    it('should return group when found', async () => {
      jest.spyOn(service, 'getGroup').mockResolvedValue(mockGroup as any)
      const result = await controller.getGroup('group-1')
      expect(result).toEqual(mockGroup)
    })

    it('should throw 404 when group not found', async () => {
      jest.spyOn(service, 'getGroup').mockResolvedValue(undefined as any)
      await expect(controller.getGroup('non-existent')).rejects.toThrow('Group not found')
    })
  })

  describe('updateGroup', () => {
    const updateDto = { name: 'Updated Name' }

    it('should update group successfully', async () => {
      jest.spyOn(service, 'updateGroup').mockResolvedValue({ ...mockGroup, ...updateDto } as any)
      const result = await controller.updateGroup('group-1', updateDto as any)
      expect(result.name).toBe('Updated Name')
    })

    it('should throw HttpException when update fails', async () => {
      jest.spyOn(service, 'updateGroup').mockRejectedValue(new Error('Failed'))
      await expect(controller.updateGroup('group-1', updateDto as any)).rejects.toThrow()
    })
  })

  describe('deleteGroup', () => {
    it('should delete group successfully', async () => {
      jest.spyOn(service, 'deleteGroup').mockResolvedValue(undefined)
      const result = await controller.deleteGroup('group-1')
      expect(result).toEqual({ success: true })
    })

    it('should throw HttpException when delete fails', async () => {
      jest.spyOn(service, 'deleteGroup').mockRejectedValue(new Error('Failed'))
      await expect(controller.deleteGroup('group-1')).rejects.toThrow()
    })
  })

  describe('getMembers', () => {
    it('should return group members', async () => {
      jest.spyOn(service, 'getMembers').mockResolvedValue([mockMember] as any)
      const result = await controller.getMembers('group-1')
      expect(result).toEqual([mockMember])
    })

    it('should throw HttpException when fails', async () => {
      jest.spyOn(service, 'getMembers').mockRejectedValue(new Error('Failed'))
      await expect(controller.getMembers('group-1')).rejects.toThrow()
    })
  })

  describe('addMember', () => {
    const addMemberDto = { agentId: 'agent-1', role: 'member' }

    it('should add member successfully', async () => {
      jest.spyOn(service, 'addMember').mockResolvedValue(mockMember as any)
      const result = await controller.addMember('group-1', addMemberDto as any)
      expect(result).toEqual(mockMember)
    })

    it('should throw HttpException when fails', async () => {
      jest.spyOn(service, 'addMember').mockRejectedValue(new Error('Failed'))
      await expect(controller.addMember('group-1', addMemberDto as any)).rejects.toThrow()
    })
  })
})
