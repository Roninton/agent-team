import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from './config/config.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/version')
  getVersion() {
    return {
      version: this.configService.getVersion(),
      name: 'ACP Platform',
    };
  }

  @Get('api/config')
  getConfig() {
    return {
      version: this.configService.getVersion(),
      server: {
        port: this.configService.get('server.port'),
        host: this.configService.get('server.host'),
      },
      agent: {
        maxInstances: this.configService.get('agent.maxInstances'),
      },
    };
  }
}
