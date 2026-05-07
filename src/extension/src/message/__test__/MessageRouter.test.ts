import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MessageRouter } from '../core/MessageRouter'
import { AgentManager } from '../../agent/core/AgentManager'
import type { SendMessageOptions } from '../types/Message'

vi.mock('../../agent/core/AgentManager', () => ({
  AgentManager: vi.fn().mockImplementation(() => ({
    canSendMessage: vi.fn((agentId) => {
      // 模拟限流：agent-1允许发5条，agent-2被限流
      return agentId !== 'agent-limit-exceeded'
    }),
    recordMessageSent: vi.fn()
  }))
}))

describe('MessageRouter', () => {
  let messageRouter: MessageRouter
  let agentManager: AgentManager
  let sendOptions: SendMessageOptions

  beforeEach(() => {
    agentManager = new AgentManager()
    messageRouter = new MessageRouter(agentManager)
    
    sendOptions = {
      conversationId: 'conv-123',
      senderId: 'agent-1',
      senderType: 'agent',
      receiverId: 'user-1',
      receiverType: 'user',
      content: 'Hello World',
      type: 'text'
    }
  })

  describe('sendMessage', () => {
    it('should send agent message successfully when under rate limit', async () => {
      const message = await messageRouter.sendMessage(sendOptions)
      
      expect(message.messageId).toBeDefined()
      expect(message.status).toBe('sent')
      expect(message.content).toBe('Hello World')
      expect(agentManager.recordMessageSent).toHaveBeenCalledWith('agent-1')
    })

    it('should reject agent message when rate limit exceeded', async () => {
      const limitOptions = { ...sendOptions, senderId: 'agent-limit-exceeded' }
      
      await expect(messageRouter.sendMessage(limitOptions))
        .rejects.toThrow('Agent agent-limit-exceeded has exceeded rate limit (5 messages per minute)')
      expect(agentManager.recordMessageSent).not.toHaveBeenCalledWith('agent-limit-exceeded')
    })

    it('should bypass rate limit for urgent priority messages', async () => {
      const urgentOptions = {
        ...sendOptions,
        senderId: 'agent-limit-exceeded',
        priority: 'urgent'
      }
      
      const message = await messageRouter.sendMessage(urgentOptions)
      expect(message.status).toBe('sent')
      expect(agentManager.recordMessageSent).toHaveBeenCalledWith('agent-limit-exceeded')
    })

    it('should not apply rate limit for non-agent messages', async () => {
      const userOptions = {
        ...sendOptions,
        senderId: 'user-1',
        senderType: 'user'
      }
      
      const message = await messageRouter.sendMessage(userOptions)
      expect(message.status).toBe('sent')
      expect(agentManager.recordMessageSent).not.toHaveBeenCalled()
    })

    it('should route group message to all group members', async () => {
      const groupOptions = {
        ...sendOptions,
        receiverId: 'group-1',
        receiverType: 'group'
      }

      vi.spyOn(messageRouter as any, 'getGroupMemberIds').mockResolvedValue(['user-1', 'user-2', 'agent-3'])

      const message = await messageRouter.sendMessage(groupOptions)
      
      expect(message.receiverId).toBe('group-1')
      expect(message.receiverType).toBe('group')
      // 验证消息已路由到所有成员
      const userMessages = await messageRouter.getUserMessages('user-1')
      const agentMessages = await messageRouter.getAgentMessages('agent-3')
      expect(userMessages).toHaveLength(1)
      expect(agentMessages).toHaveLength(1)
    })

    it('should generate unique messageId for each message', async () => {
      const message1 = await messageRouter.sendMessage(sendOptions)
      const message2 = await messageRouter.sendMessage(sendOptions)
      
      expect(message1.messageId).not.toBe(message2.messageId)
    })
  })

  describe('message status management', () => {
    it('should update message status to delivered when receiver receives', async () => {
      const message = await messageRouter.sendMessage(sendOptions)
      
      await messageRouter.updateMessageStatus(message.messageId, 'delivered')
      
      const updatedMessage = await messageRouter.getMessage(message.messageId)
      expect(updatedMessage?.status).toBe('delivered')
    })

    it('should update message status to read when receiver reads', async () => {
      const message = await messageRouter.sendMessage(sendOptions)
      
      await messageRouter.updateMessageStatus(message.messageId, 'read')
      
      const updatedMessage = await messageRouter.getMessage(message.messageId)
      expect(updatedMessage?.status).toBe('read')
    })

    it('should throw error when updating non-existent message', async () => {
      await expect(messageRouter.updateMessageStatus('non-existent-id', 'read'))
        .rejects.toThrow('Message non-existent-id not found')
    })
  })

  describe('message query', () => {
    it('should return correct messages for specific user', async () => {
      // 给user-1发3条消息
      for (let i = 0; i < 3; i++) {
        await messageRouter.sendMessage({
          ...sendOptions,
          receiverId: 'user-1',
          content: `Message ${i}`
        })
      }
      // 给user-2发2条消息
      for (let i = 0; i < 2; i++) {
        await messageRouter.sendMessage({
          ...sendOptions,
          receiverId: 'user-2',
          content: `User2 Message ${i}`
        })
      }

      const user1Messages = await messageRouter.getUserMessages('user-1')
      const user2Messages = await messageRouter.getUserMessages('user-2')

      expect(user1Messages).toHaveLength(3)
      expect(user2Messages).toHaveLength(2)
    })

    it('should return correct messages for specific agent', async () => {
      // 给agent-1发2条消息
      for (let i = 0; i < 2; i++) {
        await messageRouter.sendMessage({
          ...sendOptions,
          senderId: 'user-1',
          senderType: 'user',
          receiverId: 'agent-1',
          receiverType: 'agent',
          content: `To Agent Message ${i}`
        })
      }

      const agentMessages = await messageRouter.getAgentMessages('agent-1')
      expect(agentMessages).toHaveLength(2)
      expect(agentMessages.every(m => m.receiverId === 'agent-1')).toBe(true)
    })

    it('should return correct conversation history', async () => {
      const convId = 'conv-456'
      // 在同一会话发5条消息
      for (let i = 0; i < 5; i++) {
        await messageRouter.sendMessage({
          ...sendOptions,
          conversationId: convId,
          content: `Conv Message ${i}`
        })
      }

      const history = await messageRouter.getConversationHistory(convId)
      expect(history).toHaveLength(5)
      expect(history.every(m => m.conversationId === convId)).toBe(true)
      // 验证按时间倒序排列
      const timestamps = history.map(m => m.createdAt)
      expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a))
    })
  })

  describe('message routing security', () => {
    it('should filter out sensitive content in agent messages', async () => {
      const sensitiveOptions = {
        ...sendOptions,
        content: 'This is a secret: password=123456, token=abcdef'
      }

      const message = await messageRouter.sendMessage(sensitiveOptions)
      // 敏感内容应该被过滤
      expect(message.content).not.toContain('password=123456')
      expect(message.content).not.toContain('token=abcdef')
      expect(message.content).toContain('***')
    })

    it('should reject messages containing malicious code', async () => {
      const maliciousOptions = {
        ...sendOptions,
        content: '<script>alert("hacked")</script> rm -rf /'
      }

      await expect(messageRouter.sendMessage(maliciousOptions))
        .rejects.toThrow('Message contains malicious content')
    })
  })
})
