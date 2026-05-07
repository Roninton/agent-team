import { IsString, IsNotEmpty, IsArray, IsEnum, IsOptional } from 'class-validator'
import type { MessageType, MessagePriority, SenderType, ReceiverType } from '../types/message.types'

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string

  @IsString()
  @IsNotEmpty()
  senderId: string

  @IsEnum(['user', 'agent', 'system'])
  senderType: SenderType

  @IsString()
  @IsNotEmpty()
  receiverId: string

  @IsEnum(['user', 'agent', 'group'])
  receiverType: ReceiverType

  content: any

  @IsEnum(['text', 'markdown', 'code', 'system', 'task'])
  @IsOptional()
  type?: MessageType

  @IsEnum(['low', 'normal', 'high', 'urgent'])
  @IsOptional()
  priority?: MessagePriority

  @IsArray()
  @IsOptional()
  mentions?: string[]

  @IsArray()
  @IsOptional()
  attachments?: string[]

  @IsString()
  @IsOptional()
  replyToMessageId?: string
}
