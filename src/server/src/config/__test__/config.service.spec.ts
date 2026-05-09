import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '../config.service'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Mock fs 模块
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}))

describe('ConfigService', () => {
  let service: ConfigService
  const originalEnv = process.env

  beforeEach(async () => {
    // 重置环境变量
    process.env = {}
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService],
    }).compile()

    service = module.get<ConfigService>(ConfigService)
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('默认值读取', () => {
    it('应该正确读取默认端口 3001', () => {
      const port = service.get('server.port')
      expect(port).toBe(3001)
    })

    it('应该正确读取默认主机 0.0.0.0', () => {
      const host = service.get('server.host')
      expect(host).toBe('0.0.0.0')
    })

    it('应该正确读取默认数据库路径', () => {
      const dbPath = service.get('database.path')
      expect(dbPath).toBe('../../.teamagents/data/db/acp.sqlite')
    })

    it('应该正确读取默认最大代理数 10', () => {
      const maxAgents = service.get('agent.maxInstances')
      expect(maxAgents).toBe(10)
    })
  })

  describe('配置优先级', () => {
    it('环境变量应该覆盖默认值', () => {
      process.env.ACP_SERVER_PORT = '8080'
      // 重新加载配置
      service.load()
      const port = service.get('server.port')
      expect(port).toBe(8080)
    })

    it('环境变量优先级最高', () => {
      // 同时有 YAML 和环境变量时，环境变量优先
      process.env.ACP_SERVER_PORT = '9999'
      ;(fs.existsSync as jest.Mock).mockReturnValue(true)
      ;(fs.readFileSync as jest.Mock).mockReturnValue(`
server:
  port: 8000
`)
      service.load()
      const port = service.get('server.port')
      expect(port).toBe(9999) // 环境变量 9999 优先于 YAML 的 8000
    })
  })

  describe('配置验证', () => {
    it('端口不是数字时应该抛出错误', () => {
      process.env.ACP_SERVER_PORT = 'not-a-number'
      expect(() => service.load()).toThrow()
    })

    it('端口范围无效时应该抛出错误', () => {
      process.env.ACP_SERVER_PORT = '99999' // 超出范围
      expect(() => service.load()).toThrow()
    })
  })

  describe('目录自动创建', () => {
    it('应该自动创建数据目录', () => {
      ;(fs.existsSync as jest.Mock).mockReturnValue(false)
      service.ensureDirs()
      expect(fs.mkdirSync).toHaveBeenCalled()
    })

    it('目录已存在时不应该报错', () => {
      ;(fs.existsSync as jest.Mock).mockReturnValue(true)
      expect(() => service.ensureDirs()).not.toThrow()
    })
  })

  describe('路径解析', () => {
    it('应该正确解析相对路径', () => {
      const resolved = service.resolvePath('./data/db')
      expect(resolved).toContain('data/db')
    })

    it('绝对路径应该保持不变', () => {
      const absPath = process.platform === 'win32' ? 'C:\\data\\db' : '/data/db'
      const resolved = service.resolvePath(absPath)
      expect(resolved).toBe(absPath)
    })
  })

  describe('获取所有配置', () => {
    it('getAll 应该返回完整的配置对象', () => {
      const config = service.getAll()
      expect(config).toHaveProperty('server')
      expect(config).toHaveProperty('database')
      expect(config).toHaveProperty('agent')
      expect(config).toHaveProperty('log')
    })

    it('getAll 不应该包含敏感信息', () => {
      process.env.ACP_SECRET_KEY = 'my-secret'
      service.load()
      const config = service.getAll()
      // 敏感信息不应该出现在 getAll 结果中
      const configStr = JSON.stringify(config)
      expect(configStr).not.toContain('secret')
    })
  })
})
