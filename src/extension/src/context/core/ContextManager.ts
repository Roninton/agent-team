import type {
  Context,
  ContextFilterRule,
  ContextDiff,
  ContextChange,
  SyncResult,
  ContextConflict
} from '../types/Context'
import { randomUUID } from 'crypto'

export class ContextManager {
  private contexts: Map<string, Context> = new Map()
  private contextVersions: Map<string, Map<string, Context>> = new Map() // contextId -> version -> context

  /**
   * 创建上下文
   */
  async createContext(options: {
    type: any
    relationId: string
    content: Record<string, any>
    creatorId: string
  }): Promise<Context> {
    const contextId = randomUUID()
    const initialVersion = '1.0.0'
    const now = Date.now()

    const change: ContextChange = {
      changeId: randomUUID(),
      version: initialVersion,
      previousVersion: '0.0.0',
      modifierId: options.creatorId,
      changes: [],
      changedAt: now,
      description: 'Initial version'
    }

    const context: Context = {
      contextId,
      type: options.type,
      relationId: options.relationId,
      version: initialVersion,
      content: options.content,
      creatorId: options.creatorId,
      createdAt: now,
      updatedAt: now,
      lastModifierId: options.creatorId,
      changeLog: [change]
    }

    // 存储当前版本和历史版本
    this.contexts.set(contextId, context)
    if (!this.contextVersions.has(contextId)) {
      this.contextVersions.set(contextId, new Map())
    }
    this.contextVersions.get(contextId)!.set(initialVersion, { ...context })

    return { ...context }
  }

  /**
   * 获取上下文
   */
  async getContext(contextId: string): Promise<Context | undefined> {
    const context = this.contexts.get(contextId)
    return context ? { ...context } : undefined
  }

  /**
   * 获取指定版本的上下文
   */
  async getContextVersion(contextId: string, version: string): Promise<Context | undefined> {
    const versions = this.contextVersions.get(contextId)
    const context = versions?.get(version)
    return context ? { ...context } : undefined
  }

  /**
   * 列出上下文所有版本
   */
  async listContextVersions(contextId: string): Promise<Context[]> {
    const versions = this.contextVersions.get(contextId)
    if (!versions) return []
    // 按版本号降序排列
    return Array.from(versions.values())
      .sort((a, b) => this.compareVersions(b.version, a.version))
      .map(v => ({ ...v }))
  }

  /**
   * 更新上下文
   */
  async updateContext(options: {
    contextId: string
    content: Record<string, any>
    modifierId: string
    description?: string
    isMajor?: boolean
    isPatch?: boolean
  }): Promise<Context> {
    const context = this.contexts.get(options.contextId)
    if (!context) {
      throw new Error(`Context ${options.contextId} not found`)
    }

    // 生成新版本号
    const newVersion = this.incrementVersion(context.version, options.isMajor, options.isPatch)
    const now = Date.now()

    // 生成变更diff
    const changes = await this.generateDiff(options.contextId, context.version, newVersion, context.content, options.content)

    const change: ContextChange = {
      changeId: randomUUID(),
      version: newVersion,
      previousVersion: context.version,
      modifierId: options.modifierId,
      changes,
      changedAt: now,
      description: options.description || 'Updated context'
    }

    // 更新上下文
    context.content = options.content
    context.version = newVersion
    context.updatedAt = now
    context.lastModifierId = options.modifierId
    context.changeLog.unshift(change) // 最新变更放前面

    // 保存新版本
    this.contextVersions.get(options.contextId)!.set(newVersion, { ...context })

    return { ...context }
  }

  /**
   * 过滤上下文内容
   */
  async filterContext(contextId: string, rules: ContextFilterRule): Promise<Context> {
    const context = this.contexts.get(contextId)
    if (!context) {
      throw new Error(`Context ${contextId} not found`)
    }

    let filteredContent: Record<string, any> = { ...context.content }

    // 1. 按includePaths过滤，只保留指定路径
    if (rules.includePaths?.length > 0) {
      filteredContent = this.filterIncludePaths(filteredContent, rules.includePaths)
    }

    // 2. 按excludePaths移除指定路径
    if (rules.excludePaths?.length > 0) {
      filteredContent = this.filterExcludePaths(filteredContent, rules.excludePaths)
    }

    // 3. 移除敏感数据
    if (rules.removeSensitiveData) {
      filteredContent = this.removeSensitiveData(filteredContent)
    }

    // 4. 移除废弃字段
    if (rules.trimDeprecatedFields) {
      filteredContent = this.removeDeprecatedFields(filteredContent)
    }

    // 5. 截断超长内容
    if (rules.maxContentLength && rules.maxContentLength > 0) {
      filteredContent = this.truncateLongContent(filteredContent, rules.maxContentLength)
    }

    return {
      ...context,
      content: filteredContent
    }
  }

