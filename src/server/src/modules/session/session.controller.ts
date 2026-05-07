import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { SessionService } from './session.service'
import { CreateSessionDto, UpdateSessionStatusDto } from './dto/session.dto'
import type { Session, SessionMetrics } from './types/session.types'

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  async createSession(@Body() createSessionDto: CreateSessionDto): Promise<Session> {
    try {
      return await this.sessionService.createSession(createSessionDto)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Get()
  async getAllSessions(): Promise<Session[]> {
    return this.sessionService.getAllSessions()
  }

  @Get('active')
  async getActiveSessions(): Promise<Session[]> {
    return this.sessionService.getActiveSessions()
  }

  @Get(':id')
  async getSession(@Param('id') id: string): Promise<Session> {
    const session = await this.sessionService.getSession(id)
    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND)
    }
    return session
  }

  @Get('agent/:agentId')
  async getSessionByAgent(@Param('agentId') agentId: string): Promise<Session> {
    const session = await this.sessionService.getSessionByAgent(agentId)
    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND)
    }
    return session
  }

  @Put(':id/status')
  async updateSessionStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateSessionStatusDto,
  ): Promise<{ success: boolean }> {
    try {
      await this.sessionService.updateSessionStatus(id, updateStatusDto.status)
      return { success: true }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post(':id/close')
  async closeSession(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      await this.sessionService.closeSession(id)
      return { success: true }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Delete(':id')
  async deleteSession(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      await this.sessionService.deleteSession(id)
      return { success: true }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Get('stats/metrics')
  getSessionMetrics(): SessionMetrics {
    return this.sessionService.getSessionMetrics()
  }

  @Post('cleanup/idle')
  async cleanupIdleSessions(): Promise<{ cleanedCount: number }> {
    const cleanedCount = await this.sessionService.cleanupIdleSessions()
    return { cleanedCount }
  }

  /**
   * TDD - 按测试期望：获取会话消息列表
   */
  @Get(':id/messages')
  async getSessionMessages(@Param('id') sessionId: string): Promise<any[]> {
    try {
      return await this.sessionService.getSessionMessages(sessionId)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  /**
   * TDD - 按测试期望：发送会话消息
   */
  @Post(':id/messages')
  async sendSessionMessage(
    @Param('id') sessionId: string,
    @Body() messageData: any,
  ): Promise<any> {
    try {
      return await this.sessionService.sendSessionMessage(sessionId, messageData)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }
}
