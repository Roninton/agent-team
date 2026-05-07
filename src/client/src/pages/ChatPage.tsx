import { useState } from 'react';
import { Layout, List, Input, Button, Avatar, Card, Space } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;
const { TextArea } = Input;

interface Message {
  id: string
  content: string
  role: 'user' | 'agent'
  agentName?: string
  timestamp: Date
}

interface Session {
  id: string
  name: string
  agentName: string
  lastMessage?: string
  timestamp: Date
}

const ChatPage = () => {
  // setSessions 未使用，ESLint规则要求前缀下划线，使用 _ 表示明确忽略
  const [sessions] = useState<Session[]>([
    {
      id: '1',
      name: '编程助手会话',
      agentName: '代码专家',
      lastMessage: '有什么编程问题我可以帮你？',
      timestamp: new Date(),
    },
    {
      id: '2',
      name: '写作助手会话',
      agentName: '文案专家',
      lastMessage: '需要帮你写什么内容？',
      timestamp: new Date(Date.now() - 3600000),
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '你好！我是代码专家，有什么编程问题我可以帮你解决？',
      role: 'agent',
      agentName: '代码专家',
      timestamp: new Date(Date.now() - 60000),
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [activeSessionId, setActiveSessionId] = useState('1');

  const handleSend = () => {
    if (!inputText.trim()) {return;}

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // 模拟代理回复
    setTimeout(() => {
      const replyMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `收到你的问题："${inputText}"，我正在为你解答...`,
        role: 'agent',
        agentName: '代码专家',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, replyMessage]);
    }, 1000);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <Layout role="main" style={{ height: '100%', background: '#fff' }}>
      <Sider width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Button type="primary" block>新建会话</Button>
        </div>
        <List
          data-testid="session-list"
          dataSource={sessions}
          renderItem={session => (
            <List.Item
              data-testid={`session-item-${session.id}`}
              onClick={() => setActiveSessionId(session.id)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: session.id === activeSessionId ? '#e6f7ff' : 'transparent',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<RobotOutlined />} />}
                title={session.name}
                description={
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {session.lastMessage}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Sider>
      <Layout>
        <Content style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
            <h3>{activeSession?.name} - {activeSession?.agentName}</h3>
          </div>
          
          <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {messages.map(message => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Card
                    size="small"
                    style={{
                      maxWidth: '70%',
                      background: message.role === 'user' ? '#1890ff' : '#f5f5f5',
                      color: message.role === 'user' ? '#fff' : '#333',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Avatar
                        icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        size="small"
                      />
                      <div>
                        {message.role === 'agent' && (
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                            {message.agentName}
                          </div>
                        )}
                        <div>{message.content}</div>
                        <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px', textAlign: 'right' }}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </Space>
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                rows={3}
                placeholder="输入消息..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onPressEnter={e => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                style={{ height: 'auto' }}
                className="acp-send-btn"
              >
                发送
              </Button>
            </Space.Compact>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ChatPage;
