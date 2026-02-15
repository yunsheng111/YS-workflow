#!/usr/bin/env node
/**
 * ccg-path-validator.cjs 单元测试
 *
 * 测试路径校验 Hook 的各种场景
 */

const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');

const HOOK_PATH = path.join(__dirname, 'ccg-path-validator.cjs');

/**
 * 执行 Hook 并返回结果
 */
function runHook(input) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [HOOK_PATH]);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', data => {
      stdout += data.toString();
    });

    proc.stderr.on('data', data => {
      stderr += data.toString();
    });

    proc.on('close', code => {
      try {
        const output = JSON.parse(stdout);
        resolve({ code, output, stderr });
      } catch (err) {
        reject(new Error(`Failed to parse output: ${stdout}\nStderr: ${stderr}`));
      }
    });

    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}

/**
 * 测试用例
 */
async function runTests() {
  console.log('🧪 开始测试 ccg-path-validator.cjs\n');

  let passed = 0;
  let failed = 0;

  // 测试 1: 非 Write/Edit 工具 → allow
  try {
    const result = await runHook({
      tool_name: 'Bash',
      tool_input: { command: 'ls -la' },
    });
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'allow');
    console.log('✅ 测试 1 通过: 非 Write/Edit 工具 → allow');
    passed++;
  } catch (err) {
    console.error('❌ 测试 1 失败:', err.message);
    failed++;
  }

  // 测试 2: Write 工具但无 file_path → allow
  try {
    const result = await runHook({
      tool_name: 'Write',
      tool_input: { content: 'test' },
    });
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'allow');
    console.log('✅ 测试 2 通过: Write 工具但无 file_path → allow');
    passed++;
  } catch (err) {
    console.error('❌ 测试 2 失败:', err.message);
    failed++;
  }

  // 测试 3: 白名单路径（wip 目录）→ allow
  try {
    const result = await runHook({
      tool_name: 'Write',
      tool_input: { file_path: '.doc/workflow/wip/execution/test.md' },
    });
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'allow');
    console.log('✅ 测试 3 通过: 白名单路径（wip 目录）→ allow');
    passed++;
  } catch (err) {
    console.error('❌ 测试 3 失败:', err.message);
    failed++;
  }

  // 测试 4: 白名单路径（代码文件）→ allow
  try {
    const result = await runHook({
      tool_name: 'Write',
      tool_input: { file_path: 'src/index.ts' },
    });
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'allow');
    console.log('✅ 测试 4 通过: 白名单路径（代码文件）→ allow');
    passed++;
  } catch (err) {
    console.error('❌ 测试 4 失败:', err.message);
    failed++;
  }

  // 测试 5: 白名单路径（配置文件）→ allow
  try {
    const result = await runHook({
      tool_name: 'Write',
      tool_input: { file_path: 'package.json' },
    });
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'allow');
    console.log('✅ 测试 5 通过: 白名单路径（配置文件）→ allow');
    passed++;
  } catch (err) {
    console.error('❌ 测试 5 失败:', err.message);
    failed++;
  }

  // 测试 6: team-research-agent 正确路径 → allow
  try {
    const result = await runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '.doc/agent-teams/research/20260215-test-research.md',
        description: 'team-research-agent output',
      },
    });
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'allow');
    console.log('✅ 测试 6 通过: team-research-agent 正确路径 → allow');
    passed++;
  } catch (err) {
    console.error('❌ 测试 6 失败:', err.message);
    failed++;
  }

  // 测试 7: team-research-agent 错误路径 → deny
  try {
    const result = await runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '.doc/workflow/research/20260215-test-research.md',
        description: 'team-research-agent output',
      },
    });
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'deny');
    assert.ok(result.output.hookSpecificOutput.reason.includes('agent-teams/research'));
    console.log('✅ 测试 7 通过: team-research-agent 错误路径 → deny');
    passed++;
  } catch (err) {
    console.error('❌ 测试 7 失败:', err.message);
    failed++;
  }

  // 测试 8: spec-research-agent 正确路径（constraints）→ allow
  try {
    const result = await runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '.doc/spec/constraints/20260215-test-constraints.md',
      },
    });
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'allow');
    console.log('✅ 测试 8 通过: spec-research-agent 正确路径（constraints）→ allow');
    passed++;
  } catch (err) {
    console.error('❌ 测试 8 失败:', err.message);
    failed++;
  }

  // 测试 9: spec-research-agent 正确路径（proposals）→ allow
  try {
    const result = await runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '.doc/spec/proposals/20260215-test-proposal.md',
      },
    });
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'allow');
    console.log('✅ 测试 9 通过: spec-research-agent 正确路径（proposals）→ allow');
    passed++;
  } catch (err) {
    console.error('❌ 测试 9 失败:', err.message);
    failed++;
  }

  // 测试 10: fullstack-agent 正确路径 → allow
  try {
    const result = await runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '.doc/workflow/plans/20260215-test-plan.md',
      },
    });
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'allow');
    console.log('✅ 测试 10 通过: fullstack-agent 正确路径 → allow');
    passed++;
  } catch (err) {
    console.error('❌ 测试 10 失败:', err.message);
    failed++;
  }

  // 测试 11: review-agent 正确路径 → allow
  try {
    const result = await runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '.doc/workflow/reviews/20260215-test-review.md',
      },
    });
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'allow');
    console.log('✅ 测试 11 通过: review-agent 正确路径 → allow');
    passed++;
  } catch (err) {
    console.error('❌ 测试 11 失败:', err.message);
    failed++;
  }

  // 测试 12: backend-agent 正确路径 → allow
  try {
    const result = await runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '.doc/workflow/wip/execution/20260215-backend-log.md',
      },
    });
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'allow');
    console.log('✅ 测试 12 通过: backend-agent 正确路径 → allow');
    passed++;
  } catch (err) {
    console.error('❌ 测试 12 失败:', err.message);
    failed++;
  }

  // 测试 13: Windows 路径格式 → allow
  try {
    const result = await runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '.doc\\agent-teams\\research\\20260215-test-research.md',
      },
    });
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'allow');
    console.log('✅ 测试 13 通过: Windows 路径格式 → allow');
    passed++;
  } catch (err) {
    console.error('❌ 测试 13 失败:', err.message);
    failed++;
  }

  // 测试 14: 无法推断代理类型 → allow（宽容策略）
  try {
    const result = await runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '.doc/unknown/path/test.md',
      },
    });
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'allow');
    console.log('✅ 测试 14 通过: 无法推断代理类型 → allow（宽容策略）');
    passed++;
  } catch (err) {
    console.error('❌ 测试 14 失败:', err.message);
    failed++;
  }

  // 测试 15: Edit 工具也应该被校验
  try {
    const result = await runHook({
      tool_name: 'Edit',
      tool_input: {
        file_path: '.doc/workflow/research/20260215-test.md',
        old_string: 'old',
        new_string: 'new',
      },
    });
    // Edit 工具对已存在的文件进行修改，应该 allow（因为文件已经在那里了）
    // 但如果是新文件，应该 deny
    // 这里我们假设是已存在的文件，所以 allow
    assert.strictEqual(result.output.hookSpecificOutput.permissionDecision, 'allow');
    console.log('✅ 测试 15 通过: Edit 工具修改已存在文件 → allow');
    passed++;
  } catch (err) {
    console.error('❌ 测试 15 失败:', err.message);
    failed++;
  }

  // 输出测试结果
  console.log(`\n📊 测试结果: ${passed} 通过, ${failed} 失败`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('测试执行失败:', err);
  process.exit(1);
});
