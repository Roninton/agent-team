# 配置系统使用指南

本文档详细说明 ACP Platform 的配置系统，包括配置项说明、修改方式、优先级等。

---

## 📁 配置文件位置

### 推荐位置：`config/config.yml`

将 `config/config.example.yml` 复制为 `config/config.yml` 即可开始自定义配置。

### 配置文件搜索顺序（优先级从高到低）

启动时按以下顺序搜索配置文件，找到即停止：

1. **环境变量指定**：`ACP_CONFIG_FILE=/path/to/config.yml`
2. **系统级**：`/etc/acp-platform/config.yml` (Linux)
3. **用户级**：`~/.config/acp-platform/config.yml`
4. **项目级**：`./config/config.yml` ✅ 推荐
5. **默认值**：如以上都未找到，使用代码默认值

---

## ⚖️ 三级配置优先级

```
优先级从高到低：

1. 环境变量 (ACP_* 前缀)   ← 最高优先级，部署时用
2. YAML 配置文件 (config.yml)  ← 次之，自定义配置
3. 代码默认值 (config.default.ts) ← 最低，兜底
```

**注意：** 环境变量的值始终覆盖配置文件中的值，配置文件的值始终覆盖默认值。

---

## 📋 完整配置项清单

### Server 配置

| YAML 路径 | 环境变量 | 默认值 | 说明 |
|-----------|---------|--------|------|
| `server.port` | `ACP_SERVER_PORT` | `3001` | 后端服务监听端口 |
| `server.host` | `ACP_SERVER_HOST` | `'0.0.0.0'` | 监听地址，`0.0.0.0` 允许外部访问 |
| `server.corsOrigin` | `ACP_CORS_ORIGIN` | `'*'` | CORS 允许的源，生产环境建议设置为具体域名 |

### Database 配置

| YAML 路径 | 环境变量 | 默认值 | 说明 |
|-----------|---------|--------|------|
| `database.path` | `ACP_DB_PATH` | `'./data/db/acp.sqlite'` | SQLite 数据库文件路径 |

### Log 配置

| YAML 路径 | 环境变量 | 默认值 | 说明 |
|-----------|---------|--------|------|
| `log.path` | `ACP_LOG_PATH` | `'./data/logs'` | 日志文件存放目录 |
| `log.level` | `ACP_LOG_LEVEL` | `'info'` | 日志级别：`debug` / `info` / `warn` / `error` |

### Data 配置

| YAML 路径 | 环境变量 | 默认值 | 说明 |
|-----------|---------|--------|------|
| `data.root` | `ACP_DATA_ROOT` | `'./data'` | 运行时数据根目录 |

### Agent 配置

| YAML 路径 | 环境变量 | 默认值 | 说明 |
|-----------|---------|--------|------|
| `agent.maxInstances` | `ACP_MAX_AGENTS` | `10` | 同时运行的代理数量上限 |
| `agent.workDir` | `ACP_AGENT_WORKDIR` | `'./data/agents'` | 代理进程工作目录 |

### Advanced 配置

| YAML 路径 | 默认值 | 说明 |
|-----------|--------|------|
| `advanced.autoCreateDirs` | `true` | 启动时自动创建缺失的目录 |
| `advanced.printConfigOnStartup` | `false` | 启动时打印完整配置（调试用） |

---

## 🚀 配置使用示例

### 示例 1：使用 YAML 配置文件

```yaml
# config/config.yml
server:
  port: 8080
  corsOrigin: "https://my-acp.example.com"

log:
  level: debug

agent:
  maxInstances: 20
```

启动服务：
```bash
npm run dev:server
```

### 示例 2：使用环境变量（部署时推荐）

```bash
# 临时修改端口
ACP_SERVER_PORT=9000 npm run dev:server

# 完整自定义
ACP_SERVER_PORT=8080 \
ACP_DB_PATH=/mnt/acp-data/db/acp.sqlite \
ACP_LOG_LEVEL=warn \
npm run dev:server
```

### 示例 3：混合使用（环境变量优先）

```yaml
# config/config.yml
server:
  port: 8080
  host: 0.0.0.0
```

```bash
# 环境变量会覆盖配置文件中的 port
ACP_SERVER_PORT=9000 npm run dev:server
# 实际端口是 9000，host 是 0.0.0.0
```

---

## 💾 数据目录说明

### 目录结构（自动创建）

```
data/                       # 运行时数据目录（git 忽略，需要备份）
├── db/                     # SQLite 数据库文件
│   └── acp.sqlite         # 主数据库
├── logs/                   # 日志文件
│   ├── server.log         # 服务日志
│   └── agent-*.log        # 代理日志
└── agents/                 # 代理工作目录
    ├── agent-1/           # 每个代理独立目录
    └── agent-2/
```

### 备份策略

**必须定期备份的内容：**
1. `data/db/acp.sqlite` - 核心数据库（群组、代理、任务等数据）
2. `config/config.yml` - 自定义配置

**建议备份频率：** 每天一次，保留最近 7 天的备份。

---

## 🛠️ 开发者注意事项

### 在代码中读取配置

✅ **正确方式 - 使用 ConfigService**

```typescript
import { ConfigService } from './config/config.service';

@Injectable()
export class YourService {
  constructor(private configService: ConfigService) {}

  someMethod() {
    // 读取嵌套配置
    const port = this.configService.get<number>('server.port');
    
    // 读取代理配置
    const maxAgents = this.configService.get<number>('agent.maxInstances');
    
    // 读取版本号
    const version = this.configService.getVersion();
  }
}
```

❌ **错误方式 - 禁止直接读取环境变量**

```typescript
// 不要这样写！
const port = process.env.ACP_SERVER_PORT || 3001;
```

### 添加新配置项的流程

1. 在 `config.default.ts` 中添加默认值
2. 在 `config.loader.ts` 中添加环境变量映射（如有需要）
3. 更新 `config/config.example.yml` 模板
4. 更新本文档和 SDD 规范文档
5. 添加对应的单元测试

---

## ❓ 常见问题

### Q1: 修改配置后需要重启服务吗？

A: 是的，当前版本配置只在服务启动时加载一次，修改后需要重启服务。热重载功能在后续版本规划中。

### Q2: 配置文件可以放在其他位置吗？

A: 可以，使用 `ACP_CONFIG_FILE` 环境变量指定：

```bash
ACP_CONFIG_FILE=/my/custom/path/config.yml npm run dev:server
```

### Q3: 如何确认配置是否生效？

A: 启动日志会打印版本号和数据目录路径，或者调用 API 查看：

```bash
curl http://localhost:3001/api/config
```

### Q4: Git 会提交我的配置文件吗？

A: 不会，`config/config.yml` 和 `data/` 目录都已经在 `.gitignore` 中配置为忽略，用户数据不会被意外提交。

---

## 📚 相关文档

- [SDD 架构规范](../docs/specs/architecture/tech-stack-and-architecture.md)
- [开发规范](../docs/DEVELOPMENT_GUIDELINE.md)
