import { io, Socket } from 'socket.io-client'
import { WS_CONFIG } from './config'
import { WsEventType } from '../../../shared/types/websocket.types'

type EventCallback = (data: any) => void

class WebSocketClient {
  private socket: Socket | null = null
  private eventListeners: Map<string, Set<EventCallback>> = new Map()
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected'

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve()
        return
      }

      this.connectionStatus = 'connecting'
      
      const url = token 
        ? `${WS_CONFIG.url}?token=${token}`
        : WS_CONFIG.url

      this.socket = io(url, {
        reconnection: WS_CONFIG.reconnection,
        reconnectionAttempts: WS_CONFIG.reconnectionAttempts,
        reconnectionDelay: WS_CONFIG.reconnectionDelay,
        timeout: WS_CONFIG.timeout,
        transports: ['websocket'],
      })

      this.socket.on('connect', () => {
        console.log('[WebSocket] Connected')
        this.connectionStatus = 'connected'
        resolve()
      })

      this.socket.on('disconnect', (reason) => {
        console.log('[WebSocket] Disconnected:', reason)
        this.connectionStatus = 'disconnected'
      })

      this.socket.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error)
        this.connectionStatus = 'disconnected'
        reject(error)
      })

      this.setupDefaultListeners()
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connectionStatus = 'disconnected'
    }
  }

  private setupDefaultListeners() {
    if (!this.socket) return

    // 系统事件
    this.socket.on(WsEventType.CONNECTED, (data) => {
      console.log('[WebSocket] Connected event:', data)
      this.emit('connected', data)
    })

    this.socket.on(WsEventType.DISCONNECTED, (data) => {
      this.emit('disconnected', data)
    })

    this.socket.on(WsEventType.ERROR, (data) => {
      console.error('[WebSocket] Error:', data)
      this.emit('error', data)
    })

    // 聊天消息事件
    this.socket.on(WsEventType.CHAT_MESSAGE_NEW, (data) => {
      this.emit('message.new', data)
    })

    this.socket.on(WsEventType.CHAT_MESSAGE_UPDATE, (data) => {
      this.emit('message.update', data)
    })

    this.socket.on(WsEventType.CHAT_TYPING, (data) => {
      this.emit('typing', data)
    })

    // 任务事件
    this.socket.on(WsEventType.TASK_STATUS_UPDATE, (data) => {
      this.emit('task.status', data)
    })

    this.socket.on(WsEventType.TASK_PROGRESS_UPDATE, (data) => {
      this.emit('task.progress', data)
    })

    // 代理状态事件
    this.socket.on(WsEventType.AGENT_STATUS_UPDATE, (data) => {
      this.emit('agent.status', data)
    })

    // 群组事件
    this.socket.on('group.member.joined', (data) => {
      this.emit('group.member.joined', data)
    })

    this.socket.on('group.member.left', (data) => {
      this.emit('group.member.left', data)
    })
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)

    // 返回取消订阅函数
    return () => {
      this.off(event, callback)
    }
  }

  off(event: string, callback: EventCallback) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`[WebSocket] Event handler error for ${event}:`, error)
        }
      })
    }
  }

  send(event: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('WebSocket not connected'))
        return
      }

      this.socket.emit(event, data, (response: any) => {
        if (response?.success === false) {
          reject(new Error(response.error?.message || 'Request failed'))
        } else {
          resolve(response)
        }
      })
    })
  }

  joinSession(sessionId: string): Promise<any> {
    return this.send('join.session', { sessionId })
  }

  leaveSession(sessionId: string): Promise<any> {
    return this.send('leave.session', { sessionId })
  }

  joinGroup(groupId: string): Promise<any> {
    return this.send('join.group', { groupId })
  }

  leaveGroup(groupId: string): Promise<any> {
    return this.send('leave.group', { groupId })
  }

  sendChatMessage(data: { sessionId: string; content: string; type?: string }): Promise<any> {
    return this.send(WsEventType.CHAT_MESSAGE_SEND, data)
  }

  sendTyping(data: { sessionId: string; isTyping: boolean }): Promise<any> {
    return this.send(WsEventType.CHAT_TYPING, data)
  }

  getStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionStatus
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const wsClient = new WebSocketClient()
