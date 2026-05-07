/**
 * 通用API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean
  code: number
  message: string
  data?: T
  error?: string
}

/**
 * API错误响应格式
 */
export interface ApiError {
  code: number
  message: string
  details?: string
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
  keyword?: string
}

/**
 * 分页结果
 */
export interface PagedResult<T> {
  total: number
  page: number
  pageSize: number
  list: T[]
}

/**
 * 通用错误码枚举
 */
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

/**
 * 基础实体基类
 */
export interface BaseEntity {
  id: string
  createdAt: number
  updatedAt: number
  metadata?: Record<string, any>
}
