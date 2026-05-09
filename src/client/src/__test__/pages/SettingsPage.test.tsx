import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from '../../pages/SettingsPage';
import { agentApi } from '../../api/agent.api';

// Mock API 调用
vi.mock('../../api/agent.api', () => ({
  agentApi: {
    getAgents: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: '1',
          config: {
            name: '代码专家',
            command: 'npx',
            args: ['-y', '@agent/code-expert'],
            rateLimit: 5,
          },
          status: 'running'
        },
        {
          id: '2',
          config: {
            name: '文案专家',
            command: 'npx',
            args: ['-y', '@agent/write-expert'],
            rateLimit: 10,
          },
          status: 'running'
        },
        {
          id: '3',
          config: {
            name: '数据分析专家',
            command: 'python',
            args: ['./agents/data_analyst.py'],
            rateLimit: 3,
          },
          status: 'stopped'
        }
      ]
    }),
    createAgent: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: '4',
        config: { name: '测试代理' },
        status: 'running'
      }
    }),
    updateAgent: vi.fn().mockResolvedValue({ success: true }),
    deleteAgent: vi.fn().mockResolvedValue({ success: true }),
    startAgent: vi.fn().mockResolvedValue({ success: true }),
    stopAgent: vi.fn().mockResolvedValue({ success: true })
  }
}));

// 完全基于SettingsPage源码实现编写测试
describe('SettingsPage 核心功能测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('1. 界面渲染完整：标题、添加按钮、3个默认代理配置全部存在', async () => {
    render(<SettingsPage />);
    
    // 等待异步加载完成
    await waitFor(() => {
      expect(screen.getByText('代码专家')).toBeInTheDocument();
    });
    
    expect(screen.getByText('代理配置管理')).toBeInTheDocument();
    expect(document.querySelector('.acp-add-agent-btn')).toBeInTheDocument();
    // 验证3个默认代理存在
    expect(screen.getByText('代码专家')).toBeInTheDocument();
    expect(screen.getByText('文案专家')).toBeInTheDocument();
    expect(screen.getByText('数据分析专家')).toBeInTheDocument();
    expect(agentApi.getAgents).toHaveBeenCalledTimes(1);
  });

  it('2. 启用/禁用功能正常：点击切换开关可以正常点击触发', async () => {
    render(<SettingsPage />);
    
    // 等待异步加载完成
    await waitFor(() => {
      expect(screen.getByText('代码专家')).toBeInTheDocument();
    });

    const switches = screen.getAllByRole('switch');
    // 第一个开关默认是启用状态，点击切换到禁用
    fireEvent.click(switches[0]);
    // 第三个开关默认是禁用状态，点击切换到启用
    fireEvent.click(switches[2]);
  });

  it('3. 点击添加按钮可以正常弹出添加代理表单', async () => {
    render(<SettingsPage />);
    
    // 等待异步加载完成
    await waitFor(() => {
      expect(screen.getByText('代码专家')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /添加代理/ });
    
    fireEvent.click(addButton);
    // modal标题是"添加代理"，button也有"添加代理"，所以用getAllByText
    expect(screen.getAllByText('添加代理').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('代理名称')).toBeInTheDocument();
    expect(screen.getByLabelText('代理类型')).toBeInTheDocument();
  });

  it('4. 点击编辑按钮可以正常弹出编辑代理表单，填充已有数据', async () => {
    render(<SettingsPage />);
    
    // 等待异步加载完成
    await waitFor(() => {
      expect(screen.getByText('代码专家')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /编辑/ });
    
    fireEvent.click(editButtons[0]);
    expect(screen.getByText('编辑代理')).toBeInTheDocument();
    // 表单默认填充了代码专家的名称
    expect(screen.getByDisplayValue('代码专家')).toBeInTheDocument();
  });

  it('5. 启动/停止代理功能正常：点击按钮显示对应提示', async () => {
    render(<SettingsPage />);
    
    // 等待异步加载完成
    await waitFor(() => {
      expect(screen.getByText('代码专家')).toBeInTheDocument();
    });

    const stopButtons = screen.getAllByRole('button', { name: /停止/ });
    const startButtons = screen.getAllByRole('button', { name: /启动/ });
    
    // 停止第一个代理
    fireEvent.click(stopButtons[0]);
    expect(agentApi.stopAgent).toHaveBeenCalledWith('1');
    
    // 启动第三个代理
    fireEvent.click(startButtons[0]);
    expect(agentApi.startAgent).toHaveBeenCalledWith('3');
  });
});

