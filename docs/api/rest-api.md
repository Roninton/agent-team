# 后端 REST API 规范

## 1. 概述
本文档定义VS Code多AI协作平台的后端REST API接口规范，包括接口路径、请求参数、返回值、错误码等。所有前后端通信接口必须遵循本规范。

## 2. 通用规范
### 2.1 基础信息
- 基础路径：`/api/v1`
- 数据格式：JSON，请求和响应的Content-Type均为`application/json`
- 字符编码：UTF-8
- 认证方式：JWT Token，放在请求头的`Authorization: Bearer <token>`字段

### 2.2 响应格式
#### 成功响应
```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {} // 返回的业务数据
}
```

#### 错误响应
```json
{
  "success": false,
  "code": 400,
  "message": "参数错误",
  "error": "详细错误信息" // 可选
}
```

### 2.3 通用错误码
| 错误码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 400 | 参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
| 502 | 网关错误 |
| 503 | 服务不可用 |

## 3. 系统接口
### 3.1 获取版本信息

获取当前系统版本号，用于前端检查兼容性。

```http
GET /api/version
```

**响应：**
```json
{
  "version": "0.5.0",
  "name": "ACP Platform"
}
```

### 3.2 获取公开配置信息

获取系统公开配置信息，用于前端展示。

```http
GET /api/config
```

**响应：**
```json
{
  "version": "0.5.0",
  "server": {
    "port": 3001,
    "host": "0.0.0.0"
  },
  "agent": {
    "maxInstances": 10
  }
}
```

---

## 4. 群组管理接口
### 4.1 获取群组列表
```http
GET /api/v1/groups
```

**请求参数（Query）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认10 |
| keyword | string | 否 | 搜索关键词（群组名称） |

**响应数据：**
```json
{
  "total": 100,
  "page": 1,
  "pageSize": 10,
  "list": [
    {
      "id": "group-123",
      "name": "前端开发团队",
      "description": "负责前端项目开发",
      "avatar": "https://example.com/avatar.png",
      "memberCount": 5,
      "status": "active",
      "createdAt": 1715000000000,
      "updatedAt": 1715000000000
    }
  ]
}
```

### 3.2 创建群组
```http
POST /api/v1/groups
```

**请求参数（Body）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| name | string | 是 | 群组名称，长度2-50 |
| description | string | 否 | 群组描述，最大200字符 |
| avatar | string | 否 | 群组头像URL |
| members | string[] | 否 | 初始成员ID列表 |
| config | object | 否 | 群组配置 |

**响应数据：** 返回创建的群组完整信息

### 3.3 获取群组详情
```http
GET /api/v1/groups/:groupId
```

**路径参数：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| groupId | string | 是 | 群组ID |

**响应数据：** 返回群组完整信息，包括成员列表、配置信息

### 3.4 更新群组信息
```http
PUT /api/v1/groups/:groupId
```

**路径参数：** groupId

**请求参数（Body）：** 可更新的字段包括name、description、avatar、config

### 3.5 删除群组
```http
DELETE /api/v1/groups/:groupId
```

### 3.6 添加群组成员
```http
POST /api/v1/groups/:groupId/members
```

**请求参数（Body）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| memberIds | string[] | 是 | 要添加的成员ID列表 |
| role | string | 否 | 角色：'owner'/'admin'/'member'，默认'member' |

### 3.7 移除群组成员
```http
DELETE /api/v1/groups/:groupId/members/:memberId
```

### 3.8 更新成员角色
```http
PUT /api/v1/groups/:groupId/members/:memberId/role
```

**请求参数（Body）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| role | string | 是 | 新角色 |

## 4. 代理管理接口
### 4.1 获取代理列表
```http
GET /api/v1/agents
```

**请求参数（Query）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| status | string | 否 | 过滤状态：'online'/'offline'/'busy' |
| skillTags | string[] | 否 | 过滤技能标签 |

**响应数据：**
```json
{
  "list": [
    {
      "id": "agent-123",
      "name": "GitHub Copilot",
      "description": "AI编程助手",
      "avatar": "https://example.com/copilot.png",
      "skillTags": ["coding", "javascript", "typescript"],
      "status": "online",
      "currentTaskCount": 2,
      "maxTaskCount": 5,
      "version": "1.0.0",
      "createdAt": 1715000000000
    }
  ]
}
```

### 4.2 获取代理详情
```http
GET /api/v1/agents/:agentId
```

### 4.3 连接代理
```http
POST /api/v1/agents/:agentId/connect
```

**请求参数（Body）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| config | object | 否 | 连接配置（API密钥、模型参数等） |

### 4.4 断开代理连接
```http
POST /api/v1/agents/:agentId/disconnect
```

### 4.5 重启代理
```http
POST /api/v1/agents/:agentId/restart
```

