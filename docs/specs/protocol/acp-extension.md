# ACP 协议扩展定义 SDD 规范

## 1. 目的与范围
本文档定义基于官方ACP（AI Chat Protocol）协议的扩展字段和消息类型，支持群组协作、任务管理、上下文同步等平台特有功能。所有与ACP代理的通信都必须遵循本扩展规范。

## 2. 协议基础
- 基于官方ACP协议 v1.0 版本进行扩展
- 扩展字段全部使用`x-`前缀，避免与官方字段冲突
- 保持向后兼容，不修改官方原有字段的含义和用法
- 所有扩展消息类型都在官方`custom`类型下定义

## 3. 核心扩展字段
### 3.1 消息头扩展字段
```typescript
interface AcpMessageHeader {
  // 官方原有字段
  version: string; // 协议版本，默认"1.0"
  type: string; // 消息类型
  messageId: string; // 消息唯一ID
  timestamp: number; // 时间戳
  
  // 扩展字段
  'x-group-id'?: string; // 所属群组ID
  'x-task-id'?: string; // 关联任务ID
  'x-context-version'?: string; // 关联上下文版本号
  'x-sender-type'?: 'user' | 'agent' | 'system'; // 发送者类型
  'x-sender-role'?: 'owner' | 'admin' | 'member' | 'guest'; // 发送者角色
  'x-conversation-type'?: 'group' | 'private' | 'task'; // 会话类型
  'x-priority'?: 'low' | 'normal' | 'high' | 'urgent'; // 消息优先级
  'x-trace-id'?: string; // 链路追踪ID
}
```

### 3.2 元数据扩展字段
```typescript
interface AcpMessageMetadata {
  // 官方原有字段
  userId?: string; // 用户ID
  agentId?: string; // 代理ID
  sessionId?: string; // 会话ID
  
  // 扩展字段
  'x-group-info'?: GroupInfo; // 群组信息
  'x-task-info'?: TaskInfo; // 任务信息
  'x-context-info'?: ContextInfo; // 上下文信息
  'x-permissions'?: string[]; // 当前用户/代理的权限列表
  'x-capabilities'?: string[]; // 代理的能力标签列表
  'x-client-info'?: ClientInfo; // 客户端信息
}
```

#### 3.2.1 群组信息扩展
```typescript
interface GroupInfo {
  groupId: string; // 群组ID
  name: string; // 群组名称
  description: string; // 群组描述
  memberCount: number; // 成员数量
  members: GroupMember[]; // 成员列表
  createdAt: number; // 创建时间
  ownerId: string; // 群主ID
  config: GroupConfig; // 群组配置
}

interface GroupMember {
  memberId: string; // 成员ID
  type: 'user' | 'agent'; // 成员类型
  name: string; // 成员名称
  role: 'owner' | 'admin' | 'member' | 'guest'; // 角色
  capabilityTags: string[]; // 能力标签（代理）
  online: boolean; // 在线状态
}

interface GroupConfig {
  allowAgentInvite: boolean; // 允许代理邀请其他代理
  allowTaskAutoAssign: boolean; // 允许自动分配任务
  allowContextAutoSync: boolean; // 允许上下文自动同步
  maxMembers: number; // 最大成员数
  messageRetentionDays: number; // 消息保留天数
}
```

#### 3.2.2 任务信息扩展
```typescript
interface TaskInfo {
  taskId: string; // 任务ID
  parentTaskId?: string; // 父任务ID
  title: string; // 任务标题
  description: string; // 任务描述
  requirements: string[]; // 任务要求
  skillTags: string[]; // 需要的技能标签
  priority: 'low' | 'medium' | 'high' | 'urgent'; // 优先级
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled'; // 任务状态
  progress: number; // 进度 0-100
  assigneeId?: string; // 执行者ID
  dependencies: string[]; // 依赖任务ID列表
  createdAt: number; // 创建时间
  startedAt?: number; // 开始时间
  completedAt?: number; // 完成时间
  deadline?: number; // 截止时间
  estimatedDurationMin: number; // 预估时长（分钟）
}
```

#### 3.2.3 上下文信息扩展
```typescript
interface ContextInfo {
  contextId: string; // 上下文ID
  name: string; // 上下文名称
  type: 'text' | 'markdown' | 'file' | 'code' | 'structured'; // 类型
  version: string; // 版本号
  size: number; // 大小（字节）
  tags: string[]; // 标签列表
  updatedAt: number; // 最后更新时间
  updatedBy: string; // 最后更新者
  summary: string; // 内容摘要
  url?: string; // 下载地址（大文件）
}
```

### 3.3 内容扩展字段
```typescript
interface AcpMessageContent {
  // 官方原有字段
  text?: string; // 文本内容
  attachments?: AcpAttachment[]; // 附件列表
  
  // 扩展字段
  'x-message-type'?: MessageType; // 扩展消息类型
  'x-mentions'?: string[]; // @的成员ID列表
  'x-reply-to'?: string; // 回复的消息ID
  'x-reactions'?: MessageReaction[]; // 表情反应
  'x-task-command'?: TaskCommand; // 任务指令
  'x-context-command'?: ContextCommand; // 上下文指令
  'x-group-command'?: GroupCommand; // 群组指令
}
```

## 4. 扩展消息类型
在官方`custom`消息类型下，定义以下扩展子类型：

