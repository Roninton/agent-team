import { useState } from 'react';
import { Card, List, Button, Form, Input, Modal, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';

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
  const [agents, setAgents] = useState<AgentConfig[]>([
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [form] = Form.useForm();

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
      onOk: () => {
        setAgents(agents.filter(a => a.id !== id));
        message.success('删除成功');
      }
    });
  };

  const handleToggle = (id: string, enabled: boolean) => {
    setAgents(agents.map(a => a.id === id ? { ...a, enabled } : a));
    message.success(enabled ? '代理已启用' : '代理已禁用');
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      if (editingAgent) {
        setAgents(agents.map(a => a.id === editingAgent.id ? { ...a, ...values } : a));
        message.success('修改成功');
      } else {
        const newAgent: AgentConfig = {
          ...values,
          id: Date.now().toString(),
        };
        setAgents([...agents, newAgent]);
        message.success('添加成功');
      }
      setIsModalOpen(false);
    });
  };

  const handleStart = (agent: AgentConfig) => {
    message.success(`正在启动代理 ${agent.name}...`);
    // TODO: 调用后端API启动代理
  };

  const handleStop = (agent: AgentConfig) => {
    message.success(`正在停止代理 ${agent.name}...`);
    // TODO: 调用后端API停止代理
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
        id="settings-agent-modal"
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
