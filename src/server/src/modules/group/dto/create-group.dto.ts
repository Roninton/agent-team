import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsObject, IsArray } from 'class-validator'
import type { GroupMember, GroupStatus } from '../types/group.types'

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsArray()
  @IsOptional()
  members?: Omit<GroupMember, 'joinedAt'>[]

  @IsNumber()
  @Min(2)
  @IsOptional()
  maxMembers?: number

  @IsString()
  @IsOptional()
  createdBy?: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}

export class UpdateGroupDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsOptional()
  status?: GroupStatus

  @IsNumber()
  @Min(2)
  @IsOptional()
  maxMembers?: number

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  agentId: string

  @IsString()
  @IsOptional()
  role?: 'owner' | 'admin' | 'member' | 'observer'
}

export class SendGroupMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string

  @IsString()
  @IsNotEmpty()
  senderId: string

  @IsString()
  @IsNotEmpty()
  senderType: 'user' | 'agent' | 'system'

  content: any

  @IsString()
  @IsOptional()
  type?: 'text' | 'markdown' | 'code' | 'system' | 'task'

  @IsString()
  @IsOptional()
  priority?: 'low' | 'normal' | 'high' | 'urgent'

  @IsArray()
  @IsOptional()
  mentions?: string[]
}
