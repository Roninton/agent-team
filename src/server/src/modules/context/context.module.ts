import { Module, forwardRef } from '@nestjs/common'
import { ContextService } from './context.service'
import { ContextController } from './context.controller'
import { GroupModule } from '../group/group.module'

@Module({
  imports: [forwardRef(() => GroupModule)],
  controllers: [ContextController],
  providers: [ContextService],
  exports: [ContextService],
})
export class ContextModule {}
