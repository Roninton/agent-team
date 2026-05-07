# 任务分配子系统 SDD 规范

## 1. 概述
任务分配子系统是群组协作的核心逻辑模块，基于大语言模型的智能分析能力，实现用户需求的自动拆解、任务智能分配给合适的Worker、执行过程全链路跟踪、上下文智能同步、执行结果自动汇总，实现主管+多个Worker的高效协同工作流，最大化多代理并行执行的效率，降低用户的操作成本。

## 2. 依赖关系
| 依赖模块 | 依赖能力 |
|----------|----------|
| 群组管理子系统 | 群组模型、成员管理、角色权限体系 |
| 代理调度子系统 | 负载均衡、代理选择、状态查询能力 |
| 多代理连接模块 | 向指定代理发送消息、接收执行结果能力 |
| 上下文同步模块 | 上下文增量更新、版本管理、定向分发能力 |

## 3. 需求说明
### 3.1 核心功能需求
1. **智能需求拆解**
   - 支持自动将用户的复杂需求拆解为多个可并行执行的子任务
   - 支持子任务依赖关系定义，明确执行顺序
   - 支持手动调整拆解结果，用户可以修改、新增、删除子任务
   - 支持拆解过程可解释，展示每个子任务的拆解依据和目标

2. **智能任务分配**
   - 支持根据子任务的类型、复杂度、技能要求，自动匹配最合适的Worker
   - 支持考虑Worker的当前负载、能力标签、历史执行表现进行分配
   - 支持手动分配任务给指定Worker
   - 支持任务重分配，Worker执行失败后可以自动转派给其他Worker

3. **任务生命周期管理**
   - 完整的任务状态机：待分配→已分配→执行中→已完成→已失败→已取消
   - 支持任务暂停、继续、取消、重试操作
   - 支持任务执行进度实时上报、进度条展示
   - 支持任务执行日志、中间结果的保存和查看

4. **上下文智能同步**
   - 支持自动提取子任务相关的上下文片段，只同步必要的内容，减少冗余
   - 支持上下文增量更新，只同步变化的部分，降低传输开销
   - 支持上下文版本管理，确保所有Worker使用同一版本的上下文
   - 支持上下文定向分发，只将相关上下文同步给对应任务的执行者

5. **执行结果自动汇总**
   - 支持自动收集所有子任务的执行结果，按照逻辑整合为完整的最终结果
   - 支持结果校验，自动检查结果是否符合要求，缺失或错误的部分自动重新执行
   - 支持多轮迭代，结果不符合要求时自动触发新一轮的任务拆解和分配
   - 支持结果结构化展示，按照任务层级展示每个子任务的结果和过程

6. **异常处理机制**
   - 支持任务超时自动取消，超过配置的执行时间自动终止
   - 支持失败自动重试，任务执行失败后自动重试最多3次
   - 支持Worker异常自动重分配，Worker离线时自动将任务转派给其他可用Worker
   - 支持依赖失败处理，前置任务失败时自动取消关联的后续任务

### 3.2 非功能需求
1. 需求拆解延迟<3秒，任务分配延迟<100毫秒
2. 任务状态更新延迟<1秒，用户可以实时看到任务执行进度
3. 上下文同步效率提升≥60%（相比全量同步）
4. 支持同时处理≥10个并行群组，每个群组≥10个并行任务
5. 任务执行成功率≥99%，异常自动恢复率≥95%

## 4. 模型设计
### 4.1 任务模型扩展
```typescript
interface GroupTask {
  taskId: string;                # 任务唯一ID
  parentTaskId?: string;         # 父任务ID（拆解的子任务）
  groupId: string;               # 所属群组ID
  title: string;                 # 任务标题
  description: string;           # 任务详细描述
  requirements: string[];        # 任务要求
  skillTags: string[];           # 需要的技能标签（用于匹配Worker）
  priority: 'low' | 'medium' | 'high' | 'urgent';  # 优先级
  estimatedDurationMin: number;  # 预估执行时长（分钟）
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';  # 状态
  assignee?: string;             # 执行者成员ID
  dependencies: string[];        # 依赖的前置任务ID列表
  contextVersion: string;        # 关联的上下文版本号
  progress: number;              # 执行进度（0-100）
  result?: TaskResult;           # 执行结果
  error?: string;                # 错误信息
  logs: TaskLogEntry[];          # 执行日志
  createdAt: number;             # 创建时间
  assignedAt?: number;           # 分配时间
  startedAt?: number;            # 开始执行时间
  completedAt?: number;          # 完成时间
  retryCount: number;            # 重试次数
  maxRetryCount: number;         # 最大重试次数
  timeoutSeconds: number;        # 超时时间（秒）
}
```

