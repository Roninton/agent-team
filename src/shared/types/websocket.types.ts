/**
 * WebSocket事件类型
 */
export enum WsEventType {
  // 系统事件
  PING = 'ping',
  PONG = 'pong',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  RESPONSE = 'response',

  // 聊天消息事件
  CHAT_MESSAGE_SEND = 'chat.message.send',
  CHAT_MESSAGE_NEW = 'chat.message.new',
  CHAT_MESSAGE_UPDATE = 'chat.message.update',
  CHAT_MESSAGE_READ = 'chat.message.read',
  CHAT_MESSAGE_RECALL = 'chat.message.recall',
  CHAT_TYPING = 'chat.typing',

  // 任务相关事件
  TASK_STATUS_UPDATE = 'task.status.update',
  TASK_PROGRESS_UPDATE = 'task.progress.update',

  // 代理相关事件
  AGENT_STATUS_UPDATE = 'agent.status.update',

  // 群组相关事件
  GROUP_MEMBER_JOINED = 'group.member.joined',
  GROUP_MEMBER_LEFT = 'group.member.left',
  GROUP_UPDATED = 'group.updated',
}

/**
 * WebSocket基础消息
 */
export interface WebSocketMessage {
  id: string
  type: WsEventType | string
  timestamp: number
  data?: any
}

/**
 * WebSocket成功响应
 */
export interface WsSuccessResponse {
  id: string
  type: WsEventType.RESPONSE
  success: true
  data?: any
}

/**
 * WebSocket错误响应
 */
export interface WsErrorResponse {
  id: string
  type: WsEventType.RESPONSE
  success: false
  error: {
    code: number
    message: string
    details?: string
  }
}

/**
 * WebSocket响应类型
 */
export type WsResponse = WsSuccessResponse | WsErrorResponse

/**
 * 连接成功事件数据
 */
export interface ConnectedEventData {
  connectionId: string
  userId: string
  serverTime: number
}

/**
 * 心跳ping数据
 */
export interface PingData {
  clientTime: number
}

/**
 * 心跳pong数据
 */
export interface PongData {
  clientTime: number
  serverTime: number
}

/**
 * 输入状态事件数据
 */
export interface TypingEventData {
  sessionId: string
  userId: string
  userName?: string
  isTyping: boolean
}
