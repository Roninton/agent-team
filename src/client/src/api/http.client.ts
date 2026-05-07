import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { API_CONFIG, ApiResponse, ErrorCode } from './config'

class HttpClient {
  private instance: AxiosInstance
  private token: string | null = null

  constructor() {
    this.instance = axios.create(API_CONFIG)
    this.setupInterceptors()
  }

  setToken(token: string) {
    this.token = token
  }

  clearToken() {
    this.token = null
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.token && config.headers) {
          config.headers.Authorization = `Bearer ${this.token}`
        }
        if (import.meta.env.DEV) {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data)
        }
        return config
      },
      (error) => {
        console.error('[API Request Error]', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        if (import.meta.env.DEV) {
          console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
        }
        
        const { data } = response
        if (!data.success) {
          return Promise.reject(new Error(data.message || 'Request failed'))
        }
        return response
      },
      (error) => {
        console.error('[API Response Error]', error)
        
        const status = error.response?.status
        let message = error.message

        switch (status) {
          case ErrorCode.UNAUTHORIZED:
            message = '未授权，请重新登录'
            this.clearToken()
            break
          case ErrorCode.FORBIDDEN:
            message = '无权限访问'
            break
          case ErrorCode.NOT_FOUND:
            message = '资源不存在'
            break
          case ErrorCode.INTERNAL_SERVER_ERROR:
            message = '服务器内部错误'
            break
          default:
            message = error.response?.data?.message || message
        }

        return Promise.reject(new Error(message))
      }
    )
  }

  async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, { params })
    return response.data
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.post<ApiResponse<T>>(url, data)
    return response.data
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.put<ApiResponse<T>>(url, data)
    return response.data
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data)
    return response.data
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<ApiResponse<T>>(url)
    return response.data
  }
}

export const httpClient = new HttpClient()
