# 前端页面设计规范

## 1. 概述
本文档定义项目前端页面的设计规范、组件使用规范、页面结构规范、测试规范，确保所有前端页面具有一致的风格和质量标准。

## 2. 页面类型与职责
项目包含以下核心页面，每个页面职责单一：

| 页面名称 | 路由 | 核心职责 |
|----------|------|----------|
| ChatPage | /chat | 多代理群聊界面，消息发送与接收 |
| GroupPage | /group | 代理群组管理，创建/编辑/删除群组 |
| SettingsPage | /settings | 代理配置管理，启停代理，配置代理参数 |

## 3. 页面结构规范

### 3.1 通用页面结构
```tsx
import { useState } from 'react';
import { Card, Button, ... } from 'antd';

// 1. 类型定义（页面内部使用）
interface PageDataType {
  id: string
  name: string
  // ... 其他字段
}

const PageName = () => {
  // 2. 状态定义：data, modal状态, form等
  const [data, setData] = useState<PageDataType[]>([...]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PageDataType | null>(null);
  const [form] = Form.useForm();

  // 3. 事件处理函数：增删改查操作
  const handleAdd = () => { ... };
  const handleEdit = () => { ... };
  const handleDelete = () => { ... };
  const handleSave = () => { ... };

  // 4. 渲染：Card + List/Table + Modal
  return (
    <div>
      <Card title="页面标题" extra={<Button>操作按钮</Button>}>
        <List ... />
      </Card>

      <Modal>
        <Form>...</Form>
      </Modal>
    </div>
  );
};

export default PageName;
```

### 3.2 组件使用规范
- **必须**使用 Ant Design 组件库，不允许使用其他UI库
- **必须**使用统一的图标：`@ant-design/icons`
- **推荐**使用的组件：
  - 布局：`Card`, `Layout`, `Space`, `Divider`
  - 列表：`List`, `Table`
  - 表单：`Form`, `Input`, `Select`, `Switch`, `Button`
  - 反馈：`Modal`, `message`, `Tag`, `Alert`
  - 数据展示：`Avatar`, `Badge`, `Progress`

### 3.3 样式规范
- **禁止**使用内联样式（除了简单的margin/padding）
- **推荐**使用 TailwindCSS 或 CSS Modules
- **必须**保持与设计系统一致的主题色
- 主色：`#1890ff`
- 成功色：`#52c41a`
- 警告色：`#faad14`
- 错误色：`#ff4d4f`

### 3.4 元素标识符规范
为了便于测试定位和CSS选择器，**必须**为关键交互元素分配明确的标识符，遵循以下规范：

#### 3.4.1 id 规范（测试优先）
- **必须**为所有可交互元素添加 `id` 属性
- 命名格式：`[模块名]-[元素类型]-[功能描述]`
- 使用 `id` 而不是 `data-testid`，因为：
  - id是标准HTML属性，所有工具都支持
  - querySelector可以直接使用#id选择器，性能更好
  - 本项目为单页应用，不存在id冲突问题

```tsx
// ✅ 推荐
<Button id="settings-add-agent-btn" type="primary">
  添加代理
</Button>
<List.Item id="settings-agent-item-1">
  {/* ... */}
</List.Item>

// ❌ 禁止
<Button id="btn1">添加代理</Button>
<Button className="my-btn">添加代理</Button>
```

#### 3.4.2 常用id命名模式
| 元素类型 | 命名前缀 | 示例 |
|----------|----------|------|
| 按钮 | `*-btn` | `settings-add-btn`, `chat-send-btn` |
| 输入框 | `*-input` | `agent-name-input`, `message-input` |
| 列表项 | `*-item-*` | `group-item-1`, `session-item-2` |
| 卡片/容器 | `*-card` | `agent-config-card`, `chat-messages-card` |
| 开关/选择器 | `*-switch` | `agent-enabled-switch`, `notification-switch` |
| 模态框 | `*-modal` | `create-group-modal`, `edit-agent-modal` |

#### 3.4.3 className 规范
- className用于样式，不用于测试定位
- 命名格式：`acp-[页面名]-[组件名]`
- 保持className简洁，只用于必要的样式覆盖

```tsx
// ✅ 推荐
<div className="acp-chat-message-list">
<button className="acp-settings-add-btn">

// ❌ 禁止
<button className="my-button-123 blue">
```

#### 3.4.4 key 属性规范
- 列表渲染的key**必须**使用稳定的唯一标识符（如id）
- **禁止**使用数组索引作为key
- key用于React内部优化，不用于测试定位

```tsx
// ✅ 推荐
{agents.map(agent => (
  <List.Item key={agent.id} data-testid={`agent-item-${agent.id}`}>
    {agent.name}
  </List.Item>
))}

// ❌ 禁止
{agents.map((agent, index) => (
  <List.Item key={index}>
    {agent.name}
  </List.Item>
))}
```

