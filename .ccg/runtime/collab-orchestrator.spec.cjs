/**
 * CollabOrchestrator 单元测试
 *
 * 使用 Node.js 内置 assert，无外部依赖
 * 运行：node .ccg/runtime/collab-orchestrator.spec.cjs
 */

const assert = require('assert');
const path = require('path');
const { CollabOrchestrator } = require('./collab-orchestrator.cjs');
const { States, EventTypes } = require('./execution-ledger-schema.cjs');

// --- 简单测试运行器 ---

let passed = 0;
let failed = 0;
let total = 0;
const errors = [];

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (e) {
    failed++;
    errors.push({ name, error: e });
    console.error(`  \u2717 ${name}: ${e.message}`);
  }
}

function asyncTest(name, fn) {
  total++;
  return fn().then(() => {
    passed++;
    console.log(`  \u2713 ${name}`);
  }).catch((e) => {
    failed++;
    errors.push({ name, error: e });
    console.error(`  \u2717 ${name}: ${e.message}`);
  });
}

// --- 测试辅助 ---

const TEST_CONFIG_PATH = path.join(__dirname, '..', 'config.toml');
const TEST_CWD = 'C:/Users/Administrator/.claude';

function createOrchestrator(overrides = {}) {
  return new CollabOrchestrator({
    configPath: TEST_CONFIG_PATH,
    cwd: TEST_CWD,
    env: { LITE_MODE: 'false', GEMINI_MODEL: '' },
    verbose: false,
    liteMode: false,
    ...overrides
  });
}

// ============================================================
// 测试组 1：构造函数
// ============================================================

console.log('\n--- 构造函数 ---');

test('1.1 默认参数初始化', () => {
  const orch = new CollabOrchestrator();
  assert.strictEqual(orch.getState(), States.INIT);
  assert.deepStrictEqual(orch.getEvents(), []);
});

test('1.2 自定义参数初始化', () => {
  const orch = createOrchestrator({ verbose: true, liteMode: true });
  assert.strictEqual(orch._verbose, true);
  assert.strictEqual(orch._liteMode, true);
  assert.strictEqual(orch._cwd, TEST_CWD);
});

test('1.3 初始状态为 INIT', () => {
  const orch = createOrchestrator();
  assert.strictEqual(orch.getState(), States.INIT);
});

// ============================================================
// 测试组 2：命令渲染
// ============================================================

console.log('\n--- 命令渲染 ---');

test('2.1 Codex 命令渲染正确', () => {
  const orch = createOrchestrator();
  const cmd = orch._renderCommand('codex', 'architect', '分析架构');
  assert.ok(cmd.includes('--backend codex'), '应包含 --backend codex');
  assert.ok(cmd.includes('codex/architect.md'), '应包含角色文件路径');
  assert.ok(cmd.includes('分析架构'), '应包含任务描述');
  assert.ok(cmd.includes(TEST_CWD), '应包含工作目录');
});

test('2.2 Gemini 命令渲染正确', () => {
  const orch = createOrchestrator();
  const cmd = orch._renderCommand('gemini', 'reviewer', '审查代码');
  assert.ok(cmd.includes('--backend gemini'), '应包含 --backend gemini');
  assert.ok(cmd.includes('gemini/reviewer.md'), '应包含角色文件路径');
  assert.ok(cmd.includes('审查代码'), '应包含任务描述');
});

test('2.3 LITE_MODE_FLAG 正确注入', () => {
  const orch = createOrchestrator({
    env: { LITE_MODE: 'true', GEMINI_MODEL: '' }
  });
  const cmd = orch._renderCommand('codex', 'analyzer', '测试');
  assert.ok(cmd.includes('--lite '), '应包含 --lite 标志');
});

test('2.4 GEMINI_MODEL_FLAG 正确注入', () => {
  const orch = createOrchestrator({
    env: { LITE_MODE: 'false', GEMINI_MODEL: 'gemini-3-pro-preview' }
  });
  const cmd = orch._renderCommand('gemini', 'architect', '测试');
  assert.ok(cmd.includes('--gemini-model gemini-3-pro-preview'), '应包含 Gemini 模型标志');
});