  /**
   * 生成两个版本之间的diff
   */
  async generateDiff(
    contextId: string,
    fromVersion: string,
    toVersion: string,
    oldContent?: Record<string, any>,
    newContent?: Record<string, any>
  ): Promise<ContextDiff[]> {
    // 如果传入了内容就直接用，否则查询版本库
    let oldObj = oldContent
    let newObj = newContent

    if (!oldObj || !newObj) {
      const fromContext = await this.getContextVersion(contextId, fromVersion)
      const toContext = await this.getContextVersion(contextId, toVersion)
      if (!fromContext || !toContext) {
        throw new Error('Invalid version for diff')
      }
      oldObj = fromContext.content
      newObj = toContext.content
    }

    return this.calculateDiff(oldObj, newObj)
  }

  /**
   * 增量同步上下文
   */
  async syncContext(options: {
    contextId: string
    currentVersion: string
    localChanges: ContextDiff[]
  }): Promise<SyncResult> {
    const context = this.contexts.get(options.contextId)
    if (!context) {
      throw new Error(`Context ${options.contextId} not found`)
    }

    // 版本已经是最新
    if (options.currentVersion === context.version) {
      return {
        success: true,
        currentVersion: context.version,
        changesApplied: []
      }
    }

    // 生成从当前版本到最新版本的diff
    const changesToApply = await this.generateDiff(options.contextId, options.currentVersion, context.version)
    
    // 应用本地变更
    let localContent = this.applyDiffs({ ...context.content }, options.localChanges)
    
    // 应用远程变更，检测冲突
    const conflicts: ContextConflict[] = []
    const finalContent = this.applyDiffsWithConflictResolution(
      localContent,
      changesToApply,
      conflicts
    )

    // 如果有冲突，使用默认策略（远程覆盖本地）
    if (conflicts.length > 0) {
      for (const conflict of conflicts) {
        conflict.resolution = 'use-theirs'
        // 应用远程值
        this.setPathValue(finalContent, conflict.path, conflict.theirValue)
      }
    }

    // 更新上下文
    await this.updateContext({
      contextId: options.contextId,
      content: finalContent,
      modifierId: 'system',
      description: 'Sync changes'
    })

    return {
      success: true,
      currentVersion: context.version,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      changesApplied: changesToApply
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 递增版本号
   */
  private incrementVersion(version: string, isMajor?: boolean, isPatch?: boolean): string {
    const [major, minor, patch] = version.split('.').map(Number)
    if (isMajor) {
      return `${major + 1}.0.0`
    } else if (isPatch) {
      return `${major}.${minor}.${patch + 1}`
    } else {
      return `${major}.${minor + 1}.0`
    }
  }

  /**
   * 比较版本号大小：返回负数v1 < v2，0相等，正数v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0
      const num2 = parts2[i] || 0
      if (num1 !== num2) {
        return num1 - num2
      }
    }
    return 0
  }

  /**
   * 计算两个对象之间的diff，使用JSON Patch格式
   */
  private calculateDiff(oldObj: Record<string, any>, newObj: Record<string, any>, path = ''): ContextDiff[] {
    const diffs: ContextDiff[] = []

    // 检查删除或修改的字段
    for (const key in oldObj) {
      const currentPath = path ? `${path}/${key}` : `/${key}`
      if (!(key in newObj)) {
        diffs.push({ op: 'remove', path: currentPath })
      } else if (typeof oldObj[key] === 'object' && oldObj[key] !== null && typeof newObj[key] === 'object' && newObj[key] !== null) {
        // 递归比较对象
        diffs.push(...this.calculateDiff(oldObj[key], newObj[key], currentPath))
      } else if (oldObj[key] !== newObj[key]) {
        diffs.push({ op: 'replace', path: currentPath, value: newObj[key] })
      }
    }

    // 检查新增的字段
    for (const key in newObj) {
      const currentPath = path ? `${path}/${key}` : `/${key}`
      if (!(key in oldObj)) {
        diffs.push({ op: 'add', path: currentPath, value: newObj[key] })
      }
    }

    return diffs
  }

  /**
   * 应用diff到对象
   */
  private applyDiffs(obj: Record<string, any>, diffs: ContextDiff[]): Record<string, any> {
    const result = { ...obj }
    for (const diff of diffs) {
      switch (diff.op) {
        case 'add':
        case 'replace':
          this.setPathValue(result, diff.path, diff.value)
          break
        case 'remove':
          this.removePathValue(result, diff.path)
          break
      }
    }
    return result
  }

  /**
   * 应用diff并检测冲突
   */
  private applyDiffsWithConflictResolution(
    localObj: Record<string, any>,
    remoteDiffs: ContextDiff[],
    conflicts: ContextConflict[]
  ): Record<string, any> {
    const result = { ...localObj }
    for (const diff of remoteDiffs) {
      const localValue = this.getPathValue(result, diff.path)
      
      // 检测冲突：本地值和旧值不同，远程也修改了同一个路径
      // 这里简化判断，只要路径在远程变更里，本地值和基准值不同就算冲突
      if (diff.op === 'replace' && localValue !== undefined && localValue !== diff.value) {
        conflicts.push({
          path: diff.path,
          ourValue: localValue,
          theirValue: diff.value,
          resolution: 'auto-merge'
        })
      }

      // 应用远程变更
      if (diff.op === 'replace' || diff.op === 'add') {
        this.setPathValue(result, diff.path, diff.value)
      } else if (diff.op === 'remove') {
        this.removePathValue(result, diff.path)
      }
    }
    return result
  }

  /**
   * 根据JSON Path获取值
   */
  private getPathValue(obj: Record<string, any>, path: string): any {
    const parts = path.split('/').filter(Boolean)
    let current = obj
    for (const part of parts) {
      if (current === null || typeof current !== 'object' || !(part in current)) {
        return undefined
      }
      current = current[part]
    }
    return current
  }

  /**
   * 根据JSON Path设置值
   */
  private setPathValue(obj: Record<string, any>, path: string, value: any): void {
    const parts = path.split('/').filter(Boolean)
    const lastPart = parts.pop()!
    let current = obj
    for (const part of parts) {
      if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
        current[part] = {}
      }
      current = current[part]
    }
    current[lastPart] = value
  }

  /**
   * 根据JSON Path删除值
   */
  private removePathValue(obj: Record<string, any>, path: string): void {
    const parts = path.split('/').filter(Boolean)
    const lastPart = parts.pop()!
    let current = obj
    for (const part of parts) {
      if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
        return
      }
      current = current[part]
    }
    delete current[lastPart]
  }

