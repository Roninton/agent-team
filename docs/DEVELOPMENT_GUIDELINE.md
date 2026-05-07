# 基于SDD（Specification-Driven Development）开发规范

## 项目名称
VS Code 多AI协作平台（Multi-Agent Collaboration Platform）

## 开发原则
根据需求复杂度灵活选择开发模式，所有功能最终都需要沉淀为规范文档：

### 三种开发模式适配
#### 1. 完整SDD模式（默认，适用于复杂核心功能）
- 适用场景：架构调整、核心模块开发、复杂业务功能
- 流程：先写完整SDD规范 → 评审通过 → TDD编写测试 → 功能实现 → 验收
- 要求：所有细节必须在规范中明确，无歧义

#### 2. PDD模式（Prompt-Driven Development，适用于轻量快速迭代）
- 定位：SDD弱化版，轻量化敏捷开发模式
- 适用场景：小功能迭代、bug修复、新功能快速探索验证
- 流程：清晰的prompt需求描述 → 快速实现验证 → 迭代稳定后沉淀为正式SDD
- 要求：功能上线前必须完成对应的SDD文档沉淀

#### 3. SDD中间态模式
- 适用场景：需求部分明确，需要边开发边完善细节
- 规则：SDD文档标记"WIP"状态，明确当前版本和未完善部分
- 核心需求明确即可进入开发，细节可以逐步补充完善
- 功能上线前必须完成SDD文档最终版

## 文档结构
```
docs/
├── specs/                  # 规范文档目录
│   ├── architecture/       # 架构设计规范
│   ├── features/           # 功能需求规范
│   ├── protocol/           # 协议扩展规范
│   └── ui/                 # UI设计规范
├── api/                    # API文档
├── user/                   # 用户文档
└── DEVELOPMENT_GUIDELINE.md # 本文件
```

## 规范文档模板
每个规范文档必须包含：
1. 目的与范围
2. 需求说明
3. 设计方案/接口定义
4. 交互流程（如果有）
5. 验收标准
6. 变更记录

## 开发模式选择与切换规则
### 选择标准
| 需求类型 | 复杂度 | 推荐模式 |
|----------|--------|----------|
| 核心功能、架构调整 | 高 | SDD完整模式 |
| 新功能模块开发 | 中 | SDD中间态模式 |
| bug修复、小功能优化、快速验证 | 低 | PDD模式 |

### 切换规则
- PDD模式开发的功能迭代2-3个版本稳定后，必须切换为SDD模式完成规范沉淀
- SDD中间态模式在所有需求明确后，必须升级为正式SDD文档
- 任何模式下发现需求复杂度超过当前模式适配范围，必须升级到更严格的模式

## 目录约定
- 所有新增的设计文档必须放在`docs/specs/`对应的子目录下
- 文档命名采用小写+短横线格式，例如：`multi-agent-group-chat.md`
- 每次提交代码前必须确保相关规范文档已同步更新
- PDD示例模板存放在`docs/templates/pdd-task-template.md`

---

## 配置开发规范（强制执行）

### 基本原则
所有配置必须通过 `ConfigService` 统一管理，**禁止直接读取 `process.env`**

### 正确示例 ✅
```typescript
@Injectable()
export class AgentService {
  constructor(private configService: ConfigService) {}
  
  someMethod() {
    const maxAgents = this.configService.get('agent.maxInstances');
    // 使用配置
  }
}
```

### 错误示例 ❌
```typescript
// 禁止！散落在各个文件中的环境变量读取
const maxAgents = process.env.ACP_MAX_AGENTS || 10;
```

### 配置变更流程
1. 修改 `src/server/src/config/config.default.ts` 添加默认值
2. 更新 `config.loader.ts` 添加环境变量映射（如有需要）
3. 更新 `config/config.example.yml` 模板
4. 更新 SDD 文档（`docs/specs/architecture/tech-stack-and-architecture.md`）
5. 更新 Guidance 文档（`guidance/developer/configuration.md`）

### 三级配置优先级
```
环境变量 (ACP_* 前缀)
    ↓ 优先级最高
YAML 配置文件 (config/config.yml)
    ↓ 优先级次之
代码默认值 (config.default.ts)
    ↓ 优先级最低，兜底
```
