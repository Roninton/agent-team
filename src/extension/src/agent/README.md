# Agent模块
对应SDD架构层：代理调度子系统

## 职责
- Agent进程的生命周期管理（启动、停止、重启）
- Agent资源隔离与限流控制
- Agent配置文件管理（agent.md、instruction.md）
- Agent能力标签、状态管理
- 负载均衡与代理池管理
---
## 子目录
- `core/`：核心业务逻辑实现
- `types/`：TypeScript类型定义
- `services/`：对外提供的服务接口
- `__test__`：测试用例
