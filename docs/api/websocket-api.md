# WebSocket 消息协议规范

## 1. 概述
本文档定义VS Code多AI协作平台的WebSocket实时通信协议，包括消息格式、事件类型、通信流程等。所有实时消息交互必须遵循本规范。

## 2. 通用规范
### 2.1 连接信息
- 连接地址：`wss://<host>/ws/v1`
- 认证方式：连接时在Query参数携带token：`wss://example.com/ws/v1?token=<jwt_token>`
- 心跳机制：客户端每30秒发送ping消息，服务端响应pong，超过90秒无心跳自动断开连接
- 消息格式：JSON，每条消息必须包含`id`、`type`、`data`字段

### 2.2 基础消息格式
```json
{
  "id": "msg-123456", // 消息唯一ID，客户端生成
  "type": "event_name", // 消息类型/事件名
  "timestamp": 1715000000000, // 消息发送时间戳
  "data": {} // 消息数据内容
}
```

### 2.3 响应格式
#### 成功响应
```json
{
  "id": "msg-123456", // 对应请求的消息ID
  "type": "response",
  "success": true,
  "data": {} // 返回数据
}
```

#### 错误响应
```json
{
  "id": "msg-123456",
  "type": "response",
  "success": false,
  "error": {
    "code": 400,
    "message": "参数错误",
    "details": "详细错误信息"
  }
}
```

### 2.4 系统事件
| 事件类型 | 方向 | 说明 |
|----------|------|------|
| `ping` | 客户端→服务端 | 心跳消息 |
| `pong` | 服务端→客户端 | 心跳响应 |
| `connected` | 服务端→客户端 | 连接成功通知 |
| `disconnected` | 服务端→客户端 | 连接断开通知 |
| `error` | 服务端→客户端 | 系统错误通知 |

## 3. 聊天消息事件
### 3.1 发送消息
**事件名：** `chat.message.send`  
**方向：** 客户端→服务端

**请求数据：**
```json
{
  "sessionId": "session-123",
  "content": "你好，帮我写一个React组件",
  "type": "text", // text/markdown/tool_call/tool_result
  "attachments": [
    {
      "type": "file",
      "path": "/src/components/Button.tsx",
      "content": "文件内容（可选）"
    }
  ],
  "metadata": {
    "agentId": "agent-123" // 指定发送给某个代理
  }
}
```

### 3.2 新消息通知
**事件名：** `chat.message.new`  
**方向：** 服务端→客户端

**消息数据：**
```json
{
  "id": "msg-789",
  "sessionId": "session-123",
  "senderId": "agent-123",
  "senderType": "agent", // user/agent/system
  "senderName": "GitHub Copilot",
  "senderAvatar": "https://example.com/avatar.png",
  "content": "好的，我来帮你写这个React组件",
  "type": "markdown",
  "attachments": [],
  "status": "sending", // sending/completed/failed
  "timestamp": 1715000000000
}
```

### 3.3 消息更新通知
**事件名：** `chat.message.update`  
**方向：** 服务端→客户端

**消息数据：** 同新消息通知，包含更新后的完整消息内容

### 3.4 消息已读通知
**事件名：** `chat.message.read`  
**方向：** 双向

**数据：**
```json
{
  "sessionId": "session-123",
  "messageId": "msg-789",
  "readBy": "user-123"
}
```

### 3.5 消息撤回
**事件名：** `chat.message.recall`  
**方向：** 双向

**数据：**
```json
{
  "sessionId": "session-123",
  "messageId": "msg-789",
  "reason": "用户撤回"
}
```

### 3.6 输入状态通知
**事件名：** `chat.typing`  
**方向：** 双向

**数据：**
```json
{
  "sessionId": "session-123",
  "userId": "agent-123",
  "userName": "GitHub Copilot",
  "isTyping": true
}
```

## 4. 任务相关事件
### 4.1 任务状态更新
**事件名：** `task.status.update`  
**方向：** 服务端→客户端

**数据：**
```json
{
  "taskId": "task-123",
  "groupId": "group-456",
  "oldStatus": "pending",
  "newStatus": "running",
  "progress": 30,
  "assigneeId": "agent-789",
  "assigneeName": "GitHub Copilot",
  "timestamp": 1715000000000,
  "message": "任务开始执行"
}
```

### 4.2 任务进度更新
**事件名：** `task.progress.update`  
**方向：** 服务端→客户端

**数据：**
```json
{
  "taskId": "task-123",
  "progress": 75,
  "log": "正在生成代码文件",
  "timestamp": 1715000000000
}
```

### 4.3 任务执行日志
**事件名：** `task.log.append`  
**方向：** 服务端→客户端

**数据：**
```json
{
  "taskId": "task-123",
  "log": "[10:30] 调用文件工具读取 src/App.tsx",
  "level": "info", // info/warn/error/debug
  "timestamp": 1715000000000
}
```

### 4.4 任务完成通知
**事件名：** `task.completed`  
**方向：** 服务端→客户端

**数据：**
```json
{
  "taskId": "task-123",
  "groupId": "group-456",
  "success": true,
  "result": {
    "summary": "已完成React组件编写",
    "attachments": [
      {
        "type": "file",
        "path": "/src/components/Button.tsx",
        "content": "import React from 'react'; ..."
      }
    ]
  },
  "duration": 15000, // 执行时长（毫秒）
  "timestamp": 1715000000000
}
```

### 4.5 任务失败通知
**事件名：** `task.failed`  
**方向：** 服务端→客户端

**数据：**
```json
{
  "taskId": "task-123",
  "groupId": "group-456",
  "error": "API调用超时",
  "retryCount": 2,
  "willRetry": true,
  "timestamp": 1715000000000
}
```

