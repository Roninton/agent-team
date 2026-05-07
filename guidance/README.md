# 项目指南总入口

欢迎使用多 AI 协作平台指南文档。

> ℹ️ **阅读前请注意：**
> - 如果您是**普通用户**，想快速上手使用，请直接阅读 → [`user/README.md`](./user/README.md)
> - 如果您是**开发人员**，想理解架构、分析瓶颈、二次开发，请阅读 → [`developer/README.md`](./developer/README.md)
> - 如果您是**测试人员**，想了解 E2E 测试方案，请阅读 → [`testing/e2e/README.md`](./testing/e2e/README.md)
> - 如果您是**核心开发人员**，想了解设计规范，请先阅读 → [`docs/SPEC_INDEX.md](../docs/SPEC_INDEX.md)

---

## 文档分层原则

本项目文档分为两类，优先级不同：

### 1. `docs/` - 核心设计文档（高优先级）
- SDD 规范文档：开发前必须阅读，代码必须与之对齐
- 包括架构设计、功能规范、协议定义、UI 规范
- 这是**设计时文档，决定了代码怎么写

### 2. `guidance/` - 衍生使用文档（低优先级）
- 使用指南、开发者教程、测试指南
- 这是**运行时/维护时文档**，帮助理解和使用已有的代码

---

## 导航地图

```
guidance/
├── user/                    # 用户使用文档
│   ├── README.md           # 👈 用户指南入口
│   ├── quick-start.md      # 5分钟快速上手
│   ├── features/          # 功能详解
│   └── faq.md             # 常见问题
│
├── developer/               # 开发者指南
│   ├── README.md           # 👈 开发者指南入口
│   ├── architecture/        # 架构分层详解
│   │   ├── 01-overview.md
│   │   ├── 02-client-layer.md
│   │   ├── 03-server-layer.md
│   │   ├── 04-shared-layer.md
│   │   ├── 05-data-flow.md
│   │   └── 06-performance-analysis.md  # 瓶颈分析方法论
│   ├── setup/             # 开发环境搭建
│   └── testing/           # 单元测试指南
│
└── testing/                 # 测试指南
    ├── e2e/               # E2E 测试指南
    │   ├── README.md         # 👈 E2E 测试入口
    │   ├── test-cases/      # 测试用例列表
    │   ├── tools.md        # 工具配置
    │   └── ci-cd.md        # CI/CD 集成
    └── coverage.md         # 测试覆盖率目标
```

---

## 与 SDD 规范的关系

```
SDD 规范文档 (docs/specs/)
    ↓ 设计时
代码实现
    ↓ 开发完成
衍生指南文档 (guidance/)
```

- SDD 规范决定了代码如何设计
- 指南文档解释了代码如何使用和维护
- **当 SDD 与代码不一致时，以代码为准，更新 SDD
- 当代码更新时，同步更新指南文档
