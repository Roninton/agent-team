# 任务ID: 20260507-007
## 任务名称：为6个NestJS模块的Service层补充完整单元测试（TDD）

## 任务概述
按照TDD开发流程，为6个NestJS模块的Service层编写完整的单元测试。当前只有AgentService有部分测试，其他5个Service完全没有测试。

## 上下文信息

### 相关规范文档索引
**Level 0 顶层规范：**
- `.copilot/instruction.md` - SDD→TDD流程规范

**Level 1 架构层规范：**
- `docs/specs/architecture/agent-scheduling.md` - 代理调度子系统设计
- `docs/specs/architecture/group-management.md` - 群组管理子系统设计
- `docs/specs/architecture/task-allocation.md` - 任务分配子系统设计
- `docs/specs/architecture/message-routing.md` - 消息路由子系统设计

**参考已实现的测试：**
- `src/server/src/modules/agent/__test__/agent.service.spec.ts` - AgentService测试示例

### 当前状态
- ✅ AgentService - 已有部分测试（startAgent、stopAgent）
- ❌ GroupService - 完全无测试
- ❌ SessionService - 完全无测试
- ❌ MessageService - 完全无测试
- ❌ TaskService - 完全无测试
- ❌ ContextService - 完全无测试

### TDD流程要求
测试先行，先写失败测试，再实现功能代码

## 执行计划

### 阶段一：AgentService 测试补全
当前已有测试只有 6 个用例，需要补充：
```typescript
// 待补充测试场景
- restartAgent 测试
  - 正常重启运行中的代理
  - 重启未运行的代理
  - 重启不存在的代理
- getAgentStatus 测试
  - 获取运行中代理状态
  - 获取已停止代理状态
  - 获取不存在代理状态
- findAll / findOne 测试
- create / remove 测试
- sendToAgent 测试
  - 正常发送消息
  - 发送给未运行的代理
  - 发送给不存在的代理
- 限流功能测试（rateLimit）
- 异常场景：进程崩溃、启动超时
```

### 阶段二：GroupService 测试
```typescript
// 核心测试场景
- createGroup
  - 正常创建群组
  - 创建同名群组（冲突）
  - 创建时带初始成员
  - 参数验证失败
- getAllGroups / getGroup
  - 获取所有群组
  - 获取存在的群组
  - 获取不存在的群组（404）
- updateGroup / deleteGroup
- addMember / removeMember
  - 添加成员到群组
  - 重复添加同一成员
  - 移除不存在的成员
  - 移除不存在群组的成员
- updateMemberRole
- sendGroupMessage
- getGroupMessages
- 群组状态流转测试
```

### 阶段三：SessionService 测试
```typescript
// 核心测试场景
- createSession
  - 为代理创建会话
  - 为不存在的代理创建会话
- getSession / getAllSessions
- deleteSession
- getSessionMessages
- sendSessionMessage
  - 正常发送
  - 会话不存在
- 会话生命周期管理
- 多代理并行会话隔离
```

### 阶段四：MessageService 测试
```typescript
// 核心测试场景
- createMessage
- getMessage / getMessages
- getMessagesBySession / getMessagesByGroup
- updateMessageStatus
- deleteMessage
- 消息持久化
- 消息分页查询
```

### 阶段五：TaskService 测试
```typescript
// 核心测试场景
- createTask
  - 正常创建任务
  - 创建子任务
- getTask / getAllTasks
- updateTask
- deleteTask
- assignTask
  - 分配给代理
  - 重新分配
- updateTaskStatus
  - 状态流转：pending → running → completed/failed
- getTasksByAssignee
- 任务优先级处理
```

### 阶段六：ContextService 测试
```typescript
// 核心测试场景
- getContext
  - 获取存在的会话上下文
  - 获取不存在的会话上下文
- updateContext
  - 完整更新上下文
  - 部分更新上下文
- mergeContext
  - 合并新上下文
  - 冲突处理
- clearContext
- 上下文大小限制
- 上下文持久化
```

### 测试编写规范
1. 每个方法至少 3 个测试用例：正常、异常、边界
2. 所有外部依赖必须 Mock（child_process、数据库等）
3. 使用 jest.mock() 进行模块级 Mock
4. 使用 jest.spyOn() 进行方法级 Mock
5. 每个测试用例必须有清晰的 Given-When-Then 结构
6. 必须验证方法调用的参数正确性

## 验收标准
1. ✅ 6个Service都有对应的 `*.service.spec.ts` 测试文件
2. ✅ 每个Service至少覆盖 80% 的公共方法
3. ✅ 每个公共方法至少 3 个测试用例（正常、异常、边界）
4. ✅ 所有外部依赖都已正确 Mock
5. ✅ 运行测试全部通过
6. ✅ Service层行覆盖率 ≥ 85%

## 相关文件路径
- 目标目录：`src/server/src/modules/*/__test__/`
- 参考示例：`src/server/src/modules/agent/__test__/agent.service.spec.ts`
- Service代码：`src/server/src/modules/*/*.service.ts`
- 架构规范：`docs/specs/architecture/`
