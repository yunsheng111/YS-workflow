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
    const filePath = this._getFilePath(taskId);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * 清理过期 Ledger
   */
  static cleanup() {
    if (!fs.existsSync(LEDGER_DIR)) {
      return;
    }

    const now = Date.now();
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

    const files = fs.readdirSync(LEDGER_DIR);
    files.forEach(file => {
      const filePath = path.join(LEDGER_DIR, file);
      const stat = fs.statSync(filePath);

      if (now - stat.mtimeMs > retentionMs) {
        fs.unlinkSync(filePath);
      }
    });
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
    const tempPath = `${filePath}.tmp`;

    fs.writeFileSync(tempPath, JSON.stringify(ledger, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  }

  /**
   * 获取文件路径
   * @private
   */
  static _getFilePath(taskId) {
    return path.join(LEDGER_DIR, `${taskId}.json`);
  }
}

module.exports = ExecutionLedger;
