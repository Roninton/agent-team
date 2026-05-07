# 多AI协作平台 (ACP Platform)

基于 ACP (Agent Client Protocol) 协议的多 AI 代理协作 Web 平台，采用三层解耦架构设计，支持多代理并行连接、AI 群组协作、实时消息路由。

> ✅ **项目状态**: 核心架构稳定，TDD 测试覆盖完整，SDD 规范与实现 100% 对齐

---

## 🎯 项目定位

- **产品形态**: 独立 Web 应用（前后端分离）
- **核心场景**: 多 AI 代理协同工作环境
- **设计理念**: SDD 规范驱动 + TDD 测试驱动 + 三层解耦架构

---

## 📚 文档导航

| 文档类型 | 入口位置 | 目标读者 | 说明 |
|---------|---------|---------|------|
| 🔧 **设计规范** | `docs/SPEC_INDEX.md` | 核心开发人员 | SDD 架构/功能/协议/UI 规范，开发前必须阅读 |
| 👤 **用户指南** | `guidance/user/README.md` | 终端用户 | 快速上手使用平台 |
| 👨‍💻 **开发者指南** | `guidance/developer/README.md` | 开发人员 | 架构分层详解、瓶颈分析方法论、二次开发 |
| 🧪 **E2E 测试指南** | `guidance/testing/e2e/README.md` | 测试人员 | 集成测试用例、边界场景覆盖 |
| 📡 **API 文档** | `docs/api/` | 前后端开发 | REST API + WebSocket 协议 |

---

## 🛠️ 技术栈

### 后端服务层
- **NestJS 11** - 企业级 Node.js 模块化框架
- **TypeScript 6** - 类型安全
- **Socket.IO 4** - 实时双向通信
- **TypeORM** + **SQLite** - 轻量级数据持久化
- **ACP SDK** - AI 代理通信协议适配
- **Jest** - 单元测试框架

### 前端展示层
- **React 18** - 声明式 UI 框架
- **TypeScript 6** - 类型安全
- **Ant Design 6** - 企业级 UI 组件库
- **Vite 6** - 极速构建工具
- **Vitest** - 前端单元测试

### 共享层
- 统一 TypeScript 类型定义
- 通用工具函数、校验逻辑
- 前后端 100% 类型同步

---

## 📁 项目结构

```
acp-platform/
├── src/
│   ├── client/             # 前端 React 应用
│   │   ├── src/pages/      # ChatPage / GroupPage / SettingsPage
│   │   ├── src/api/        # REST + WebSocket 客户端封装
│   │   └── src/__test__/   # 前端单元测试 (13 个用例)
│   ├── server/             # 后端 NestJS 应用
│   │   ├── src/modules/    # 6 个核心业务模块
│   │   │   ├── agent/      # 代理生命周期管理
│   │   │   ├── group/      # 群组管理
│   │   │   ├── session/    # 会话状态管理 + WebSocket
│   │   │   ├── message/    # 消息路由与存储
│   │   │   ├── task/       # 任务状态追踪
│   │   │   └── context/    # 上下文同步
│   │   └── src/__test__/   # 后端单元测试 (203 个用例)
│   └── shared/             # 前后端共享
│       ├── types/          # 统一类型定义
│       ├── utils/          # 通用工具函数
│       └── __test__/       # 共享层测试 (49 个用例)
├── docs/                   # 核心设计文档（高优先级）
│   ├── SPEC_INDEX.md       # 规范文档总索引
│   ├── specs/              # SDD 架构/功能/协议/UI 规范
│   └── api/                # REST + WebSocket API 定义
├── guidance/               # 衍生使用文档（低优先级）
│   ├── user/               # 用户使用指南
│   ├── developer/          # 开发者指南 + 架构详解
│   └── testing/            # E2E 测试指南
├── task/                   # 任务跟踪与开发记录
└── package.json            # 统一脚本入口
```

---

## ✨ 已实现核心功能

