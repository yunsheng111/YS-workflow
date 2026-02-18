#!/usr/bin/env node
/**
 * 降级场景 Ledger 初始化辅助函数
 *
 * 用于单模型降级场景下初始化 Execution Ledger，确保 Hook 校验通过
 */

const ExecutionLedger = require('./execution-ledger.cjs');
const { EventTypes } = require('./execution-ledger-schema.cjs');

/**
 * 为降级场景初始化 Ledger
 *
 * @param {Object} options - 配置选项
 * @param {string} options.taskId - 任务 ID（必需）
 * @param {string} options.sessionId - 单模型的 SESSION_ID（必需）
 * @param {string} options.backend - 使用的模型（'codex' | 'gemini'）
 * @param {string} options.reason - 降级原因（可选）
 * @returns {Object} 初始化的 Ledger 记录
 */
function initDegradedLedger(options) {
  const { taskId, sessionId, backend, reason = '单模型降级' } = options;

  // 参数校验
  if (!taskId || typeof taskId !== 'string') {
    throw new Error('taskId is required and must be a string');
  }

  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('sessionId is required and must be a string');
  }

  if (!backend || !['codex', 'gemini'].includes(backend)) {
    throw new Error('backend must be "codex" or "gemini"');
  }

  // 1. 初始化 Ledger
  const ledger = ExecutionLedger.init(taskId);

  // 2. 记录模型调用事件（单模型）
  ExecutionLedger.append(taskId, EventTypes.MODEL_CALLED, {
    backend,
    timestamp: Date.now()
  });

  // 3. 绑定 SESSION_ID
  ExecutionLedger.bindSession(taskId, sessionId);

  // 4. 记录 SESSION_ID 捕获事件
  ExecutionLedger.append(taskId, EventTypes.SESSION_CAPTURED, {
    session_id: sessionId,
    backend
  });

  // 5. 记录降级事件
  ExecutionLedger.append(taskId, EventTypes.DEGRADED, {
    reason,
    missing_model: backend === 'codex' ? 'gemini' : 'codex',
    degraded_level: 'ACCEPTABLE', // 默认可接受降级
    missing_dimensions: backend === 'codex' ? ['frontend'] : ['backend']
  });

  // 6. 状态转换：INIT → RUNNING → DEGRADED
  ExecutionLedger.transition(taskId, 'RUNNING');
  ExecutionLedger.transition(taskId, 'DEGRADED');

  return ExecutionLedger.get(taskId);
}

/**
 * 设置 TASK_ID 环境变量
 *
 * @param {string} taskId - 任务 ID
 */
function setTaskIdEnv(taskId) {
  process.env.TASK_ID = taskId;
}

/**
 * 生成任务 ID
 *
 * @param {string} prefix - 前缀（默认 'degraded'）
 * @returns {string} 任务 ID
 */
function generateTaskId(prefix = 'degraded') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * 完整的降级场景初始化流程
 *
 * @param {Object} options - 配置选项
 * @param {string} options.sessionId - 单模型的 SESSION_ID（必需）
 * @param {string} options.backend - 使用的模型（'codex' | 'gemini'）
 * @param {string} options.reason - 降级原因（可选）
 * @param {string} options.taskIdPrefix - 任务 ID 前缀（可选）
 * @returns {Object} 包含 taskId 和 ledger 的对象
 */
function setupDegradedScenario(options) {
  const { sessionId, backend, reason, taskIdPrefix } = options;

  // 1. 生成任务 ID
  const taskId = generateTaskId(taskIdPrefix);

  // 2. 设置环境变量
  setTaskIdEnv(taskId);

  // 3. 初始化 Ledger
  const ledger = initDegradedLedger({
    taskId,
    sessionId,
    backend,
    reason
  });

  return { taskId, ledger };
}

module.exports = {
  initDegradedLedger,
  setTaskIdEnv,
  generateTaskId,
  setupDegradedScenario
};
