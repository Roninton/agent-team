import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { DEFAULT_CONFIG, AppConfig } from './config.default'

/**
 * 配置加载器
 * 优先级：环境变量 > YAML配置文件 > 默认值
 */
export class ConfigLoader {
  /**
   * 查找配置文件路径
   * 按优先级顺序查找，找到即返回
   */
  static findConfigFile(): string | null {
    const searchPaths = [
      // 1. 环境变量指定
      process.env.ACP_CONFIG_FILE,
      // 2. 系统配置目录 (Linux)
      '/etc/acp-platform/config.yml',
      // 3. 用户目录配置
      path.join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'acp-platform', 'config.yml'),
      // 4. 项目配置目录 (推荐位置)
      './config/config.yml',
    ].filter(Boolean) as string[]

    for (const configPath of searchPaths) {
      if (fs.existsSync(configPath)) {
        return configPath
      }
    }
    return null
  }

  /**
   * 从 YAML 文件加载配置
   */
  static loadFromYaml(filePath: string): Partial<AppConfig> {
    if (!fs.existsSync(filePath)) {
      return {}
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return yaml.load(content) as Partial<AppConfig> || {}
    } catch (e) {
      console.warn(`[Config] Failed to load YAML config from ${filePath}:`, e)
      return {}
    }
  }

  /**
   * 从环境变量加载配置
   */
  static loadFromEnv(): Partial<AppConfig> {
    const envConfig: Partial<AppConfig> = {}

    // Server
    if (process.env.ACP_SERVER_PORT) {
      envConfig.server = { port: Number(process.env.ACP_SERVER_PORT) }
    }
    if (process.env.ACP_SERVER_HOST) {
      envConfig.server = { ...envConfig.server, host: process.env.ACP_SERVER_HOST }
    }
    if (process.env.ACP_CORS_ORIGIN) {
      envConfig.server = { ...envConfig.server, corsOrigin: process.env.ACP_CORS_ORIGIN }
    }

    // Database
    if (process.env.ACP_DB_PATH) {
      envConfig.database = { path: process.env.ACP_DB_PATH }
    }

    // Log
    if (process.env.ACP_LOG_PATH) {
      envConfig.log = { path: process.env.ACP_LOG_PATH }
    }
    if (process.env.ACP_LOG_LEVEL) {
      const level = process.env.ACP_LOG_LEVEL.toLowerCase() as AppConfig['log']['level']
      if (['debug', 'info', 'warn', 'error'].includes(level)) {
        envConfig.log = { ...envConfig.log, level }
      }
    }

    // Data
    if (process.env.ACP_DATA_ROOT) {
      envConfig.data = { root: process.env.ACP_DATA_ROOT }
    }

    // Agent
    if (process.env.ACP_MAX_AGENTS) {
      envConfig.agent = { maxInstances: Number(process.env.ACP_MAX_AGENTS) }
    }
    if (process.env.ACP_AGENT_WORKDIR) {
      envConfig.agent = { ...envConfig.agent, workDir: process.env.ACP_AGENT_WORKDIR }
    }

    return envConfig
  }

  /**
   * 深度合并配置
   */
  static deepMerge(...objects: Partial<AppConfig>[]): AppConfig {
    const result: any = {}

    for (const obj of objects) {
      if (!obj) continue
      for (const key of Object.keys(obj)) {
        const value = (obj as any)[key]
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = this.deepMerge(result[key], value)
        } else if (value !== undefined) {
          result[key] = value
        }
      }
    }

    return result
  }

  /**
   * 加载完整配置
   */
  static load(): AppConfig {
    // 1. 默认值
    const defaultConfig = { ...DEFAULT_CONFIG }

    // 2. YAML 配置文件
    const yamlPath = this.findConfigFile()
    const yamlConfig = yamlPath ? this.loadFromYaml(yamlPath) : {}

    // 3. 环境变量（优先级最高）
    const envConfig = this.loadFromEnv()

    // 合并：默认值 < YAML < 环境变量
    return this.deepMerge(defaultConfig, yamlConfig, envConfig)
  }

  /**
   * 验证配置合法性
   */
  static validate(config: AppConfig): void {
    const errors: string[] = []

    // 端口验证
    if (
      typeof config.server.port !== 'number' || 
      isNaN(config.server.port) ||
      config.server.port < 1 || 
      config.server.port > 65535
    ) {
      errors.push(`Invalid port: ${config.server.port} (must be 1-65535)`)
    }

    // 最大代理数验证
    if (typeof config.agent.maxInstances !== 'number' || config.agent.maxInstances < 1) {
      errors.push(`Invalid maxInstances: ${config.agent.maxInstances} (must be >= 1)`)
    }

    // 日志级别验证
    const validLevels = ['debug', 'info', 'warn', 'error']
    if (!validLevels.includes(config.log.level)) {
      errors.push(`Invalid log level: ${config.log.level} (must be one of ${validLevels.join(', ')})`)
    }

    if (errors.length > 0) {
      throw new Error(`Config validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`)
    }
  }
}
