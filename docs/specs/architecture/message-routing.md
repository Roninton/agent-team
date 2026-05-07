# 消息路由子系统 SDD 规范

## 1. 概述
消息路由子系统是平台的通信中枢，负责所有端（VS Code扩展、Web前端、后端服务、ACP代理）之间的实时消息传输、多端同步、消息分发、历史存储、离线推送，确保消息的可靠传递、顺序一致、低延迟，为群聊功能、任务状态同步、实时通知等场景提供通信基础。

## 2. 依赖关系
| 依赖模块 | 依赖能力 |
|----------|----------|
| WebSocket 服务 | 全双工实时通信通道 |
| 会话管理模块 | 用户/客户端会话管理、身份认证 |
| 持久化模块 | 消息历史存储、离线消息存储 |
| 群组管理模块 | 群组信息、成员列表查询能力 |

## 3. 需求说明
### 3.1 核心功能需求
1. **多端消息同步**
   - 支持多端同时在线，消息在所有端实时同步
   - 支持离线消息推送，用户上线后自动接收离线期间的所有消息
   - 支持消息状态多端同步（已读、未读、已撤回、已删除）
   - 支持跨设备消息漫游，所有设备可以看到完整的消息历史

2. **群组消息分发**
   - 支持群组消息广播，发送到群组的消息实时推送给所有在线成员
   - 支持@指定成员的消息，优先通知目标用户
   - 支持消息权限控制，不同角色可见不同类型的消息
   - 支持消息优先级，重要消息（通知、告警）优先投递

3. **点对点消息**
   - 支持用户之间、用户与代理、代理之间的一对一私信
   - 支持消息已读回执，发送者可以看到接收者是否已读
   - 支持消息撤回、编辑、删除操作，多端同步状态
   - 支持敏感消息阅后即焚，查看后自动销毁

4. **消息可靠性保证**
   - 消息至少投递一次（At Least Once），不会丢失
   - 支持消息去重，重复投递的消息不会重复展示
   - 支持消息顺序保证，同一个会话的消息按照发送顺序投递
   - 支持投递失败自动重试，重试间隔指数退避，最多重试10次

5. **历史消息管理**
   - 支持消息持久化存储，永久保存所有消息历史
   - 支持按时间、关键词、发送者搜索历史消息
   - 支持消息分页加载，快速滚动浏览历史
   - 支持消息导出，可以导出整个群组的聊天记录

6. **消息类型支持**
   - 支持文本、Markdown、代码块、图片、文件、卡片等丰富的消息类型
   - 支持自定义消息类型，可扩展实现任务通知、系统告警、交互卡片等
   - 支持消息回复、引用、转发等交互功能
   - 支持消息表情回应（Reaction）功能

### 3.2 非功能需求
1. 消息端到端延迟<100毫秒，99%的消息在500毫秒内完成投递
2. 支持1000个并发在线用户，每个用户同时加入10个群组
3. 消息投递成功率>99.99%，不丢失任何消息
4. 消息存储成本低，支持TB级消息存储
5. 水平扩展能力强，增加节点即可支持更多并发用户

## 4. 模型设计
### 4.1 消息模型
```typescript
interface Message {
  messageId: string;             # 消息唯一ID（全局唯一，雪花算法生成）
  conversationId: string;        # 会话ID（群组ID或用户对ID）
  conversationType: 'group' | 'private'; # 会话类型
  senderId: string;              # 发送者ID
  senderType: 'user' | 'agent' | 'system'; # 发送者类型
  senderInfo: SenderInfo;        # 发送者信息（名称、头像、角色等）
  type: MessageType;             # 消息类型
  content: any;                  # 消息内容（根据类型不同结构不同）
  mentions: string[];            # @的用户/成员ID列表
  attachments: MessageAttachment[]; # 附件列表
  replyToMessageId?: string;     # 回复的消息ID
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'; # 消息状态
  priority: 'low' | 'normal' | 'high' | 'urgent'; # 消息优先级
  visibleTo: string[];           # 可见用户列表（为空则所有人可见）
  isDeleted: boolean;            # 是否已删除
  deletedBy?: string;            # 删除者ID
  isRecalled: boolean;           # 是否已撤回
  recalledAt?: number;           # 撤回时间
  reactions: MessageReaction[];  # 表情回应列表
  extra?: any;                   # 扩展字段
  timestamp: number;             # 发送时间戳（毫秒）
  sequenceId: number;            # 会话内序列号（保证顺序）
}
```

