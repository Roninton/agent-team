/**
 * API相关常量
 * 统一管理API路径、请求方法、状态码等
 */

// API基础路径
export const API_BASE = '/api';

// API端点
export const API_ENDPOINTS = {
  AGENTS: {
    BASE: '/agents',
    LIST: '/agents',
    CREATE: '/agents',
    GET: (id: string) => `/agents/${id}`,
    UPDATE: (id: string) => `/agents/${id}`,
    DELETE: (id: string) => `/agents/${id}`,
    START: (id: string) => `/agents/${id}/start`,
    STOP: (id: string) => `/agents/${id}/stop`,
    RESTART: (id: string) => `/agents/${id}/restart`
  },
  CHAT: {
    BASE: '/chat',
    SEND: '/chat/send',
    HISTORY: '/chat/history',
    CLEAR: '/chat/clear'
  },
  GROUP: {
    BASE: '/groups',
    LIST: '/groups',
    CREATE: '/groups',
    GET: (id: string) => `/groups/${id}`,
    UPDATE: (id: string) => `/groups/${id}`,
    DELETE: (id: string) => `/groups/${id}`
  },
  WS: {
    BASE: '/ws'
  }
} as const;

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// WebSocket事件类型
export const WS_EVENTS = {
  MESSAGE: 'message',
  AGENT_STATUS_CHANGED: 'agent_status_changed',
  AGENT_OUTPUT: 'agent_output',
  ERROR: 'error',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected'
} as const;

// API请求超时时间
export const API_TIMEOUTS = {
  DEFAULT: 10000,
  LONG: 30000,
  UPLOAD: 60000
} as const;
