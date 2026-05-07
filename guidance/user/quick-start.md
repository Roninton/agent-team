# 5 分钟快速上手

本指南将帮助您在 5 分钟内启动并使用多 AI 协作平台。

---

## 📋 前置条件

- Node.js ≥ 18
- npm ≥ 9
- 至少一个兼容 ACP 协议的 AI 代理（可选，平台内置模拟代理）

---

## 🚀 三步启动平台

### 第 1 步：安装依赖

在项目根目录执行：

```bash
npm run install:all
```

这个命令会同时安装：
- 根目录依赖
- `src/server` 后端依赖
- `src/client` 前端依赖

⏱️ 预计耗时：1~2 分钟

---

### 第 2 步：启动后端服务

```bash
npm run dev:server
```

后端服务会在 `http://localhost:3001` 启动

看到以下输出表示启动成功：
```
[Nest] 12345  - LOG [RouterExplorer] Mapped {/api/agent, GET} route
[Nest] 12345  - LOG [NestApplication] Nest application successfully started
```

⏱️ 预计耗时：10 秒

---

### 第 3 步：启动前端应用

**新开一个终端窗口**，执行：

```bash
npm run dev:client
```

前端应用会在 `http://localhost:5173` 启动

在浏览器打开这个地址，您会看到聊天界面！

🎉 **恭喜！平台已经启动成功！**

---

## 💬 第一次使用体验

### 1. 查看默认代理

点击顶部导航栏的「设置」，您会看到 3 个预配置的代理：
- 代码专家 - 专门编写和审查代码
- 架构师 - 负责系统设计和架构决策
- 测试专家 - 专注测试用例设计和质量保证

每个代理旁边有一个开关，点击即可启动/停止。

### 2. 启动一个代理

点击「代码专家」的启动开关，等待状态变为「运行中」。

### 3. 开始聊天

回到「聊天」页面，在输入框输入：
```
帮我写一个快速排序算法
```

按回车发送，很快就能收到代码专家的回复！

### 4. 使用群组

点击「群组」页面，您会看到预配置的 3 个群组：
- 编程协作组（代码专家 + 架构师 + 测试专家）
- 代码审查组（代码专家 + 测试专家）
- 架构设计组（架构师 + 代码专家）

选择一个群组开始聊天，消息会发送给群组内所有代理！

---

## ✅ 验证所有功能

按照以下顺序快速走一遍，确认平台正常工作：

1. ✅ 前端页面加载正常
2. ✅ 能看到默认代理列表
3. ✅ 能启动/停止代理
4. ✅ 能发送消息并收到回复
5. ✅ 能看到群组列表
6. ✅ WebSocket 实时消息正常

---

## 📚 下一步学习

- 了解群聊高级功能：[`features/multi-agent-chat.md`](./features/multi-agent-chat.md)
- 学习群组管理：[`features/group-management.md`](./features/group-management.md)
- 配置自定义代理：[`features/agent-config.md`](./features/agent-config.md)
- 常见问题：[`faq.md`](./faq.md)
