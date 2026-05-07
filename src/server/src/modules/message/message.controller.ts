import { Controller, Get, Post, Put, Body, Param, Delete, HttpException, HttpStatus } from '@nestjs/common'
import { MessageService } from './message.service'
import { SendMessageDto } from './dto/send-message.dto'
import type { Message } from './types/message.types'

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  async sendMessage(@Body() sendMessageDto: SendMessageDto): Promise<Message> {
    try {
      return await this.messageService.sendMessage(sendMessageDto)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Get(':id')
  async getMessage(@Param('id') id: string): Promise<Message> {
    const message = await this.messageService.getMessage(id)
    if (!message) {
      throw new HttpException('Message not found', HttpStatus.NOT_FOUND)
    }
    return message
  }

  @Get('user/:userId')
  async getUserMessages(@Param('userId') userId: string): Promise<Message[]> {
    return this.messageService.getUserMessages(userId)
  }

  @Get('agent/:agentId')
  async getAgentMessages(@Param('agentId') agentId: string): Promise<Message[]> {
    return this.messageService.getAgentMessages(agentId)
  }

  @Get('conversation/:conversationId')
  async getConversationMessages(@Param('conversationId') conversationId: string): Promise<Message[]> {
    return this.messageService.getConversationMessages(conversationId)
  }

  @Post(':id/status')
  async updateMessageStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ): Promise<{ success: boolean; status: string }> {
    try {
      await this.messageService.updateMessageStatus(id, body.status as any)
      return { success: true, status: body.status }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Delete(':id')
  async deleteMessage(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.messageService.deleteMessage(id)
    return { success: true }
  }

  @Get('stats/summary')
  getStats(): {
    totalMessages: number
    totalConversations: number
    totalAgents: number
    totalUsers: number
  } {
    return this.messageService.getStats()
  }

  // TDD - 测试期望的API别名
  @Get()
  async getAllMessages(): Promise<Message[]> {
    return this.messageService.getAllMessages()
  }

  @Get('session/:sessionId')
  async getMessagesBySession(@Param('sessionId') sessionId: string): Promise<Message[]> {
    return this.messageService.getMessagesBySession(sessionId)
  }
}