#### 3.4.5 测试定位最佳实践
测试中定位元素的优先级顺序（从高到低）：
1. `getById` - **最推荐**，稳定、语义化、不随文本/样式变化
2. `getByRole` - 语义化，适合按钮、输入框等标准控件
3. `getByLabelText` - 表单元素，关联label
4. `getByText` - 文本内容，注意国际化问题
5. `querySelector` - 仅作为最后手段，需加注释说明

```tsx
// ✅ 测试中定位示例
it('点击添加按钮弹出表单', () => {
  render(<SettingsPage />);
  
  // 使用id最稳定，通过document.getElementById或querySelector
  const addButton = document.getElementById('settings-add-agent-btn');
  fireEvent.click(addButton);
  
  // 验证模态框显示
  expect(document.getElementById('settings-agent-modal')).toBeInTheDocument();
});
```

## 4. 测试规范

### 4.1 测试文件结构
```
web/src/__test__/
├── setup.ts           # 测试环境配置
├── pages/
│   ├── ChatPage.test.tsx
│   ├── GroupPage.test.tsx
│   └── SettingsPage.test.tsx
└── components/
    └── (组件测试)
```

### 4.2 测试覆盖率要求
- 每个页面**必须**有至少5个测试用例
- 核心功能**必须**100%覆盖
- 测试用例必须覆盖：
  1. 界面渲染完整性
  2. 核心交互功能（点击、输入、提交）
  3. 状态切换（启用/禁用、激活/非激活）
  4. 弹窗/表单显示与数据填充
  5. 操作反馈（消息提示、状态变更）

### 4.3 测试编写规范
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PageName from '../../pages/PageName';

describe('PageName 核心功能测试', () => {
  beforeAll(() => {
    // Mock console.error避免测试输出污染
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('1. 界面渲染完整：XXX、XXX、XXX全部存在', () => {
    render(<PageName />);
    // 验证关键元素存在
    expect(screen.getByText('标题')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /按钮/ })).toBeInTheDocument();
  });

  it('2. XXX功能正常：点击/输入后状态正确更新', () => {
    render(<PageName />);
    // 执行操作
    fireEvent.click(someElement);
    // 验证结果
    expect(someCondition).toBe(true);
  });
});
```

### 4.4 测试注意事项
1. **元素定位优先顺序**：
   - `getByRole` - 最推荐，语义化
   - `getByText` - 文本定位
   - `getByLabelText` - 表单元素
   - `getByTestId` - 最后手段

2. **处理重复文本**：
   - 当Modal标题和Button文本相同时，使用 `getAllByText`
   - 例：`expect(screen.getAllByText('创建群组').length).toBeGreaterThan(0)`

3. **处理Ant Design message组件**：
   - message的toast内容不一定能通过 `getByText` 找到
   - 只要点击操作不报错即可认为测试通过
   - 不需要强制断言message文本内容

4. **Mock规范**：
   - 必须Mock `console.error` 避免Ant Design警告导致测试失败
   - `setup.ts` 中必须配置 `matchMedia` 和 `ResizeObserver` Mock

## 5. 代码规范

### 5.1 命名规范
- 组件名：`PascalCase` - 例：`ChatPage`, `GroupPage`
- 函数名：`camelCase` - 例：`handleAdd`, `handleSave`
- 状态变量：`camelCase` - 例：`isModalOpen`, `editingGroup`
- 事件处理函数前缀：`handle` - 例：`handleClick`, `handleSubmit`

### 5.2 TypeScript规范
- **必须**定义接口类型，禁止使用 `any`
- **必须**为useState指定泛型类型
- **推荐**使用类型推断，避免冗余类型声明
- 未使用变量必须加 `_` 前缀，例：`const [_, setData] = useState()`

### 5.3 代码组织顺序
每个页面文件必须按以下顺序组织：
1. import 语句
2. 类型接口定义
3. 常量定义
4. 组件定义
5. 状态定义
6. 事件处理函数
7. 渲染返回

## 6. API集成规范

### 6.1 API调用模式
```tsx
// 使用 axios 或自定义封装的 request
import api from '../utils/api';

const handleSave = async () => {
  try {
    const values = await form.validateFields();
    await api.post('/agents', values);
    message.success('保存成功');
    setIsModalOpen(false);
    refreshData();
  } catch (error) {
    message.error('保存失败');
  }
};
```

### 6.2 错误处理
- 所有API调用**必须**包含try-catch错误处理
- 操作成功/失败**必须**有明确的用户反馈（message.success/error）
- 加载状态**推荐**显示loading动画

## 7. 可访问性规范
- 所有按钮**必须**有可访问的名称
- 所有表单字段**必须**有label
- 交互元素**必须**可以通过键盘操作
- 颜色对比度**必须**符合WCAG标准

## 8. 性能规范
- 避免在渲染函数中创建新对象/数组
- 大列表**必须**使用虚拟滚动
- 复杂计算**必须**使用 `useMemo` 缓存
- 事件处理函数**推荐**使用 `useCallback` 缓存
