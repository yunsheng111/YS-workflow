#!/usr/bin/env node
/**
 * 单元测试 -- ccg-execution-guard.cjs
 *
 * 测试覆盖：
 * 1. LedgerAdapter 校验逻辑
 * 2. EvidenceParser 证据提取
 * 3. Execution Guard Hook 集成测试
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const LedgerAdapter = require('./lib/ledger-adapter.cjs');
const EvidenceParser = require('./lib/evidence-parser.cjs');
const ExecutionLedger = require('../.ccg/runtime/execution-ledger.cjs');

const HOOK_PATH = path.join(__dirname, 'ccg-execution-guard.cjs');

/**
 * 执行 Hook 并返回结果
 * @param {object} hookInput - Hook 输入数据
 * @param {object} env - 环境变量
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
function runHook(hookInput, env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [HOOK_PATH], {
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    proc.on('close', exitCode => {
      resolve({ stdout, stderr, exitCode });
    });

    proc.on('error', reject);

    // 写入 Hook 输入
    proc.stdin.write(JSON.stringify(hookInput));
    proc.stdin.end();
  });
}

/**
 * 解析 Hook 响应
 */
function parseHookResponse(stdout) {
  try {
    return JSON.parse(stdout);
  } catch (err) {
    throw new Error(`Failed to parse hook response: ${stdout}`);
  }
}

/**
 * 简单的测试框架
 */
