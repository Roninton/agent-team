import { Module, forwardRef } from '@nestjs/common'
import { TaskService } from './task.service'
import { TaskController } from './task.controller'
import { AgentModule } from '../agent/agent.module'
import { GroupModule } from '../group/group.module'

@Module({
  imports: [forwardRef(() => AgentModule), forwardRef(() => GroupModule)],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
