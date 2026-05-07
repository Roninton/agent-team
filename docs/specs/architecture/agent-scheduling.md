# 代理调度子系统 SDD 规范

## 1. 概述
代理调度子系统是平台的核心底层模块，负责所有ACP代理进程的全生命周期管理、资源隔离、负载均衡、异常自动恢复、代理池管理，为上层多代理连接、群组管理、任务执行提供稳定可靠的代理运行基础，确保单个代理故障不影响全局，资源使用可控。

## 2. 依赖关系
| 依赖模块 | 依赖能力 |
|----------|----------|
| Node.js 子进程 API | 进程创建、销毁、信号监听、标准IO管理 |
| 系统资源监控 API | CPU、内存、磁盘IO使用率统计 |
| ACP 协议 SDK | 代理连接握手、心跳检测、协议通信 |

## 3. 需求说明
### 3.1 核心功能需求
1. **进程生命周期管理**
   - 支持代理进程的创建、启动、停止、重启、销毁全生命周期管理
   - 支持自定义代理启动参数、环境变量、工作目录
   - 支持代理进程的标准输出/错误捕获、日志存储
   - 支持进程状态实时查询（运行中、启动中、停止、异常退出）

2. **资源隔离与限制**
   - 支持每个代理进程的CPU使用率限制（默认单核心100%）
   - 支持每个代理进程的内存使用限制（默认512MB）
   - 支持文件系统访问限制（默认只能访问工作目录和指定的安全目录）
   - 支持网络访问限制（默认允许所有出站访问，可配置白名单）
   - 支持进程数量上限限制（默认单实例最多运行20个代理进程）

3. **异常检测与自动恢复**
   - 支持进程心跳检测：代理超过30秒无响应判定为异常
   - 支持崩溃自动恢复：代理进程异常退出后自动重启，最多重试3次
   - 支持资源过载保护：代理CPU/内存使用率超过阈值90%持续1分钟自动重启
   - 支持异常告警：代理多次重启失败后触发告警通知
   - 异常恢复不影响其他代理进程的正常运行

4. **代理池管理**
   - 支持创建多个代理池，每个池包含多个同类型的代理实例
   - 支持代理池的预热、预启动，减少请求时的启动延迟
   - 支持代理池的最小/最大实例数配置，动态扩缩容
   - 支持代理池的闲置回收：代理闲置超过10分钟自动销毁，节省资源

5. **负载均衡**
   - 支持多种负载均衡策略：轮询、最少连接数、最低CPU/内存使用率、随机
   - 支持按代理类型、能力标签调度，将任务分配给最合适的代理
   - 支持故障节点自动剔除，异常代理不会被分配新的任务
   - 支持权重配置，性能更好的代理可以分配更多任务

6. **监控与统计**
   - 收集每个代理的运行时长、CPU/内存使用率、请求量、错误率等指标
   - 统计代理池的整体负载、闲置率、请求成功率
   - 支持指标导出，对接外部监控系统
   - 支持慢请求、异常请求的日志记录

### 3.2 非功能需求
1. 进程启动延迟<2秒，重启延迟<1秒
2. 资源隔离准确率100%，代理进程无法超出配置的资源限制
3. 异常检测响应时间<5秒，自动恢复成功率>99%
4. 调度延迟<10ms，支持每秒处理>1000次调度请求
5. 单个代理崩溃不会影响其他代理和主进程的稳定性

## 4. 模型设计
### 4.1 代理实例模型
```typescript
interface AgentInstance {
  agentId: string;              # 代理实例唯一ID
  agentName: string;            # 代理类型名称（对应ACP配置中的name）
  poolId?: string;              # 所属代理池ID（独立运行的代理无poolId）
  status: 'pending' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';  # 运行状态
  processId: number;            # 系统进程ID
  config: AgentConfig;          # 代理配置（命令、参数、环境变量）
  resourceLimit: ResourceLimit; # 资源限制配置
  metrics: AgentMetrics;        # 实时运行指标
  createdAt: number;            # 创建时间
  startedAt?: number;           # 启动时间
  stoppedAt?: number;           # 停止时间
  lastHeartbeatAt: number;      # 最后心跳时间
  restartCount: number;         # 重启次数
  errorMessage?: string;        # 错误信息（异常状态下）
}
```

### 4.2 代理池模型
```typescript
interface AgentPool {
  poolId: string;               # 代理池唯一ID
  poolName: string;             # 代理池名称
  agentName: string;            # 池内代理类型
  minInstances: number;         # 最小实例数（预热保持）
  maxInstances: number;         # 最大实例数（上限）
  currentInstances: number;     # 当前运行实例数
  loadBalanceStrategy: 'round-robin' | 'least-connections' | 'lowest-load' | 'random';  # 负载均衡策略
  autoScaling: boolean;         # 是否开启自动扩缩容
  idleTimeout: number;          # 闲置回收超时时间（秒）
  config: AgentConfig;          # 池内代理统一配置
  resourceLimit: ResourceLimit; # 池内代理统一资源限制
  instances: string[];          # 池内代理实例ID列表
  status: 'active' | 'disabled'; # 代理池状态
  createdAt: number;            # 创建时间
}
```

