import { Module, forwardRef } from '@nestjs/common'
import { SessionService } from './session.service'
import { SessionController } from './session.controller'
import { AgentModule } from '../agent/agent.module'
import { WsGateway } from './gateways/ws.gateway'

@Module({
  imports: [forwardRef(() => AgentModule)],
  controllers: [SessionController],
  providers: [SessionService, WsGateway],
  exports: [SessionService, WsGateway],
})
export class SessionModule {}