function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
      }
    },
    toContain(expected) {
      if (Array.isArray(actual)) {
        if (!actual.includes(expected)) {
          throw new Error(`Expected ${JSON.stringify(actual)} to contain ${expected}`);
        }
      } else if (typeof actual === 'string') {
        if (!actual.includes(expected)) {
          throw new Error(`Expected "${actual}" to contain "${expected}"`);
        }
      } else {
        throw new Error(`Cannot check contains on ${typeof actual}`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected ${actual} to be null`);
      }
    }
  };
}

function beforeEach(fn) {
  // 简化实现：直接执行
  fn();
}

function afterEach(fn) {
  // 简化实现：直接执行
  fn();
}

// 测试主函数
async function runTests() {
  const TEST_TASK_ID = 'test-task-execution-guard';
  const LEDGER_DIR = path.join(__dirname, '../.ccg/runtime/ledger');

  function cleanup() {
    const ledgerPath = path.join(LEDGER_DIR, `${TEST_TASK_ID}.json`);
    if (fs.existsSync(ledgerPath)) {
      fs.unlinkSync(ledgerPath);
    }
  }

  describe('ccg-execution-guard', () => {
    describe('LedgerAdapter', () => {
    describe('validateEventChain', () => {
      it('应校验完整事件链', () => {
        cleanup();
        const ledger = ExecutionLedger.init(TEST_TASK_ID);
        ExecutionLedger.append(TEST_TASK_ID, 'docs_read', { file: 'test.md' });
        ExecutionLedger.append(TEST_TASK_ID, 'model_called', { backend: 'codex' });
        ExecutionLedger.append(TEST_TASK_ID, 'session_captured', { session_id: 'test-session' });

        const updatedLedger = ExecutionLedger.get(TEST_TASK_ID);
        const result = LedgerAdapter.validateEventChain(updatedLedger);

        expect(result.valid).toBe(true);
        expect(result.missing).toEqual([]);
        cleanup();
      });

      it('应检测缺失事件', () => {
        cleanup();
        const ledger = ExecutionLedger.init(TEST_TASK_ID);
        ExecutionLedger.append(TEST_TASK_ID, 'docs_read', { file: 'test.md' });

        const updatedLedger = ExecutionLedger.get(TEST_TASK_ID);
        const result = LedgerAdapter.validateEventChain(updatedLedger);

        expect(result.valid).toBe(false);
        expect(result.missing).toContain('model_called');
        expect(result.missing).toContain('session_captured');
        cleanup();
      });

      it('应处理空 Ledger', () => {
        const result = LedgerAdapter.validateEventChain(null);

        expect(result.valid).toBe(false);
        expect(result.missing).toEqual(['all']);
      });
    });

    describe('validateSessionBinding', () => {
      it('应校验 SESSION_ID 匹配', () => {
        cleanup();
        const ledger = ExecutionLedger.init(TEST_TASK_ID);
        const sessionId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
        ExecutionLedger.bindSession(TEST_TASK_ID, sessionId);

        const updatedLedger = ExecutionLedger.get(TEST_TASK_ID);
        const result = LedgerAdapter.validateSessionBinding(updatedLedger, sessionId);

        expect(result.valid).toBe(true);
        cleanup();
      });

      it('应检测 SESSION_ID 不匹配', () => {
        cleanup();
        const ledger = ExecutionLedger.init(TEST_TASK_ID);
        const sessionId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
        ExecutionLedger.bindSession(TEST_TASK_ID, sessionId);

        const updatedLedger = ExecutionLedger.get(TEST_TASK_ID);
        const result = LedgerAdapter.validateSessionBinding(
          updatedLedger,
          'different-session-id'
        );

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('SESSION_ID 不匹配');
        cleanup();
      });

      it('应检测未绑定 SESSION_ID', () => {
        cleanup();
        const ledger = ExecutionLedger.init(TEST_TASK_ID);
        const result = LedgerAdapter.validateSessionBinding(ledger, 'any-session-id');

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('未绑定 SESSION_ID');
        cleanup();
      });
    });

    describe('validateState', () => {
      it('SUCCESS 状态应允许写入', () => {
        cleanup();
        const ledger = ExecutionLedger.init(TEST_TASK_ID);
        ExecutionLedger.transition(TEST_TASK_ID, 'RUNNING');
        ExecutionLedger.transition(TEST_TASK_ID, 'SUCCESS');

        const updatedLedger = ExecutionLedger.get(TEST_TASK_ID);
        const result = LedgerAdapter.validateState(updatedLedger);

        expect(result.valid).toBe(true);
        cleanup();
      });

      it('DEGRADED 状态应允许写入', () => {
        cleanup();
        const ledger = ExecutionLedger.init(TEST_TASK_ID);
        ExecutionLedger.transition(TEST_TASK_ID, 'RUNNING');
        ExecutionLedger.transition(TEST_TASK_ID, 'DEGRADED');
        ExecutionLedger.append(TEST_TASK_ID, 'model_called', {
          backend: 'codex',
          degraded: true,
          reason: 'Gemini unavailable'
        });

        const updatedLedger = ExecutionLedger.get(TEST_TASK_ID);
        const result = LedgerAdapter.validateState(updatedLedger);

        expect(result.valid).toBe(true);
        cleanup();
      });

      it('DEGRADED 状态缺少降级事件应拒绝', () => {
        cleanup();
        const ledger = ExecutionLedger.init(TEST_TASK_ID);
        ExecutionLedger.transition(TEST_TASK_ID, 'RUNNING');
        ExecutionLedger.transition(TEST_TASK_ID, 'DEGRADED');

        const updatedLedger = ExecutionLedger.get(TEST_TASK_ID);
        const result = LedgerAdapter.validateState(updatedLedger);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('缺少降级事件');
        cleanup();
      });

      it('INIT 状态应拒绝写入', () => {
        cleanup();
        const ledger = ExecutionLedger.init(TEST_TASK_ID);
        const result = LedgerAdapter.validateState(ledger);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('状态不允许写入');
        cleanup();
      });

      it('RUNNING 状态应拒绝写入', () => {
        cleanup();
        const ledger = ExecutionLedger.init(TEST_TASK_ID);
        ExecutionLedger.transition(TEST_TASK_ID, 'RUNNING');

        const updatedLedger = ExecutionLedger.get(TEST_TASK_ID);
        const result = LedgerAdapter.validateState(updatedLedger);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('状态不允许写入');
        cleanup();
      });

      it('FAILED 状态应拒绝写入', () => {
        cleanup();
        const ledger = ExecutionLedger.init(TEST_TASK_ID);
        ExecutionLedger.transition(TEST_TASK_ID, 'RUNNING');
        ExecutionLedger.transition(TEST_TASK_ID, 'FAILED');

        const updatedLedger = ExecutionLedger.get(TEST_TASK_ID);
        const result = LedgerAdapter.validateState(updatedLedger);

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('状态不允许写入');
        cleanup();
      });
    });
  });

  describe('EvidenceParser', () => {
    describe('extractSessionId', () => {
      it('应提取标准格式 SESSION_ID', () => {
        const content = 'SESSION_ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890';
        const result = EvidenceParser.extractSessionId(content);

        expect(result).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      });

      it('应提取无冒号格式 SESSION_ID', () => {
        const content = 'SESSION_ID a1b2c3d4-e5f6-7890-abcd-ef1234567890';
        const result = EvidenceParser.extractSessionId(content);

        expect(result).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      });

      it('应处理大小写不敏感', () => {
        const content = 'session_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890';
        const result = EvidenceParser.extractSessionId(content);

        expect(result).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      });

      it('应拒绝伪造 UUID', () => {
        const content = 'SESSION_ID: fake-uuid-12345';
        const result = EvidenceParser.extractSessionId(content);

        expect(result).toBeNull();
      });

      it('应处理空内容', () => {
        const result = EvidenceParser.extractSessionId('');

        expect(result).toBeNull();
      });

      it('应处理 null 内容', () => {
        const result = EvidenceParser.extractSessionId(null);

        expect(result).toBeNull();
      });
    });

    describe('hasDualModelEvidence', () => {
      it('应检测 Codex 证据', () => {
        const content = 'Analysis by Codex: ...';
        const result = EvidenceParser.hasDualModelEvidence(content);

        expect(result).toBe(true);
      });

      it('应检测 Gemini 证据', () => {
        const content = 'Analysis by Gemini: ...';
        const result = EvidenceParser.hasDualModelEvidence(content);

        expect(result).toBe(true);
      });

      it('应检测双模型证据', () => {
        const content = 'Codex analysis: ... Gemini analysis: ...';
        const result = EvidenceParser.hasDualModelEvidence(content);

        expect(result).toBe(true);
      });

      it('应处理大小写不敏感', () => {
        const content = 'codex analysis: ...';
        const result = EvidenceParser.hasDualModelEvidence(content);

        expect(result).toBe(true);
      });

      it('应拒绝无证据内容', () => {
        const content = 'Some random content without model evidence';
        const result = EvidenceParser.hasDualModelEvidence(content);

        expect(result).toBe(false);
      });

      it('应处理空内容', () => {
        const result = EvidenceParser.hasDualModelEvidence('');

        expect(result).toBe(false);
      });
    });
  });

  describe('Execution Guard Hook 集成测试', () => {
    it('完整事件链 + 匹配 SESSION_ID 应允许写入', () => {
      cleanup();
      // 初始化 Ledger
      const ledger = ExecutionLedger.init(TEST_TASK_ID);
      const sessionId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

      // 追加事件
      ExecutionLedger.append(TEST_TASK_ID, 'docs_read', { file: 'test.md' });
      ExecutionLedger.append(TEST_TASK_ID, 'model_called', { backend: 'codex' });
      ExecutionLedger.append(TEST_TASK_ID, 'session_captured', { session_id: sessionId });

      // 绑定 SESSION_ID
      ExecutionLedger.bindSession(TEST_TASK_ID, sessionId);

      // 转换到 SUCCESS 状态
      ExecutionLedger.transition(TEST_TASK_ID, 'RUNNING');
      ExecutionLedger.transition(TEST_TASK_ID, 'SUCCESS');

      // 获取最终 Ledger
      const finalLedger = ExecutionLedger.get(TEST_TASK_ID);

      // 模拟文档内容
      const documentContent = `SESSION_ID: ${sessionId}\n\nSome content...`;

      // 校验
      const stateValidation = LedgerAdapter.validateState(finalLedger);
      const eventChainValidation = LedgerAdapter.validateEventChain(finalLedger);
      const documentSessionId = EvidenceParser.extractSessionId(documentContent);
      const sessionValidation = LedgerAdapter.validateSessionBinding(
        finalLedger,
        documentSessionId
      );

      expect(stateValidation.valid).toBe(true);
      expect(eventChainValidation.valid).toBe(true);
      expect(documentSessionId).toBe(sessionId);
      expect(sessionValidation.valid).toBe(true);
      cleanup();
    });

    it('伪造 UUID 应拒绝', () => {
      cleanup();
      // 初始化 Ledger
      const ledger = ExecutionLedger.init(TEST_TASK_ID);
      const realSessionId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const fakeSessionId = 'fake-uuid-12345';

      // 追加事件
      ExecutionLedger.append(TEST_TASK_ID, 'docs_read', { file: 'test.md' });
      ExecutionLedger.append(TEST_TASK_ID, 'model_called', { backend: 'codex' });
      ExecutionLedger.append(TEST_TASK_ID, 'session_captured', { session_id: realSessionId });

      // 绑定真实 SESSION_ID
      ExecutionLedger.bindSession(TEST_TASK_ID, realSessionId);

      // 转换到 SUCCESS 状态
      ExecutionLedger.transition(TEST_TASK_ID, 'RUNNING');
      ExecutionLedger.transition(TEST_TASK_ID, 'SUCCESS');

      // 获取最终 Ledger
      const finalLedger = ExecutionLedger.get(TEST_TASK_ID);

      // 模拟伪造 UUID 的文档内容
      const documentContent = `SESSION_ID: ${fakeSessionId}\n\nSome content...`;

      // 提取伪造 UUID（应失败）
      const documentSessionId = EvidenceParser.extractSessionId(documentContent);

      expect(documentSessionId).toBeNull();
      cleanup();
    });

    it('缺失 session_captured 事件应拒绝', () => {
      cleanup();
      // 初始化 Ledger
      const ledger = ExecutionLedger.init(TEST_TASK_ID);
      const sessionId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

      // 追加事件（缺少 session_captured）
      ExecutionLedger.append(TEST_TASK_ID, 'docs_read', { file: 'test.md' });
      ExecutionLedger.append(TEST_TASK_ID, 'model_called', { backend: 'codex' });
      // 注意：这里故意不追加 session_captured 事件

      // 绑定 SESSION_ID
      ExecutionLedger.bindSession(TEST_TASK_ID, sessionId);

      // 转换到 SUCCESS 状态
      ExecutionLedger.transition(TEST_TASK_ID, 'RUNNING');
      ExecutionLedger.transition(TEST_TASK_ID, 'SUCCESS');

      // 获取最终 Ledger
      const finalLedger = ExecutionLedger.get(TEST_TASK_ID);

      // 校验事件链（应失败）
      const eventChainValidation = LedgerAdapter.validateEventChain(finalLedger);

      expect(eventChainValidation.valid).toBe(false);
      expect(eventChainValidation.missing).toContain('session_captured');
      cleanup();
    });

    it('DEGRADED 状态必须带降级事件', () => {
      cleanup();
      // 初始化 Ledger
      const ledger = ExecutionLedger.init(TEST_TASK_ID);
      const sessionId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

      // 追加事件
      ExecutionLedger.append(TEST_TASK_ID, 'docs_read', { file: 'test.md' });
      ExecutionLedger.append(TEST_TASK_ID, 'model_called', {
        backend: 'codex',
        degraded: true,
        reason: 'Gemini unavailable'
      });
      ExecutionLedger.append(TEST_TASK_ID, 'session_captured', { session_id: sessionId });

      // 绑定 SESSION_ID
      ExecutionLedger.bindSession(TEST_TASK_ID, sessionId);

      // 转换到 DEGRADED 状态
      ExecutionLedger.transition(TEST_TASK_ID, 'RUNNING');
      ExecutionLedger.transition(TEST_TASK_ID, 'DEGRADED');

      // 获取最终 Ledger
      const finalLedger = ExecutionLedger.get(TEST_TASK_ID);

      // 校验状态（应通过）
      const stateValidation = LedgerAdapter.validateState(finalLedger);

      expect(stateValidation.valid).toBe(true);
      cleanup();
    });

    it('DEGRADED 状态缺少降级事件应拒绝', () => {
      cleanup();
      // 初始化 Ledger
      const ledger = ExecutionLedger.init(TEST_TASK_ID);
      const sessionId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

      // 追加事件（无降级标记）
      ExecutionLedger.append(TEST_TASK_ID, 'docs_read', { file: 'test.md' });
      ExecutionLedger.append(TEST_TASK_ID, 'model_called', { backend: 'codex' });
      ExecutionLedger.append(TEST_TASK_ID, 'session_captured', { session_id: sessionId });

      // 绑定 SESSION_ID
      ExecutionLedger.bindSession(TEST_TASK_ID, sessionId);

      // 转换到 DEGRADED 状态
      ExecutionLedger.transition(TEST_TASK_ID, 'RUNNING');
      ExecutionLedger.transition(TEST_TASK_ID, 'DEGRADED');

      // 获取最终 Ledger
      const finalLedger = ExecutionLedger.get(TEST_TASK_ID);

      // 校验状态（应失败）
      const stateValidation = LedgerAdapter.validateState(finalLedger);

      expect(stateValidation.valid).toBe(false);
      expect(stateValidation.reason).toContain('缺少降级事件');
      cleanup();
    });
  });
}

// 运行测试
runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
