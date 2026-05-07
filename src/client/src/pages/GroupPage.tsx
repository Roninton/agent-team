import { useState } from 'react';
import { Card, List, Button, Modal, Form, Input, Select, Space, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MessageOutlined, UserAddOutlined } from '@ant-design/icons';

interface Group {
  id: string
  name: string
  description: string
  agents: string[]
  createdAt: Date
  status: 'active' | 'idle'
}

const { Option } = Select;
const { TextArea } = Input;

const GroupPage = () => {
  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: '编程协作组',
      description: '多个编程专家协作解决复杂技术问题',
      agents: ['代码专家', '架构师', '测试专家'],
      createdAt: new Date(Date.now() - 86400000),
      status: 'active',
    },
    {
      id: '2',
      name: '文案创作组',
      description: '内容创作、营销文案、文章写作协作',
      agents: ['文案专家', '创意策划', 'SEO优化师'],
      createdAt: new Date(Date.now() - 3 * 86400000),
      status: 'idle',
    }
  ]);

  const [availableAgents] = useState(['代码专家', '架构师', '测试专家', '文案专家', '创意策划', 'SEO优化师', '数据分析专家']);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingGroup(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    form.setFieldsValue(group);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个代理群组吗？',
      onOk: () => {
        setGroups(groups.filter(g => g.id !== id));
        message.success('删除成功');
      }
    });
  };

  const handleEnterChat = (group: Group) => {
    message.info(`进入群组 ${group.name} 的聊天界面`);
    // TODO: 跳转到群组聊天页面
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      if (editingGroup) {
        setGroups(groups.map(g => g.id === editingGroup.id ? { ...g, ...values } : g));
        message.success('修改成功');
      } else {
        const newGroup: Group = {
          ...values,
          id: Date.now().toString(),
          createdAt: new Date(),
          status: 'idle',
        };
        setGroups([...groups, newGroup]);
        message.success('添加成功');
      }
      setIsModalOpen(false);
    });
  };

  return (
    <div>
      <Card
        title="代理群组管理"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            id="group-create-btn"
          >
            创建群组
          </Button>
        }
      >
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={groups}
          renderItem={group => (
            <List.Item id={`group-item-${group.id}`}>
              <Card
                title={
                  <Space>
                    {group.name}
                    <Tag color={group.status === 'active' ? 'green' : 'default'}>
                      {group.status === 'active' ? '运行中' : '空闲'}
                    </Tag>
                  </Space>
                }
                extra={
                  <Space>
                    <Button
                      type="text"
                      icon={<MessageOutlined />}
                      onClick={() => handleEnterChat(group)}
                      id={`group-chat-btn-${group.id}`}
                    >
                      进入聊天
                    </Button>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(group)}
                      id={`group-edit-btn-${group.id}`}
                    >
                      编辑
                    </Button>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(group.id)}
                    >
                      删除
                    </Button>
                  </Space>
                }
              >
                <p>{group.description}</p>
                <div style={{ margin: '12px 0' }}>
                  <div style={{ marginBottom: '8px', fontSize: '12px', color: '#999' }}>包含代理：</div>
                  <Space wrap>
                    {group.agents.map(agent => (
                      <Tag key={agent} icon={<UserAddOutlined />}>
                        {agent}
                      </Tag>
                    ))}
                  </Space>
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '16px' }}>
                  创建时间：{group.createdAt.toLocaleDateString()}
                </div>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={editingGroup ? '编辑群组' : '创建群组'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        width={600}
        id="group-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="群组名称"
            rules={[{ required: true, message: '请输入群组名称' }]}
          >
            <Input placeholder="例如：编程协作组" />
          </Form.Item>

          <Form.Item
            name="description"
            label="群组描述"
            rules={[{ required: true, message: '请输入群组描述' }]}
          >
            <TextArea rows={3} placeholder="描述这个群组的用途和功能" />
          </Form.Item>

          <Form.Item
            name="agents"
            label="选择代理"
            rules={[{ required: true, message: '请选择至少一个代理' }]}
          >
            <Select mode="multiple" placeholder="选择加入群组的代理">
              {availableAgents.map(agent => (
                <Option key={agent} value={agent}>
                  {agent}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GroupPage;