test('2.5 残留占位符抛出错误', () => {
  const orch = createOrchestrator();
  // 注入一个无法解析的占位符到模板
  const originalRender = orch._runtimeVars;
  // 通过传入包含未知占位符的 task 来触发（不会触发，因为 TASK 已被替换）
  // 直接测试 renderTemplate + validateNoPlaceholders 的集成
  const { renderTemplate, validateNoPlaceholders } = require('./command-renderer.cjs');
  const badTemplate = 'echo {{UNKNOWN_VAR}}';
  const rendered = renderTemplate(badTemplate, {});
  assert.throws(() => {
    validateNoPlaceholders(rendered);
  }, /渲染失败：命令中存在残留占位符/);
});

// ============================================================
// 测试组 3：SESSION_ID 提取
// ============================================================

console.log('\n--- SESSION_ID 提取 ---');

test('3.1 正常提取 UUID', () => {
  const orch = createOrchestrator();
  const output = '一些输出内容\nSESSION_ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890\n后续内容';
  const id = orch._extractSessionId(output);
  assert.strictEqual(id, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
});

test('3.2 无 SESSION_ID 返回 null', () => {
  const orch = createOrchestrator();
  const output = '一些普通输出，没有 session 信息';
  const id = orch._extractSessionId(output);
  assert.strictEqual(id, null);
});

test('3.3 多个 SESSION_ID 取第一个', () => {
  const orch = createOrchestrator();
  const output = 'SESSION_ID: aaaa-bbbb-cccc-dddd\n其他内容\nSESSION_ID: 1111-2222-3333-4444';
  const id = orch._extractSessionId(output);
  assert.strictEqual(id, 'aaaa-bbbb-cccc-dddd');
});

test('3.4 null 输入返回 null', () => {
  const orch = createOrchestrator();
  assert.strictEqual(orch._extractSessionId(null), null);
});

// ============================================================
// 测试组 4：状态判定
// ============================================================

console.log('\n--- 状态判定 ---');

test('4.1 双模型成功 -> SUCCESS', () => {
  const orch = createOrchestrator();
  const status = orch._determineStatus('uuid-codex', 'uuid-gemini', 'both');
  assert.strictEqual(status, 'SUCCESS');
});

test('4.2 仅 Codex 成功 -> DEGRADED', () => {
  const orch = createOrchestrator();
  const status = orch._determineStatus('uuid-codex', null, 'both');
  assert.strictEqual(status, 'DEGRADED');
});

test('4.3 仅 Gemini 成功 -> DEGRADED', () => {
  const orch = createOrchestrator();
  const status = orch._determineStatus(null, 'uuid-gemini', 'both');
  assert.strictEqual(status, 'DEGRADED');
});

test('4.4 双模型失败 -> FAILED', () => {
  const orch = createOrchestrator();
  const status = orch._determineStatus(null, null, 'both');
  assert.strictEqual(status, 'FAILED');
});

test('4.5 backend=codex 且仅 Codex 有 SESSION_ID -> SUCCESS（单模型模式）', () => {
  const orch = createOrchestrator();
  const status = orch._determineStatus('uuid-codex', null, 'codex');
  assert.strictEqual(status, 'SUCCESS');
});

test('4.6 backend=gemini 且 Gemini 无 SESSION_ID -> FAILED', () => {
  const orch = createOrchestrator();
  const status = orch._determineStatus(null, null, 'gemini');
  assert.strictEqual(status, 'FAILED');
});

// ============================================================
// 测试组 5：DEGRADED 分级
// ============================================================

console.log('\n--- DEGRADED 分级 ---');

test('5.1 role=architect 缺 frontend -> ACCEPTABLE', () => {
  const orch = createOrchestrator();
  const level = orch._determineDegradedLevel('architect', ['frontend']);
  assert.strictEqual(level, 'ACCEPTABLE');
});

test('5.2 role=architect 缺 backend -> UNACCEPTABLE', () => {
  const orch = createOrchestrator();
  const level = orch._determineDegradedLevel('architect', ['backend']);
  assert.strictEqual(level, 'UNACCEPTABLE');
});

test('5.3 role=analyzer 缺任何 -> UNACCEPTABLE', () => {
  const orch = createOrchestrator();
  assert.strictEqual(orch._determineDegradedLevel('analyzer', ['frontend']), 'UNACCEPTABLE');
  assert.strictEqual(orch._determineDegradedLevel('analyzer', ['backend']), 'UNACCEPTABLE');
  assert.strictEqual(orch._determineDegradedLevel('analyzer', ['backend', 'frontend']), 'UNACCEPTABLE');
});

test('5.4 role=reviewer 缺 backend -> ACCEPTABLE', () => {
  const orch = createOrchestrator();
  const level = orch._determineDegradedLevel('reviewer', ['backend']);
  assert.strictEqual(level, 'ACCEPTABLE');
});

test('5.5 role=reviewer 缺 frontend -> UNACCEPTABLE', () => {
  const orch = createOrchestrator();
  const level = orch._determineDegradedLevel('reviewer', ['frontend']);
  assert.strictEqual(level, 'UNACCEPTABLE');
});

// ============================================================
// 测试组 6：LITE_MODE
// ============================================================

console.log('\n--- LITE_MODE ---');

const liteModeTests = [];

liteModeTests.push(asyncTest('6.1 liteMode=true 返回 DEGRADED + ACCEPTABLE', async () => {
  const orch = createOrchestrator({ liteMode: true });
  const result = await orch.execute({ role: 'architect', task: '测试任务' });
  assert.strictEqual(result.status, 'DEGRADED');
  assert.strictEqual(result.degraded_level, 'ACCEPTABLE');
  assert.strictEqual(result.degraded_reason, 'LITE_MODE: 跳过外部模型调用');
  assert.strictEqual(result.codex_session, null);
  assert.strictEqual(result.gemini_session, null);
  assert.ok(typeof result.duration_ms === 'number', 'duration_ms 应为数字');
}));

// ============================================================
// 测试组 7：事件记录
// ============================================================

console.log('\n--- 事件记录 ---');

liteModeTests.push(asyncTest('7.1 execute 后事件链完整（LITE_MODE 路径）', async () => {
  const orch = createOrchestrator({ liteMode: true });
  await orch.execute({ role: 'architect', task: '测试' });
  const events = orch.getEvents();
  assert.ok(events.length >= 1, '应至少有 1 个事件');
  assert.strictEqual(events[0].type, EventTypes.DEGRADED);
}));

liteModeTests.push(asyncTest('7.2 事件包含正确的 EventTypes', async () => {
  const orch = createOrchestrator({ liteMode: true });
  await orch.execute({ role: 'architect', task: '测试' });
  const events = orch.getEvents();
  for (const event of events) {
    assert.ok(event.type, '事件应有 type 字段');
    assert.ok(event.timestamp, '事件应有 timestamp 字段');
    assert.ok(event.data !== undefined, '事件应有 data 字段');
  }
}));

test('7.3 processResults 后事件链完整（双模型成功路径）', () => {
  const orch = createOrchestrator();
  // 手动将状态推进到 RUNNING
  orch._transitionTo(States.RUNNING);
  orch._recordEvent(EventTypes.MODEL_CALLED, { phase: 'running' });

  const result = orch.processResults(
    {
      codex: '输出内容\nSESSION_ID: aaaa-bbbb-cccc-dddd',
      gemini: '输出内容\nSESSION_ID: 1111-2222-3333-4444'
    },
    'architect',
    Date.now() - 5000
  );

  assert.strictEqual(result.status, 'SUCCESS');
  const events = orch.getEvents();
  // 应有 MODEL_CALLED + 2x SESSION_CAPTURED + 最终 SESSION_CAPTURED(success)
  assert.ok(events.length >= 3, `应至少有 3 个事件，实际 ${events.length}`);
});

test('7.4 processResults 后事件链完整（单模型降级路径）', () => {
  const orch = createOrchestrator();
  orch._transitionTo(States.RUNNING);

  const result = orch.processResults(
    {
      codex: '输出内容\nSESSION_ID: aaaa-bbbb-cccc-dddd',
      gemini: '输出内容但无 session'
    },
    'architect',
    Date.now() - 3000
  );

  assert.strictEqual(result.status, 'DEGRADED');
  assert.strictEqual(result.degraded_level, 'ACCEPTABLE');
  assert.deepStrictEqual(result.missing_dimensions, ['frontend']);
});

test('7.5 processResults 后事件链完整（双模型失败路径）', () => {
  const orch = createOrchestrator();
  orch._transitionTo(States.RUNNING);

  const result = orch.processResults(
    {
      codex: '输出但无 session',
      gemini: '输出但无 session'
    },
    'architect',
    Date.now() - 2000
  );

  assert.strictEqual(result.status, 'FAILED');
  assert.strictEqual(result.degraded_level, null);
});

// ============================================================
// 测试组 8：Ledger 查询
// ============================================================

console.log('\n--- Ledger 查询 ---');

test('8.1 getLedger() 返回完整记录', () => {
  const orch = createOrchestrator();
  const ledger = orch.getLedger();
  assert.ok('task_id' in ledger, '应有 task_id');
  assert.ok('session_id' in ledger, '应有 session_id');
  assert.ok('state' in ledger, '应有 state');
  assert.ok('events' in ledger, '应有 events');
  assert.ok('created_at' in ledger, '应有 created_at');
  assert.ok('updated_at' in ledger, '应有 updated_at');
  assert.strictEqual(ledger.state, States.INIT);
});

test('8.2 getState() 返回当前状态', () => {
  const orch = createOrchestrator();
  assert.strictEqual(orch.getState(), States.INIT);
});

test('8.3 getEvents() 返回事件数组（不可变副本）', () => {
  const orch = createOrchestrator();
  const events1 = orch.getEvents();
  const events2 = orch.getEvents();
  assert.notStrictEqual(events1, events2, '每次调用应返回新数组');
  assert.deepStrictEqual(events1, events2, '内容应相同');
});

// ============================================================
// 测试组 9：execute 正常路径（非 LITE_MODE）
// ============================================================

console.log('\n--- execute 正常路径 ---');

liteModeTests.push(asyncTest('9.1 execute 返回 commands 和 taskIds（backend=both）', async () => {
  const orch = createOrchestrator();
  const result = await orch.execute({ backend: 'both', role: 'architect', task: '分析架构' });
  assert.ok(result.commands, '应有 commands');
  assert.ok(result.taskIds, '应有 taskIds');
  assert.ok(result.commands.codex, '应有 codex 命令');
  assert.ok(result.commands.gemini, '应有 gemini 命令');
  assert.ok(result.taskIds.codex, '应有 codex taskId');
  assert.ok(result.taskIds.gemini, '应有 gemini taskId');
  assert.strictEqual(orch.getState(), States.RUNNING);
}));

liteModeTests.push(asyncTest('9.2 execute 返回 commands（backend=codex）', async () => {
  const orch = createOrchestrator();
  const result = await orch.execute({ backend: 'codex', role: 'reviewer', task: '审查' });
  assert.ok(result.commands.codex, '应有 codex 命令');
  assert.strictEqual(result.commands.gemini, undefined, '不应有 gemini 命令');
}));

// ============================================================
// 测试组 10：状态转换合法性
// ============================================================

console.log('\n--- 状态转换 ---');

test('10.1 非法状态转换抛出错误', () => {
  const orch = createOrchestrator();
  // INIT 不能直接到 SUCCESS
  assert.throws(() => {
    orch._transitionTo(States.SUCCESS);
  }, /非法状态转换/);
});

test('10.2 合法状态转换不抛出错误', () => {
  const orch = createOrchestrator();
  assert.doesNotThrow(() => {
    orch._transitionTo(States.RUNNING);
  });
  assert.strictEqual(orch.getState(), States.RUNNING);
});

// ============================================================
// 测试组 11：进度消息
// ============================================================

console.log('\n--- 进度消息 ---');

test('11.1 _buildProgressMessage 格式正确', () => {
  const orch = createOrchestrator();
  const msg = orch._buildProgressMessage('RUNNING', 45000);
  assert.ok(msg.includes('RUNNING'), '应包含状态');
  assert.ok(msg.includes('45s'), '应包含耗时');
});

// --- 等待异步测试完成后输出结果 ---

Promise.all(liteModeTests).then(() => {
  console.log(`\n${'='.repeat(40)}`);
  console.log(`${passed}/${total} passed, ${failed} failed`);

  if (errors.length > 0) {
    console.log('\n失败详情：');
    for (const { name, error } of errors) {
      console.error(`  ${name}:`);
      console.error(`    ${error.message}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
});
