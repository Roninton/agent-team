# 开发者指南

欢迎来到多 AI 协作平台开发者指南！

> 📚 **阅读顺序建议**:
> 1. 先阅读 [`architecture/01-overview.md`](./architecture/01-overview.md) - 整体架构概览
> 2. 根据需要深入对应层级的详细文档
> 3. 最后阅读 [`architecture/06-performance-analysis.md`](./architecture/06-performance-analysis.md) - 瓶颈分析方法论

---

## 本指南解决的问题

1. **架构是如何分层的？** → 见 `architecture/` 系列文档
2. **每个模块的职责边界是什么？** → 见各层详解
3. **数据在系统中是如何流动的？** → 见 `05-data-flow.md`
4. **如何定位性能瓶颈？** → 见 `06-performance-analysis.md`
5. **如何搭建开发环境？** → 见 `setup/` 目录
6. **如何写单元测试？** → 见 `testing/` 目录

---

## 文档导航

### 📐 架构分层详解

| 文档 | 内容 | 适用场景 |
|------|------|---------|
| [`01-overview.md`](./architecture/01-overview.md) | 整体架构概览、三层解耦设计、模块依赖关系图 | 首次阅读、全局理解 |
| [`02-client-layer.md`](./architecture/02-client-layer.md) | 前端展示层详解、页面结构、数据流 | 前端开发、UI 调优 |
| [`03-server-layer.md`](./architecture/03-server-layer.md) | 后端服务层详解、6 个核心模块分析 | 后端开发、逻辑调优 |
| [`04-shared-layer.md`](./architecture/04-shared-layer.md) | 共享层详解、类型系统、工具函数 | 全栈开发、类型同步 |
| [`05-data-flow.md`](./architecture/05-data-flow.md) | 5 个核心场景完整调用链 | 调试、问题定位 |
| [`06-performance-analysis.md`](./architecture/06-performance-analysis.md) | 瓶颈分析方法论、工具、常见瓶颈点 | 性能优化、架构评审 |

### 🛠️ 开发环境

| 文档 | 内容 |
|------|------|
| [`setup/local-development.md`](./setup/local-development.md) | 本地开发环境搭建步骤 |
| [`setup/debugging.md`](./setup/debugging.md) | VS Code 调试配置、常用调试技巧 |

### 🧪 测试相关

| 文档 | 内容 |
|------|------|
| [`testing/unit-testing.md`](./testing/unit-testing.md) | 单元测试编写指南、各层测试最佳实践 |
| **E2E 测试** | 见 [`guidance/testing/e2e/`](../testing/e2e/) |

---

## 快速开始开发

### 前置要求
- Node.js ≥ 18
- npm ≥ 9

### 启动开发环境

```bash
# 1. 安装所有依赖
npm run install:all

# 2. 启动后端服务 (端口 3001)
npm run dev:server

# 3. 新开终端，启动前端 (端口 5173)
npm run dev:client

# 4. 运行测试
npm test
```

### 代码目录速查

```
src/
├── client/           # 前端
│   └── src/pages/    # 3 个核心页面
├── server/           # 后端
│   └── src/modules/  # 6 个核心模块
└── shared/           # 共享层
```

---

## 性能分析核心思路

**先定位层级，再定位模块**

1. **前端瓶颈?** → React 重渲染、大列表
2. **后端瓶颈?** → 哪个模块？（Agent 进程？消息存储？）
3. **跨层交互瓶颈?** → API 调用、WebSocket 推送频率
4. **基础设施瓶颈?** → 数据库查询、进程开销

详见：[`06-performance-analysis.md`](./architecture/06-performance-analysis.md)

---

## 重要提醒

⚠️ **开发前请务必阅读 SDD 规范文档**

本指南是**代码实现的解释文档**，而 SDD 规范是**设计约束文档**。

所有代码必须遵循：[`docs/SPEC_INDEX.md`](../../docs/SPEC_INDEX.md)