## 5. 代理状态事件
### 5.1 代理上线通知
**事件名：** `agent.online`  
**方向：** 服务端→客户端

**数据：**
```json
{
  "agentId": "agent-123",
  "agentName": "GitHub Copilot",
  "status": "online",
  "timestamp": 1715000000000
}
```

### 5.2 代理下线通知
**事件名：** `agent.offline`  
**方向：** 服务端→客户端

### 5.3 代理状态更新
**事件名：** `agent.status.update`  
**方向：** 服务端→客户端

**数据：**
```json
{
  "agentId": "agent-123",
  "oldStatus": "idle",
  "newStatus": "busy",
  "currentTaskCount": 3,
  "maxTaskCount": 5,
  "timestamp": 1715000000000
}
```

## 6. 群组事件
### 6.1 群组创建通知
**事件名：** `group.created`  
**方向：** 服务端→客户端

### 6.2 群组更新通知
**事件名：** `group.updated`  
**方向：** 服务端→客户端

### 6.3 成员加入通知
**事件名：** `group.member.joined`  
**方向：** 服务端→客户端

**数据：**
```json
{
  "groupId": "group-123",
  "memberId": "agent-456",
  "memberName": "Claude Code",
  "role": "member",
  "timestamp": 1715000000000
}
```

### 6.4 成员离开通知
**事件名：** `group.member.left`  
**方向：** 服务端→客户端

### 6.5 成员角色更新
**事件名：** `group.member.role.updated`  
**方向：** 服务端→客户端

## 7. 上下文同步事件
### 7.1 上下文更新通知
**事件名：** `context.updated`  
**方向：** 服务端→客户端

**数据：**
```json
{
  "contextId": "ctx-123",
  "version": "v2",
  "changes": [
    {
      "path": "files/src/App.tsx",
      "type": "update",
      "content": "新的文件内容"
    }
  ],
  "timestamp": 1715000000000
}
```

### 7.2 上下文版本冲突
**事件名：** `context.conflict`  
**方向：** 服务端→客户端

**数据：**
```json
{
  "contextId": "ctx-123",
  "expectedVersion": "v2",
  "actualVersion": "v1",
  "resolution": "请同步最新版本后重试"
}
```

## 8. 工具调用事件
### 8.1 工具调用请求
**事件名：** `tool.call.request`  
**方向：** 服务端→客户端

**数据：**
```json
{
  "id": "tool-123",
  "taskId": "task-456",
  "agentId": "agent-789",
  "toolName": "read_file",
  "parameters": {
    "filePath": "/src/App.tsx",
    "startLine": 1,
    "endLine": 100
  },
  "timestamp": 1715000000000
}
```

### 8.2 工具调用响应
**事件名：** `tool.call.response`  
**方向：** 客户端→服务端

**数据：**
```json
{
  "id": "tool-123",
  "success": true,
  "result": "文件内容...",
  "error": null,
  "timestamp": 1715000000000
}
```

### 8.3 工具调用状态更新
**事件名：** `tool.call.status.update`  
**方向：** 双向

**数据：**
```json
{
  "id": "tool-123",
  "status": "running",
  "progress": 50,
  "message": "正在读取文件"
}
```

## 9. 通知事件
### 9.1 系统通知
**事件名：** `notification.system`  
**方向：** 服务端→客户端

**数据：**
```json
{
  "id": "notify-123",
  "level": "info", // info/warn/error/success
  "title": "系统升级通知",
  "content": "系统将于2026-05-07 00:00进行维护，预计持续1小时",
  "actions": [
    {
      "text": "查看详情",
      "url": "/notice/123"
    }
  ],
  "timestamp": 1715000000000
}
```

### 9.2 消息通知
**事件名：** `notification.message`  
**方向：** 服务端→客户端

## 10. 通信流程
### 10.1 连接建立流程
1. 客户端获取JWT Token
2. 客户端发起WebSocket连接：`wss://host/ws/v1?token=<token>`
3. 服务端验证Token，验证通过后返回`connected`事件
4. 客户端开始定时发送`ping`心跳（每30秒一次）
5. 服务端响应`pong`，保持连接活跃

### 10.2 消息发送流程
1. 客户端构造消息，生成唯一消息ID
2. 发送`chat.message.send`事件
3. 服务端验证消息合法性，返回响应
4. 服务端将消息转发给目标代理/群组
5. 目标接收方收到消息后，返回已读通知

### 10.3 任务执行流程
1. 用户发送任务请求
2. 系统拆解任务，分配给代理
3. 发送`task.status.update`通知用户任务已分配
4. 代理执行任务过程中，实时发送`task.progress.update`和`task.log.append`事件
5. 任务完成后，发送`task.completed`通知，包含执行结果
6. 系统汇总结果返回给用户

### 10.4 断开重连流程
1. 连接异常断开后，客户端立即尝试重连
2. 重连时携带上次连接的会话ID和最后收到的消息ID
3. 服务端补发断开期间的所有未读消息
4. 客户端同步状态，恢复正常通信

## 11. 错误码定义
| 错误码 | 说明 | 处理策略 |
|--------|------|----------|
| 4001 | 无效的Token | 重新登录获取新Token |
| 4002 | Token已过期 | 刷新Token或重新登录 |
| 4003 | 权限不足 | 无操作权限，提示用户 |
| 4004 | 会话不存在 | 重新创建会话 |
| 4005 | 消息格式错误 | 检查消息格式后重发 |
| 4006 | 频率限制 | 等待一段时间后重试 |
| 5001 | 服务内部错误 | 稍后重试或联系管理员 |
| 5002 | 服务暂不可用 | 稍后重试 |

## 变更记录
- 2026-05-06 初始版本创建，完成所有实时消息协议定义