### 4.1 群组相关消息
| 消息类型 | 说明 | 用途 |
|----------|------|------|
| `group.join` | 加入群组通知 | 新成员加入群组时发送 |
| `group.leave` | 离开群组通知 | 成员离开群组时发送 |
| `group.update` | 群组信息更新通知 | 群组信息变更时发送 |
| `group.member.update` | 群成员信息更新通知 | 成员信息、角色变更时发送 |
| `group.notice` | 群公告通知 | 发布/更新群公告时发送 |

### 4.2 任务相关消息
| 消息类型 | 说明 | 用途 |
|----------|------|------|
| `task.create` | 任务创建通知 | 新任务创建时发送 |
| `task.assign` | 任务分配通知 | 任务分配给执行者时发送 |
| `task.update` | 任务状态更新通知 | 任务状态、进度变更时发送 |
| `task.result` | 任务执行结果通知 | 任务执行完成时发送 |
| `task.command` | 任务操作指令 | 执行任务相关操作（取消、重试、重新分配等） |

### 4.3 上下文相关消息
| 消息类型 | 说明 | 用途 |
|----------|------|------|
| `context.create` | 上下文创建通知 | 新上下文创建时发送 |
| `context.update` | 上下文更新通知 | 上下文内容、版本变更时发送 |
| `context.delete` | 上下文删除通知 | 上下文删除时发送 |
| `context.sync.request` | 上下文同步请求 | 请求同步指定上下文 |
| `context.sync.response` | 上下文同步响应 | 返回上下文内容 |
| `context.diff` | 上下文增量更新 | 发送上下文diff补丁 |

### 4.4 系统相关消息
| 消息类型 | 说明 | 用途 |
|----------|------|------|
| `system.notice` | 系统通知 | 系统级别的通知消息 |
| `system.error` | 错误通知 | 操作失败、系统错误时发送 |
| `system.heartbeat` | 心跳消息 | 保持连接活跃，检测在线状态 |
| `system.sync.request` | 同步请求 | 请求同步离线消息、状态等 |
| `system.sync.response` | 同步响应 | 返回同步数据 |

## 5. 扩展指令定义
### 5.1 任务指令
```typescript
interface TaskCommand {
  command: 'start' | 'pause' | 'resume' | 'cancel' | 'retry' | 'reassign' | 'submit_result'; // 指令类型
  taskId: string; // 目标任务ID
  params?: any; // 指令参数
  reason?: string; // 操作原因
}
```

### 5.2 上下文指令
```typescript
interface ContextCommand {
  command: 'pull' | 'push' | 'lock' | 'unlock' | 'rollback' | 'diff'; // 指令类型
  contextId: string; // 目标上下文ID
  version?: string; // 版本号
  params?: any; // 指令参数
}
```

### 5.3 群组指令
```typescript
interface GroupCommand {
  command: 'invite' | 'remove' | 'update_role' | 'update_config' | 'mute' | 'unmute'; // 指令类型
  groupId: string; // 目标群组ID
  memberId?: string; // 目标成员ID
  params?: any; // 指令参数
}
```

## 6. 通信流程扩展
### 6.1 群组会话建立流程
1. 用户创建群组，添加代理成员
2. 后端向每个代理发送`group.join`通知，携带群组信息和成员列表
3. 代理收到通知后，初始化群组会话上下文
4. 代理返回确认消息，加入群组成功
5. 群组成员列表更新，所有成员收到通知

### 6.2 任务分配执行流程
1. 系统创建任务，分配给指定代理
2. 向代理发送`task.assign`消息，携带任务信息和关联上下文
3. 代理收到任务后，返回确认消息，开始执行
4. 代理执行过程中定期发送`task.update`消息，上报进度和日志
5. 执行完成后，代理发送`task.result`消息，携带执行结果
6. 系统收到结果后，更新任务状态，通知所有相关成员

### 6.3 上下文同步流程
1. 上下文更新后，系统向相关代理发送`context.update`通知，携带新版本信息
2. 代理对比本地版本，如果不是最新，发送`context.sync.request`请求拉取更新
3. 系统返回`context.sync.response`，如果差异小则返回全量内容，如果差异大返回diff补丁
4. 代理应用更新，更新本地上下文版本
5. 代理返回确认消息，同步完成

## 7. 错误码扩展
在官方ACP错误码基础上，扩展以下平台特有错误码：
| 错误码 | 说明 |
|--------|------|
| 20000 | 群组不存在 |
| 20001 | 无群组访问权限 |
| 20002 | 群组人数已满 |
| 20003 | 非群成员 |
| 20100 | 任务不存在 |
| 20101 | 无任务操作权限 |
| 20102 | 任务状态不允许当前操作 |
| 20103 | 任务已被其他代理领取 |
| 20200 | 上下文不存在 |
| 20201 | 无上下文访问权限 |
| 20202 | 上下文版本冲突 |
| 20203 | 上下文内容过大 |
| 20300 | 权限不足 |
| 20301 | 操作被禁止 |
| 20302 | 参数错误 |

## 8. 扩展规范约束
1. 所有扩展字段必须以`x-`开头，命名采用小写字母加短横线分隔
2. 扩展消息类型必须符合`{模块}.{操作}`的命名规范
3. 扩展字段必须保持向后兼容，不得修改已有字段的含义
4. 复杂结构必须在本文档中明确定义，不得使用未定义的结构
5. 所有扩展功能必须提供降级方案，在代理不支持扩展时仍能正常工作
6. 官方协议已有功能不得重复定义，必须使用官方原有字段

## 9. 变更记录
- 2026-05-06 创建初始版本