  /**
   * 只保留includePaths中的路径
   */
  private filterIncludePaths(obj: Record<string, any>, includePaths: string[]): Record<string, any> {
    const result: Record<string, any> = {}
    for (const path of includePaths) {
      const value = this.getPathValue(obj, path)
      if (value !== undefined) {
        this.setPathValue(result, path, value)
      }
    }
    return result
  }

  /**
   * 移除excludePaths中的路径
   */
  private filterExcludePaths(obj: Record<string, any>, excludePaths: string[]): Record<string, any> {
    const result = { ...obj }
    for (const path of excludePaths) {
      this.removePathValue(result, path)
    }
    return result
  }

  /**
   * 移除敏感数据
   */
  private removeSensitiveData(obj: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'passwd', 'token', 'secret', 'apiKey', 'api_key', 'creditcard', 'credit_card']
    const result = { ...obj }
    
    const removeSensitiveRecursive = (o: any) => {
      if (typeof o !== 'object' || o === null) return
      for (const key in o) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
          delete o[key]
        } else if (typeof o[key] === 'object' && o[key] !== null) {
          removeSensitiveRecursive(o[key])
        }
      }
    }

    removeSensitiveRecursive(result)
    return result
  }

  /**
   * 移除废弃字段
   */
  private removeDeprecatedFields(obj: Record<string, any>): Record<string, any> {
    const result = { ...obj }
    for (const key in result) {
      if (key.toLowerCase().includes('deprecated')) {
        delete result[key]
      } else if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = this.removeDeprecatedFields(result[key])
      }
    }
    return result
  }

  /**
   * 截断超长字符串内容
   */
  private truncateLongContent(obj: Record<string, any>, maxLength: number): Record<string, any> {
    const result = { ...obj }
    for (const key in result) {
      if (typeof result[key] === 'string' && result[key].length > maxLength) {
        // 预留3个点的位置，所以实际截取maxLength-3
        result[key] = result[key].slice(0, Math.max(0, maxLength - 3)) + '...'
      } else if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = this.truncateLongContent(result[key], maxLength)
      }
    }
    return result
  }
}