## 5. 任务管理接口
### 5.1 拆解任务
```http
POST /api/v1/tasks/split
```

**请求参数（Body）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| groupId | string | 是 | 所属群组ID |
| request | string | 是 | 用户需求内容 |
| config | object | 否 | 拆解配置 |

**响应数据：** 返回拆解后的子任务列表

### 5.2 分配任务
```http
POST /api/v1/tasks/:taskId/assign
```

**请求参数（Body）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| agentId | string | 否 | 指定分配的代理ID（手动分配时） |
| config | object | 否 | 分配策略配置 |

### 5.3 获取任务列表
```http
GET /api/v1/tasks
```

**请求参数（Query）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| groupId | string | 否 | 按群组过滤 |
| agentId | string | 否 | 按代理过滤 |
| status | string | 否 | 按状态过滤 |
| priority | string | 否 | 按优先级过滤 |

### 5.4 获取任务详情
```http
GET /api/v1/tasks/:taskId
```

### 5.5 更新任务进度
```http
PUT /api/v1/tasks/:taskId/progress
```

**请求参数（Body）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| progress | number | 是 | 进度（0-100） |
| log | string | 否 | 进度日志 |

### 5.6 上报任务结果
```http
POST /api/v1/tasks/:taskId/result
```

**请求参数（Body）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| success | boolean | 是 | 是否执行成功 |
| result | object | 是 | 执行结果 |
| error | string | 否 | 错误信息（失败时） |

### 5.7 取消任务
```http
POST /api/v1/tasks/:taskId/cancel
```

**请求参数（Body）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| reason | string | 否 | 取消原因 |
| cancelDependencies | boolean | 否 | 是否同时取消依赖任务 |

### 5.8 重试任务
```http
POST /api/v1/tasks/:taskId/retry
```

**请求参数（Body）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| reassign | boolean | 否 | 是否重新分配代理 |

## 6. 会话管理接口
### 6.1 获取会话列表
```http
GET /api/v1/sessions
```

### 6.2 创建新会话
```http
POST /api/v1/sessions
```

**请求参数（Body）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| groupId | string | 否 | 关联群组ID |
| agentId | string | 否 | 关联代理ID |
| title | string | 否 | 会话标题 |

### 6.3 获取会话详情
```http
GET /api/v1/sessions/:sessionId
```

### 6.4 获取会话消息列表
```http
GET /api/v1/sessions/:sessionId/messages
```

**请求参数（Query）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| beforeId | string | 否 | 加载该ID之前的历史消息 |
| limit | number | 否 | 数量限制，默认20 |

### 6.5 发送消息
```http
POST /api/v1/sessions/:sessionId/messages
```

**请求参数（Body）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| content | string | 是 | 消息内容 |
| type | string | 是 | 消息类型：'text'/'markdown'/'tool_call'/'tool_result' |
| attachments | array | 否 | 附件列表 |

### 6.6 删除会话
```http
DELETE /api/v1/sessions/:sessionId
```

## 7. 上下文管理接口
### 7.1 获取上下文信息
```http
GET /api/v1/contexts/:contextId
```

### 7.2 更新上下文
```http
PUT /api/v1/contexts/:contextId
```

**请求参数（Body）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| content | object | 是 | 上下文内容 |
| version | string | 是 | 当前版本号（用于乐观锁） |

### 7.3 获取上下文版本历史
```http
GET /api/v1/contexts/:contextId/versions
```

### 7.4 回滚上下文到指定版本
```http
POST /api/v1/contexts/:contextId/rollback
```

**请求参数（Body）：**
| 参数名 | 类型 | 必选 | 说明 |
|--------|------|------|------|
| version | string | 是 | 要回滚到的版本号 |

## 8. 配置管理接口
### 8.1 获取系统配置
```http
GET /api/v1/config/system
```

### 8.2 更新系统配置
```http
PUT /api/v1/config/system
```

**请求参数（Body）：** 配置键值对

### 8.3 获取用户配置
```http
GET /api/v1/config/user
```

### 8.4 更新用户配置
```http
PUT /api/v1/config/user
```

## 9. 统计接口
### 9.1 获取系统统计信息
```http
GET /api/v1/stats/system
```

**响应数据：**
```json
{
  "totalAgents": 15,
  "onlineAgents": 10,
  "totalGroups": 50,
  "activeGroups": 25,
  "totalTasks": 1000,
  "runningTasks": 50,
  "uptime": 86400
}
```

### 9.2 获取用户统计信息
```http
GET /api/v1/stats/user
```

## 10. 版本信息接口
### 10.1 获取API版本信息
```http
GET /api/v1/version
```

**响应数据：**
```json
{
  "version": "1.0.0",
  "buildDate": "2026-05-06",
  "features": ["multi-agent", "group-chat", "task-allocation"]
}
```

## 变更记录
- 2026-05-06 初始版本创建，完成所有核心接口定义
