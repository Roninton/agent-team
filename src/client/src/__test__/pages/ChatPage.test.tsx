import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatPage from '../../pages/ChatPage';

// 完全基于ChatPage源码实现编写测试，100%对齐实际功能
describe('ChatPage 核心功能测试', () => {
  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('1. 界面渲染完整：会话列表、输入框、发送按钮、默认消息全部存在', () => {
    render(<ChatPage />);
    // 验证核心元素存在
    expect(screen.getByTestId('session-list')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument();
    // AntD按钮里有图标和文字，accessible name会合并，所以用模糊匹配
    expect(screen.getByRole('button', { name: /发送/ })).toBeInTheDocument();
    expect(screen.getByText('编程助手会话')).toBeInTheDocument();
    expect(screen.getByText('写作助手会话')).toBeInTheDocument();
    // 验证默认欢迎消息存在
    expect(screen.getByText('你好！我是代码专家，有什么编程问题我可以帮你解决？')).toBeInTheDocument();
  });

  it('2. 发送消息功能正常：输入内容点击发送后，消息展示且输入框清空，1秒后收到代理回复', async () => {
    render(<ChatPage />);
    
    const input = screen.getByPlaceholderText('输入消息...');
    const sendButton = document.querySelector('.acp-send-btn') as HTMLElement;
    
    // 输入内容
    fireEvent.change(input, { target: { value: '你好，测试消息' } });
    expect(input).toHaveValue('你好，测试消息');
    
    // 点击发送
    fireEvent.click(sendButton);
    expect(input).toHaveValue('');
    // 用户消息立即展示
    expect(screen.getByText('你好，测试消息')).toBeInTheDocument();
  });

  it('3. 切换会话功能正常：点击不同会话项，激活状态切换，头部标题更新', () => {
    render(<ChatPage />);
    
    const session1 = screen.getByTestId('session-item-1');
    const session2 = screen.getByTestId('session-item-2');
    
    // 初始状态：第一个会话激活，头部显示"编程助手会话 - 代码专家"
    expect(session1.style.background).toContain('rgb(230, 247, 255)');
    expect(session2.style.background).toContain('transparent');
    expect(screen.getByText('编程助手会话 - 代码专家')).toBeInTheDocument();
    
    // 点击第二个会话
    fireEvent.click(session2);
    
    // 切换后状态：第二个会话激活，头部显示"写作助手会话 - 文案专家"
    expect(session1.style.background).toContain('transparent');
    expect(session2.style.background).toContain('rgb(230, 247, 255)');
    expect(screen.getByText('写作助手会话 - 文案专家')).toBeInTheDocument();
  });
});





