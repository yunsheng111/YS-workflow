const fs = require('fs');
const path = require('path');
const { States, EventTypes, StateTransitions } = require('./execution-ledger-schema.cjs');

const LEDGER_DIR = path.join(__dirname, 'ledger');
const RETENTION_DAYS = 30;

class ExecutionLedger {
  /**
   * 初始化 Ledger
   * @param {string} taskId - 任务 ID
   * @returns {Object} Ledger 记录
   */
  static init(taskId) {
    // 10% 概率触发自动清理
    if (Math.random() < 0.1) {
      this.cleanup();
    }

    const ledger = {
      task_id: taskId,
      session_id: null,
      state: States.INIT,
      events: [],
      created_at: Date.now(),
      updated_at: Date.now()
    };

    this._write(taskId, ledger);
    return ledger;
  }

  /**
   * 追加事件
   * @param {string} taskId - 任务 ID
   * @param {string} eventType - 事件类型
   * @param {Object} data - 事件数据
   */
  static append(taskId, eventType, data = {}) {
    const ledger = this.get(taskId);
    if (!ledger) {
      throw new Error(`Ledger not found for task: ${taskId}`);
    }

    // 校验事件类型
    if (!Object.values(EventTypes).includes(eventType)) {
      throw new Error(`Invalid event type: ${eventType}. Must be one of: ${Object.values(EventTypes).join(', ')}`);
    }

    // 关键事件的数据校验
    if (eventType === EventTypes.SESSION_CAPTURED) {
      if (!data.session_id || typeof data.session_id !== 'string') {
        throw new Error('session_captured event requires data.session_id (string)');
      }
    }

    if (eventType === EventTypes.MODEL_CALLED) {
      if (!data.backend || !['codex', 'gemini', 'both'].includes(data.backend)) {
        throw new Error('model_called event requires data.backend (codex|gemini|both)');
      }
    }

    const event = {
      type: eventType,
      timestamp: Date.now(),
      data
    };

    ledger.events.push(event);
    ledger.updated_at = Date.now();

    this._write(taskId, ledger);
  }

  /**
   * 绑定 SESSION_ID
   * @param {string} taskId - 任务 ID
   * @param {string} sessionId - 会话 ID
   */
  static bindSession(taskId, sessionId) {
    const ledger = this.get(taskId);
    if (!ledger) {
      throw new Error(`Ledger not found for task: ${taskId}`);
    }

    if (ledger.session_id && ledger.session_id !== sessionId) {
      throw new Error(`SESSION_ID already bound: ${ledger.session_id}`);
    }

    ledger.session_id = sessionId;
    ledger.updated_at = Date.now();

    this._write(taskId, ledger);
  }

  /**
   * 状态转换
   * @param {string} taskId - 任务 ID
   * @param {string} newState - 新状态
   */
  static transition(taskId, newState) {
    const ledger = this.get(taskId);
    if (!ledger) {
      throw new Error(`Ledger not found for task: ${taskId}`);
    }

    const currentState = ledger.state;
    const allowedTransitions = StateTransitions[currentState] || [];

    if (!allowedTransitions.includes(newState)) {
      throw new Error(`Invalid state transition: ${currentState} -> ${newState}`);
    }

    ledger.state = newState;
    ledger.updated_at = Date.now();

    this._write(taskId, ledger);
  }

  /**
   * 获取 Ledger
   * @param {string} taskId - 任务 ID
   * @returns {Object|null} Ledger 记录
   */
  static get(taskId) {
    try {
      const filePath = this._getFilePath(taskId);
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      // JSON 解析失败或文件损坏，隔离并返回 null
      if (err instanceof SyntaxError) {
        const filePath = this._getFilePath(taskId);
        const corruptPath = `${filePath}.corrupt`;
        try {
          fs.renameSync(filePath, corruptPath);
          console.error(`Corrupted ledger file moved to: ${corruptPath}`);
        } catch (renameErr) {
          console.error(`Failed to isolate corrupted ledger: ${renameErr.message}`);
        }
        return null;
      }
      throw err;
    }
  }

  /**
   * 清理过期 Ledger
   */
  static cleanup() {
    try {
      if (!fs.existsSync(LEDGER_DIR)) {
        return;
      }

      const now = Date.now();
      const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

      const files = fs.readdirSync(LEDGER_DIR);
      files.forEach(file => {
        try {
          const filePath = path.join(LEDGER_DIR, file);
          const stat = fs.statSync(filePath);

          if (now - stat.mtimeMs > retentionMs) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          // 单个文件清理失败不影响其他文件
          console.error(`Failed to cleanup file ${file}: ${err.message}`);
        }
      });
    } catch (err) {
      // 清理失败不应中断主流程
      console.error(`Ledger cleanup failed: ${err.message}`);
    }
  }

  /**
   * 原子写入（临时文件 + rename）
   * @private
   */
  static _write(taskId, ledger) {
    if (!fs.existsSync(LEDGER_DIR)) {
      fs.mkdirSync(LEDGER_DIR, { recursive: true });
    }

    const filePath = this._getFilePath(taskId);
    // 使用随机后缀避免并发冲突
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

    fs.writeFileSync(tempPath, JSON.stringify(ledger, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  }

  /**
   * 获取文件路径
   * @private
   */
  static _getFilePath(taskId) {
    // 校验 taskId 格式，防止路径穿越
    if (!taskId || typeof taskId !== 'string') {
      throw new Error('Invalid taskId: must be a non-empty string');
    }

    // 仅允许字母、数字、下划线、连字符、点号
    if (!/^[a-zA-Z0-9._-]+$/.test(taskId)) {
      throw new Error(`Invalid taskId format: ${taskId}. Only alphanumeric, underscore, hyphen, and dot are allowed.`);
    }

    const filePath = path.join(LEDGER_DIR, `${taskId}.json`);

    // 验证目标路径必须位于 LEDGER_DIR 内（防止路径穿越）
    const resolvedPath = path.resolve(filePath);
    const resolvedLedgerDir = path.resolve(LEDGER_DIR);

    if (!resolvedPath.startsWith(resolvedLedgerDir)) {
      throw new Error(`Path traversal detected: ${taskId} resolves outside ledger directory`);
    }

    return filePath;
  }
}

module.exports = ExecutionLedger;
