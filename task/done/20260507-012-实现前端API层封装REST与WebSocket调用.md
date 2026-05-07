# 任务ID: 20260507-012
## 任务名称：实现前端API层，封装REST与WebSocket调用

## 任务概述
目前 `src/client/src/api/` 目录为空，需要实现完整的前端API层，封装所有后端REST API调用和WebSocket实时通信，为前端页面提供统一的数据访问接口。

## 上下文信息

### 相关规范文档索引
**Level 0 顶层规范：**
- `docs/specs/architecture/tech-stack-and-architecture.md` - 第4.1节"前端展示层"

**Level 3 协议层规范：**
- `docs/api/rest-api.md` - 所有REST API接口规范
- `docs/api/websocket-api.md` - WebSocket消息协议

**Level 4 UI层规范：**
- `docs/specs/ui/pages-design-spec.md` - 前端代码规范

### 当前状态
- ✅ 前端项目框架已建立（React + Vite + TypeScript）
- ❌ `src/client/src/api/` 目录为空
- ❌ 无API调用封装，当前使用mock数据
- ❌ 无WebSocket客户端实现
- ❌ 前端类型定义与后端不统一

### 技术选型
- HTTP客户端：axios (或 fetch)
- WebSocket客户端：socket.io-client
- 类型系统：引用 `src/shared/types/` 的共享类型

## 执行计划

### 阶段一：基础配置与类型
1. **API基础配置** (`config.ts`)
   - API基础URL
   - 超时配置
   - 错误码定义

2. **请求拦截器** (`interceptor.ts`)
   - JWT Token注入
   - 请求日志
   - 响应统一处理
   - 错误统一处理

### 阶段二：REST API封装
按模块划分API文件：

1. **代理API** (`agent.api.ts`)
   - `getAgents()` - 获取代理列表
   - `getAgent(id)` - 获取代理详情
   - `startAgent(id)` - 启动代理
   - `stopAgent(id)` - 停止代理
   - `restartAgent(id)` - 重启代理
   - `createAgent(config)` - 创建代理
   - `deleteAgent(id)` - 删除代理
   - `sendToAgent(id, message)` - 发送消息给代理

2. **群组API** (`group.api.ts`)
   - `getGroups()` - 获取群组列表
   - `getGroup(id)` - 获取群组详情
   - `createGroup(data)` - 创建群组
   - `updateGroup(id, data)` - 更新群组
   - `deleteGroup(id)` - 删除群组
   - `addMember(groupId, agentId)` - 添加成员
   - `removeMember(groupId, agentId)` - 移除成员
   - `sendGroupMessage(groupId, message)` - 发送群组消息

3. **会话API** (`session.api.ts`)
   - `getSessions()` - 获取会话列表
   - `getSession(id)` - 获取会话详情
   - `createSession(agentId)` - 创建会话
   - `deleteSession(id)` - 删除会话
   - `getSessionMessages(sessionId)` - 获取会话消息
   - `sendSessionMessage(sessionId, message)` - 发送会话消息

4. **任务API** (`task.api.ts`)
   - `getTasks()` - 获取任务列表
   - `getTask(id)` - 获取任务详情
   - `createTask(data)` - 创建任务
   - `updateTask(id, data)` - 更新任务
   - `assignTask(id, agentId)` - 分配任务

5. **上下文API** (`context.api.ts`)
   - `getContext(sessionId)` - 获取上下文
   - `updateContext(sessionId, data)` - 更新上下文
   - `clearContext(sessionId)` - 清除上下文

### 阶段三：WebSocket客户端封装
1. **WebSocket管理器** (`ws.client.ts`)
   - 单例连接管理
   - 自动重连机制
   - 连接状态管理
   - 事件订阅/取消订阅
   - 消息发送封装

2. **事件监听封装**
   - `onMessage(callback)` - 新消息监听
   - `onAgentStatus(callback)` - 代理状态变更监听
   - `onGroupEvent(callback)` - 群组事件监听

### 阶段四：TDD - 编写单元测试（先写测试再实现）
1. **REST API测试** (`src/client/src/__test__/api/`)
   - `agent.api.spec.ts` - 代理API调用测试
   - `group.api.spec.ts` - 群组API调用测试
   - `session.api.spec.ts` - 会话API调用测试
   - `task.api.spec.ts` - 任务API调用测试
   - 拦截器测试 - 请求/响应拦截逻辑

2. **WebSocket客户端测试** (`src/client/src/__test__/api/ws.client.spec.ts`)
   - 连接管理测试
   - 自动重连测试
   - 事件订阅测试
   - 消息发送/接收测试
   - 错误处理测试

3. **Mock配置**
   - `vitest-mock-axios` 配置
   - Socket.IO mock 配置
   - 通用测试数据生成器

4. **运行测试确认失败**
   - 执行 `npm run test -- --run src/client/src/__test__/api/`
   - 确认测试失败（TDD第一步）

### 阶段五：实现与验证
1. 按测试用例逐一实现API封装
2. 运行测试确认通过
3. 集成测试验证前后端通信
   - `onTaskUpdate(callback)` - 任务更新监听

3. **React Hook封装** (`useWebSocket.ts`)
   - 封装WebSocket为React Hook
   - 自动连接/断开
   - 状态管理

### 阶段四：统一导出与类型
1. **统一导出入口** (`index.ts`)
   - 导出所有API实例
   - 导出类型定义

2. **类型引用**
   - 引用 `src/shared/types/` 的共享类型
   - 消除前端重复类型定义

## 核心实现示例

### API客户端基础类
```typescript
class BaseApiClient {
  private axios: AxiosInstance;
  
  constructor(baseURL: string) {
    this.axios = axios.create({
      baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // 请求拦截器：注入token
    // 响应拦截器：统一处理响应格式
  }
  
  protected get<T>(url: string, params?: any): Promise<T>;
  protected post<T>(url: string, data?: any): Promise<T>;
  protected put<T>(url: string, data?: any): Promise<T>;
  protected delete<T>(url: string): Promise<T>;
}
```

### WebSocket Hook
```typescript
function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    // 连接逻辑
    const client = new WsClient();
    client.connect();
    return () => client.disconnect();
  }, []);
  
  return { isConnected, messages, send: client.send.bind(client) };
}
```

## 验收标准
1. ✅ `src/client/src/api/` 包含至少8个API文件
2. ✅ 所有REST API（至少20个接口）已封装
3. ✅ WebSocket客户端完整实现，支持自动重连
4. ✅ React Hook封装完成，易用性好
5. ✅ 统一的错误处理机制
6. ✅ 引用 `src/shared/types/` 的共享类型
7. ✅ 所有测试全部通过

## 相关文件路径
- 目标目录：`src/client/src/api/`
- 规范文档：`docs/api/rest-api.md`, `docs/api/websocket-api.md`
- 共享类型：`src/shared/types/`
- 参考代码：`src/server/src/modules/*/controller.ts`
