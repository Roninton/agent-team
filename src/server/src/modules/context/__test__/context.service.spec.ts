import { Test, TestingModule } from "@nestjs/testing"
import { ContextService } from '../context.service'
import { GroupService } from '../../group/group.service'
import type { SetContextOptions } from '../types/context.types'

// Mock services
const mockGroupService = {
  getMembers: jest.fn().mockResolvedValue([
    { agentId: 'agent-1' },
    { agentId: 'agent-2' },
  ]),
}

describe('ContextService', () => {
  let service: ContextService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContextService,
        {
          provide: GroupService,
          useValue: mockGroupService,
        },
      ],
    }).compile()

    service = module.get<ContextService>(ContextService)
    jest.clearAllMocks()
  })

  describe('setContext', () => {
    const baseOptions: SetContextOptions = {
      scope: 'agent',
      targetId: 'agent-1',
      key: 'user.profile',
      value: { name: 'Test User', role: 'developer' },
    }

    it('should create a new context entry', async () => {
      const result = await service.setContext(baseOptions)
      expect(result.contextId).toBeDefined()
      expect(result.key).toBe('user.profile')
      expect(result.valueType).toBe('object')
      expect(result.scope).toBe('agent')
    })

    it('should update existing context entry', async () => {
      const created = await service.setContext(baseOptions)
      const originalValue = created.value

      const updated = await service.setContext({
        ...baseOptions,
        value: { name: 'Updated User', role: 'admin' },
      })

      expect(updated.contextId).toBe(created.contextId)
      expect(updated.value.name).toBe('Updated User')
      expect(updated.updatedAt).toBeGreaterThanOrEqual(created.updatedAt)
    })

    it('should correctly detect value types', async () => {
      // String
      const strResult = await service.setContext({
        ...baseOptions,
        key: 'string.key',
        value: 'hello',
      })
      expect(strResult.valueType).toBe('string')

      // Number
      const numResult = await service.setContext({
        ...baseOptions,
        key: 'number.key',
        value: 42,
      })
      expect(numResult.valueType).toBe('number')

      // Boolean
      const boolResult = await service.setContext({
        ...baseOptions,
        key: 'boolean.key',
        value: true,
      })
      expect(boolResult.valueType).toBe('boolean')

      // Array
      const arrResult = await service.setContext({
        ...baseOptions,
        key: 'array.key',
        value: [1, 2, 3],
      })
      expect(arrResult.valueType).toBe('array')
    })
  })

  describe('getContext', () => {
    it('should return context entry', async () => {
      const created = await service.setContext({
        scope: 'agent',
        targetId: 'agent-1',
        key: 'test.key',
        value: 'test value',
      })

      const found = await service.getContextByKey('agent', 'agent-1', 'test.key')
      expect(found?.contextId).toBe(created.contextId)
      expect(found?.value).toBe('test value')
    })

    it('should return undefined for non-existent context', async () => {
      const found = await service.getContextByKey('agent', 'nonexistent', 'key')
      expect(found).toBeUndefined()
    })

    it('should return undefined for expired context', async () => {
      const pastTime = Date.now() - 1000 // 1 second ago
      await service.setContext({
        scope: 'agent',
        targetId: 'agent-1',
        key: 'expired.key',
        value: 'expired',
        expiresAt: pastTime,
      })

      const found = await service.getContextByKey('agent', 'agent-1', 'expired.key')
      expect(found).toBeUndefined()
    })
  })

  describe('queryContext', () => {
    beforeEach(async () => {
      // Create multiple context entries
      await service.setContext({
        scope: 'agent',
        targetId: 'agent-1',
        key: 'user.name',
        value: 'Alice',
      })
      await service.setContext({
        scope: 'agent',
        targetId: 'agent-1',
        key: 'user.email',
        value: 'alice@example.com',
      })
      await service.setContext({
        scope: 'agent',
        targetId: 'agent-2',
        key: 'user.name',
        value: 'Bob',
      })
      await service.setContext({
        scope: 'group',
        targetId: 'group-1',
        key: 'group.settings',
        value: { theme: 'dark' },
      })
    })

    it('should filter by scope', async () => {
      const results = await service.queryContext({ scope: 'group' })
      expect(results).toHaveLength(1)
      expect(results[0].scope).toBe('group')
    })

    it('should filter by targetId', async () => {
      const results = await service.queryContext({ targetId: 'agent-2' })
      expect(results).toHaveLength(1)
      expect(results[0].value).toBe('Bob')
    })

    it('should filter by key prefix', async () => {
      const results = await service.queryContext({ prefix: 'user.' })
      expect(results).toHaveLength(3)
    })

    it('should return all contexts with no filters', async () => {
      const results = await service.queryContext({})
      expect(results).toHaveLength(4)
    })
  })

  describe('deleteContext', () => {
    it('should delete context entry', async () => {
      const created = await service.setContext({
        scope: 'agent',
        targetId: 'agent-1',
        key: 'to.delete',
        value: 'delete me',
      })

      await service.deleteContext(created.contextId)
      const found = await service.getContextByKey('agent', 'agent-1', 'to.delete')
      expect(found).toBeUndefined()
    })

    it('should not throw for non-existent context', async () => {
      await expect(service.deleteContext('non-existent')).resolves.not.toThrow()
    })
  })

  describe('getContextHistory', () => {
    it('should return change history', async () => {
      const created = await service.setContext({
        scope: 'agent',
        targetId: 'agent-1',
        key: 'history.test',
        value: 'v1',
      })

      await service.setContext({
        scope: 'agent',
        targetId: 'agent-1',
        key: 'history.test',
        value: 'v2',
      })

      const history = await service.getContextHistory(created.contextId)
      expect(history.length).toBeGreaterThanOrEqual(2)
      expect(history[0].changeType).toBe('add')
      expect(history[1].changeType).toBe('update')
    })
  })

  describe('createSnapshot and restoreSnapshot', () => {
    it('should create and restore snapshot', async () => {
      // Create some context entries
      await service.setContext({
        scope: 'agent',
        targetId: 'agent-1',
        key: 'snap.key1',
        value: 'value1',
      })
      await service.setContext({
        scope: 'agent',
        targetId: 'agent-1',
        key: 'snap.key2',
        value: 'value2',
      })

      // Create snapshot
      const snapshot = await service.createSnapshot('agent', 'agent-1')
      expect(snapshot.snapshotId).toBeDefined()
      expect(snapshot.entries.length).toBe(2)

      // Modify current context
      await service.setContext({
        scope: 'agent',
        targetId: 'agent-1',
        key: 'snap.key1',
        value: 'modified value',
      })

      // Restore snapshot
      await service.restoreSnapshot(snapshot.snapshotId)

      // Verify restored values
      const restored = await service.getContextByKey('agent', 'agent-1', 'snap.key1')
      expect(restored?.value).toBe('value1')
    })

    it('should throw when restoring non-existent snapshot', async () => {
      await expect(service.restoreSnapshot('non-existent')).rejects.toThrow('not found')
    })
  })

  describe('syncGroupContext', () => {
    it('should sync group context to all members', async () => {
      // Create group context
      await service.setContext({
        scope: 'group',
        targetId: 'group-1',
        key: 'shared.setting',
        value: 'shared value',
      })

      const syncedAgents = await service.syncGroupContext('group-1')
      expect(syncedAgents).toHaveLength(2)
      expect(syncedAgents).toContain('agent-1')
      expect(syncedAgents).toContain('agent-2')

      // Verify context was synced to agents
      const agent1Context = await service.getContextByKey('agent', 'agent-1', 'shared.setting')
      const agent2Context = await service.getContextByKey('agent', 'agent-2', 'shared.setting')

      expect(agent1Context?.value).toBe('shared value')
      expect(agent2Context?.value).toBe('shared value')
      expect(agent1Context?.metadata?.syncedFrom).toBe('group-1')
    })
  })

  describe('getContextMetrics', () => {
    it('should return correct metrics', async () => {
      await service.setContext({
        scope: 'agent',
        targetId: 'agent-1',
        key: 'metric.key1',
        value: 'value1',
      })
      await service.setContext({
        scope: 'group',
        targetId: 'group-1',
        key: 'metric.key2',
        value: 'value2',
      })

      const metrics = service.getContextMetrics()
      expect(metrics.totalEntries).toBe(2)
      expect(metrics.byScope.agent).toBe(1)
      expect(metrics.byScope.group).toBe(1)
    })
  })

  describe('cleanupExpiredContexts', () => {
    it('should cleanup expired contexts', async () => {
      const pastTime = Date.now() - 1000
      const futureTime = Date.now() + 10000

      await service.setContext({
        scope: 'agent',
        targetId: 'agent-1',
        key: 'expired.key',
        value: 'expired',
        expiresAt: pastTime,
      })
      await service.setContext({
        scope: 'agent',
        targetId: 'agent-1',
        key: 'valid.key',
        value: 'valid',
        expiresAt: futureTime,
      })

      const cleanedCount = await service.cleanupExpiredContexts()
      expect(cleanedCount).toBe(1)

      const expired = await service.getContextByKey('agent', 'agent-1', 'expired.key')
      expect(expired).toBeUndefined()

      const valid = await service.getContextByKey('agent', 'agent-1', 'valid.key')
      expect(valid).toBeDefined()
    })
  })
})
