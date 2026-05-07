# 常见问题

本文档整理使用过程中的常见问题及解决方案。

---

## 🔧 安装与启动

### Q: npm install 很慢或失败？
A: 尝试使用国内镜像源：
```bash
npm config set registry https://registry.npmmirror.com
npm run install:all
```

### Q: 后端启动报错，端口被占用？
A: 检查 3001 端口是否被其他程序占用，或者通过配置修改端口：

**方式 1：修改配置文件**
```yaml
# config/config.yml
server:
  port: 8080
```

**方式 2：使用环境变量**
```bash
ACP_SERVER_PORT=8080 npm run dev:server
```

查看端口占用：
```bash
# Linux/Mac
lsof -i :3001
# Windows
netstat -ano | findstr :3001
```

### Q: 启动时提示找不到配置文件？
A: 这是正常的！系统会自动使用默认值。如果需要自定义配置：
```bash
cp config/config.example.yml config/config.yml
# 然后编辑 config/config.yml
```

---

## ⚙️ 配置相关

### Q: 如何修改默认配置？
A: 有三种方式，优先级从高到低：

1. **环境变量**（推荐用于部署）：
```bash
ACP_SERVER_PORT=8080 \
ACP_DB_PATH=/mnt/data/acp.sqlite \
npm run dev:server
```

2. **YAML 配置文件**（推荐用于开发）：
```yaml
# config/config.yml
server:
  port: 8080
  corsOrigin: "https://my-domain.com"
log:
  level: debug
```

3. **修改代码默认值**（不推荐，升级会覆盖）

### Q: 配置文件可以放在其他位置吗？
A: 可以，使用环境变量指定：
```bash
ACP_CONFIG_FILE=/my/custom/path/config.yml npm run dev:server
```

### Q: 如何确认我的配置是否生效？
A: 查看启动日志，或者调用 API：
```bash
curl http://localhost:3001/api/config
```

---

## 💾 数据与备份

### Q: 用户数据存在哪里？
A: 所有运行时数据都在 `data/` 目录下：
```
data/
├── db/acp.sqlite      # 数据库文件
├── logs/                # 日志文件
└── agents/              # 代理工作目录
```

### Q: 如何备份我的数据？
A: 备份以下两个目录/文件即可：
1. **必须备份：`data/db/acp.sqlite`（核心数据库）
2. **建议备份：`config/config.yml`（自定义配置）

备份示例：
```bash
# 备份数据库
cp data/db/acp.sqlite backup/acp-$(date +%Y%m%d).sqlite

# 恢复备份
cp backup/acp-20240501.sqlite data/db/acp.sqlite
```

### Q: Git 会提交我的数据和配置吗？
A: **不会！** 以下内容已在 `.gitignore` 中配置为忽略：
- `data/` 目录下的所有内容
- `config/config.yml` 用户配置
- `.env` 环境变量文件

请放心使用，用户数据不会被意外提交到代码仓库。

---

## 🤖 代理相关

### Q: 代理启动后状态一直是「启动中」？
A:
1. 检查代理命令路径是否正确
2. 查看 `data/logs/` 下的日志文件，确认子进程是否正常启动
3. 确认代理程序本身是否兼容 ACP 协议

### Q: 如何添加自己的代理？
A: 在「设置」页面点击「添加代理」，填写：
- 代理名称
- 启动命令（如 `npx my-agent`）
- 工作目录
- 环境变量（如有需要）

### Q: 最多可以同时启动多少个代理？
A: 默认上限是 10 个，可以通过配置修改：
```yaml
# config/config.yml
agent:
  maxInstances: 20
```

---

## 💬 消息相关

### Q: 发送消息后收不到回复？
A: 按以下顺序排查：
1. 确认代理状态是「运行中」
2. 检查浏览器 Console 是否有报错
3. 检查 `data/logs/` 下的后端日志是否有报错
4. 确认代理程序本身是否正常工作

### Q: WebSocket 连接断开？
A:
1. 刷新页面试试
2. 检查后端服务是否还在运行
3. 确认没有网络代理或防火墙拦截 WebSocket

---

## 📊 性能相关

### Q: 聊天记录很多时页面卡顿？
A: 这是已知的前端性能优化点，可以：
1. 定期清理历史消息
2. 前端实现虚拟列表（待优化）

### Q: 同时启动很多代理后系统变慢？
A: 每个代理都是独立 Node.js 子进程，会占用内存：
1. 默认建议同时运行不超过 5 个代理
2. 根据机器配置调整 `agent.maxInstances` 上限

---

## ❓ 其他问题

### Q: 支持分布式部署吗？
A: 当前版本是单机架构，但设计上预留了扩展空间：
- 数据库可以换成 PostgreSQL
- 代理进程管理可以抽成独立服务
- WebSocket 可以配合 Redis 做消息队列

### Q: 版本号是什么意思？
A: 当前版本 `0.5.0` 是 Alpha 版本：
- ✅ 核心架构稳定
- ✅ 单元测试 100% 通过
- ⏳ 尚未经过生产环境验证

版本号规则：
- `0.1.0 ~ 0.5.0`: Alpha - 核心功能完成
- `0.6.0 ~ 0.9.9`: Beta - 实际环境测试，逐步稳定
- `1.0.0+`: 正式版 - 生产环境可用

---

## 💡 问题反馈

如果没有找到您的问题，欢迎：
1. 先检查 GitHub Issues 是否已有类似问题
2. 新建 Issue 时附上：
   - 操作步骤
   - 报错截图
   - 浏览器和系统版本
   - Node.js 版本
   - 配置信息（可通过 `GET /api/version`）

---

## 📚 相关文档

- [快速开始](./quick-start.md)
- [开发者配置指南](../developer/configuration.md)
- [SDD 架构规范](../../docs/specs/architecture/tech-stack-and-architecture.md)
