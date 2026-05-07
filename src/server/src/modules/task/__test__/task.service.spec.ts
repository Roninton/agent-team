import { Test, TestingModule } from "@nestjs/testing"
import { TaskService } from '../task.service'
import { AgentService } from '../../agent/agent.service'
import { GroupService } from '../../group/group.service'
import type { CreateTaskOptions } from '../types/task.types'

// Mock services
const mockAgentService = {
  canSendMessage: jest.fn().mockReturnValue(true),
  recordMessage: jest.fn(),
}

const mockGroupService = {
  getMembers: jest.fn().mockResolvedValue([
    { agentId: 'agent-1' },
    { agentId: 'agent-2' },
  ]),
}

describe('TaskService', () => {
  let service: TaskService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: AgentService,
          useValue: mockAgentService,
        },
        {
          provide: GroupService,
          useValue: mockGroupService,
        },
      ],
    }).compile()

    service = module.get<TaskService>(TaskService)
    jest.clearAllMocks()
  })

  describe('createTask', () => {
    const baseOptions: CreateTaskOptions = {
      title: 'Test Task',
      description: 'A test task',
      priority: 'high',
    }

    it('should create a task successfully', async () => {
      const result = await service.createTask(baseOptions)
      expect(result.taskId).toBeDefined()
      expect(result.title).toBe('Test Task')
      expect(result.status).toBe('pending')
      expect(result.progress).toBe(0)
    })

    it('should set status to assigned when agent is specified', async () => {
      const result = await service.createTask({
        ...baseOptions,
        assignedAgentId: 'agent-1',
      })
      expect(result.status).toBe('assigned')
      expect(result.assignedAgentId).toBe('agent-1')
    })
  })

  describe('getTask', () => {
    it('should return task by id', async () => {
      const created = await service.createTask({ title: 'Test' })
      const found = await service.getTask(created.taskId)
      expect(found?.taskId).toBe(created.taskId)
    })

    it('should return undefined for non-existent task', async () => {
      const found = await service.getTask('non-existent')
      expect(found).toBeUndefined()
    })
  })

  describe('getAllTasks', () => {
    it('should return all tasks', async () => {
      await service.createTask({ title: 'Task 1' })
      await service.createTask({ title: 'Task 2' })

      const tasks = await service.getAllTasks()
      expect(tasks).toHaveLength(2)
    })

    it('should filter by status', async () => {
      await service.createTask({ title: 'Pending Task' })
      const assigned = await service.createTask({
        title: 'Assigned Task',
        assignedAgentId: 'agent-1',
      })

      const filtered = await service.getAllTasks({ status: 'assigned' })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].taskId).toBe(assigned.taskId)
    })

    it('should filter by agentId', async () => {
      await service.createTask({ title: 'Task 1', assignedAgentId: 'agent-1' })
      await service.createTask({ title: 'Task 2', assignedAgentId: 'agent-2' })

      const filtered = await service.getAllTasks({ assignedAgentId: 'agent-1' })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].assignedAgentId).toBe('agent-1')
    })
  })

  describe('updateTask', () => {
    it('should update task details', async () => {
      const created = await service.createTask({ title: 'Original Title' })

      const updated = await service.updateTask(created.taskId, {
        title: 'Updated Title',
        description: 'Updated description',
        priority: 'urgent',
      })

      expect(updated.title).toBe('Updated Title')
      expect(updated.description).toBe('Updated description')
      expect(updated.priority).toBe('urgent')
    })

    it('should set startedAt when status becomes in_progress', async () => {
      const created = await service.createTask({ title: 'Test' })
      expect(created.startedAt).toBeUndefined()

      const updated = await service.updateTask(created.taskId, { status: 'in_progress' })
      expect(updated.startedAt).toBeDefined()
    })

    it('should set completedAt and progress to 100 when status becomes completed', async () => {
      const created = await service.createTask({ title: 'Test' })
      expect(created.completedAt).toBeUndefined()
      expect(created.progress).toBe(0)

      const updated = await service.updateTask(created.taskId, { status: 'completed' })
      expect(updated.completedAt).toBeDefined()
      expect(updated.progress).toBe(100)
    })

    it('should throw error for non-existent task', async () => {
      await expect(service.updateTask('non-existent', { title: 'Test' })).rejects.toThrow(
        'not found',
      )
    })
  })

  describe('assignTask', () => {
    it('should assign task to agent', async () => {
      const created = await service.createTask({ title: 'Test' })
      expect(created.assignedAgentId).toBeUndefined()

      const assigned = await service.assignTask(created.taskId, 'agent-1')
      expect(assigned.assignedAgentId).toBe('agent-1')
      expect(assigned.status).toBe('assigned')
    })
  })

  describe('cancelTask', () => {
    it('should cancel task', async () => {
      const created = await service.createTask({ title: 'Test' })
      await service.cancelTask(created.taskId)

      const cancelled = await service.getTask(created.taskId)
      expect(cancelled?.status).toBe('cancelled')
    })
  })

  describe('deleteTask', () => {
    it('should delete task', async () => {
      const created = await service.createTask({ title: 'Test' })
      await service.deleteTask(created.taskId)

      const deleted = await service.getTask(created.taskId)
      expect(deleted).toBeUndefined()
    })

    it('should also delete subtasks', async () => {
      const parent = await service.createTask({ title: 'Parent' })
      const child = await service.createTask({
        title: 'Child',
        parentTaskId: parent.taskId,
      })

      await service.deleteTask(parent.taskId)

      const deletedChild = await service.getTask(child.taskId)
      expect(deletedChild).toBeUndefined()
    })
  })

  describe('getAgentTasks', () => {
    it('should return all tasks for agent', async () => {
      await service.createTask({ title: 'Task 1', assignedAgentId: 'agent-1' })
      await service.createTask({ title: 'Task 2', assignedAgentId: 'agent-1' })
      await service.createTask({ title: 'Task 3', assignedAgentId: 'agent-2' })

      const tasks = await service.getAgentTasks('agent-1')
      expect(tasks).toHaveLength(2)
    })
  })

  describe('getSubtasks', () => {
    it('should return all subtasks for parent task', async () => {
      const parent = await service.createTask({ title: 'Parent' })
      await service.createTask({ title: 'Child 1', parentTaskId: parent.taskId })
      await service.createTask({ title: 'Child 2', parentTaskId: parent.taskId })

      const subtasks = await service.getSubtasks(parent.taskId)
      expect(subtasks).toHaveLength(2)
    })
  })

  describe('autoAssignTask', () => {
    it('should assign task to available agent in group', async () => {
      const task = await service.createTask({
        title: 'Auto Assign Test',
        groupId: 'group-1',
      })

      const assigned = await service.autoAssignTask(task.taskId)
      expect(assigned.assignedAgentId).toBeDefined()
      expect(assigned.status).toBe('assigned')
    })

    it('should throw error when no agents available', async () => {
      // Override mock to return empty members
      const originalGetMembers = mockGroupService.getMembers
      mockGroupService.getMembers = jest.fn().mockResolvedValue([])

      const task = await service.createTask({
        title: 'Auto Assign Test',
        groupId: 'group-1',
      })

      await expect(service.autoAssignTask(task.taskId)).rejects.toThrow(
        'No available agents',
      )

      // Restore mock
      mockGroupService.getMembers = originalGetMembers
    })
  })

  describe('getTaskMetrics', () => {
    it('should return correct task statistics', async () => {
      await service.createTask({ title: 'Pending Task' })
      await service.createTask({ title: 'Assigned Task', assignedAgentId: 'agent-1' })
      const completed = await service.createTask({ title: 'Completed Task' })
      await service.updateTask(completed.taskId, { status: 'completed' })

      const metrics = service.getTaskMetrics()
      expect(metrics.totalTasks).toBe(3)
      expect(metrics.pendingTasks).toBe(1)
      expect(metrics.inProgressTasks).toBe(1)
      expect(metrics.completedTasks).toBe(1)
    })
  })
})
