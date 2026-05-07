import * as types from '../types'

describe('Type exports', () => {
  it('should export all type modules', () => {
    expect(types).toBeDefined()
  })

  it('should have ErrorCode enum defined', () => {
    expect(types.ErrorCode).toBeDefined()
    expect(types.ErrorCode.SUCCESS).toBe(200)
    expect(types.ErrorCode.BAD_REQUEST).toBe(400)
    expect(types.ErrorCode.UNAUTHORIZED).toBe(401)
    expect(types.ErrorCode.FORBIDDEN).toBe(403)
    expect(types.ErrorCode.NOT_FOUND).toBe(404)
    expect(types.ErrorCode.INTERNAL_SERVER_ERROR).toBe(500)
  })

  it('should have WsEventType enum defined', () => {
    expect(types.WsEventType).toBeDefined()
    expect(types.WsEventType.PING).toBe('ping')
    expect(types.WsEventType.PONG).toBe('pong')
    expect(types.WsEventType.CONNECTED).toBe('connected')
    expect(types.WsEventType.DISCONNECTED).toBe('disconnected')
  })
})

describe('Type compatibility', () => {
  it('ApiResponse should have correct structure', () => {
    const response: types.ApiResponse = {
      success: true,
      code: 200,
      message: 'OK',
      data: {},
    }
    expect(response.success).toBe(true)
    expect(response.code).toBe(200)
  })

  it('BaseEntity should have id and timestamps', () => {
    const entity: types.BaseEntity = {
      id: 'test-123',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    expect(entity.id).toBeDefined()
    expect(entity.createdAt).toBeDefined()
    expect(entity.updatedAt).toBeDefined()
  })

  it('AgentStatus should be valid string literal', () => {
    const status: types.AgentStatus = 'running'
    expect(['not_found', 'starting', 'running', 'stopping', 'stopped', 'error']).toContain(status)
  })

  it('GroupStatus should be valid string literal', () => {
    const status: types.GroupStatus = 'active'
    expect(['active', 'inactive', 'paused']).toContain(status)
  })

  it('TaskStatus should be valid string literal', () => {
    const status: types.TaskStatus = 'pending'
    expect(['pending', 'assigned', 'running', 'completed', 'failed', 'cancelled']).toContain(status)
  })

  it('TaskPriority should be valid string literal', () => {
    const priority: types.TaskPriority = 'normal'
    expect(['low', 'normal', 'high', 'urgent']).toContain(priority)
  })

  it('MessageType should be valid string literal', () => {
    const type: types.MessageType = 'text'
    expect(['text', 'markdown', 'code', 'system', 'task', 'tool_call', 'tool_result']).toContain(type)
  })

  it('SenderType should be valid string literal', () => {
    const type: types.SenderType = 'user'
    expect(['user', 'agent', 'system']).toContain(type)
  })
})
