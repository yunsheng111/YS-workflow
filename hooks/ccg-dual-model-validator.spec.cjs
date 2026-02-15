#!/usr/bin/env node
/**
 * 单元测试 -- ccg-dual-model-validator.cjs
 *
 * 测试覆盖：
 * 1. 受保护路径 + 缺少证据 → deny
 * 2. 白名单豁免 → allow
 * 3. 非受保护路径 → allow (fail-open)
 * 4. 异常处理 → 受保护路径 fail-closed，非受保护路径 fail-open
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { spawn } = require('child_process');
const path = require('path');

const HOOK_PATH = path.join(__dirname, 'ccg-dual-model-validator.cjs');

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

describe('ccg-dual-model-validator', () => {
  describe('受保护路径 + 缺少证据', () => {
    it('Write 工具写入 .doc/workflow/plans/ 且无 SESSION_ID 应拒绝', async () => {
      const hookInput = {
        tool_name: 'Write',
        tool_input: {
          file_path: 'C:/Users/Admin/.claude/.doc/workflow/plans/20260216-test-plan.md',
          content: '# 测试计划\n\n这是一个没有 SESSION_ID 的计划文档。'
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
      expect(response.hookSpecificOutput.reason).toContain('SESSION_ID');
      expect(result.exitCode).toBe(2);
    });

    it('Edit 工具修改 .doc/agent-teams/research/ 且无 SESSION_ID 应拒绝', async () => {
      const hookInput = {
        tool_name: 'Edit',
        tool_input: {
          file_path: '.doc/agent-teams/research/20260216-research.md',
          new_string: '# 研究报告\n\n没有双模型证据的内容。'
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
      expect(response.hookSpecificOutput.reason).toContain('SESSION_ID');
      expect(result.exitCode).toBe(2);
    });

    it('Write 工具写入 .doc/spec/constraints/ 且无 Codex/Gemini 关键词应拒绝', async () => {
      const hookInput = {
        tool_name: 'Write',
        tool_input: {
          file_path: '.doc/spec/constraints/20260216-constraints.md',
          content: '# 约束集\n\nSESSION_ID: 12345678-1234-1234-1234-123456789abc\n\n但是没有提及双模型。'
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
      expect(response.hookSpecificOutput.reason).toContain('Codex 或 Gemini');
      expect(result.exitCode).toBe(2);
    });

    it('Edit 工具修改 .doc/common/reviews/ 且有 SESSION_ID 和 Codex 应允许', async () => {
      const hookInput = {
        tool_name: 'Edit',
        tool_input: {
          file_path: '.doc/common/reviews/20260216-review.md',
          new_string: '# 审查报告\n\nSESSION_ID: 12345678-1234-1234-1234-123456789abc\n\n使用 Codex 进行了分析。'
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('白名单豁免', () => {
    it('wip 目录应允许（无需 SESSION_ID）', async () => {
      const hookInput = {
        tool_name: 'Write',
        tool_input: {
          file_path: '.doc/workflow/wip/research/20260216-temp.md',
          content: '# 临时文件\n\n没有 SESSION_ID 也可以写入。'
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(result.exitCode).toBe(0);
    });

    it('LITE_MODE=true 环境变量应允许', async () => {
      const hookInput = {
        tool_name: 'Write',
        tool_input: {
          file_path: '.doc/workflow/plans/20260216-lite-plan.md',
          content: '# LITE 模式计划\n\n没有 SESSION_ID。'
        }
      };

      const result = await runHook(hookInput, { LITE_MODE: 'true' });
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(result.exitCode).toBe(0);
    });

    it('CCG_LEVEL3_DEGRADED=true 环境变量应允许', async () => {
      const hookInput = {
        tool_name: 'Edit',
        tool_input: {
          file_path: '.doc/agent-teams/plans/20260216-degraded-plan.md',
          new_string: '# 降级计划\n\n主代理接管，无需 SESSION_ID。'
        }
      };

      const result = await runHook(hookInput, { CCG_LEVEL3_DEGRADED: 'true' });
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(result.exitCode).toBe(0);
    });

    it('内容包含 LITE_MODE: true 标记应允许', async () => {
      const hookInput = {
        tool_name: 'Write',
        tool_input: {
          file_path: '.doc/spec/proposals/20260216-lite-proposal.md',
          content: '# 提案\n\nLITE_MODE: true\n\n快速模式，无需双模型验证。'
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(result.exitCode).toBe(0);
    });

    it('内容包含降级标记应允许', async () => {
      const hookInput = {
        tool_name: 'Edit',
        tool_input: {
          file_path: '.doc/common/plans/20260216-degraded.md',
          new_string: '# 计划\n\n由于降级，主代理直接执行。'
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(result.exitCode).toBe(0);
    });

    it('状态为 FAILED 的报告应允许', async () => {
      const hookInput = {
        tool_name: 'Write',
        tool_input: {
          file_path: '.doc/workflow/reviews/20260216-failed-review.md',
          content: '# 审查报告\n\n状态: FAILED\n\n执行失败，记录错误信息。'
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('非受保护路径', () => {
    it('Write 到 src/ 目录应保持 fail-open', async () => {
      const hookInput = {
        tool_name: 'Write',
        tool_input: {
          file_path: 'src/components/Button.tsx',
          content: 'export const Button = () => <button>Click</button>;'
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(result.exitCode).toBe(0);
    });

    it('Edit 到 README.md 应保持 fail-open', async () => {
      const hookInput = {
        tool_name: 'Edit',
        tool_input: {
          file_path: 'README.md',
          new_string: '# Project\n\nUpdated documentation.'
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(result.exitCode).toBe(0);
    });

    it('非 Write/Edit 工具应直接允许', async () => {
      const hookInput = {
        tool_name: 'Read',
        tool_input: {
          file_path: '.doc/workflow/plans/20260216-plan.md'
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('异常处理', () => {
    it('受保护路径异常应 fail-closed', async () => {
      // 模拟异常：传入无效的 JSON 结构
      const hookInput = {
        tool_name: 'Write',
        tool_input: {
          file_path: '.doc/workflow/plans/20260216-plan.md',
          content: null // 触发验证异常
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      // 由于 content 为 null，会触发验证失败
      expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
      expect(result.exitCode).toBe(2);
    });

    it('非受保护路径异常应 fail-open', async () => {
      const hookInput = {
        tool_name: 'Write',
        tool_input: {
          file_path: 'src/test.js',
          content: null // 触发验证异常
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      // 非受保护路径，即使异常也应允许
      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('边界情况', () => {
    it('路径包含反斜杠应正确规范化', async () => {
      const hookInput = {
        tool_name: 'Write',
        tool_input: {
          file_path: '.doc\\workflow\\plans\\20260216-plan.md',
          content: '# 计划\n\n没有 SESSION_ID。'
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      // 应识别为受保护路径并拒绝
      expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
      expect(result.exitCode).toBe(2);
    });

    it('空输入应允许', async () => {
      const result = await runHook(null);
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(result.exitCode).toBe(0);
    });

    it('缺少 file_path 应允许', async () => {
      const hookInput = {
        tool_name: 'Write',
        tool_input: {
          content: '# 内容'
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(result.exitCode).toBe(0);
    });

    it('SESSION_ID 和 Gemini 关键词应通过验证', async () => {
      const hookInput = {
        tool_name: 'Write',
        tool_input: {
          file_path: '.doc/spec/plans/20260216-gemini-plan.md',
          content: '# 计划\n\nSESSION_ID: abcdef12-3456-7890-abcd-ef1234567890\n\n使用 Gemini 模型进行分析。'
        }
      };

      const result = await runHook(hookInput);
      const response = parseHookResponse(result.stdout);

      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(result.exitCode).toBe(0);
    });
  });
});
