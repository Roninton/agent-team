/**
 * UI相关常量
 * 统一管理所有界面文本、按钮标签、提示消息等
 */

// 按钮文本
export const BUTTON_TEXTS = {
  ADD_AGENT: '添加代理',
  SAVE: '确 定',
  CANCEL: '取 消',
  START: '启动',
  STOP: '停止',
  EDIT: '编辑',
  DELETE: '删除',
  SEND: '发送',
  CONFIRM: '确认',
  CLOSE: '关闭'
} as const;

// 表单标签
export const FORM_LABELS = {
  AGENT_NAME: '代理名称',
  AGENT_TYPE: '代理类型',
  AGENT_COMMAND: '启动命令',
  AGENT_ARGS: '命令参数',
  AGENT_RATE_LIMIT: '限流配置（条/分钟）',
  AGENT_ENABLED: '是否启用'
} as const;

// 表单占位符
export const FORM_PLACEHOLDERS = {
  AGENT_NAME: '例如：代码专家',
  AGENT_TYPE: '例如：openai、local',
  AGENT_COMMAND: '例如：npx、python',
  AGENT_ARGS: '例如：-y @agent/code-expert',
  MESSAGE_INPUT: '输入消息内容...'
} as const;

// 提示消息
export const MESSAGES = {
  AGENT_ADDED_SUCCESS: '代理添加成功',
  AGENT_UPDATED_SUCCESS: '代理更新成功',
  AGENT_DELETED_SUCCESS: '代理删除成功',
  AGENT_STARTED: '正在启动代理',
  AGENT_STOPPED: '代理已停止',
  OPERATION_SUCCESS: '操作成功',
  OPERATION_FAILED: '操作失败',
  CONFIRM_DELETE: '确认要删除该代理吗？'
} as const;

// 菜单文本
export const MENU_TEXTS = {
  CHAT: '聊天',
  GROUP: '代理群组',
  SETTINGS: '设置'
} as const;

// 页面标题
export const PAGE_TITLES = {
  CHAT: '多代理协作平台',
  SETTINGS: '代理配置管理',
  GROUP: '代理群组管理'
} as const;
