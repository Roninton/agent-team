export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3001/ws/v1'

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
}

export const WS_CONFIG = {
  url: WS_BASE_URL,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
  timeout: 30000,
}

export enum ErrorCode {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}

export interface ApiResponse<T = any> {
  success: boolean
  code: number
  message: string
  data?: T
  error?: string
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  keyword?: string
}

export interface PagedResult<T> {
  total: number
  page: number
  pageSize: number
  list: T[]
}
