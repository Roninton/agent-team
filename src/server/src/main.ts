import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get('server.port');
  const version = configService.getVersion();
  const dataRoot = configService.resolvePath(configService.get('data.root'));
  
  // 启用 CORS
  app.enableCors({
    origin: configService.get('server.corsOrigin'),
  });
  
  console.log(`
╔══════════════════════════════════════════════════╗
║        ACP Platform - Multi-Agent Collaboration  ║
╠══════════════════════════════════════════════════╣
║  Version:  v${version.padEnd(40)}║
║  Port:     ${String(port).padEnd(42)}║
║  Data:     ${dataRoot.padEnd(42)}║
╚══════════════════════════════════════════════════╝
`);
  
  await app.listen(port);
}
bootstrap();
