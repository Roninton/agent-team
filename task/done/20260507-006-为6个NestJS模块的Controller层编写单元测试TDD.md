# 任务ID: 20260507-006
## 任务名称：为6个NestJS模块的Controller层编写单元测试（TDD）

## 任务概述
按照TDD开发流程，先为6个NestJS模块（agent、group、session、message、task、context）的Controller层编写完整的单元测试。当前覆盖率显示所有Controller的覆盖率都是0%，需要补充测试。

## 上下文信息

### 相关规范文档索引
**Level 0 顶层规范：**
- `.copilot/instruction.md` - SDD→TDD流程规范，第8节"SDD → TDD 流程"

**Level 3 协议层规范：**
- `docs/api/rest-api.md` - 所有REST API接口规范，包含完整的请求/响应格式

**参考已实现的测试：**
- `src/server/src/modules/agent/__test__/agent.service.spec.ts` - Service层测试示例

### 当前状态
- ✅ AgentService 已有部分测试（但未被覆盖率正确统计）
- ❌ AgentController 无测试
- ❌ GroupController 无测试
- ❌ SessionController 无测试
- ❌ MessageController 无测试
- ❌ TaskController 无测试
- ❌ ContextController 无测试

### TDD 流程要求
1. 先写测试用例 → 2. 运行测试确认失败 → 3. 实现代码 → 4. 测试通过 → 5. 重构

## 执行计划

### 阶段一：测试基类与工具准备
1. 创建测试辅助工具 `src/server/src/common/test/test-helpers.ts`
   - Mock 工具函数
   - 通用测试数据生成器
   - NestJS TestingModule 快捷创建方法

2. 为每个Controller创建测试文件
   - 每个文件命名为 `*.controller.spec.ts`

### 阶段二：为每个Controller编写测试
按模块逐一编写，每个Controller至少覆盖：

#### 1. AgentController 测试用例
```typescript
// 测试场景
- GET /agents → 返回所有代理列表
- GET /agents/:id → 返回指定代理详情
- GET /agents/:id/status → 返回代理状态
- POST /agents → 创建新代理
- POST /agents/:id/start → 启动代理
- POST /agents/:id/stop → 停止代理
- POST /agents/:id/restart → 重启代理
- DELETE /agents/:id → 删除代理
- 异常场景：代理不存在、参数错误
```

#### 2. GroupController 测试用例
```typescript
// 测试场景
- GET /groups → 返回所有群组列表
- GET /groups/:id → 返回指定群组详情
- POST /groups → 创建新群组
- PUT /groups/:id → 更新群组信息
- DELETE /groups/:id → 删除群组
- GET /groups/:id/members → 获取群组成员
- POST /groups/:id/members → 添加成员
- DELETE /groups/:id/members/:agentId → 移除成员
- PUT /groups/:id/members/:agentId/role → 更新成员角色
- POST /groups/:id/messages → 发送群组消息
- GET /groups/:id/messages → 获取群组消息
```

#### 3. SessionController 测试用例
```typescript
// 测试场景
- GET /sessions → 获取所有会话
- GET /sessions/:id → 获取会话详情
- POST /sessions → 创建会话
- DELETE /sessions/:id → 删除会话
- GET /sessions/:id/messages → 获取会话消息
- POST /sessions/:id/messages → 发送会话消息
```

#### 4. MessageController 测试用例
```typescript
// 测试场景
- GET /messages → 获取消息列表
- GET /messages/:id → 获取消息详情
- DELETE /messages/:id → 删除消息
- GET /messages/session/:sessionId → 获取会话消息
```

#### 5. TaskController 测试用例
```typescript
// 测试场景
- GET /tasks → 获取任务列表
- GET /tasks/:id → 获取任务详情
- POST /tasks → 创建任务
- PUT /tasks/:id → 更新任务
- DELETE /tasks/:id → 删除任务
- POST /tasks/:id/assign → 分配任务
- POST /tasks/:id/status → 更新任务状态
```

#### 6. ContextController 测试用例
```typescript
// 测试场景
- GET /context/:sessionId → 获取上下文
- PUT /context/:sessionId → 更新上下文
- DELETE /context/:sessionId → 清除上下文
- POST /context/:sessionId/merge → 合并上下文
```

### 阶段三：每个测试文件必须包含
1. **正常流程测试** - 所有成功场景
2. **异常流程测试** - 所有错误场景（404、400等）
3. **边界条件测试** - 空参数、超长参数等
4. **参数验证测试** - DTO验证

### 测试结构示例
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { XxxController } from '../xxx.controller';
import { XxxService } from '../xxx.service';

// Mock Service
jest.mock('../xxx.service', () => ({
  XxxService: jest.fn().mockImplementation(() => ({
    method1: jest.fn(),
    method2: jest.fn(),
  })),
}));

describe('XxxController', () => {
  let controller: XxxController;
  let service: jest.Mocked<XxxService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [XxxController],
      providers: [XxxService],
    }).compile();

    controller = module.get<XxxController>(XxxController);
    service = module.get(XxxService) as any;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('methodName', () => {
    it('should ... when ...', async () => {
      // Arrange
      service.methodName.mockResolvedValue(expectedResult);
      
      // Act
      const result = await controller.methodName(params);
      
      // Assert
      expect(result).toEqual(expectedResult);
      expect(service.methodName).toHaveBeenCalledWith(params);
    });

    it('should throw HttpException when ...', async () => {
      // Arrange
      service.methodName.mockRejectedValue(new Error('error message'));
      
      // Act & Assert
      await expect(controller.methodName(params)).rejects.toThrow(HttpException);
    });
  });
});
```

## 验收标准
1. ✅ 6个Controller都有对应的 `*.controller.spec.ts` 测试文件
2. ✅ 每个Controller至少覆盖80%的API端点
3. ✅ 每个方法至少包含正常流程和异常流程测试
4. ✅ 所有测试遵循 NestJS 测试最佳实践
5. ✅ 运行测试全部通过
6. ✅ Controller层覆盖率 ≥ 80%

## 相关文件路径
- 目标目录：`src/server/src/modules/*/__test__/`
- 参考示例：`src/server/src/modules/agent/__test__/agent.service.spec.ts`
- API规范：`docs/api/rest-api.md`
- Controller代码：`src/server/src/modules/*/*.controller.ts`
