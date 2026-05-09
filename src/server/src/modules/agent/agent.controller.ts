import { Controller, Get, Post, Body, Param, Delete, Put, HttpException, HttpStatus } from '@nestjs/common'
import { AgentService } from './agent.service'
import { CreateAgentDto } from './dto/create-agent.dto'
import type { AgentInstance } from './types/agent.types'

@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get()
  findAll(): AgentInstance[] {
    return this.agentService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string): AgentInstance {
    const agent = this.agentService.findOne(id)
    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND)
    }
    return agent
  }

  @Get(':id/status')
  getStatus(@Param('id') id: string): { status: string } {
    const status = this.agentService.getAgentStatus(id)
    return { status }
  }

  @Post()
  async create(@Body() createAgentDto: CreateAgentDto): Promise<AgentInstance> {
    try {
      return await this.agentService.create(createAgentDto)
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException('创建代理失败，请检查配置', HttpStatus.BAD_REQUEST)
    }
  }

  @Post(':id/start')
  async start(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    const agent = this.agentService.findOne(id)
    if (!agent) {
      throw new HttpException('Agent not found', HttpStatus.NOT_FOUND)
    }
    try {
      await this.agentService.startAgent(agent.config)
      return { success: true, message: `Agent ${id} started` }
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException('启动代理失败', HttpStatus.BAD_REQUEST)
    }
  }

  @Post(':id/stop')
  async stop(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.agentService.stopAgent(id)
      return { success: true, message: `Agent ${id} stopped` }
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException('停止代理失败', HttpStatus.BAD_REQUEST)
    }
  }

  @Post(':id/restart')
  async restart(@Param('id') id: string): Promise<{ success: boolean; message: string; agentId: string }> {
    try {
      const agentId = await this.agentService.restartAgent(id)
      return { success: true, message: `Agent ${id} restarted`, agentId }
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException('重启代理失败', HttpStatus.BAD_REQUEST)
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.agentService.remove(id)
      return { success: true, message: `Agent ${id} deleted` }
    } catch (err) {
      if (err instanceof Error) {
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
      }
      throw new HttpException('删除代理失败', HttpStatus.BAD_REQUEST)
    }
  }
}
