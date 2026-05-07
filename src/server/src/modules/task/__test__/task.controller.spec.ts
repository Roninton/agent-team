import { Test, TestingModule } from '@nestjs/testing'
import { TaskController } from '../task.controller'
import { TaskService } from '../task.service'
import { HttpException } from '@nestjs/common'

describe('TaskController', () => {
  let controller: TaskController
  let service: jest.Mocked<TaskService>

  const mockTask = {
    taskId: 'task-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'pending',
    priority: 'medium',
    assignedAgentId: 'agent-1',
    createdAt: Date.now(),
  }

  // Mock service with all methods
  const mockService = {
    createTask: jest.fn(),
    getTask: jest.fn(),
    getAllTasks: jest.fn(),
    updateTask: jest.fn(),
    assignTask: jest.fn(),
    cancelTask: jest.fn(),
    // TDD - controller methods
    deleteTask: jest.fn(),
    updateTaskStatus: jest.fn(),
    getTasksByAssignee: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockService,
        },
      ],
    }).compile()

    controller = module.get<TaskController>(TaskController)
    service = module.get<TaskService>(TaskService) as jest.Mocked<TaskService>
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getAllTasks', () => {
    it('should return all tasks', async () => {
      jest.spyOn(service, 'getAllTasks').mockResolvedValue([mockTask] as any)
      const result = await controller.getAllTasks()
      expect(result).toEqual([mockTask])
    })

    it('should return empty array when no tasks', async () => {
      jest.spyOn(service, 'getAllTasks').mockResolvedValue([])
      const result = await controller.getAllTasks()
      expect(result).toEqual([])
    })
  })

  describe('getTask', () => {
    it('should return task when found', async () => {
      jest.spyOn(service, 'getTask').mockResolvedValue(mockTask as any)
      const result = await controller.getTask('task-1')
      expect(result).toEqual(mockTask)
    })

    it('should throw 404 when task not found', async () => {
      jest.spyOn(service, 'getTask').mockRejectedValue(new Error('Task not found'))
      await expect(controller.getTask('non-existent')).rejects.toThrow()
    })
  })

  describe('createTask', () => {
    const createDto = { title: 'New Task', description: 'Test' }

    it('should create task successfully', async () => {
      jest.spyOn(service, 'createTask').mockResolvedValue(mockTask as any)
      const result = await controller.createTask(createDto as any)
      expect(result).toEqual(mockTask)
    })

    it('should throw HttpException when creation fails', async () => {
      jest.spyOn(service, 'createTask').mockRejectedValue(new Error('Failed'))
      await expect(controller.createTask(createDto as any)).rejects.toThrow()
    })
  })

  describe('updateTask', () => {
    const updateDto = { status: 'in_progress' }

    it('should update task successfully', async () => {
      jest.spyOn(service, 'updateTask').mockResolvedValue({ ...mockTask, ...updateDto } as any)
      const result = await controller.updateTask('task-1', updateDto as any)
      expect(result.status).toBe('in_progress')
    })

    it('should throw HttpException when update fails', async () => {
      jest.spyOn(service, 'updateTask').mockRejectedValue(new Error('Failed'))
      await expect(controller.updateTask('task-1', updateDto as any)).rejects.toThrow()
    })
  })

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      jest.spyOn(service, 'deleteTask').mockResolvedValue(undefined)
      const result = await controller.deleteTask('task-1')
      expect(result).toEqual({ success: true })
    })

    it('should throw HttpException when delete fails', async () => {
      jest.spyOn(service, 'deleteTask').mockRejectedValue(new Error('Failed'))
      await expect(controller.deleteTask('task-1')).rejects.toThrow()
    })
  })

  describe('assignTask', () => {
    const assignDto = { agentId: 'agent-1' }

    it('should assign task successfully', async () => {
      jest.spyOn(service, 'assignTask').mockResolvedValue({ ...mockTask, assigneeId: 'agent-1' } as any)
      const result = await controller.assignTask('task-1', assignDto as any)
      expect(result.assigneeId).toBe('agent-1')
    })

    it('should throw HttpException when assign fails', async () => {
      jest.spyOn(service, 'assignTask').mockRejectedValue(new Error('Failed'))
      await expect(controller.assignTask('task-1', assignDto as any)).rejects.toThrow()
    })
  })

  describe('updateTaskStatus', () => {
    const statusDto = { status: 'completed' }

    it('should update task status successfully', async () => {
      jest.spyOn(service, 'updateTaskStatus').mockResolvedValue({ ...mockTask, status: 'completed' } as any)
      const result = await controller.updateTaskStatus('task-1', statusDto as any)
      expect(result.status).toBe('completed')
    })

    it('should throw HttpException when update fails', async () => {
      jest.spyOn(service, 'updateTaskStatus').mockRejectedValue(new Error('Failed'))
      await expect(controller.updateTaskStatus('task-1', statusDto as any)).rejects.toThrow()
    })
  })

  describe('getTasksByAssignee', () => {
    it('should return tasks by assignee', async () => {
      jest.spyOn(service, 'getTasksByAssignee').mockResolvedValue([mockTask] as any)
      const result = await controller.getTasksByAssignee('agent-1')
      expect(result).toEqual([mockTask])
    })
  })
})
