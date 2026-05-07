import { Module, forwardRef } from '@nestjs/common'
import { MessageService } from './message.service'
import { MessageController } from './message.controller'
import { AgentModule } from '../agent/agent.module'

@Module({
  imports: [forwardRef(() => AgentModule)],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
