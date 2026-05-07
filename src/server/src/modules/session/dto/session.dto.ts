import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator'
import type { SessionStatus } from '../types/session.types'

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  agentId: string

  @IsString()
  @IsOptional()
  agentName?: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}

export class UpdateSessionStatusDto {
  @IsString()
  @IsNotEmpty()
  status: SessionStatus
}
