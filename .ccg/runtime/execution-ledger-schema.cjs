/**
 * Execution Ledger Schema
 * 定义状态模型、事件模型和数据结构
 */

// 状态枚举
const States = {
  INIT: 'INIT',           // 初始化
  RUNNING: 'RUNNING',     // 运行中
  DEGRADED: 'DEGRADED',   // 降级模式
  FAILED: 'FAILED',       // 失败
  SUCCESS: 'SUCCESS'      // 成功
};

// 事件类型枚举
const EventTypes = {
  DOCS_READ: 'docs_read',           // 文档读取
  MODEL_CALLED: 'model_called',     // 模型调用
  SESSION_CAPTURED: 'session_captured', // SESSION_ID 捕获
  ZHI_CONFIRMED: 'zhi_confirmed'    // zhi 确认
};

// 状态转换规则
const StateTransitions = {
  INIT: ['RUNNING', 'FAILED'],
  RUNNING: ['DEGRADED', 'SUCCESS', 'FAILED'],
  DEGRADED: ['SUCCESS', 'FAILED'],
  FAILED: [],
  SUCCESS: []
};

// Ledger 记录 Schema
const LedgerSchema = {
  task_id: 'string',      // 任务 ID
  session_id: 'string',   // 会话 ID（可选，绑定后不可变）
  state: 'string',        // 当前状态
  events: 'array',        // 事件列表
  created_at: 'number',   // 创建时间戳
  updated_at: 'number'    // 更新时间戳
};

// 事件记录 Schema
const EventSchema = {
  type: 'string',         // 事件类型
  timestamp: 'number',    // 时间戳
  data: 'object'          // 事件数据
};

module.exports = {
  States,
  EventTypes,
  StateTransitions,
  LedgerSchema,
  EventSchema
};
