/**
 * 所有配置的默认值
 * 优先级：环境变量 > YAML配置 > 这里的默认值
 */
export const DEFAULT_CONFIG = {
  server: {
    port: 3001,
    host: '0.0.0.0',
    corsOrigin: '*',
  },

  database: {
    path: './data/db/acp.sqlite',
  },

  log: {
    path: './data/logs',
    level: 'info' as 'debug' | 'info' | 'warn' | 'error',
  },

  data: {
    root: './data',
  },

  config: {
    path: './config',
  },

  agent: {
    maxInstances: 10,
    workDir: './data/agents',
  },

  advanced: {
    autoCreateDirs: true,
    printConfigOnStartup: false,
  },
}

export type AppConfig = typeof DEFAULT_CONFIG