### 4.2 消息类型枚举
```typescript
enum MessageType {
  TEXT = 'text',                 # 纯文本消息
  MARKDOWN = 'markdown',         # Markdown消息
  CODE = 'code',                 # 代码块消息
  IMAGE = 'image',               # 图片消息
  FILE = 'file',                 # 文件消息
  SYSTEM_NOTICE = 'system_notice', # 系统通知消息
  TASK_NOTICE = 'task_notice',   # 任务状态变更通知
  AGENT_MESSAGE = 'agent_message', # 代理发送的消息
  INTERACTIVE_CARD = 'interactive_card', # 交互卡片消息
  RECALL = 'recall',             # 撤回通知
  DELETE = 'delete',             # 删除通知
  READ_RECEIPT = 'read_receipt', # 已读回执
  CUSTOM = 'custom'              # 自定义消息类型
}
```

### 4.3 会话模型
```typescript
interface Conversation {
  conversationId: string;        # 会话ID
  type: 'group' | 'private';     # 会话类型
  name: string;                  # 会话名称
  avatar?: string;               # 会话头像
  memberIds: string[];           # 成员ID列表
  lastMessage?: Message;         # 最后一条消息
  unreadCount: number;           # 未读消息数
  lastReadSequenceId: Record<string, number>; # 每个成员的最后已读序列号
  mute: boolean;                 # 是否免打扰
  top: boolean;                  # 是否置顶
  createdAt: number;             # 创建时间
  updatedAt: number;             # 最后更新时间
}
```

### 4.4 客户端会话模型
```typescript
interface ClientSession {
  sessionId: string;             # 客户端会话ID
  userId: string;                # 用户ID
  clientType: 'vscode' | 'web' | 'mobile'; # 客户端类型
  clientVersion: string;         # 客户端版本
  connectedAt: number;           # 连接时间
  lastActiveAt: number;          # 最后活跃时间
  isOnline: boolean;             # 是否在线
  deviceInfo: any;               # 设备信息
}
```

## 5. 核心架构
采用分层架构设计，从下到上分为：
1. **接入层**：WebSocket服务器，负责客户端连接管理、心跳检测、消息收发
2. **路由层**：消息路由引擎，负责消息的路由、分发、广播、过滤
3. **存储层**：消息持久化存储，负责消息历史、离线消息、会话信息存储
4. **服务层**：业务逻辑处理，包括消息管理、会话管理、通知管理等

### 5.1 核心流程
#### 消息发送流程
1. 客户端发送消息到接入层，携带会话ID、消息内容、签名等信息
2. 接入层验证消息合法性、用户身份权限
3. 生成全局唯一的messageId和会话内sequenceId，设置时间戳
4. 消息持久化存储到数据库
5. 路由层根据会话类型和目标接收者列表，将消息推送给所有在线的目标客户端
6. 对于离线用户，将消息存入离线消息队列，等待用户上线后推送
7. 返回发送结果给发送者，更新消息状态为`sent`

#### 消息接收流程
1. 客户端连接到接入层，进行身份认证
2. 接入层查询该用户的离线消息，批量推送给客户端
3. 客户端发送已接收确认，接入层删除对应的离线消息
4. 实时消息通过WebSocket主动推送给在线客户端
5. 客户端收到消息后发送确认回执，更新消息状态为`delivered`
6. 用户查看消息后，客户端发送已读回执，更新消息状态为`read`，同步给其他端

#### 群组消息广播流程
1. 发送者发送消息到群组会话
2. 系统查询群组成员列表，过滤掉消息不可见的成员
3. 路由层根据成员的在线状态，分别处理：
   - 在线成员：直接通过WebSocket推送消息
   - 离线成员：存入离线消息队列
4. 记录消息的已读状态，每个成员独立维护自己的已读位置
5. 支持@全体成员、@指定成员，目标成员收到特殊通知

## 5. 核心机制
### 5.1 消息可靠性保证机制
#### 投递保证
- 采用At Least Once投递语义，消息至少投递一次
- 每个消息携带唯一ID，客户端收到消息后发送ACK确认
- 服务端未收到ACK的消息，会按照指数退避策略重试：1s→3s→5s→10s→30s→1m→5m→10m→30m→1h
- 最多重试10次，超过后存入死信队列，人工处理

#### 去重机制
- 客户端生成幂等ID，服务端根据幂等ID去重，重复发送的消息不会重复存储
- 消息ID全局唯一，客户端收到重复ID的消息自动忽略
- 会话内sequenceId连续，客户端可以通过检查序列号发现丢失的消息，主动拉取

