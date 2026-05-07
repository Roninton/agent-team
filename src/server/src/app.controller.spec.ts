import { Test, TestingModule } from "@nestjs/testing"
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigService } from './config/config.service';

describe('AppController', () => {
  let appController: AppController;
  let configService: ConfigService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, ConfigService],
    }).compile();

    appController = app.get<AppController>(AppController);
    configService = app.get<ConfigService>(ConfigService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('api/version', () => {
    it('should return version info', () => {
      const result = appController.getVersion();
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('name', 'ACP Platform');
    });
  });

  describe('api/config', () => {
    it('should return public config', () => {
      const result = appController.getConfig();
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('server');
      expect(result).toHaveProperty('agent');
    });
  });
});
