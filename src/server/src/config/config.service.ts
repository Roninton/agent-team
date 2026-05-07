import { Injectable, OnModuleInit } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import { ConfigLoader } from './config.loader'
import { AppConfig } from './config.default'

@Injectable()
export class ConfigService implements OnModuleInit {
  private config: AppConfig

  constructor() {
    this.load()
  }

  onModuleInit() {
    // 模块初始化时确保目录存在
    if (this.config.advanced.autoCreateDirs) {
      this.ensureDirs()
    }
  }

  /**
   * 加载配置
   */
  load(): void {
    this.config = ConfigLoader.load()
    ConfigLoader.validate(this.config)
  }

  /**
   * 获取配置项
   * 支持嵌套路径，如：'server.port', 'agent.maxInstances'
   */
  get<T = any>(path: string): T {
    const keys = path.split('.')
    let result: any = this.config

    for (const key of keys) {
      if (result === undefined || result === null) {
        return undefined as T
      }
      result = result[key]
    }

    return result as T
  }

  /**
   * 获取完整配置对象
   * 注意：敏感信息会被过滤
   */
  getAll(): AppConfig {
    // 返回拷贝，防止外部修改内部配置
    const copy = JSON.parse(JSON.stringify(this.config))
    // 可以在这里过滤敏感信息
    return copy
  }

  /**
   * 确保所有需要的目录都存在
   */
  ensureDirs(): void {
    const dirs = [
      this.get<string>('data.root'),
      this.get<string>('database.path').replace(/\/[^\/]+$/, ''), // 数据库文件所在目录
      this.get<string>('log.path'),
      this.get<string>('agent.workDir'),
    ]

    for (const dir of dirs) {
      const absDir = this.resolvePath(dir)
      if (!fs.existsSync(absDir)) {
        fs.mkdirSync(absDir, { recursive: true })
      }
    }
  }

  /**
   * 解析路径（相对路径转绝对路径）
   */
  resolvePath(relativePath: string): string {
    // 已经是绝对路径直接返回
    if (path.isAbsolute(relativePath)) {
      return relativePath
    }
    // 相对于项目根目录
    return path.resolve(process.cwd(), relativePath)
  }

  /**
   * 获取版本号
   */
  getVersion(): string {
    try {
      const pkgPath = this.resolvePath('package.json')
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
      return pkg.version || '0.0.0'
    } catch {
      return '0.0.0'
    }
  }
}
