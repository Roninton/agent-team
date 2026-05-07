import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { TaskService } from './task.service'
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto'
import type { Task, TaskMetrics } from './types/task.types'

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    try {
      return await this.taskService.createTask(createTaskDto)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Get()
  async getAllTasks(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignedAgentId') assignedAgentId?: string,
    @Query('groupId') groupId?: string,
  ): Promise<Task[]> {
    return this.taskService.getAllTasks({ status, priority, assignedAgentId, groupId })
  }

  @Get(':id')
  async getTask(@Param('id') id: string): Promise<Task> {
    const task = await this.taskService.getTask(id)
    if (!task) {
      throw new HttpException('Task not found', HttpStatus.NOT_FOUND)
    }
    return task
  }

  @Put(':id')
  async updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    try {
      return await this.taskService.updateTask(id, updateTaskDto)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post(':id/assign')
  async assignTask(
    @Param('id') id: string,
    @Body() body: { agentId: string; assignedBy?: string },
  ): Promise<Task> {
    try {
      return await this.taskService.assignTask(id, body.agentId, body.assignedBy)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post(':id/auto-assign')
  async autoAssignTask(@Param('id') id: string): Promise<Task> {
    try {
      return await this.taskService.autoAssignTask(id)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post(':id/cancel')
  async cancelTask(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      await this.taskService.cancelTask(id)
      return { success: true }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Delete(':id')
  async deleteTask(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      await this.taskService.deleteTask(id)
      return { success: true }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Get('agent/:agentId')
  async getAgentTasks(@Param('agentId') agentId: string): Promise<Task[]> {
    return this.taskService.getAgentTasks(agentId)
  }

  @Get('group/:groupId')
  async getGroupTasks(@Param('groupId') groupId: string): Promise<Task[]> {
    return this.taskService.getGroupTasks(groupId)
  }

  @Get(':id/subtasks')
  async getSubtasks(@Param('id') id: string): Promise<Task[]> {
    return this.taskService.getSubtasks(id)
  }

  @Get('stats/metrics')
  getTaskMetrics(): TaskMetrics {
    return this.taskService.getTaskMetrics()
  }

  /**
   * TDD - 按测试期望：更新任务状态
   */
  @Put(':id/status')
  async updateTaskStatus(
    @Param('id') taskId: string,
    @Body() body: { status: string },
  ): Promise<Task> {
    try {
      return await this.taskService.updateTaskStatus(taskId, body.status)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  /**
   * TDD - 按测试期望：获取分配给指定代理人的任务
   */
  @Get('assignee/:assigneeId')
  async getTasksByAssignee(@Param('assigneeId') assigneeId: string): Promise<Task[]> {
    return this.taskService.getTasksByAssignee(assigneeId)
  }
}