### 4.3 资源限制模型
```typescript
interface ResourceLimit {
  cpuLimit: number;             # CPU使用率上限（百分比，默认100）
  memoryLimitMB: number;        # 内存使用上限（MB，默认512）
  diskIOLimitMBps: number;      # 磁盘IO上限（MB/s，默认无限制）
  fileAccessWhitelist: string[];# 允许访问的文件路径白名单
  networkAccessWhitelist: string[]; # 允许访问的网络地址白名单
  maxProcessCount: number;      # 最大进程数（默认1，禁止代理创建子进程）
}
```

### 4.4 运行指标模型
```typescript
interface AgentMetrics {
  cpuUsagePercent: number;      # 当前CPU使用率
  memoryUsageMB: number;        # 当前内存使用量
  memoryUsagePercent: number;   # 内存使用率
  uptimeSeconds: number;        # 运行时长（秒）
  requestCount: number;         # 处理请求总数
  successRequestCount: number;  # 成功请求数
  errorRequestCount: number;    # 错误请求数
  averageResponseTimeMs: number;# 平均响应时间
  currentTaskCount: number;     # 当前正在处理的任务数
}
```

### 4.5 代理配置文件模型
```typescript
interface AgentConfigFile {
  agentId: string;              # 代理ID
  agentMdPath: string;          # agent.md初始化文件路径
  instructionMdPath: string;    # 专属instruction.md文件路径（可选）
  config: Record<string, any>;  # 其他配置项
  createdAt: number;            # 创建时间
  updatedAt: number;            # 更新时间
}
```

## 5. 核心机制
### 5.1 进程生命周期管理
#### 启动流程
1. 调用`spawnAgent`接口，传入代理配置和资源限制
2. 检查系统资源是否足够，是否超过总进程数限制
3. 创建子进程，设置资源限制（cgroups/Windows Job Object实现）
4. 捕获进程的标准输出/错误流，写入日志
5. 等待代理启动完成，完成ACP握手和认证
6. 启动心跳检测定时器，定期检查代理状态
7. 更新代理实例状态为`running`，返回agentId

#### 停止流程
1. 调用`killAgent`接口，传入agentId
2. 向代理进程发送SIGTERM信号，等待优雅退出（最长5秒）
3. 超时未退出则发送SIGKILL信号强制杀死进程
4. 清理进程相关的所有资源（句柄、临时文件等）
5. 更新代理实例状态为`stopped`
6. 触发`agent-stopped`事件

### 5.2 异常检测与恢复机制
#### 异常检测方式
1. **进程状态检测**：定期检查进程是否存在，是否异常退出
2. **心跳检测**：每10秒向代理发送ACP心跳请求，30秒无响应判定为异常
3. **资源过载检测**：每5秒检查代理的CPU/内存使用率，超过阈值90%持续1分钟判定为过载
4. **错误率检测**：代理请求错误率连续1分钟超过30%判定为异常

#### 自动恢复流程
1. 检测到代理异常后，更新状态为`error`，记录错误信息
2. 检查重启次数，如果小于3次则自动触发重启流程
3. 停止异常进程，重新启动新的代理进程
4. 重启成功后恢复服务，原有未完成的任务自动重试
5. 重启3次仍然失败则标记为永久故障，触发告警通知，不再自动重启
6. 属于代理池的实例，自动从负载均衡池中剔除，创建新的实例替换

### 5.3 负载均衡策略
| 策略 | 适用场景 | 实现逻辑 |
|------|----------|----------|
| 轮询（round-robin） | 代理性能均衡，任务复杂度相近 | 按顺序依次分配给每个代理，循环往复 |
| 最少连接数（least-connections） | 任务执行时间差异较大 | 优先分配给当前处理任务数最少的代理 |
| 最低负载（lowest-load） | 对性能敏感，资源占用差异大 | 优先分配给CPU+内存使用率最低的代理 |
| 随机（random） | 测试场景、简单负载均衡 | 随机选择可用代理分配 |

### 5.4 代理池自动扩缩容机制
1. **扩容触发条件**：代理池平均负载>70%持续5分钟，且当前实例数<maxInstances
2. **缩容触发条件**：代理池平均负载<30%持续10分钟，且当前实例数>minInstances
3. **扩容步长**：每次扩容增加1~2个实例，避免突增
4. **缩容步长**：每次缩容减少1个实例，优先回收闲置时间最长的实例
5. **冷却时间**：两次扩缩容操作之间至少间隔2分钟，避免频繁波动

