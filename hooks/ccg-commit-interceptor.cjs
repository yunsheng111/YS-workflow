#!/usr/bin/env node
/**
 * Claude Code PreToolUse Hook -- Git 提交拦截器（deny 模式）
 *
 * 三层强制执行方案的 Layer 2 安全网：
 *   1. 拦截所有 bare git commit 命令
 *   2. 返回 deny + reason，引导用户使用 /ccg:commit
 *   3. 白名单：仅 -F/--file 参数（commit-agent 内部使用）
 */

const path = require('path');

/**
 * 读取 Claude Code 传入的 hook 数据
 * 格式：JSON 包含 tool_name、tool_input 等信息
 */
function readHookInput() {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.on('data', chunk => {
      data += chunk.toString();
    });

    process.stdin.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse stdin: ${err.message}`));
      }
    });

    process.stdin.on('error', reject);

    // 防止无限等待（如果没有 stdin 数据）
    setTimeout(() => {
      if (!data) {
        resolve(null);
      }
    }, 100);
  });
}

/**
 * 检测 Bash 命令中的重定向写文件
 * @param {string} command - Bash 命令
 * @returns {Array<string>} 重定向的文件路径列表
 */
function detectRedirects(command) {
  if (!command) return [];

  const redirects = [];

  // 匹配 > 和 >> 重定向
  const redirectPattern = /(?:>>?)\s+([^\s;&|]+)/g;
  let match;
  while ((match = redirectPattern.exec(command)) !== null) {
    redirects.push(match[1]);
  }

  // 匹配 tee 命令
  const teePattern = /\btee\s+(?:-a\s+)?([^\s;&|]+)/g;
  while ((match = teePattern.exec(command)) !== null) {
    redirects.push(match[1]);
  }

  return redirects;
}

/**
 * 检查路径是否为受保护目录
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否为受保护路径
 */
function isProtectedPath(filePath) {
  const protectedDirs = [
    '.doc/workflow/research/',
    '.doc/workflow/plans/',
    '.doc/workflow/reviews/',
    '.doc/agent-teams/research/',
    '.doc/agent-teams/plans/',
    '.doc/agent-teams/reviews/',
    '.doc/spec/constraints/',
    '.doc/spec/proposals/',
    '.doc/spec/plans/',
    '.doc/spec/reviews/',
    '.doc/common/plans/',
    '.doc/common/reviews/'
  ];

  const normalizedPath = filePath.replace(/\\/g, '/');
  return protectedDirs.some(dir => normalizedPath.includes(dir));
}

/**
 * 检查命令是否在白名单中（不需要拦截）
 * 白名单：仅 -F/--file（commit-agent 内部使用）
 *
 * 注意：--no-verify 不在白名单中。
 * --no-verify 仅跳过 git hooks（pre-commit、commit-msg），
 * 不应跳过 CCG 工作流拦截。所有提交必须通过 /ccg:commit。
 */
function isWhitelisted(command) {
  if (!command || typeof command !== 'string') {
    return false;
  }

  const whitelistPatterns = [
    /-F\s+/,       // commit-agent 使用 -F 参数
    /--file\s+/,   // --file 等价于 -F
  ];

  for (const pattern of whitelistPatterns) {
    if (pattern.test(command)) {
      return true;
    }
  }

  return false;
}

/**
 * 返回 allow 决策
 */
function respondAllow() {
  const response = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
    },
  };
  console.log(JSON.stringify(response));
}

/**
 * 返回 deny 决策并退出
 */
function respondDeny(reason) {
  const response = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      reason,
    },
  };
  console.log(JSON.stringify(response));
  process.exit(2);
}

const DENY_REASON_COMMIT = `[CCG Hook] git commit 命令被拦截。
规则：所有 Git 提交必须通过 /ccg:commit 命令执行。
原因：/ccg:commit 提供完整的提交工作流（安全检查、拆分建议、三术记忆驱动的规范化提交信息、用户确认）。
操作：请使用 /ccg:commit 命令重新发起提交。`;

const DENY_REASON_REDIRECT = `[CCG Hook] Bash 重定向到受保护目录被拒绝。
规则：研究产出目录必须包含双模型调用证据（SESSION_ID）。
原因：缺少双模型调用证据，可能未实际调用 Codex/Gemini。
操作：请使用 Write 工具或通过 CCG 命令调用（如 /ccg:workflow、/ccg:spec-research）。
参考：~/.claude/skills/collab/SKILL.md`;

/**
 * 主逻辑
 */
async function main() {
  let hookInput = null;
  let isGitCommit = false;

  try {
    hookInput = await readHookInput();
  } catch (err) {
    // stdin 解析失败，无法判断命令类型，宽容放行
    console.error(`PreToolUse hook stdin 解析失败: ${err.message}`);
    respondAllow();
    return;
  }

  try {
    // 非 Bash 工具 → allow
    if (!hookInput || hookInput.tool_name !== 'Bash') {
      respondAllow();
      return;
    }

    const command = hookInput.tool_input?.command;

    if (!command || typeof command !== 'string') {
      respondAllow();
      return;
    }

    // 标记是否为 git commit 命令（用于 catch 中的安全决策）
    isGitCommit = /\bgit\s+commit\b/.test(command);

    // 优先检查 git commit
    if (isGitCommit) {
      // 白名单命中 → allow
      if (isWhitelisted(command)) {
        respondAllow();
        return;
      }
      // 其余 → deny
      respondDeny(DENY_REASON_COMMIT);
      return;
    }

    // 检测重定向写文件
    const redirects = detectRedirects(command);
    if (redirects.length > 0) {
      for (const filePath of redirects) {
        if (isProtectedPath(filePath)) {
          respondDeny(DENY_REASON_REDIRECT + `\n\n目标路径: ${filePath}`);
          return;
        }
      }
    }

    // 其他 Bash 命令 → allow
    respondAllow();
  } catch (err) {
    console.error(`PreToolUse hook 逻辑错误: ${err.message}`);
    if (isGitCommit) {
      // 已确认是 git commit 命令但处理出错，安全起见拦截
      respondDeny(`[CCG Hook] Hook 执行出错，出于安全考虑拦截此提交命令。\n错误: ${err.message}\n操作：请使用 /ccg:commit 命令重新发起提交。`);
    } else {
      // 非 git commit 命令出错，宽容放行（避免阻断合法操作）
      respondAllow();
    }
  }
}

main().catch(err => {
  // 最外层异常兜底：宽容放行（极端情况，不应发生）
  console.error(`Hook 致命错误: ${err.message}`);
  respondAllow();
  process.exit(1);
});
