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
import { GroupService } from './group.service'
import { CreateGroupDto, UpdateGroupDto, AddMemberDto, SendGroupMessageDto } from './dto/create-group.dto'
import type { Group, GroupMember } from './types/group.types'
import type { Message } from '../message/types/message.types'

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  async createGroup(@Body() createGroupDto: CreateGroupDto): Promise<Group> {
    try {
      return await this.groupService.createGroup(createGroupDto)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Get()
  async getAllGroups(): Promise<Group[]> {
    return this.groupService.getAllGroups()
  }

  @Get(':id')
  async getGroup(@Param('id') id: string): Promise<Group> {
    const group = await this.groupService.getGroup(id)
    if (!group) {
      throw new HttpException('Group not found', HttpStatus.NOT_FOUND)
    }
    return group
  }

  @Put(':id')
  async updateGroup(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ): Promise<Group> {
    try {
      return await this.groupService.updateGroup(id, updateGroupDto)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Delete(':id')
  async deleteGroup(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      await this.groupService.deleteGroup(id)
      return { success: true }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string): Promise<GroupMember[]> {
    try {
      return await this.groupService.getMembers(id)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
  ): Promise<GroupMember> {
    try {
      return await this.groupService.addMember(id, addMemberDto)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Delete(':id/members/:agentId')
  async removeMember(
    @Param('id') id: string,
    @Param('agentId') agentId: string,
  ): Promise<{ success: boolean }> {
    try {
      await this.groupService.removeMember(id, agentId)
      return { success: true }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Put(':id/members/:agentId/role')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('agentId') agentId: string,
    @Body() body: { role: 'owner' | 'admin' | 'member' | 'observer' },
  ): Promise<{ success: boolean }> {
    try {
      await this.groupService.updateMemberRole(id, agentId, body.role)
      return { success: true }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post(':id/messages')
  async sendGroupMessage(
    @Param('id') id: string,
    @Body() sendMessageDto: SendGroupMessageDto,
  ): Promise<Message[]> {
    try {
      return await this.groupService.sendGroupMessage(id, sendMessageDto)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Get(':id/messages')
  async getGroupMessages(
    @Param('id') id: string,
    @Body('conversationId') conversationId?: string,
  ): Promise<Message[]> {
    try {
      return await this.groupService.getGroupMessages(id, conversationId)
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Put(':id/status')
  async setGroupStatus(
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'inactive' | 'paused' },
  ): Promise<{ success: boolean }> {
    try {
      await this.groupService.setGroupStatus(id, body.status)
      return { success: true }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Get('agent/:agentId')
  async getGroupsForAgent(@Param('agentId') agentId: string): Promise<Group[]> {
    return this.groupService.getGroupsForAgent(agentId)
  }

  @Get('stats/summary')
  getGroupStats(): {
    totalGroups: number
    activeGroups: number
    totalMembers: number
    averageMembersPerGroup: number
  } {
    return this.groupService.getGroupStats()
  }
}
