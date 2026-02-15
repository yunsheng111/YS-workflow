const ExecutionLedger = require('../../.ccg/runtime/execution-ledger.cjs');

/**
 * Ledger 适配器 - 封装 Ledger 访问逻辑
 */
class LedgerAdapter {
  /**
   * 获取当前任务的 Ledger
   * @param {string} taskId - 任务 ID
   * @returns {Object|null} Ledger 记录
   */
  static get(taskId) {
    try {
      return ExecutionLedger.get(taskId);
    } catch (error) {
      console.error(`Failed to get ledger: ${error.message}`);
      return null;
    }
  }

  /**
   * 校验必需事件链
   * @param {Object} ledger - Ledger 记录
   * @returns {Object} { valid: boolean, missing: string[] }
   */
  static validateEventChain(ledger) {
    if (!ledger || !ledger.events) {
      return { valid: false, missing: ['all'] };
    }

    const requiredEvents = ['docs_read', 'model_called', 'session_captured'];
    const eventTypes = ledger.events.map(e => e.type);
    const missing = requiredEvents.filter(e => !eventTypes.includes(e));

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * 校验 SESSION_ID 绑定
   * @param {Object} ledger - Ledger 记录
   * @param {string} documentSessionId - 文档中的 SESSION_ID
   * @returns {Object} { valid: boolean, reason: string }
   */
  static validateSessionBinding(ledger, documentSessionId) {
    if (!ledger || !ledger.session_id) {
      return { valid: false, reason: 'Ledger 未绑定 SESSION_ID' };
    }

    if (ledger.session_id !== documentSessionId) {
      return {
        valid: false,
        reason: `SESSION_ID 不匹配: Ledger=${ledger.session_id}, Document=${documentSessionId}`
      };
    }

    return { valid: true };
  }

  /**
   * 校验状态
   * @param {Object} ledger - Ledger 记录
   * @returns {Object} { valid: boolean, reason: string }
   */
  static validateState(ledger) {
    if (!ledger) {
      return { valid: false, reason: 'Ledger 不存在' };
    }

    const allowedStates = ['SUCCESS', 'DEGRADED'];
    if (!allowedStates.includes(ledger.state)) {
      return {
        valid: false,
        reason: `状态不允许写入: ${ledger.state}（仅允许 SUCCESS/DEGRADED）`
      };
    }

    // DEGRADED 必须有降级事件
    if (ledger.state === 'DEGRADED') {
      const hasDegradedEvent = ledger.events.some(e =>
        e.type === 'degraded' || e.data?.degraded
      );
      if (!hasDegradedEvent) {
        return {
          valid: false,
          reason: 'DEGRADED 状态缺少降级事件'
        };
      }
    }

    return { valid: true };
  }
}

module.exports = LedgerAdapter;
