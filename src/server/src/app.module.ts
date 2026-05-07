import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { AgentModule } from './modules/agent/agent.module';
import { MessageModule } from './modules/message/message.module';
import { GroupModule } from './modules/group/group.module';
import { SessionModule } from './modules/session/session.module';
import { TaskModule } from './modules/task/task.module';
import { ContextModule } from './modules/context/context.module';

@Module({
  imports: [ConfigModule, AgentModule, MessageModule, GroupModule, SessionModule, TaskModule, ContextModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