### 4.2 任务结果模型
```typescript
interface TaskResult {
  summary: string;               # 结果摘要
  content: any;                  # 详细内容（结构化/非结构化）
  attachments: TaskAttachment[]; # 附件列表（生成的文件、代码等）
  metrics: TaskMetrics;          # 执行指标（耗时、Token使用量等）
  qualityScore?: number;         # 结果质量评分（0-100）
  feedback?: string;             # 结果反馈信息（失败原因、改进建议等）
}
```

### 4.3 拆解策略配置
```typescript
interface TaskSplittingConfig {
  maxSubtasks: number;           # 最大子任务数量（默认5）
  minSubtaskComplexity: number;  # 最小子任务复杂度（避免拆解过细）
  allowParallelExecution: boolean; # 是否允许并行执行
  dependencySupport: boolean;    # 是否支持依赖关系
  customPrompt?: string;         # 自定义拆解提示词
}
```

### 4.4 分配策略配置
```typescript
interface TaskAssignmentConfig {
  strategy: 'auto' | 'manual' | 'load-balance' | 'skill-match';  # 分配策略
  considerLoad: boolean;         # 是否考虑Worker负载
  considerSkill: boolean;        # 是否考虑技能匹配
  considerHistoryPerformance: boolean; # 是否考虑历史表现
  maxAssignmentsPerWorker: number; # 每个Worker最多同时分配的任务数
}
```

## 5. 核心机制
### 5.1 智能需求拆解流程
1. 用户发送需求到群组，主管接收需求
2. 主管分析需求复杂度，判断是否需要拆解：简单需求直接执行，复杂需求进入拆解流程
3. 调用大语言模型拆解任务，根据配置的拆解策略生成子任务列表、依赖关系、技能要求
4. 系统校验拆解结果：检查是否有遗漏的依赖，子任务是否完整覆盖原始需求
5. 可选：展示拆解结果给用户确认，用户可以调整后再进入分配阶段
6. 生成最终的子任务列表，保存到数据库

### 5.2 智能任务分配流程
1. 遍历所有待分配的子任务，检查前置依赖是否已完成
2. 对于可分配的任务，根据分配策略筛选合适的Worker：
   - 技能匹配：Worker的能力标签包含任务需要的技能
   - 负载情况：Worker当前正在执行的任务数未超过上限
   - 历史表现：优先分配给同类任务成功率高、执行速度快的Worker
3. 选择最优的Worker，将任务分配给它
4. 同步任务专属的上下文给目标Worker
5. 更新任务状态为`assigned`，触发任务开始事件
6. 记录分配日志，包含分配依据和选择的Worker

### 5.3 任务执行跟踪流程
1. Worker接收任务和上下文，开始执行，更新任务状态为`running`
2. Worker实时上报执行进度和日志，系统更新任务的progress字段和logs列表
3. 系统监控任务执行时间，超过超时时间自动终止任务，标记为`failed`
4. 执行过程中如果Worker异常离线，系统自动将任务重新分配给其他可用Worker
5. 执行完成后，Worker上报执行结果，系统更新任务状态为`completed`或`failed`
6. 检查所有依赖该任务的后续任务，如果依赖全部完成则自动分配后续任务

### 5.4 上下文同步策略
1. **上下文片段提取**：根据任务的内容，自动从全局上下文中提取相关的片段，只同步必要的内容
2. **增量更新**：上下文发生变化时，对比版本差异，只同步变化的部分，使用diff算法减少传输量
3. **版本管理**：每个上下文都有唯一的版本号，任务关联固定版本的上下文，避免执行过程中上下文变化导致不一致
4. **按需同步**：只有当Worker的本地上下文版本低于任务需要的版本时，才同步更新

### 5.5 结果汇总流程
1. 所有子任务执行完成后，触发结果汇总流程
2. 主管收集所有子任务的执行结果，按照逻辑顺序和依赖关系整合
3. 校验汇总结果是否满足原始需求的所有要求，缺失或错误的部分自动生成补全任务
4. 需要多轮迭代的，自动触发新一轮的任务拆解和分配
5. 所有环节完成后，将最终结果返回给用户，展示完整的执行过程和每个子任务的详情

### 5.6 异常处理机制
| 异常场景 | 处理策略 |
|----------|----------|
| 任务执行失败 | 自动重试最多3次，重试失败转派给其他Worker |
| Worker离线 | 自动回收其所有未完成任务，重新分配给其他可用Worker |
| 任务超时 | 自动终止任务，标记为失败，重试或转派 |
| 前置任务失败 | 自动取消所有依赖该任务的后续任务，通知用户 |
| 上下文版本冲突 | 暂停任务执行，同步最新版本上下文后重试 |
| 结果质量不达标 | 自动生成修正任务，重新执行 |

