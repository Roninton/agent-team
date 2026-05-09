import { useState, useEffect } from 'react';
import { Card, List, Button, Form, Input, Modal, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { agentApi } from '../api/agent.api';
import type { ApiResponse, PagedResult } from '../api/config';

interface AgentConfig {
  id: string
  name: string
  type: string
  command: string
  args: string
  rateLimit: number
  enabled: boolean
}

const SettingsPage = () => {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [form] = Form.useForm();

  // 页面加载时从后端获取代理列表
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await agentApi.getAgents();
      if (response.success) {
        // 处理后端返回的数据结构
        const agentList = Array.isArray(response.data) ? response.data : (response.data?.list || []);
        setAgents(agentList.map((item: any) => ({
          id: item.id,
          name: item.config?.name || item.name,
          type: item.config?.env?.AGENT_TYPE || item.type || 'local',
          command: item.config?.command || item.command,
          args: item.config?.args?.join(' ') || item.args || '',
          rateLimit: item.config?.rateLimit || item.rateLimit || 5,
          enabled: item.status === 'running' || item.enabled || false,
        })));
      }
    } catch (error) {
      console.error('加载代理列表失败:', error);
      // 加载失败时使用默认代理作为后备
      setAgents([
        {
          id: '1',
          name: '代码专家',
          type: 'openai',
          command: 'npx',
          args: '-y @agent/code-expert',
          rateLimit: 5,
          enabled: true,
        },
        {
          id: '2',
          name: '文案专家',
          type: 'openai',
          command: 'npx',
          args: '-y @agent/write-expert',
          rateLimit: 10,
          enabled: true,
        },
        {
          id: '3',
          name: '数据分析专家',
          type: 'local',
          command: 'python',
          args: './agents/data_analyst.py',
          rateLimit: 3,
          enabled: false,
        }
      ]);
    }
  };

  const handleAdd = () => {
    setEditingAgent(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (agent: AgentConfig) => {
    setEditingAgent(agent);
    form.setFieldsValue(agent);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个代理配置吗？',
      onOk: async () => {
        try {
          const response = await agentApi.deleteAgent(id);
          if (response.success) {
            setAgents(agents.filter(a => a.id !== id));
            message.success('删除成功');
          }
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleToggle = (id: string, enabled: boolean) => {
    setAgents(agents.map(a => a.id === id ? { ...a, enabled } : a));
    message.success(enabled ? '代理已启用' : '代理已禁用');
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingAgent) {
        // 调用更新代理API
        const response = await agentApi.updateAgent(editingAgent.id, {
          name: values.name,
          command: values.command,
          args: values.args ? values.args.split(' ') : [],
          rateLimit: values.rateLimit,
        });
        if (response.success) {
          setAgents(agents.map(a => a.id === editingAgent.id ? { ...a, ...values } : a));
          message.success('修改成功');
        }
      } else {
        // 调用创建代理API
        const response = await agentApi.createAgent({
          name: values.name,
          command: values.command,
          args: values.args ? values.args.split(' ') : [],
          rateLimit: values.rateLimit,
        });
        if (response.success) {
          const newAgent: AgentConfig = {
            id: response.data?.id || Date.now().toString(),
            name: values.name,
            type: 'local',
            command: values.command,
            args: values.args || '',
            rateLimit: values.rateLimit,
            enabled: response.data?.status === 'running',
          };
          setAgents([...agents, newAgent]);
          message.success('添加成功');
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      message.error(editingAgent ? '修改失败' : '添加失败');
    }
  };

  const handleStart = async (agent: AgentConfig) => {
    try {
      message.loading({ content: `正在启动代理 ${agent.name}...`, key: 'start' });
      const response = await agentApi.startAgent(agent.id);
      if (response.success) {
        setAgents(agents.map(a => a.id === agent.id ? { ...a, enabled: true } : a));
        message.success({ content: `代理 ${agent.name} 启动成功`, key: 'start' });
      }
    } catch (error) {
      message.error({ content: `代理 ${agent.name} 启动失败`, key: 'start' });
    }
  };

  const handleStop = async (agent: AgentConfig) => {
    try {
      message.loading({ content: `正在停止代理 ${agent.name}...`, key: 'stop' });
      const response = await agentApi.stopAgent(agent.id);
      if (response.success) {
        setAgents(agents.map(a => a.id === agent.id ? { ...a, enabled: false } : a));
        message.success({ content: `代理 ${agent.name} 停止成功`, key: 'stop' });
      }
    } catch (error) {
      message.error({ content: `代理 ${agent.name} 停止失败`, key: 'stop' });
    }
  };

  return (
    <div>
      <Card
        title="代理配置管理"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd} 
            className="acp-add-agent-btn"
            id="settings-add-agent-btn"
          >
            添加代理
          </Button>
        }
      >
        <List
          dataSource={agents}
          renderItem={agent => (
            <List.Item
              id={`settings-agent-item-${agent.id}`}
              actions={[
                <Switch
                  id={`settings-agent-switch-${agent.id}`}
                  checked={agent.enabled}
                  onChange={checked => handleToggle(agent.id, checked)}
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                />,
                agent.enabled ? (
                  <Button
                    type="text"
                    danger
                    icon={<StopOutlined />}
                    onClick={() => handleStop(agent)}
                  >
                    停止
                  </Button>
                ) : (
                  <Button
                    type="text"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleStart(agent)}
                  >
                    启动
                  </Button>
                ),
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(agent)}
                >
                  编辑
                </Button>,
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(agent.id)}
                >
                  删除
                </Button>
              ]}
            >
              <List.Item.Meta
                title={agent.name}
                description={
                  <div>
                    <div>类型: {agent.type}</div>
                    <div>命令: {agent.command} {agent.args}</div>
                    <div>限流: {agent.rateLimit} 条/分钟</div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={editingAgent ? '编辑代理' : '添加代理'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="代理名称"
            rules={[{ required: true, message: '请输入代理名称' }]}
          >
            <Input placeholder="例如：代码专家" />
          </Form.Item>

          <Form.Item
            name="type"
            label="代理类型"
            rules={[{ required: true, message: '请输入代理类型' }]}
          >
            <Input placeholder="例如：openai、local" />
          </Form.Item>

          <Form.Item
            name="command"
            label="启动命令"
            rules={[{ required: true, message: '请输入启动命令' }]}
          >
            <Input placeholder="例如：npx、python" />
          </Form.Item>

          <Form.Item
            name="args"
            label="命令参数"
          >
            <Input placeholder="例如：-y @agent/code-expert" />
          </Form.Item>

          <Form.Item
            name="rateLimit"
            label="限流配置（条/分钟）"
            rules={[{ required: true, message: '请输入限流值' }]}
          >
            <Input type="number" min={1} />
          </Form.Item>

          <Form.Item
            name="enabled"
            label="是否启用"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
