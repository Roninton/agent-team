import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { generateId } from '../../../../../shared/utils/common.utils'
import { WsEventType } from '../../../../../shared/types/websocket.types'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'ws/v1',
  pingInterval: 30000,
  pingTimeout: 90000,
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private connectedClients: Map<string, Socket> = new Map()

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client)
    
    client.emit(WsEventType.CONNECTED, {
      connectionId: generateId('conn'),
      userId: 'anonymous',
      serverTime: Date.now(),
    })
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id)
  }

  @SubscribeMessage(WsEventType.PING)
  handlePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id: string; timestamp: number },
  ) {
    client.emit(WsEventType.PONG, {
      id: data.id,
      serverTime: Date.now(),
    })
  }

  @SubscribeMessage(WsEventType.CHAT_MESSAGE_SEND)
  handleChatMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: { id: string; type: string; timestamp: number; data: any },
  ) {
    // 广播到会话房间
    if (message.data?.sessionId) {
      this.server.to(`session:${message.data.sessionId}`).emit(WsEventType.CHAT_MESSAGE_NEW, {
        id: generateId('msg'),
        ...message.data,
        timestamp: Date.now(),
      })
    }

    return {
      id: message.id,
      type: 'response',
      success: true,
      data: {
        messageId: generateId('msg'),
      },
    }
  }

  @SubscribeMessage('join.session')
  joinSessionRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    client.join(`session:${data.sessionId}`)
    return { success: true }
  }

  @SubscribeMessage('leave.session')
  leaveSessionRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    client.leave(`session:${data.sessionId}`)
    return { success: true }
  }

  @SubscribeMessage('join.group')
  joinGroupRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    client.join(`group:${data.groupId}`)
    return { success: true }
  }

  @SubscribeMessage('leave.group')
  leaveGroupRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { groupId: string },
  ) {
    client.leave(`group:${data.groupId}`)
    return { success: true }
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: { id: string; type: string; timestamp: number; data: any },
  ) {
    // 默认消息处理器
    return {
      id: message.id,
      type: 'response',
      success: false,
      error: {
        code: 400,
        message: `Unknown event type: ${message.type}`,
      },
    }
  }

  broadcastToSession(sessionId: string, event: string, data: any) {
    this.server.to(`session:${sessionId}`).emit(event, data)
  }

  broadcastToGroup(groupId: string, event: string, data: any) {
    this.server.to(`group:${groupId}`).emit(event, data)
  }

  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data)
  }

  sendToClient(clientId: string, event: string, data: any) {
    const client = this.connectedClients.get(clientId)
    if (client) {
      client.emit(event, data)
    }
  }
}