## 6. API接口定义
```typescript
/**
 * 拆解用户需求为子任务
 * @param groupId 群组ID
 * @param userRequest 用户需求内容
 * @param config? 拆解策略配置
 * @returns GroupTask[] 拆解后的子任务列表
 */
async function splitTask(groupId: string, userRequest: string, config?: Partial<TaskSplittingConfig>): Promise<GroupTask[]>;

/**
 * 分配任务给Worker
 * @param groupId 群组ID
 * @param taskId 任务ID
 * @param memberId? 指定分配的成员ID（手动分配时传）
 * @param config? 分配策略配置
 * @returns boolean 是否分配成功
 */
async function assignTask(groupId: string, taskId: string, memberId?: string, config?: Partial<TaskAssignmentConfig>): Promise<boolean>;

/**
 * 批量分配任务
 * @param groupId 群组ID
 * @param taskIds 任务ID列表
 * @param config? 分配策略配置
 * @returns AssignmentResult[] 分配结果列表
 */
async function batchAssignTasks(groupId: string, taskIds: string[], config?: Partial<TaskAssignmentConfig>): Promise<AssignmentResult[]>;

/**
 * 更新任务执行进度
 * @param taskId 任务ID
 * @param progress 进度（0-100）
 * @param log? 进度日志内容
 * @returns boolean 是否更新成功
 */
async function updateTaskProgress(taskId: string, progress: number, log?: string): Promise<boolean>;

/**
 * 上报任务执行结果
 * @param taskId 任务ID
 * @param result 执行结果
 * @param success 是否成功
 * @returns boolean 是否上报成功
 */
async function reportTaskResult(taskId: string, result: TaskResult, success: boolean): Promise<boolean>;

/**
 * 取消任务
 * @param taskId 任务ID
 * @param reason? 取消原因
 * @param cancelDependencies? 是否同时取消依赖该任务的后续任务
 * @returns boolean 是否取消成功
 */
async function cancelTask(taskId: string, reason?: string, cancelDependencies?: boolean): Promise<boolean>;

/**
 * 重试失败的任务
 * @param taskId 任务ID
 * @param reassign? 是否重新分配Worker（默认false，使用原执行者）
 * @returns boolean 是否重试成功
 */
async function retryTask(taskId: string, reassign?: boolean): Promise<boolean>;

/**
 * 获取任务执行详情
 * @param taskId 任务ID
 * @returns GroupTask 任务完整信息
 */
async function getTaskDetail(taskId: string): Promise<GroupTask>;

/**
 * 获取群组所有任务列表
 * @param groupId 群组ID
 * @param filter? 过滤条件（状态、优先级等）
 * @returns GroupTask[] 任务列表
 */
async function getGroupTaskList(groupId: string, filter?: TaskFilter): Promise<GroupTask[]>;

/**
 * 汇总子任务结果生成最终结果
 * @param groupId 群组ID
 * @param parentTaskId 父任务ID
 * @returns TaskResult 汇总后的最终结果
 */
async function aggregateTaskResults(groupId: string, parentTaskId: string): Promise<TaskResult>;
```

## 7. 可配置策略
### 7.1 拆解策略扩展
- 支持自定义拆解Prompt，适配不同类型的任务场景
- 支持自定义拆解规则，比如按功能模块、按技术栈、按执行顺序等
- 支持配置是否需要用户确认拆解结果，默认复杂需求需要确认，简单需求自动执行

### 7.2 分配策略扩展
- 支持自定义分配算法插件，实现业务相关的智能分配逻辑
- 支持配置Worker的技能标签、权重、优先级，影响分配结果
- 支持配置不同任务类型的分配偏好，比如编码任务优先分配给擅长编码的Worker

### 7.3 异常策略扩展
- 支持自定义异常处理规则，不同类型的任务配置不同的重试次数、超时时间
- 支持自定义失败降级策略，比如重要任务失败自动升级处理，普通任务失败直接通知用户
- 支持自定义告警规则，任务失败次数超过阈值自动通知管理员

## 8. 验收标准
1. 可以自动将复杂需求拆解为合理的子任务列表，准确率≥90%
2. 可以根据任务技能要求和Worker负载，智能分配给最合适的Worker
3. 多个任务可以并行执行，状态实时更新，延迟<1秒
4. 上下文增量同步功能正常，比全量同步减少≥60%的传输量
5. 任务执行失败后自动重试/转派，异常恢复成功率≥95%
6. 所有子任务完成后可以自动汇总为完整的最终结果，符合用户需求
7. 支持同时运行10个群组，每个群组10个并行任务，系统稳定无卡顿
