/**
 * Agent相关常量
 * 统一管理Agent类型、状态、配置默认值等
 */

// Agent类型
export const AGENT_TYPES = {
  OPENAI: 'openai',
  LOCAL: 'local',
  CUSTOM: 'custom'
} as const;

// Agent状态
export const AGENT_STATUSES = {
  STOPPED: 'stopped',
  RUNNING: 'running',
  STARTING: 'starting',
  STOPPING: 'stopping',
  ERROR: 'error'
} as const;

// Agent配置默认值
export const AGENT_DEFAULTS = {
  RATE_LIMIT: 5,
  ENABLED: true,
  TIMEOUT: 30000
} as const;

// Agent配置限制
export const AGENT_LIMITS = {
  MAX_NAME_LENGTH: 50,
  MAX_COMMAND_LENGTH: 200,
  MIN_RATE_LIMIT: 1,
  MAX_RATE_LIMIT: 100,
  MAX_AGENTS: 10
} as const;

// 内置Agent模板
export const AGENT_TEMPLATES = [
  {
    name: '代码专家',
    type: AGENT_TYPES.OPENAI,
    command: 'npx',
    args: '-y @agent/code-expert',
    rateLimit: 5
  },
  {
    name: '文案专家',
    type: AGENT_TYPES.OPENAI,
    command: 'npx',
    args: '-y @agent/write-expert',
    rateLimit: 10
  },
  {
    name: '数据分析专家',
    type: AGENT_TYPES.LOCAL,
    command: 'python',
    args: './agents/data_analyst.py',
    rateLimit: 3
  },
  {
    name: 'Echo测试代理',
    type: AGENT_TYPES.LOCAL,
    command: 'python',
    args: './agents/echo.py',
    rateLimit: 20
  }
] as const;
