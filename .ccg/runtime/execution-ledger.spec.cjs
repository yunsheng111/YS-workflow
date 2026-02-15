const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
const ExecutionLedger = require('./execution-ledger.cjs');
const { States, EventTypes } = require('./execution-ledger-schema.cjs');

describe('ExecutionLedger', () => {
  const testTaskId = 'test-task-123';

  afterEach(() => {
    // 清理测试文件
    const ledgerDir = path.join(__dirname, 'ledger');
    if (fs.existsSync(ledgerDir)) {
      fs.rmSync(ledgerDir, { recursive: true, force: true });
    }
  });

  describe('init', () => {
    it('应创建新 Ledger', () => {
      const ledger = ExecutionLedger.init(testTaskId);
      expect(ledger.task_id).toBe(testTaskId);
      expect(ledger.state).toBe(States.INIT);
      expect(ledger.events).toEqual([]);
    });
  });

  describe('append', () => {
    it('应追加事件', () => {
      ExecutionLedger.init(testTaskId);
      ExecutionLedger.append(testTaskId, EventTypes.DOCS_READ, { file: 'test.md' });

      const ledger = ExecutionLedger.get(testTaskId);
      expect(ledger.events.length).toBe(1);
      expect(ledger.events[0].type).toBe(EventTypes.DOCS_READ);
    });
  });

  describe('bindSession', () => {
    it('应绑定 SESSION_ID', () => {
      ExecutionLedger.init(testTaskId);
      ExecutionLedger.bindSession(testTaskId, 'session-456');

      const ledger = ExecutionLedger.get(testTaskId);
      expect(ledger.session_id).toBe('session-456');
    });

    it('重复绑定相同 SESSION_ID 应成功', () => {
      ExecutionLedger.init(testTaskId);
      ExecutionLedger.bindSession(testTaskId, 'session-456');
      ExecutionLedger.bindSession(testTaskId, 'session-456');

      const ledger = ExecutionLedger.get(testTaskId);
      expect(ledger.session_id).toBe('session-456');
    });

    it('绑定不同 SESSION_ID 应失败', () => {
      ExecutionLedger.init(testTaskId);
      ExecutionLedger.bindSession(testTaskId, 'session-456');

      expect(() => {
        ExecutionLedger.bindSession(testTaskId, 'session-789');
      }).toThrow('SESSION_ID already bound');
    });
  });

  describe('transition', () => {
    it('合法状态转换应成功', () => {
      ExecutionLedger.init(testTaskId);
      ExecutionLedger.transition(testTaskId, States.RUNNING);

      const ledger = ExecutionLedger.get(testTaskId);
      expect(ledger.state).toBe(States.RUNNING);
    });

    it('非法状态转换应失败', () => {
      ExecutionLedger.init(testTaskId);

      expect(() => {
        ExecutionLedger.transition(testTaskId, States.SUCCESS);
      }).toThrow('Invalid state transition');
    });
  });

  describe('并发隔离', () => {
    it('不同 task_id 应独立存储', () => {
      ExecutionLedger.init('task-1');
      ExecutionLedger.init('task-2');

      ExecutionLedger.append('task-1', EventTypes.DOCS_READ);
      ExecutionLedger.append('task-2', EventTypes.MODEL_CALLED, { backend: 'codex' });

      const ledger1 = ExecutionLedger.get('task-1');
      const ledger2 = ExecutionLedger.get('task-2');

      expect(ledger1.events.length).toBe(1);
      expect(ledger2.events.length).toBe(1);
      expect(ledger1.events[0].type).toBe(EventTypes.DOCS_READ);
      expect(ledger2.events[0].type).toBe(EventTypes.MODEL_CALLED);
    });
  });

  describe('cleanup', () => {
    it('应删除过期文件', () => {
      // 创建测试 Ledger
      ExecutionLedger.init(testTaskId);

      const ledgerDir = path.join(__dirname, 'ledger');
      const filePath = path.join(ledgerDir, `${testTaskId}.json`);

      // 修改文件时间戳为 31 天前
      const oldTime = Date.now() - (31 * 24 * 60 * 60 * 1000);
      fs.utimesSync(filePath, new Date(oldTime), new Date(oldTime));

      // 执行清理
      ExecutionLedger.cleanup();

      // 验证文件已删除
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('不应删除未过期文件', () => {
      // 创建测试 Ledger
      ExecutionLedger.init(testTaskId);

      const ledgerDir = path.join(__dirname, 'ledger');
      const filePath = path.join(ledgerDir, `${testTaskId}.json`);

      // 执行清理
      ExecutionLedger.cleanup();

      // 验证文件仍存在
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('原子写入', () => {
    it('应使用临时文件写入', () => {
      ExecutionLedger.init(testTaskId);

      const ledgerDir = path.join(__dirname, 'ledger');
      const filePath = path.join(ledgerDir, `${testTaskId}.json`);
      const tempPath = `${filePath}.tmp`;

      // 验证最终文件存在
      expect(fs.existsSync(filePath)).toBe(true);

      // 验证临时文件已清理
      expect(fs.existsSync(tempPath)).toBe(false);
    });
  });

  describe('事件顺序', () => {
    it('事件时间戳应单调递增', () => {
      ExecutionLedger.init(testTaskId);

      ExecutionLedger.append(testTaskId, EventTypes.DOCS_READ);
      ExecutionLedger.append(testTaskId, EventTypes.MODEL_CALLED, { backend: 'codex' });
      ExecutionLedger.append(testTaskId, EventTypes.SESSION_CAPTURED, { session_id: 'test-session-123' });

      const ledger = ExecutionLedger.get(testTaskId);

      for (let i = 1; i < ledger.events.length; i++) {
        expect(ledger.events[i].timestamp).toBeGreaterThanOrEqual(
          ledger.events[i - 1].timestamp
        );
      }
    });
  });
});
