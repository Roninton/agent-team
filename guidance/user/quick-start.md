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

## 🛠️ 自定义代理开发

### 编写一个简单的测试代理

您可以轻松创建自己的ACP代理，以下是一个最简单的echo代理示例：

1. 创建新文件 `agents/echo_agent.py`：
```python
#!/usr/bin/env python3
import sys
import json

def main():
    print("Echo代理已启动，等待输入...", file=sys.stderr)
    
    while True:
        line = sys.stdin.readline()
        if not line:
            break
            
        try:
            request = json.loads(line)
            if request.get('type') == 'message':
                content = request.get('content', '')
                response = {
                    "type": "message",
                    "content": f"收到你的消息：{content}\n我是Echo测试代理，你说的我都会原样返回！",
                    "metadata": {
                        "agent": "echo",
                        "version": "1.0.0"
                    }
                }
                print(json.dumps(response), flush=True)
        except Exception as e:
            print(f"处理消息出错：{e}", file=sys.stderr)

if __name__ == "__main__":
    main()
```

2. 给文件添加执行权限：
```bash
chmod +x agents/echo_agent.py
```

### 对接自定义代理

在平台中添加您的自定义代理：
1. 进入「设置」页面，点击「添加代理」按钮
2. 填写代理信息：
   - 代理名称：Echo测试代理
   - 代理类型：选择「本地命令」
   - 执行命令：`python agents/echo_agent.py`
   - 限流设置：根据需要设置，建议不低于1条/分钟
3. 点击「保存」，然后点击「启动」按钮即可使用

### 代理协议说明
ACP代理通过标准输入输出进行通信：
- 平台发送JSON格式的消息到代理的stdin
- 代理处理完成后将JSON响应输出到stdout
- 日志和调试信息请输出到stderr，不会影响正常通信

---

## ❓ 常见问题排查

### 启动问题
**Q：后端启动报错 "Cannot find module './dist/main'"**
A：请先执行一次编译：`npm run build:server`，然后再启动开发服务。

**Q：前端启动后页面空白，控制台有CORS错误**
A：确认后端服务是否正常启动，检查`config/config.yml`中的`corsOrigin`配置是否包含`http://localhost:5173`。

**Q：启动代理时报错 "command not found"**
A：检查代理执行命令是否正确，路径是否存在，相关依赖是否已安装。

### 使用问题
**Q：发送消息后没有回复**
A：1. 确认代理是否已启动（设置页面状态为运行中）
2. 检查代理日志：查看终端输出是否有报错信息
3. 确认代理的输入输出格式是否符合ACP协议规范

**Q：代理启动后马上退出**
A：1. 检查代理命令是否正确，是否有执行权限
2. 查看代理的错误日志，确认是否缺少依赖或配置
3. 尝试手动在终端执行代理命令，看是否能正常运行

### 性能问题
**Q：多个代理同时运行时响应变慢**
A：1. 检查系统资源占用，CPU和内存是否足够
2. 调整每个代理的限流配置，避免同时处理过多请求
3. 可以考虑将频繁使用的代理部署到独立的服务器上

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