## 6. API接口定义
```typescript
/**
 * 启动一个新的代理进程
 * @param config 代理配置
 * @param resourceLimit? 资源限制（默认使用全局配置）
 * @returns agentId 代理实例ID
 */
async function spawnAgent(config: AgentConfig, resourceLimit?: Partial<ResourceLimit>): Promise<string>;

/**
 * 停止指定代理进程
 * @param agentId 代理实例ID
 * @param force? 是否强制停止（默认false，优雅停止）
 * @returns boolean 是否成功
 */
async function killAgent(agentId: string, force?: boolean): Promise<boolean>;

/**
 * 重启代理进程
 * @param agentId 代理实例ID
 * @returns boolean 是否成功
 */
async function restartAgent(agentId: string): Promise<boolean>;

/**
 * Agent发送消息到聊天框的专用工具接口
 * @param agentId 发送消息的Agent实例ID
 * @param message 消息内容
 * @param options 消息选项（@提及列表、附件、优先级等）
 * @returns messageId 发送成功的消息ID
 * @description 所有Agent发送消息必须调用此接口，禁止直接发送原始消息
 */
async function sendAgentMessage(
  agentId: string,
  message: {
    type: 'text' | 'markdown' | 'code' | 'file' | 'task_card';
    content: any;
  },
  options?: {
    mentions: string[];
    attachments: Array<{type: string; path: string; content?: any}>;
    priority: 'low' | 'normal' | 'high';
    replyToMessageId?: string;
  }
): Promise<string>;

/**
 * 获取代理实例状态信息
 * @param agentId 代理实例ID
 * @returns AgentInstance 代理详细信息
 */
async function getAgentStatus(agentId: string): Promise<AgentInstance>;

/**
 * 获取所有代理实例列表
 * @param filter? 过滤条件（状态、代理类型等）
 * @returns AgentInstance[] 代理列表
 */
async function getAgentList(filter?: AgentFilter): Promise<AgentInstance[]>;

/**
 * 创建代理池
 * @param config 代理池配置
 * @returns poolId 代理池ID
 */
async function createAgentPool(config: CreateAgentPoolConfig): Promise<string>;

/**
 * 销毁代理池
 * @param poolId 代理池ID
 * @param force? 是否强制销毁（默认false，等待所有任务完成）
 * @returns boolean 是否成功
 */
async function destroyAgentPool(poolId: string, force?: boolean): Promise<boolean>;

/**
 * 从代理池获取一个可用代理实例
 * @param poolId 代理池ID
 * @param strategy? 负载均衡策略（默认使用代理池配置的策略）
 * @returns AgentInstance 可用代理实例
 */
async function getAvailableAgentFromPool(poolId: string, strategy?: LoadBalanceStrategy): Promise<AgentInstance>;

/**
 * 归还代理实例到代理池
 * @param poolId 代理池ID
 * @param agentId 代理实例ID
 * @param taskSuccess? 任务是否执行成功（用于统计指标）
 */
async function returnAgentToPool(poolId: string, agentId: string, taskSuccess?: boolean): Promise<void>;

/**
 * 获取代理调度系统整体统计信息
 * @returns SchedulingStats 统计信息
 */
async function getSchedulingStats(): Promise<SchedulingStats>;
```

## 7. 资源隔离实现方案
| 操作系统 | 资源隔离实现方式 |
|----------|------------------|
| Linux | 使用cgroups v2实现CPU、内存、IO限制，使用seccomp实现系统调用限制，使用mount namespace实现文件系统隔离 |
| macOS | 使用launchd资源限制、sandbox沙箱机制实现隔离 |
| Windows | 使用Job Object实现CPU、内存、IO限制，使用Windows Sandbox实现更强隔离 |

## 8. 扩展性设计
1. 支持自定义负载均衡策略插件，可扩展实现复杂的调度算法
2. 支持自定义资源隔离插件，适配不同的容器化、虚拟化部署环境
3. 支持自定义异常检测和恢复策略，满足不同代理的特殊需求
4. 支持分布式部署，后续可扩展为跨机器的代理调度集群
5. 支持对接Kubernetes等容器编排系统，实现大规模代理集群管理

## 9. 验收标准
1. 可以正常启动/停止/重启代理进程，状态更新正确，无僵尸进程
2. 资源限制生效：代理进程CPU/内存超过配置阈值后会被限制或重启
3. 异常恢复功能正常：代理进程被强制杀死后自动重启，最多重试3次
4. 代理池功能正常：可以创建代理池，自动扩缩容，负载均衡策略生效
5. 同时运行10个代理进程，单个代理崩溃不影响其他代理和主进程
6. 调度延迟<10ms，代理启动时间<2秒
