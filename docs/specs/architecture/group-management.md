# 群组管理子系统 SDD 规范

## 1. 概述
群组管理子系统是多代理协作平台的核心模块，基于多代理并行连接能力，实现AI团队协作模式。支持创建包含主管+多个Worker的协作群组，实现任务自动分配、上下文同步、并行工作、结果汇总的完整协同工作流。

## 2. 依赖关系
| 依赖模块 | 依赖能力 |
|----------|----------|
| 多代理连接模块 | 同时连接多个ACP代理的能力，每个代理独立会话 |
| 代理调度模块 | 代理进程生命周期管理、消息发送接收能力 |
| 消息路由模块 | 多端消息同步、群聊消息分发能力 |

## 3. 需求说明
### 3.1 核心功能需求
1. **群组管理**
   - 支持创建、删除、修改群组配置
   - 每个群组包含1个主管角色 + N个Worker角色（N≥1，上限可配置，默认10）
   - 支持添加、移除群组成员，修改成员角色
   - 群组配置持久化保存，重启后自动恢复

2. **角色权限体系**
   - **主管角色**：拥有群组最高权限，可以分配任务、同步上下文、汇总结果、管理成员
   - **Worker角色**：接受主管分配的任务，执行任务并返回结果，只能访问分配给自己的上下文
   - **用户角色**：群组创建者，可以查看所有消息、管理群组配置、干预任务分配

3. **任务分配机制**
   - 主管可以自动拆解用户需求为多个子任务，分配给合适的Worker并行执行
   - 支持手动分配任务给指定Worker
   - 支持任务优先级、截止时间配置
   - 支持任务状态跟踪（待分配、执行中、已完成、失败）

4. **上下文同步策略**
   - 主管可以将公共上下文同步给所有Worker
   - 支持给指定Worker同步私有上下文
   - 上下文支持增量更新，避免重复传输
   - 每个Worker的上下文独立，互不影响

5. **消息路由规则**
   - 所有成员的消息统一展示在群聊界面，标注发送者角色和名称
   - 主管和Worker之间的内部通信消息可选是否展示给用户
   - 支持@指定成员的消息机制
   - 消息顺序按照时间戳排序，支持多端同步

### 3.2 非功能需求
1. 群组最大支持1个主管 + 10个Worker同时在线
2. 任务分配延迟<100ms，上下文同步延迟<500ms
3. 单个Worker失败不影响整个群组和其他Worker的正常运行
4. 群组状态持久化，服务重启后可以恢复所有群组的运行状态
5. 支持多个独立群组同时运行，互不影响

## 4. 模型设计
### 4.1 群组模型
```
Group
├── groupId: string              # 群组唯一ID
├── groupName: string            # 群组名称
├── description: string          # 群组描述
├── status: 'idle' | 'running' | 'paused' | 'error'  # 群组状态
├── owner: string                # 创建者ID（用户）
├── members: GroupMember[]       # 成员列表
├── tasks: GroupTask[]           # 任务列表
├── context: GroupContext        # 群组公共上下文
├── createdAt: number            # 创建时间
├── updatedAt: number            # 最后更新时间
└── config: GroupConfig          # 群组配置
```

### 4.2 成员模型
```typescript
interface GroupMember {
  memberId: string;              # 成员唯一ID
  agentName: string;             # 关联的ACP代理名称
  role: 'owner' | 'supervisor' | 'worker';  # 角色
  status: 'online' | 'offline' | 'busy';   # 状态
  sessionId: string;             # 关联的会话ID
  currentTaskId?: string;        # 当前执行的任务ID
  permissions: string[];         # 权限列表
  joinedAt: number;              # 加入时间
}
```

### 4.3 任务模型
```typescript
interface GroupTask {
  taskId: string;                # 任务唯一ID
  title: string;                 # 任务标题
  description: string;           # 任务描述
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed';  # 状态
  assignee?: string;             # 执行者成员ID
  parentTaskId?: string;         # 父任务ID（拆解的子任务）
  priority: 'low' | 'medium' | 'high' | 'urgent';  # 优先级
  context: TaskContext;          # 任务专属上下文
  result?: any;                  # 执行结果
  error?: string;                # 错误信息
  createdAt: number;             # 创建时间
  startedAt?: number;            # 开始时间
  completedAt?: number;          # 完成时间
}
```

### 4.4 权限定义
| 权限 | 主管 | Worker | 用户 |
|------|------|--------|------|
| 创建/删除群组 | ❌ | ❌ | ✅ |
| 添加/移除成员 | ✅ | ❌ | ✅ |
| 分配任务 | ✅ | ❌ | ✅ |
| 同步上下文 | ✅ | ❌ | ✅ |
| 执行任务 | ✅ | ✅ | ❌ |
| 查看所有消息 | ✅ | 仅自己相关 | ✅ |
| 修改群组配置 | ✅ | ❌ | ✅ |

