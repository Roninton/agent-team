import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ContextManager } from '../core/ContextManager'
import type { ContextFilterRule } from '../types/Context'

describe('ContextManager', () => {
  let contextManager: ContextManager
  const testContextContent = {
    userInfo: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      password: '123456', // 敏感字段，应该被过滤
      preferences: {
        theme: 'dark',
        fontSize: 14,
        notifications: true
      }
    },
    conversationHistory: [
      { id: 'msg-1', content: 'Hello', timestamp: 123456 },
      { id: 'msg-2', content: 'Hi there', timestamp: 123457 },
      { id: 'msg-3', content: 'How can I help?', timestamp: 123458 }
    ],
    taskInfo: {
      id: 'task-1',
      title: 'Implement Context Module',
      status: 'in-progress',
      priority: 'high',
      deprecatedField: 'This is deprecated' // 废弃字段，应该被移除
    },
    systemInfo: {
      apiKey: 'secret-abc123', // 敏感字段
      serverUrl: 'https://api.example.com'
    }
  }

  beforeEach(() => {
    contextManager = new ContextManager()
  })

  describe('context CRUD operations', () => {
    it('should create context successfully with auto versioning', async () => {
      const context = await contextManager.createContext({
        type: 'conversation',
        relationId: 'conv-123',
        content: testContextContent,
        creatorId: 'user-123'
      })

      expect(context.contextId).toBeDefined()
      expect(context.version).toBe('1.0.0')
      expect(context.content).toEqual(testContextContent)
      expect(context.changeLog).toHaveLength(1)
      expect(context.changeLog[0].description).toBe('Initial version')
    })

    it('should get existing context by id', async () => {
      const created = await contextManager.createContext({
        type: 'conversation',
        relationId: 'conv-123',
        content: testContextContent,
        creatorId: 'user-123'
      })

      const found = await contextManager.getContext(created.contextId)
      expect(found).toEqual(created)
    })

    it('should return undefined for non-existent context id', async () => {
      const found = await contextManager.getContext('non-existent-id')
      expect(found).toBeUndefined()
    })
  })

  describe('context version management', () => {
    it('should increment version correctly when updating context', async () => {
      const context = await contextManager.createContext({
        type: 'conversation',
        relationId: 'conv-123',
        content: { test: 'v1' },
        creatorId: 'user-123'
      })

      // 小版本更新
      const updatedV11 = await contextManager.updateContext({
        contextId: context.contextId,
        content: { test: 'v1.1', newField: 'added' },
        modifierId: 'user-123',
        description: 'Added newField'
      })
      expect(updatedV11.version).toBe('1.1.0')
      expect(updatedV11.changeLog).toHaveLength(2)

      // 补丁版本更新
      const updatedV111 = await contextManager.updateContext({
        contextId: context.contextId,
        content: { test: 'v1.1.1', newField: 'fixed' },
        modifierId: 'user-123',
        description: 'Fixed newField value',
        isPatch: true
      })
      expect(updatedV111.version).toBe('1.1.1')

      // 大版本更新
      const updatedV2 = await contextManager.updateContext({
        contextId: context.contextId,
        content: { test: 'v2', majorChange: true },
        modifierId: 'user-123',
        description: 'Major version update',
        isMajor: true
      })
      expect(updatedV2.version).toBe('2.0.0')
    })

    it('should get specific version of context', async () => {
      const context = await contextManager.createContext({
        type: 'conversation',
        relationId: 'conv-123',
        content: { test: 'v1' },
        creatorId: 'user-123'
      })

      await contextManager.updateContext({
        contextId: context.contextId,
        content: { test: 'v2' },
        modifierId: 'user-123',
        isMajor: true
      })

      const v1 = await contextManager.getContextVersion(context.contextId, '1.0.0')
      const v2 = await contextManager.getContextVersion(context.contextId, '2.0.0')

      expect(v1?.content.test).toBe('v1')
      expect(v2?.content.test).toBe('v2')
    })

    it('should list all versions of context', async () => {
      const context = await contextManager.createContext({
        type: 'conversation',
        relationId: 'conv-123',
        content: { test: 'v1' },
        creatorId: 'user-123'
      })

      for (let i = 0; i < 3; i++) {
        await contextManager.updateContext({
          contextId: context.contextId,
          content: { test: `v${i + 2}` },
          modifierId: 'user-123'
        })
      }

      const versions = await contextManager.listContextVersions(context.contextId)
      expect(versions).toHaveLength(4) // 1.0.0, 1.1.0, 1.2.0, 1.3.0
      expect(versions.map(v => v.version)).toEqual(['1.3.0', '1.2.0', '1.1.0', '1.0.0'])
    })
  })

  describe('context filtering and trimming', () => {
    it('should filter sensitive data according to rules', async () => {
      const context = await contextManager.createContext({
        type: 'conversation',
        relationId: 'conv-123',
        content: testContextContent,
        creatorId: 'user-123'
      })

      const filterRule: ContextFilterRule = {
        includePaths: ['userInfo', 'taskInfo'],
        excludePaths: ['userInfo.password', 'taskInfo.deprecatedField'],
        removeSensitiveData: true,
        trimDeprecatedFields: true,
        maxContentLength: 100
      }

      const filtered = await contextManager.filterContext(context.contextId, filterRule)
      const content = filtered.content

      // 包含的路径保留
      expect(content.userInfo).toBeDefined()
      expect(content.taskInfo).toBeDefined()
      // 排除的路径被移除
      expect(content.userInfo.password).toBeUndefined()
      expect(content.taskInfo.deprecatedField).toBeUndefined()
      // 敏感字段被移除
      expect(content.systemInfo).toBeUndefined() // 整个systemInfo是敏感的
      // 未包含的路径被移除
      expect(content.conversationHistory).toBeUndefined()
    })

    it('should automatically trim content exceeding max length', async () => {
      const longContent = {
        longText: 'a'.repeat(1000) // 1000个字符
      }

      const context = await contextManager.createContext({
        type: 'conversation',
        relationId: 'conv-123',
        content: longContent,
        creatorId: 'user-123'
      })

      const filtered = await contextManager.filterContext(context.contextId, {
        includePaths: ['longText'],
        excludePaths: [],
        maxContentLength: 100,
        removeSensitiveData: false,
        trimDeprecatedFields: false
      })

      expect(filtered.content.longText.length).toBe(100)
      expect(filtered.content.longText.slice(-3)).toBe('...')
    })
  })

  describe('context incremental sync', () => {
    it('should generate incremental diff between versions', async () => {
      const context = await contextManager.createContext({
        type: 'conversation',
        relationId: 'conv-123',
        content: {
          name: 'Test',
          items: [1, 2, 3],
          nested: { value: 'old' }
        },
        creatorId: 'user-123'
      })

      const updated = await contextManager.updateContext({
        contextId: context.contextId,
        content: {
          name: 'Updated Test',
          items: [1, 2, 3, 4],
          nested: { value: 'new' },
          newField: 'added'
        },
        modifierId: 'user-123'
      })

      const diff = await contextManager.generateDiff(context.contextId, '1.0.0', '1.1.0')
      expect(diff).toHaveLength(4) // name更新, items新增元素, nested.value更新, newField新增 -> 共4处
      const ops = diff.map(d => d.op)
      expect(ops).toContain('replace') // name更新和nested.value更新
      expect(ops).toContain('add') // newField新增和items数组新增元素
    })

    it('should apply incremental diff correctly to sync context', async () => {
      const context = await contextManager.createContext({
        type: 'conversation',
        relationId: 'conv-123',
        content: { counter: 0, name: 'Test' },
        creatorId: 'user-123'
      })

      // 模拟远端版本更新
      await contextManager.updateContext({
        contextId: context.contextId,
        content: { counter: 1, name: 'Updated' },
        modifierId: 'user-456'
      })

      // 从v1.0.0同步到最新
      const syncResult = await contextManager.syncContext({
        contextId: context.contextId,
        currentVersion: '1.0.0',
        localChanges: []
      })

      expect(syncResult.success).toBe(true)
      expect(syncResult.currentVersion).toBe('1.2.0') // 同步合并变更生成新版本
      expect(syncResult.changesApplied).toHaveLength(2)

      const updatedContext = await contextManager.getContext(context.contextId)
      expect(updatedContext?.content.counter).toBe(1)
      expect(updatedContext?.content.name).toBe('Updated')
    })

    it('should detect and resolve conflicts during sync', async () => {
      const context = await contextManager.createContext({
        type: 'conversation',
        relationId: 'conv-123',
        content: { counter: 0, name: 'Test' },
        creatorId: 'user-123'
      })

      // 远端更新counter
      await contextManager.updateContext({
        contextId: context.contextId,
        content: { counter: 1, name: 'Remote Update' },
        modifierId: 'user-remote'
      })

      // 本地也更新了同一个字段
      const syncResult = await contextManager.syncContext({
        contextId: context.contextId,
        currentVersion: '1.0.0',
        localChanges: [
          { op: 'replace', path: '/counter', value: 2 },
          { op: 'replace', path: '/name', value: 'Local Update' }
        ]
      })

      // 应该检测到冲突
      expect(syncResult.conflicts).toHaveLength(2)
      expect(syncResult.conflicts?.map(c => c.path)).toEqual(expect.arrayContaining(['/counter', '/name']))
      // 默认策略应该是远程覆盖本地（use-theirs）
      const finalContext = await contextManager.getContext(context.contextId)
      expect(finalContext?.content.counter).toBe(1)
      expect(finalContext?.content.name).toBe('Remote Update')
    })
  })
})
