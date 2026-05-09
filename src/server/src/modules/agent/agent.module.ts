import { Module } from '@nestjs/common'
import { ConfigModule } from '../../config/config.module'
import { AgentService } from './agent.service'
import { AgentController } from './agent.controller'

@Module({
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
