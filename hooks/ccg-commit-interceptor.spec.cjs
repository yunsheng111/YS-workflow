/**
 * ccg-commit-interceptor.cjs 单元测试
 *
 * 测试范围：
 * 1. detectRedirects 函数
 * 2. isProtectedPath 函数
 * 3. git commit 拦截逻辑
 * 4. Bash 重定向拦截逻辑
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { spawn } = require('child_process');
const path = require('path');

/**
 * 辅助函数：执行 Hook 并获取响应
 */
function runHook(hookInput) {
  return new Promise((resolve, reject) => {
    const hookPath = path.join(__dirname, 'ccg-commit-interceptor.cjs');
    const proc = spawn('node', [hookPath], {
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

    proc.on('close', code => {
      try {
        // 提取最后一行 JSON（Hook 响应）
        const lines = stdout.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const response = JSON.parse(lastLine);
        resolve({ response, code, stderr });
      } catch (err) {
        reject(new Error(`Failed to parse hook output: ${err.message}\nStdout: ${stdout}\nStderr: ${stderr}`));
      }
    });

    proc.on('error', reject);

    // 写入 Hook 输入
    proc.stdin.write(JSON.stringify(hookInput));
    proc.stdin.end();
  });
}

describe('ccg-commit-interceptor', () => {
  describe('detectRedirects 函数（通过集成测试验证）', () => {
    it('应检测 > 重定向', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 'echo "test" > .doc/workflow/research/test.md'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
      expect(response.hookSpecificOutput.reason).toContain('Bash 重定向到受保护目录被拒绝');
    });

    it('应检测 >> 重定向', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 'echo "test" >> .doc/workflow/plans/test.md'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
      expect(response.hookSpecificOutput.reason).toContain('Bash 重定向到受保护目录被拒绝');
    });

    it('应检测 tee 命令', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 'echo "test" | tee .doc/spec/constraints/test.md'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
      expect(response.hookSpecificOutput.reason).toContain('Bash 重定向到受保护目录被拒绝');
    });

    it('应检测 tee -a 命令', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 'echo "test" | tee -a .doc/agent-teams/reviews/test.md'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
      expect(response.hookSpecificOutput.reason).toContain('Bash 重定向到受保护目录被拒绝');
    });

    it('应检测多个重定向（只要有一个受保护即拒绝）', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 'cmd > /tmp/safe.txt 2> .doc/workflow/research/error.log'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
      expect(response.hookSpecificOutput.reason).toContain('Bash 重定向到受保护目录被拒绝');
    });
  });

  describe('isProtectedPath 函数（通过集成测试验证）', () => {
    it('重定向到受保护目录应拒绝', async () => {
      const protectedPaths = [
        '.doc/workflow/research/test.md',
        '.doc/workflow/plans/test.md',
        '.doc/workflow/reviews/test.md',
        '.doc/agent-teams/research/test.md',
        '.doc/agent-teams/plans/test.md',
        '.doc/agent-teams/reviews/test.md',
        '.doc/spec/constraints/test.md',
        '.doc/spec/proposals/test.md',
        '.doc/spec/plans/test.md',
        '.doc/spec/reviews/test.md',
        '.doc/common/plans/test.md',
        '.doc/common/reviews/test.md'
      ];

      for (const filePath of protectedPaths) {
        const hookInput = {
          tool_name: 'Bash',
          tool_input: {
            command: `echo "test" > ${filePath}`
          }
        };

        const { response } = await runHook(hookInput);
        expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
        expect(response.hookSpecificOutput.reason).toContain('Bash 重定向到受保护目录被拒绝');
      }
    });

    it('重定向到非受保护目录应允许', async () => {
      const safePaths = [
        '/tmp/test.txt',
        '.doc/workflow/wip/test.md',
        '.doc/framework/test.md',
        'output.log'
      ];

      for (const filePath of safePaths) {
        const hookInput = {
          tool_name: 'Bash',
          tool_input: {
            command: `echo "test" > ${filePath}`
          }
        };

        const { response } = await runHook(hookInput);
        expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
      }
    });

    it('应处理 Windows 路径分隔符', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 'echo "test" > .doc\\workflow\\research\\test.md'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
      expect(response.hookSpecificOutput.reason).toContain('Bash 重定向到受保护目录被拒绝');
    });
  });

  describe('git commit 拦截逻辑', () => {
    it('bare git commit 应拒绝', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 'git commit -m "test commit"'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
      expect(response.hookSpecificOutput.reason).toContain('git commit 命令被拦截');
      expect(response.hookSpecificOutput.reason).toContain('/ccg:commit');
    });

    it('git commit -F 应允许（commit-agent 白名单）', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 'git commit -F .git/COMMIT_EDITMSG'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
    });

    it('git commit --file 应允许（commit-agent 白名单）', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 'git commit --file .git/COMMIT_EDITMSG'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
    });

    it('git commit --no-verify 应允许（用户跳过）', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 'git commit -m "test" --no-verify'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
    });

    it('git commit 拦截优先级高于重定向拦截', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 'git commit -m "test" > .doc/workflow/research/log.txt'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
      expect(response.hookSpecificOutput.reason).toContain('git commit 命令被拦截');
      expect(response.hookSpecificOutput.reason).not.toContain('Bash 重定向');
    });
  });

  describe('Bash 重定向拦截逻辑', () => {
    it('重定向到受保护目录应拒绝', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 'echo "test" > .doc/workflow/research/test.md'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('deny');
      expect(response.hookSpecificOutput.reason).toContain('Bash 重定向到受保护目录被拒绝');
      expect(response.hookSpecificOutput.reason).toContain('缺少双模型调用证据');
      expect(response.hookSpecificOutput.reason).toContain('目标路径');
    });

    it('重定向到非受保护目录应允许', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 'echo "test" > /tmp/test.txt'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
    });

    it('无重定向的 Bash 命令应允许', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 'ls -la'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
    });
  });

  describe('非 Bash 工具', () => {
    it('Write 工具应允许', async () => {
      const hookInput = {
        tool_name: 'Write',
        tool_input: {
          file_path: '.doc/workflow/research/test.md',
          content: 'test content'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
    });

    it('Edit 工具应允许', async () => {
      const hookInput = {
        tool_name: 'Edit',
        tool_input: {
          file_path: '.doc/workflow/research/test.md',
          old_string: 'old',
          new_string: 'new'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
    });

    it('Read 工具应允许', async () => {
      const hookInput = {
        tool_name: 'Read',
        tool_input: {
          file_path: '.doc/workflow/research/test.md'
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
    });
  });

  describe('错误处理', () => {
    it('空输入应允许', async () => {
      const hookInput = null;

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
    });

    it('缺少 command 字段应允许', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {}
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
    });

    it('command 为非字符串应允许', async () => {
      const hookInput = {
        tool_name: 'Bash',
        tool_input: {
          command: 123
        }
      };

      const { response } = await runHook(hookInput);
      expect(response.hookSpecificOutput.permissionDecision).toBe('allow');
    });
  });
});
