# SDD 文档分层索引总览
> 本文档是所有SDD规范的唯一入口索引，AI开发时必须先读取本文档获取上下文链路

## 索引层级结构
### Level 0：顶层规范（全局约束）
所有开发工作必须首先遵循此层规范
| 文档路径 | 说明 | 适用范围 |
|----------|------|----------|
| `.copilot/instruction.md` | AI开发元规则，开发流程、约束、上下文获取规则 | 所有开发场景 |
| `docs/DEVELOPMENT_GUIDELINE.md` | SDD开发规范总纲，开发流程、模式选择 | 所有开发场景 |
| `docs/specs/architecture/tech-stack-and-architecture.md` | 整体技术栈、三层架构、目录结构规范 | 所有模块开发 |

---

### Level 1：架构层规范（子系统级约束）
对应后端服务层各子系统设计
| 文档路径 | 说明 | 适用模块 |
|----------|------|----------|
| `docs/specs/architecture/group-management.md` | 群组管理子系统设计 | 群组相关功能 |
| `docs/specs/architecture/agent-scheduling.md` | 代理调度子系统设计 | 代理生命周期管理 |
| `docs/specs/architecture/task-allocation.md` | 任务分配子系统设计 | 任务派发、上下文同步 |
| `docs/specs/architecture/message-routing.md` | 消息路由子系统设计 | 多端消息同步、群聊消息 |
| `docs/specs/architecture/backend-architecture.md` | 后端服务整体架构设计 | 后端服务开发 |

---

### Level 2：功能层规范（功能模块级约束）
对应具体功能模块设计
| 文档路径 | 说明 | 适用功能 |
|----------|------|----------|
| `docs/specs/features/multi-agent-connection.md` | 多代理同时连接功能设计 | 会话管理、多代理并行 |
| `docs/specs/features/group-chat.md` | 群聊界面功能设计 | 前端聊天界面 |
| `docs/specs/features/context-sync.md` | 上下文同步功能设计 | 代理之间上下文共享 |

---

### Level 3：协议层规范（接口级约束）
对应API、协议、接口定义
| 文档路径 | 说明 | 适用场景 |
|----------|------|----------|
| `docs/specs/protocol/acp-extension.md` | ACP协议扩展定义 | 代理通信 |
| `docs/api/rest-api.md` | 后端REST API接口定义 | 前后端通信 |
| `docs/api/websocket-api.md` | WebSocket消息协议定义 | 实时消息 |

---

### Level 4：UI层规范（界面级约束）
对应前端界面设计规范
| 文档路径 | 说明 | 适用场景 |
|----------|------|----------|
| `docs/specs/ui/design-system.md` | 设计系统、组件规范 | 所有前端界面 |
| `docs/specs/ui/chat-interface.md` | 聊天界面设计规范 | 群聊界面 |
| `docs/specs/ui/pages-design-spec.md` | 前端页面设计规范、测试规范、代码规范 | 所有前端页面 |
| （待补充）`docs/specs/ui/group-management-ui.md` | 群组管理界面设计规范 | 群组配置界面 |

---

## 文档引用规则
1. 所有规范文档必须第一时间加入本索引，禁止存在未被索引的SDD文档
2. 文档之间引用必须使用相对路径，例如：`参考 [架构规范](../architecture/tech-stack-and-architecture.md) 中的目录要求`
3. 禁止内容冗余，相同的定义只能存在于最顶层的文档中，下层文档只能引用，不能重复定义
4. 文档更新时必须同步更新索引中的说明，确保索引和实际文档一致

## AI上下文获取顺序
开发任意功能时，必须按以下顺序获取上下文：
1. 首先读取本索引文档，找到对应功能所属的层级和相关文档列表
2. 读取Level 0的所有顶层规范，明确全局约束
3. 读取对应Level 1的架构层规范，明确子系统约束
4. 读取对应Level 2的功能层规范，明确功能需求
5. 读取对应Level 3/4的协议/UI层规范，明确接口/界面要求
6. 最后查看相关任务的需求说明，开始开发