| 模块 | 功能描述 | 状态 |
|------|---------|------|
| 🔗 **Agent 代理管理** | 多代理并行连接、独立子进程隔离、限流配置、生命周期管理 | ✅ 完成 |
| 👥 **Group 群组管理** | 创建/编辑/删除群组、代理成员管理、默认群组预置 | ✅ 完成 |
| 💬 **Message 消息路由** | 消息存储、多维度索引、@提及支持、WebSocket 实时推送 | ✅ 完成 |
| 📡 **Session 会话管理** | 会话状态追踪、代理-会话映射、WebSocket 网关 | ✅ 完成 |
| 📋 **Task 任务追踪** | 任务 CRUD、状态机、代理/群组关联 | ✅ 完成 |
| 🔄 **Context 上下文同步** | 上下文共享、版本管理 | ✅ 完成 |

---

## 🧪 测试覆盖

```
✅ 前端: 13 个测试用例全部通过
✅ 后端: 203 个测试用例全部通过
✅ 共享层: 49 个测试用例全部通过
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计: 265 个单元测试，100% 通过率
```

## 快速开始

### 安装依赖

```bash
npm run install:all
```

### 开发模式

**启动后端服务 (端口 3000):**
```bash
npm run dev:server
```

**启动前端应用 (端口 5173):**
```bash
npm run dev:client
```

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
npm run test
```

## 预配置代理

平台支持所有兼容ACP协议的AI代理：

| Agent | Command |
|-------|---------|
| GitHub Copilot | `npx @github/copilot-language-server@latest --acp` |
| Claude Code | `npx @zed-industries/claude-code-acp@latest` |
| Gemini CLI | `npx @google/gemini-cli@latest --experimental-acp` |
| Qwen Code | `npx @qwen-code/qwen-code@latest --acp --experimental-skills` |
| Auggie CLI | `npx @augmentcode/auggie@latest --acp` |
| Qoder CLI | `npx @qoder-ai/qodercli@latest --acp` |

## 开发规范

本项目采用 **Specification Driven Development (SDD)** 规范驱动开发模式：

- 所有核心功能必须先有规范文档
- 规范文档位于 `docs/specs/` 目录
- 遵循分层架构设计，职责清晰
- 测试跟随代码，每个模块有独立测试用例

详细规范请参考 `docs/DEVELOPMENT_GUIDELINE.md`

## API文档

- REST API: `docs/api/rest-api.md`
- WebSocket协议: `docs/api/websocket-api.md`

## 环境要求

- Node.js 18+
- npm 9+

### Build & Run

```bash
npm run compile    # One-time build
npm run watch      # Watch mode for development
```

Press `F5` in VS Code to launch the Extension Development Host.

### Testing

```bash
npm run pretest    # Compile tests + lint
npm test           # Run tests
```

### Packaging

```bash
npm run package    # Production build
npx @vscode/vsce package   # Create .vsix
```

## Architecture

The extension follows a modular architecture:

- **Core**: `AgentManager`, `ConnectionManager`, `SessionManager`, `AcpClientImpl`
- **Handlers**: `FileSystemHandler`, `TerminalHandler`, `PermissionHandler`, `SessionUpdateHandler`
- **UI**: `SessionTreeProvider`, `ChatWebviewProvider`, `StatusBarManager`
- **Config**: `AgentConfig`, `RegistryClient`
- **Utils**: `Logger`, `StreamAdapter`

Communication with agents uses the ACP protocol (JSON-RPC 2.0 over stdio).

## Known Issues

- Agents must be available via the system PATH or `npx`
- Some agents may require additional authentication setup
- File attachment feature is not yet functional

## Links

- [Agent Client Protocol (ACP) 官方文档](https://agentclientprotocol.com/)

## 核心特性（新增）

- 🤖 **多AI群组管理**：支持自定义AI团队，配置主管+多个Worker角色
- ⚡ **并行任务执行**：多个AI Worker可以同时处理不同任务，提升效率
- 📋 **智能任务分配**：AI主管自动拆解任务、分配合适的Worker、同步上下文
- 💬 **群聊式交互**：统一聊天界面查看所有AI成员的工作过程和结果
- 🔒 **独立上下文隔离**：每个AI代理有自己独立的进程和会话上下文
- ⚙️ **灵活配置**：每个代理可独立配置API密钥、模型参数、权限策略

## License

MIT — see [LICENSE](LICENSE) for details.
