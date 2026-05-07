import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsObject,
  IsArray,
  Min,
  Max,
} from 'class-validator'
import type { TaskPriority, TaskStatus } from '../types/task.types'

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  priority?: TaskPriority

  @IsString()
  @IsOptional()
  assignedAgentId?: string

  @IsString()
  @IsOptional()
  groupId?: string

  @IsString()
  @IsOptional()
  createdBy?: string

  @IsNumber()
  @IsOptional()
  deadline?: number

  @IsString()
  @IsOptional()
  parentTaskId?: string

  @IsArray()
  @IsOptional()
  tags?: string[]

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  status?: TaskStatus

  @IsString()
  @IsOptional()
  priority?: TaskPriority

  @IsString()
  @IsOptional()
  assignedAgentId?: string

  @IsNumber()
  @IsOptional()
  deadline?: number

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number

  result?: any

  @IsString()
  @IsOptional()
  error?: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}
