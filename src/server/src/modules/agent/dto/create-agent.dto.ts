import { IsString, IsNotEmpty, IsOptional, IsArray, IsObject, IsNumber, Min } from 'class-validator'

export class CreateAgentDto {
  @IsString()
  @IsOptional()
  id?: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  command: string

  @IsArray()
  @IsOptional()
  args?: string[]

  @IsObject()
  @IsOptional()
  env?: Record<string, string>

  @IsString()
  @IsOptional()
  workingDirectory?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  icon?: string

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxConcurrentTasks?: number

  @IsNumber()
  @IsOptional()
  rateLimit?: number

  @IsNumber()
  @Min(1000)
  @IsOptional()
  rateLimitWindow?: number
}