## 5. 核心机制
### 5.1 任务分配流程
1. 用户发送需求到群组
2. 主管接收需求，分析拆解为N个子任务
3. 主管根据每个Worker的能力、负载情况，分配子任务给对应Worker
4. 主管将子任务和对应的上下文同步给目标Worker
5. Worker并行执行任务，实时上报状态和进度
6. 主管收集所有Worker的执行结果，汇总整理后返回给用户

### 5.2 上下文同步策略
1. **全量同步**：首次加入群组或上下文发生重大变化时，发送完整的上下文内容
2. **增量同步**：上下文更新时，只发送变化的部分，减少传输量
3. **定向同步**：支持将上下文同步给指定成员，而不是所有成员
4. **版本管理**：上下文使用版本号，避免重复同步相同内容

### 5.3 消息路由规则
1. **公开消息**：所有成员可见，展示在群聊界面，包括用户消息、主管通知、Worker执行结果
2. **内部消息**：主管和Worker之间的通信消息，可选是否对用户可见，默认隐藏
3. **私信消息**：成员之间的一对一消息，只有发送者和接收者可见
4. 所有消息都携带发送者ID、角色、时间戳，按时间顺序排序

## 6. API接口定义
```typescript
/**
 * 创建新群组
 * @param config 群组配置
 * @returns groupId 群组ID
 */
async function createGroup(config: CreateGroupConfig): Promise<string>;

/**
 * 删除群组
 * @param groupId 群组ID
 * @returns boolean 是否成功
 */
async function deleteGroup(groupId: string): Promise<boolean>;

/**
 * 添加群组成员
 * @param groupId 群组ID
 * @param member 成员信息
 * @returns memberId 成员ID
 */
async function addGroupMember(groupId: string, member: AddGroupMemberConfig): Promise<string>;

/**
 * 移除群组成员
 * @param groupId 群组ID
 * @param memberId 成员ID
 * @returns boolean 是否成功
 */
async function removeGroupMember(groupId: string, memberId: string): Promise<boolean>;

/**
 * 分配任务
 * @param groupId 群组ID
 * @param task 任务信息
 * @returns taskId 任务ID
 */
async function assignTask(groupId: string, task: AssignTaskConfig): Promise<string>;

/**
 * 同步上下文到群组成员
 * @param groupId 群组ID
 * @param context 上下文内容
 * @param targetMemberIds? 目标成员ID列表，不传则同步给所有成员
 * @returns boolean 是否成功
 */
async function syncContext(groupId: string, context: any, targetMemberIds?: string[]): Promise<boolean>;

/**
 * 获取群组信息
 * @param groupId 群组ID
 * @returns GroupInfo 群组详细信息
 */
async function getGroupInfo(groupId: string): Promise<GroupInfo>;

/**
 * 获取群组所有任务列表
 * @param groupId 群组ID
 * @returns GroupTask[] 任务列表
 */
async function getGroupTasks(groupId: string): Promise<GroupTask[]>;

/**
 * 发送消息到群组
 * @param groupId 群组ID
 * @param message 消息内容
 * @param senderId 发送者ID
 * @returns messageId 消息ID
 */
async function sendGroupMessage(groupId: string, message: any, senderId: string): Promise<string>;
```

## 7. 生命周期管理
### 7.1 群组创建流程
1. 用户调用`createGroup`接口，传入群组名称、描述、配置
2. 初始化群组对象，生成唯一groupId
3. 按照配置添加主管和Worker成员，连接对应的ACP代理
4. 同步群组初始上下文给所有成员
5. 触发`group-created`事件，返回groupId
6. 群组状态设置为`running`，开始接收任务

### 7.2 群组销毁流程
1. 调用`deleteGroup`接口
2. 断开所有成员的代理连接，清理会话资源
3. 删除群组相关的所有持久化数据
4. 触发`group-deleted`事件
5. 返回销毁结果

## 8. 扩展性设计
1. 支持自定义角色和权限配置，满足不同协作模式需求
2. 支持插件化的任务分配策略，可以替换不同的智能分配算法
3. 支持自定义上下文同步策略，适配不同类型的代理需求
4. 支持跨机器群组，后续可以扩展为分布式多代理协作

## 9. 验收标准
1. 可以创建包含1个主管 + 3个Worker的群组，所有成员成功连接
2. 用户发送需求，主管可以正确拆解为子任务，分配给不同的Worker并行执行
3. 所有Worker的执行结果和消息正确展示在群聊界面，上下文不串扰
4. 移除/添加成员功能正常，不影响其他成员运行
5. 服务重启后，所有群组配置和状态可以正确恢复
6. 支持同时运行多个独立群组，互不影响