#### 顺序保证
- 同一个会话的消息按照发送时间排序，分配连续的sequenceId
- 服务端按照sequenceId顺序投递消息
- 客户端按照sequenceId顺序展示消息，乱序的消息会缓存到顺序正确后再展示
- 离线消息按照sequenceId从小到大顺序推送

### 5.2 多端同步机制
- 每个用户的所有客户端共享同一个消息序列
- 客户端连接时上报自己的最后同步序列号，服务端推送该序列号之后的所有消息
- 消息状态变更（已读、撤回、删除）会同步到该用户的所有在线客户端
- 支持增量同步，每次只同步变化的部分，减少传输量

### 5.3 离线消息机制
- 离线消息存储在有序集合中，按时间排序
- 用户上线后，批量推送离线消息，每次最多推送100条，支持分页拉取

### 5.4 流量控制与消息静默机制
#### 5.4.1 Agent消息限流策略
- 单个Agent每分钟最多发送5条消息（兜底限流策略）
- 超过限流阈值的消息自动丢弃，返回限流提示，避免消息爆炸
- 高优先级消息（任务结果、系统通知不受限流限制

#### 5.4.2 可选回复机制
- Agent支持根据消息内容判断是否需要回复，不需要回复的消息可以静默处理
- 系统提供全局配置选项：
  - 必须回复的消息类型：@提及该Agent的消息、任务分配消息、明确提问类消息
  - 可静默的消息类型：其他Agent的回复、普通聊天消息、通知类消息
- 静默消息不会产生回复，减少无效消息传输

#### 5.4.3 Agent消息强制校验规则
- **所有Agent发送到聊天框的消息必须通过统一的`sendAgentMessage`专用Tool接口发送**，禁止直接推送原始消息
- 消息网关强制校验所有Agent发出的消息来源，未通过专用Tool接口发送的消息直接拦截丢弃
- 专用Tool自动完成以下统一处理：
  - 限流校验：检查Agent是否超出每分钟5条的限流阈值
  - 格式校验：自动标准化消息格式，适配前端渲染要求
  - 敏感内容过滤：自动检测并拦截违规内容
  - 审计日志：记录所有消息的发送者、内容、时间、接收者等信息，方便追溯
  - 错误重试：发送失败自动重试，保证消息可靠性
- 离线消息保留30天，超过自动清理
- 支持离线消息推送通知，用户上线后收到未读消息提示
- 重要消息（@消息、系统通知）支持额外的离线推送（邮件、短信等，可选）

### 5.4 消息存储机制
- 分层存储：
  - 近1个月的热消息存储在Redis缓存，查询速度快
  - 历史消息默认存储在SQLite数据库，无需额外服务，部署简单
  - 高并发场景可切换为PostgreSQL存储，无需修改业务代码
- 消息内容压缩存储，使用gzip压缩，减少存储空间占用
- 支持消息加密存储，敏感消息可以加密保存，只有授权用户可以解密
- 支持消息导出为本地文件，实现长期归档
- 定期备份消息数据，防止数据丢失

### 5.5 推送策略
| 消息优先级 | 推送策略 | 适用场景 |
|------------|----------|----------|
| 紧急（urgent） | 最高优先级，立即推送，跳过限流，离线转短信通知 | 系统告警、重要通知 |
| 高（high） | 高优先级，优先推送，离线保留7天 | @消息、任务状态变更 |
| 普通（normal） | 普通优先级，按顺序推送，离线保留30天 | 普通聊天消息 |
| 低（low） | 低优先级，空闲时推送，离线保留7天 | 非重要通知、状态同步 |

## 6. API接口定义
### 6.1 WebSocket 事件定义
#### 客户端发送事件
```typescript
// 发送消息
interface SendMessageEvent {
  type: 'send_message';
  data: {
    conversationId: string;
    type: MessageType;
    content: any;
    mentions?: string[];
    replyToMessageId?: string;
    attachments?: MessageAttachment[];
  };
  idempotentId: string;
}

// 消息已读回执
interface MarkAsReadEvent {
  type: 'mark_as_read';
  data: {
    conversationId: string;
    sequenceId: number;
  };
}

// 拉取历史消息
interface FetchHistoryEvent {
  type: 'fetch_history';
  data: {
    conversationId: string;
    beforeSequenceId?: number;
    limit?: number;
  };
}

// 撤回消息
interface RecallMessageEvent {
  type: 'recall_message';
  data: {
    messageId: string;
  };
}

// 删除消息
interface DeleteMessageEvent {
  type: 'delete_message';
  data: {
    messageId: string;
    deleteForEveryone?: boolean;
  };
}

// 添加表情回应
interface AddReactionEvent {
  type: 'add_reaction';
  data: {
    messageId: string;
    reaction: string;
  };
}
```

