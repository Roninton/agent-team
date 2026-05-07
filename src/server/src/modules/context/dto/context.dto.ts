import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsEnum,
  IsNumber,
} from 'class-validator'
import type { ContextScope } from '../types/context.types'

export class SetContextDto {
  @IsEnum(['agent', 'group', 'global', 'conversation'])
  @IsNotEmpty()
  scope: ContextScope

  @IsString()
  @IsNotEmpty()
  targetId: string

  @IsString()
  @IsNotEmpty()
  key: string

  value: any

  @IsNumber()
  @IsOptional()
  expiresAt?: number

  @IsString()
  @IsOptional()
  createdBy?: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}

export class QueryContextDto {
  @IsEnum(['agent', 'group', 'global', 'conversation'])
  @IsOptional()
  scope?: ContextScope

  @IsString()
  @IsOptional()
  targetId?: string

  @IsString()
  @IsOptional()
  key?: string

  @IsString()
  @IsOptional()
  prefix?: string
}
