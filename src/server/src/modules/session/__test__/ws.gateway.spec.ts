import { Test, TestingModule } from '@nestjs/testing'
import { WsGateway } from '../gateways/ws.gateway'
import { Server, Socket } from 'socket.io'
import { generateId } from '../../../../../shared/utils/common.utils'

describe('WsGateway', () => {
  let gateway: WsGateway
  let server: Server
  let mockSocket: Socket

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WsGateway],
    }).compile()

    gateway = module.get<WsGateway>(WsGateway)
    server = new Server()
    gateway.server = server
    mockSocket = {
      id: 'socket-123',
      handshake: { query: { token: 'test-token' } },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as Socket
  })

  describe('handleConnection', () => {
    it('should handle client connection', () => {
      const spy = jest.spyOn(gateway, 'handleConnection')
      gateway.handleConnection(mockSocket)
      expect(spy).toHaveBeenCalledWith(mockSocket)
    })

    it('should send connected event on successful connection', () => {
      const emitSpy = jest.spyOn(mockSocket, 'emit')
      gateway.handleConnection(mockSocket)
      expect(emitSpy).toHaveBeenCalledWith(
        'connected',
        expect.objectContaining({
          connectionId: expect.any(String),
          serverTime: expect.any(Number),
        })
      )
    })
  })

  describe('handleDisconnect', () => {
    it('should handle client disconnection', () => {
      const spy = jest.spyOn(gateway, 'handleDisconnect')
      gateway.handleDisconnect(mockSocket)
      expect(spy).toHaveBeenCalledWith(mockSocket)
    })
  })

  describe('handlePing', () => {
    it('should respond with pong to ping message', () => {
      const emitSpy = jest.spyOn(mockSocket, 'emit')
      const message = {
        id: generateId('msg'),
        type: 'ping',
        timestamp: Date.now(),
      }
      gateway.handlePing(mockSocket, message)
      expect(emitSpy).toHaveBeenCalledWith(
        'pong',
        expect.objectContaining({
          id: message.id,
          serverTime: expect.any(Number),
        })
      )
    })
  })

  describe('handleChatMessageSend', () => {
    it('should handle chat message send and return response', () => {
      const message = {
        id: generateId('msg'),
        type: 'chat.message.send',
        timestamp: Date.now(),
        data: {
          sessionId: 'session-123',
          content: 'Hello World',
          type: 'text',
        },
      }
      const result = gateway.handleChatMessageSend(mockSocket, message)
      expect(result).toEqual(
        expect.objectContaining({
          id: message.id,
          success: true,
          data: expect.objectContaining({
            messageId: expect.any(String),
          }),
        })
      )
    })
  })

  describe('room management', () => {
    it('should join session room', () => {
      const joinSpy = jest.spyOn(mockSocket, 'join')
      gateway.joinSessionRoom(mockSocket, { sessionId: 'session-123' })
      expect(joinSpy).toHaveBeenCalledWith('session:session-123')
    })

    it('should leave session room', () => {
      const leaveSpy = jest.spyOn(mockSocket, 'leave')
      gateway.leaveSessionRoom(mockSocket, { sessionId: 'session-123' })
      expect(leaveSpy).toHaveBeenCalledWith('session:session-123')
    })

    it('should join group room', () => {
      const joinSpy = jest.spyOn(mockSocket, 'join')
      gateway.joinGroupRoom(mockSocket, { groupId: 'group-123' })
      expect(joinSpy).toHaveBeenCalledWith('group:group-123')
    })
  })

  describe('broadcast methods', () => {
    it('should broadcast message to session room', () => {
      const toSpy = jest.spyOn(server, 'to').mockReturnThis()
      const emitSpy = jest.spyOn(server, 'emit')
      
      gateway.broadcastToSession('session-123', 'chat.message.new', {
        id: 'msg-123',
        content: 'test',
      })
      
      expect(toSpy).toHaveBeenCalledWith('session:session-123')
      expect(emitSpy).toHaveBeenCalledWith('chat.message.new', expect.any(Object))
    })

    it('should broadcast message to group room', () => {
      const toSpy = jest.spyOn(server, 'to').mockReturnThis()
      const emitSpy = jest.spyOn(server, 'emit')
      
      gateway.broadcastToGroup('group-123', 'group.member.joined', {
        agentId: 'agent-123',
      })
      
      expect(toSpy).toHaveBeenCalledWith('group:group-123')
      expect(emitSpy).toHaveBeenCalledWith('group.member.joined', expect.any(Object))
    })
  })

  describe('error handling', () => {
    it('should send error response on invalid message', () => {
      const invalidMessage = {
        id: generateId('msg'),
        type: 'invalid.event',
        timestamp: Date.now(),
        data: {},
      }
      const result = gateway.handleMessage(mockSocket, invalidMessage)
      expect(result).toEqual(
        expect.objectContaining({
          id: invalidMessage.id,
          success: false,
          error: expect.objectContaining({
            code: 400,
            message: expect.any(String),
          }),
        })
      )
    })
  })
})