#### 服务端推送事件
```typescript
// 新消息推送
interface NewMessageEvent {
  type: 'new_message';
  data: Message;
}

// 消息状态更新
interface MessageStatusUpdateEvent {
  type: 'message_status_update';
  data: {
    messageId: string;
    status: MessageStatus;
    userId: string;
  };
}

// 消息撤回通知
interface MessageRecalledEvent {
  type: 'message_recalled';
  data: {
    messageId: string;
    conversationId: string;
    recalledBy: string;
    recalledAt: number;
  };
}

// 消息删除通知
interface MessageDeletedEvent {
  type: 'message_deleted';
  data: {
    messageId: string;
    conversationId: string;
    deletedBy: string;
    deleteForEveryone: boolean;
  };
}

// 表情回应更新
interface ReactionUpdateEvent {
  type: 'reaction_update';
  data: {
    messageId: string;
    reactions: MessageReaction[];
  };
}

// 会话更新通知
interface ConversationUpdateEvent {
  type: 'conversation_update';
  data: Conversation;
}
```

### 6.2 REST API 接口
```typescript
/**
 * 获取用户的会话列表
 * @returns Conversation[] 会话列表
 */
async function getConversationList(): Promise<Conversation[]>;

/**
 * 获取会话的历史消息
 * @param conversationId 会话ID
 * @param beforeSequenceId? 起始序列号（获取该序列号之前的消息）
 * @param limit? 数量限制（默认20）
 * @returns Message[] 历史消息列表
 */
async function getHistoryMessages(conversationId: string, beforeSequenceId?: number, limit?: number): Promise<Message[]>;

/**
 * 搜索消息
 * @param keyword 关键词
 * @param conversationId? 限定会话ID
 * @param senderId? 限定发送者
 * @param startTime? 开始时间
 * @param endTime? 结束时间
 * @returns Message[] 匹配的消息列表
 */
async function searchMessages(keyword: string, conversationId?: string, senderId?: string, startTime?: number, endTime?: number): Promise<Message[]>;

/**
 * 导出会话消息
 * @param conversationId 会话ID
 * @param format? 导出格式（json/markdown/html，默认json）
 * @param startTime? 开始时间
 * @param endTime? 结束时间
 * @returns string 导出文件下载地址
 */
async function exportConversation(conversationId: string, format?: 'json' | 'markdown' | 'html', startTime?: number, endTime?: number): Promise<string>;

/**
 * 更新会话设置
 * @param conversationId 会话ID
 * @param settings 设置项（mute、top等）
 * @returns Conversation 更新后的会话信息
 */
async function updateConversationSettings(conversationId: string, settings: Partial<ConversationSettings>): Promise<Conversation>;
```

## 7. 扩展性设计
1. 支持自定义消息类型，通过插件机制扩展消息的解析和渲染逻辑
2. 支持自定义推送通道，除了WebSocket外，可以扩展支持WebPush、APNs、FCM等移动端推送
3. 支持消息过滤插件，可以实现敏感词过滤、内容审核、垃圾消息拦截等功能
4. 支持分布式部署，接入层可以水平扩展，支持更多并发连接
5. 支持消息转发到第三方系统，比如企业微信、Slack、邮件等

## 8. 性能指标
| 指标 | 要求 |
|------|------|
| 消息端到端延迟 | p99 < 500ms，平均 < 100ms |
| 单节点支持并发连接 | ≥ 10000 |
| 消息投递成功率 | ≥ 99.99% |
| 消息吞吐量 | ≥ 10000条/秒 |
| 离线消息查询延迟 | < 100ms |
| 历史消息查询延迟 | < 200ms |

## 9. 验收标准
1. 多端同时在线，发送的消息在所有端实时同步，延迟<500ms
2. 客户端离线后上线，自动接收所有离线消息，不丢失
3. 群组消息可以正确广播给所有成员，支持@功能和权限控制
4. 消息撤回、删除、已读状态在多端实时同步
5. 消息投递可靠，网络抖动恢复后消息自动补发，不丢失
6. 历史消息搜索、分页加载功能正常，查询速度<200ms
7. 支持1000个并发用户同时在线，系统稳定，消息延迟无明显增加
