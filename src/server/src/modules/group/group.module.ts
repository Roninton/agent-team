import { Module, forwardRef } from '@nestjs/common'
import { GroupService } from './group.service'
import { GroupController } from './group.controller'
import { AgentModule } from '../agent/agent.module'
import { MessageModule } from '../message/message.module'

@Module({
  imports: [forwardRef(() => AgentModule), forwardRef(() => MessageModule)],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
