import { Layout, Menu } from 'antd';
import { WechatOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import GroupPage from './pages/GroupPage';
import './App.css';

const { Sider, Content } = Layout;

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <WechatOutlined />,
      label: '聊天',
    },
    {
      key: '/group',
      icon: <TeamOutlined />,
      label: '代理群组',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  return (
    <Layout className="app-layout">
      <Sider width={250} theme="light">
        <div className="logo">
          <h2>多代理协作平台</h2>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Content className="main-content">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/group" element={<GroupPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
