import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GroupPage from '../../pages/GroupPage';

// 完全基于GroupPage源码实现编写测试
describe('GroupPage 核心功能测试', () => {
  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('1. 界面渲染完整：标题、创建按钮、2个默认群组全部存在', () => {
    render(<GroupPage />);
    expect(screen.getByText('代理群组管理')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /创建群组/ })).toBeInTheDocument();
    // 验证2个默认群组存在
    expect(screen.getByText('编程协作组')).toBeInTheDocument();
    expect(screen.getByText('文案创作组')).toBeInTheDocument();
    // 验证状态标签：编程协作组是运行中，文案创作组是空闲
    expect(screen.getByText('运行中')).toBeInTheDocument();
    expect(screen.getByText('空闲')).toBeInTheDocument();
  });

  it('2. 点击创建群组按钮，弹出创建表单，包含所有必填字段', () => {
    render(<GroupPage />);
    const createButton = screen.getByRole('button', { name: /创建群组/ });
    
    fireEvent.click(createButton);
    // modal标题是"创建群组"，button也有"创建群组"，所以用getAllByText
    expect(screen.getAllByText('创建群组').length).toBeGreaterThan(0);
    // 验证表单字段存在
    expect(screen.getByLabelText('群组名称')).toBeInTheDocument();
    expect(screen.getByLabelText('群组描述')).toBeInTheDocument();
    expect(screen.getByLabelText('选择代理')).toBeInTheDocument();
  });

  it('3. 点击编辑按钮，弹出编辑表单，填充当前群组数据', () => {
    render(<GroupPage />);
    const editButtons = screen.getAllByRole('button', { name: /编辑/ });
    
    // 编辑第一个群组
    fireEvent.click(editButtons[0]);
    expect(screen.getByText('编辑群组')).toBeInTheDocument();
    // 表单默认填充了编程协作组的名称
    expect(screen.getByDisplayValue('编程协作组')).toBeInTheDocument();
  });

  it('4. 点击进入聊天按钮可以正常点击触发', () => {
    render(<GroupPage />);
    const chatButtons = screen.getAllByRole('button', { name: /进入聊天/ });
    
    // 点击第一个群组的进入聊天按钮，不报错即为通过
    fireEvent.click(chatButtons[0]);
  });

  it('5. 每个群组正确显示包含的代理标签', () => {
    render(<GroupPage />);
    // 编程协作组包含代码专家、架构师、测试专家三个代理
    expect(screen.getByText('代码专家')).toBeInTheDocument();
    expect(screen.getByText('架构师')).toBeInTheDocument();
    expect(screen.getByText('测试专家')).toBeInTheDocument();
    // 文案创作组包含文案专家、创意策划、SEO优化师三个代理
    expect(screen.getByText('文案专家')).toBeInTheDocument();
    expect(screen.getByText('创意策划')).toBeInTheDocument();
    expect(screen.getByText('SEO优化师')).toBeInTheDocument();
  });
});

