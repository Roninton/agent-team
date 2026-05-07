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
import { ContextService } from './context.service'
import { SetContextDto, QueryContextDto } from './dto/context.dto'
import type { ContextEntry, ContextDiff, ContextSnapshot, ContextMetrics } from './types/context.types'

@Controller('contexts')
export class ContextController {
  constructor(private readonly contextService: ContextService) {}

  @Post()
  async setContext(@Body() setContextDto: SetContextDto): Promise<ContextEntry> {
    try {
      return await this.contextService.setContext(setContextDto)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('query')
  async queryContext(@Body() queryContextDto: QueryContextDto): Promise<ContextEntry[]> {
    return this.contextService.queryContext(queryContextDto)
  }

  @Get(':scope/:targetId/:key')
  async getContextByKey(
    @Param('scope') scope: string,
    @Param('targetId') targetId: string,
    @Param('key') key: string,
  ): Promise<ContextEntry> {
    const context = await this.contextService.getContextByKey(scope, targetId, key)
    if (!context) {
      throw new HttpException('Context not found', HttpStatus.NOT_FOUND)
    }
    return context
  }

  @Get('session/:sessionId')
  async getContext(@Param('sessionId') sessionId: string): Promise<{ sessionId: string; entries: ContextEntry[] }> {
    try {
      const entries = await this.contextService.queryContext({
        scope: 'session',
        targetId: sessionId,
      })
      return { sessionId, entries }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Put('session/:sessionId')
  async updateContext(
    @Param('sessionId') sessionId: string,
    @Body() updateData: any,
  ): Promise<{ sessionId: string; success: boolean }> {
    try {
      return { sessionId, success: true }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Delete('session/:sessionId')
  async clearContext(@Param('sessionId') sessionId: string): Promise<{ success: boolean }> {
    try {
      await this.contextService.deleteContextByTarget('session', sessionId)
      return { success: true }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('session/:sessionId/merge')
  async mergeContext(
    @Param('sessionId') sessionId: string,
    @Body() mergeData: any,
  ): Promise<{ sessionId: string; success: boolean }> {
    try {
      return { sessionId, success: true }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Delete(':id')
  async deleteContext(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.contextService.deleteContext(id)
    return { success: true }
  }

  @Delete(':scope/:targetId')
  async deleteContextByTarget(
    @Param('scope') scope: string,
    @Param('targetId') targetId: string,
  ): Promise<{ success: boolean; deletedCount: number }> {
    const deletedCount = await this.contextService.deleteContextByTarget(scope, targetId)
    return { success: true, deletedCount }
  }

  @Get(':id/history')
  async getContextHistory(@Param('id') id: string): Promise<ContextDiff[]> {
    return this.contextService.getContextHistory(id)
  }

  @Post('snapshot/:scope/:targetId')
  async createSnapshot(
    @Param('scope') scope: string,
    @Param('targetId') targetId: string,
    @Body('createdBy') createdBy?: string,
  ): Promise<ContextSnapshot> {
    return this.contextService.createSnapshot(scope, targetId, createdBy)
  }

  @Post('snapshot/:snapshotId/restore')
  async restoreSnapshot(@Param('snapshotId') snapshotId: string): Promise<{ success: boolean }> {
    try {
      await this.contextService.restoreSnapshot(snapshotId)
      return { success: true }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('sync/group/:groupId')
  async syncGroupContext(@Param('groupId') groupId: string): Promise<{ syncedAgents: string[] }> {
    try {
      const syncedAgents = await this.contextService.syncGroupContext(groupId)
      return { syncedAgents }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Get('stats/metrics')
  getContextMetrics(): ContextMetrics {
    return this.contextService.getContextMetrics()
  }

  @Post('cleanup/expired')
  async cleanupExpiredContexts(): Promise<{ cleanedCount: number }> {
    const cleanedCount = await this.contextService.cleanupExpiredContexts()
    return { cleanedCount }
  }
}
