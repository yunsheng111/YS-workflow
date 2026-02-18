#!/usr/bin/env node
/**
 * 降级场景 Ledger 初始化辅助函数 - 单元测试
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  initDegradedLedger,
  setTaskIdEnv,
  generateTaskId,
  setupDegradedScenario
} = require('./degraded-ledger-helper.cjs');
const ExecutionLedger = require('./execution-ledger.cjs');

const LEDGER_DIR = path.join(__dirname, 'ledger');

// 清理测试数据
function cleanup() {
  if (fs.existsSync(LEDGER_DIR)) {
    const files = fs.readdirSync(LEDGER_DIR);
    files.forEach(file => {
      if (file.startsWith('test-') || file.startsWith('degraded-')) {
        fs.unlinkSync(path.join(LEDGER_DIR, file));
      }
    });
  }
  delete process.env.TASK_ID;
}

// 测试套件
function runTests() {
  console.log('🧪 开始测试 degraded-ledger-helper...\n');

  let passed = 0;
  let failed = 0;

  // 测试 1: generateTaskId
  try {
    const taskId1 = generateTaskId();
    assert(taskId1.startsWith('degraded-'), 'taskId 应以 degraded- 开头');
    assert(/^degraded-\d+-[a-z0-9]{6}$/.test(taskId1), 'taskId 格式应正确');

    const taskId2 = generateTaskId('test');
    assert(taskId2.startsWith('test-'), 'taskId 应以 test- 开头');

    console.log('✅ 测试 1: generateTaskId 通过');
    passed++;
  } catch (err) {
    console.error('❌ 测试 1 失败:', err.message);
    failed++;
  }

  // 测试 2: setTaskIdEnv
  try {
    cleanup();
    setTaskIdEnv('test-123');
    assert.strictEqual(process.env.TASK_ID, 'test-123', 'TASK_ID 应被设置');
    console.log('✅ 测试 2: setTaskIdEnv 通过');
    passed++;
  } catch (err) {
    console.error('❌ 测试 2 失败:', err.message);
    failed++;
  } finally {
    cleanup();
  }

  // 测试 3: initDegradedLedger - 正常流程
  try {
    cleanup();
    const taskId = 'test-degraded-001';
    const sessionId = '019c6xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    const ledger = initDegradedLedger({
      taskId,
      sessionId,
      backend: 'codex',
      reason: '测试降级'
    });

    assert.strictEqual(ledger.task_id, taskId, 'task_id 应匹配');
    assert.strictEqual(ledger.session_id, sessionId, 'session_id 应匹配');
    assert.strictEqual(ledger.state, 'DEGRADED', '状态应为 DEGRADED');
    assert(ledger.events.length >= 3, '事件数应 >= 3');

    // 验证事件类型
    const eventTypes = ledger.events.map(e => e.type);
    assert(eventTypes.includes('model_called'), '应包含 model_called 事件');
    assert(eventTypes.includes('session_captured'), '应包含 session_captured 事件');
    assert(eventTypes.includes('degraded'), '应包含 degraded 事件');

    console.log('✅ 测试 3: initDegradedLedger 正常流程通过');
    passed++;
  } catch (err) {
    console.error('❌ 测试 3 失败:', err.message);
    failed++;
  } finally {
    cleanup();
  }

  // 测试 4: initDegradedLedger - 参数校验
  try {
    cleanup();

    // 缺少 taskId
    try {
      initDegradedLedger({
        sessionId: 'xxx',
        backend: 'codex'
      });
      throw new Error('应抛出错误');
    } catch (err) {
      assert(err.message.includes('taskId'), '应提示 taskId 缺失');
    }

    // 缺少 sessionId
    try {
      initDegradedLedger({
        taskId: 'test-001',
        backend: 'codex'
      });
      throw new Error('应抛出错误');
    } catch (err) {
      assert(err.message.includes('sessionId'), '应提示 sessionId 缺失');
    }

    // 无效的 backend
    try {
      initDegradedLedger({
        taskId: 'test-001',
        sessionId: 'xxx',
        backend: 'invalid'
      });
      throw new Error('应抛出错误');
    } catch (err) {
      assert(err.message.includes('backend'), '应提示 backend 无效');
    }

    console.log('✅ 测试 4: initDegradedLedger 参数校验通过');
    passed++;
  } catch (err) {
    console.error('❌ 测试 4 失败:', err.message);
    failed++;
  } finally {
    cleanup();
  }

  // 测试 5: setupDegradedScenario - 完整流程
  try {
    cleanup();
    const sessionId = '019c6xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    const { taskId, ledger } = setupDegradedScenario({
      sessionId,
      backend: 'gemini',
      reason: '完整流程测试'
    });

    // 验证 taskId
    assert(taskId, 'taskId 应存在');
    assert(taskId.startsWith('degraded-'), 'taskId 应以 degraded- 开头');

    // 验证环境变量
    assert.strictEqual(process.env.TASK_ID, taskId, 'TASK_ID 环境变量应被设置');

    // 验证 Ledger
    assert.strictEqual(ledger.task_id, taskId, 'ledger.task_id 应匹配');
    assert.strictEqual(ledger.session_id, sessionId, 'ledger.session_id 应匹配');
    assert.strictEqual(ledger.state, 'DEGRADED', 'ledger.state 应为 DEGRADED');

    // 验证 Ledger 文件存在
    const ledgerPath = path.join(LEDGER_DIR, `${taskId}.json`);
    assert(fs.existsSync(ledgerPath), 'Ledger 文件应存在');

    console.log('✅ 测试 5: setupDegradedScenario 完整流程通过');
    passed++;
  } catch (err) {
    console.error('❌ 测试 5 失败:', err.message);
    failed++;
  } finally {
    cleanup();
  }

  // 测试 6: setupDegradedScenario - 自定义前缀
  try {
    cleanup();
    const sessionId = '019c6xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    const { taskId } = setupDegradedScenario({
      sessionId,
      backend: 'codex',
      taskIdPrefix: 'custom'
    });

    assert(taskId.startsWith('custom-'), 'taskId 应以 custom- 开头');

    console.log('✅ 测试 6: setupDegradedScenario 自定义前缀通过');
    passed++;
  } catch (err) {
    console.error('❌ 测试 6 失败:', err.message);
    failed++;
  } finally {
    cleanup();
  }

  // 测试 7: 降级事件数据完整性
  try {
    cleanup();
    const taskId = 'test-degraded-002';
    const sessionId = '019c6xxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    initDegradedLedger({
      taskId,
      sessionId,
      backend: 'codex',
      reason: '数据完整性测试'
    });

    const ledger = ExecutionLedger.get(taskId);
    const degradedEvent = ledger.events.find(e => e.type === 'degraded');

    assert(degradedEvent, '应存在 degraded 事件');
    assert.strictEqual(degradedEvent.data.reason, '数据完整性测试', 'reason 应匹配');
    assert.strictEqual(degradedEvent.data.missing_model, 'gemini', 'missing_model 应为 gemini');
    assert.strictEqual(degradedEvent.data.degraded_level, 'ACCEPTABLE', 'degraded_level 应为 ACCEPTABLE');
    assert.deepStrictEqual(degradedEvent.data.missing_dimensions, ['frontend'], 'missing_dimensions 应为 [frontend]');

    console.log('✅ 测试 7: 降级事件数据完整性通过');
    passed++;
  } catch (err) {
    console.error('❌ 测试 7 失败:', err.message);
    failed++;
  } finally {
    cleanup();
  }

  // 测试 8: Gemini 降级场景
  try {
    cleanup();
    const taskId = 'test-degraded-003';
    const sessionId = '784d494a-0aaf-4424-955e-0fc257fee3fb';

    initDegradedLedger({
      taskId,
      sessionId,
      backend: 'gemini',
      reason: 'Codex 超时'
    });

    const ledger = ExecutionLedger.get(taskId);
    const degradedEvent = ledger.events.find(e => e.type === 'degraded');

    assert.strictEqual(degradedEvent.data.missing_model, 'codex', 'missing_model 应为 codex');
    assert.deepStrictEqual(degradedEvent.data.missing_dimensions, ['backend'], 'missing_dimensions 应为 [backend]');

    console.log('✅ 测试 8: Gemini 降级场景通过');
    passed++;
  } catch (err) {
    console.error('❌ 测试 8 失败:', err.message);
    failed++;
  } finally {
    cleanup();
  }

  // 汇总结果
  console.log('\n' + '='.repeat(50));
  console.log(`测试完成: ${passed} 通过, ${failed} 失败`);
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
