#!/usr/bin/env node
/**
 * Claude Code PreToolUse Hook -- CCG 统一输出守卫
 *
 * 合并以下三个 Hook 的职责：
 *   1. ccg-commit-interceptor.cjs  - Git 提交拦截
 *   2. ccg-execution-guard.cjs     - 执行状态校验
 *   3. ccg-dual-model-validator.cjs - 双模型产出验证
 *
 * 决策树：
 *   Bash 工具：
 *     - git commit → 白名单(-F/--file)放行，否则 deny
 *     - 重定向到受保护路径 → 检测 wip 来源放行，否则 deny
 *     - 其他 → allow
 *   Write/Edit 工具：
 *     - 非受保护路径 → allow
 *     - wip 路径 → allow
 *     - LITE_MODE → allow
 *     - 降级内容 → allow
 *     - 有效 SESSION_ID → allow
 *     - FAILED 状态报告 → allow
 *     - 兜底 → warn（allow + stderr 警告）
 *   其他工具 → allow
 *
 * 错误处理策略：
 *   - git commit 相关异常 → fail-close（deny）
 *   - 其他异常 → fail-open（allow）
 */

// ============================================================
// 常量定义
// ============================================================

/**
 * 受保护目录列表（从三个 Hook 合并去重）
 * 覆盖 4 个工作流的所有正式产出目录
 */
const PROTECTED_DIRS = [
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

/**
 * SESSION_ID 格式（标准 UUID）
 */
const SESSION_ID_PATTERN = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;

/**
 * Git commit deny 消息
 */
const DENY_REASON_COMMIT = `[CCG Hook] git commit 命令被拦截。
规则：所有 Git 提交必须通过 /ccg:commit 命令执行。
原因：/ccg:commit 提供完整的提交工作流（安全检查、拆分建议、三术记忆驱动的规范化提交信息、用户确认）。
操作：请使用 /ccg:commit 命令重新发起提交。`;

/**
 * Bash 重定向 deny 消息模板
 */
const DENY_REASON_REDIRECT_TEMPLATE = `[CCG Hook] Bash 重定向到受保护目录被拒绝。
规则：正式产出目录的写入需要通过 CCG 命令或 Write 工具，并包含适当的来源验证。
提示：如果是从 wip 目录升级文件，请使用包含 wip 源路径的命令（如 cat .doc/xxx/wip/yyy > 目标路径）。
目标路径：{targetPath}
操作：请使用 Write 工具或通过 CCG 命令调用（如 /ccg:workflow、/ccg:spec-research）。`;

// ============================================================
// Hook 输入输出
// ============================================================

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

/**
 * 返回 allow 但附带 stderr 警告
 * 不阻断操作，仅提示建议
 */
function respondWarn(message) {
  console.error(`[CCG 警告] ${message}`);
  // 仍然返回 allow，不阻断操作
  respondAllow();
}

// ============================================================
// 路径检测
// ============================================================

/**
 * 检查路径是否为受保护目录
 * @param {string} filePath - 文件路径（支持正反斜杠）
 * @returns {boolean} 是否为受保护路径
 */
function isProtectedPath(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return PROTECTED_DIRS.some(dir => normalizedPath.includes(dir));
}

/**
 * 检查路径是否为 wip 临时目录
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否为 wip 路径
 */
function isWipPath(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return /\/wip\//.test(normalizedPath);
}

// ============================================================
// Bash 命令分析
// ============================================================

/**
 * 检测是否为 git commit 命令
 * @param {string} command - Bash 命令
 * @returns {boolean}
 */
function isGitCommit(command) {
  return /\bgit\s+commit\b/.test(command);
}

/**
 * 检测 git commit 是否在白名单中（-F/--file 参数）
 * @param {string} command - Bash 命令
 * @returns {boolean}
 */
function isGitCommitWhitelisted(command) {
  if (!command || typeof command !== 'string') {
    return false;
  }

  const whitelistPatterns = [
    /-F\s+/,       // commit-agent 使用 -F 参数
    /--file\s+/,   // --file 等价于 -F
  ];

  return whitelistPatterns.some(pattern => pattern.test(command));
}

/**
 * 检测 Bash 命令中的重定向目标路径
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
 * 检测 Bash 命令的源路径是否来自 wip 目录
 * 解析 cat/cp/mv 等命令的源参数
 * @param {string} command - Bash 命令
 * @returns {boolean} 源路径是否包含 /wip/
 */
function isSourceFromWip(command) {
  if (!command || typeof command !== 'string') {
    return false;
  }

  // 匹配 cat <src> > <dst> 模式
  const catPattern = /\bcat\s+["']?([^\s"';&|>]+)["']?\s+>>?\s+/;
  const catMatch = catPattern.exec(command);
  if (catMatch && /\/wip\//.test(catMatch[1].replace(/\\/g, '/'))) {
    return true;
  }

  // 匹配 cp <src> <dst> 模式
  const cpPattern = /\bcp\s+(?:-[a-zA-Z]+\s+)*["']?([^\s"';&|]+)["']?\s+["']?([^\s"';&|]+)["']?/;
  const cpMatch = cpPattern.exec(command);
  if (cpMatch && /\/wip\//.test(cpMatch[1].replace(/\\/g, '/'))) {
    return true;
  }

  // 匹配 mv <src> <dst> 模式
  const mvPattern = /\bmv\s+(?:-[a-zA-Z]+\s+)*["']?([^\s"';&|]+)["']?\s+["']?([^\s"';&|]+)["']?/;
  const mvMatch = mvPattern.exec(command);
  if (mvMatch && /\/wip\//.test(mvMatch[1].replace(/\\/g, '/'))) {
    return true;
  }

  return false;
}

// ============================================================
// 内容检测（Write/Edit 工具）
// ============================================================

/**
 * 检测内容是否包含降级相关关键词
 * 合并三个 Hook 的降级检测逻辑
 * @param {string} content - 文件内容
 * @returns {boolean}
 */
function isDegradedContent(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }

  // 来自 execution-guard：DEGRADED、单模型、降级
  if (/DEGRADED/i.test(content)) return true;
  if (/单模型/.test(content)) return true;
  if (/降级/.test(content)) return true;

  // 来自 dual-model-validator：降级 + 主代理（Level 3 降级）
  if (/降级/.test(content) && /主代理/.test(content)) return true;

  // 来自 dual-model-validator：LITE_MODE 内容检测
  if (/LITE_MODE:\s*true/i.test(content)) return true;
  if (/LITE\s*模式/.test(content)) return true;

  return false;
}

/**
 * 检测内容是否为 FAILED 状态报告
 * 来自 dual-model-validator
 * @param {string} content - 文件内容
 * @returns {boolean}
 */
function isFailedStatusReport(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }

  return /状态.*FAILED/i.test(content) || /FAILED.*状态/.test(content);
}

/**
 * 检测内容是否包含有效的 SESSION_ID（双模型调用证据）
 * 合并 dual-model-validator 的验证逻辑：UUID 格式 + Codex/Gemini 关键词
 * @param {string} content - 文件内容
 * @returns {boolean}
 */
function hasValidSessionId(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }

  // 必须同时满足：UUID 格式 + Codex/Gemini 关键词
  const hasUuid = SESSION_ID_PATTERN.test(content);
  const hasModelKeyword = /Codex/i.test(content) || /Gemini/i.test(content);

  return hasUuid && hasModelKeyword;
}

// ============================================================
// 处理器
// ============================================================

/**
 * 处理 Bash 工具调用
 * @param {string} command - Bash 命令
 * @param {boolean} isGitCommitFlag - 是否为 git commit（用于错误处理策略选择）
 */
function handleBash(command) {
  // 检测 git commit
  if (isGitCommit(command)) {
    if (isGitCommitWhitelisted(command)) {
      respondAllow();
      return;
    }
    respondDeny(DENY_REASON_COMMIT);
    return;
  }

  // 检测重定向写文件
  const redirects = detectRedirects(command);
  if (redirects.length > 0) {
    for (const target of redirects) {
      // 非受保护路径 → 跳过
      if (!isProtectedPath(target)) {
        continue;
      }

      // 来源是 wip 目录 → 允许（wip 升级路径）
      if (isSourceFromWip(command)) {
        continue;
      }

      // 受保护路径且非 wip 来源 → deny
      respondDeny(DENY_REASON_REDIRECT_TEMPLATE.replace('{targetPath}', target));
      return;
    }
  }

  // 其他 Bash 命令 → allow
  respondAllow();
}

/**
 * 处理 Write/Edit 工具调用
 * @param {string} filePath - 目标文件路径
 * @param {string} content - 文件内容（Write 的 content 或 Edit 的 new_string）
 */
function handleWriteEdit(filePath, content) {
  const normalizedPath = filePath.replace(/\\/g, '/');

  // 非受保护路径 → allow
  if (!isProtectedPath(normalizedPath)) {
    respondAllow();
    return;
  }

  // wip 路径 → allow
  if (isWipPath(normalizedPath)) {
    respondAllow();
    return;
  }

  // LITE_MODE 环境变量 → allow
  if (process.env.LITE_MODE === 'true') {
    respondAllow();
    return;
  }

  // 降级内容 → allow
  if (isDegradedContent(content)) {
    respondAllow();
    return;
  }

  // 有效 SESSION_ID → allow
  if (hasValidSessionId(content)) {
    respondAllow();
    return;
  }

  // FAILED 状态报告 → allow
  if (isFailedStatusReport(content)) {
    respondAllow();
    return;
  }

  // 最终兜底 → warn（allow + 警告，不 deny）
  respondWarn(
    `写入受保护路径 ${normalizedPath}，但未检测到双模型调用证据（SESSION_ID + Codex/Gemini 关键词）。` +
    `建议通过 CCG 命令写入（如 /ccg:workflow、/ccg:spec-research），或确保内容包含有效的 SESSION_ID。`
  );
}

// ============================================================
// 主逻辑
// ============================================================

async function main() {
  let hookInput = null;
  let isGitCommitCommand = false;

  try {
    hookInput = await readHookInput();
  } catch (err) {
    // stdin 解析失败，无法判断命令类型，宽容放行
    console.error(`统一守卫 stdin 解析失败: ${err.message}`);
    respondAllow();
    return;
  }

  try {
    // 无输入 → allow
    if (!hookInput) {
      respondAllow();
      return;
    }

    const toolName = hookInput.tool_name;

    // Bash 工具
    if (toolName === 'Bash') {
      const command = hookInput.tool_input?.command;

      if (!command || typeof command !== 'string') {
        respondAllow();
        return;
      }

      // 预标记（用于 catch 中的错误处理策略选择）
      isGitCommitCommand = isGitCommit(command);

      handleBash(command);
      return;
    }

    // Write/Edit 工具
    if (toolName === 'Write' || toolName === 'Edit') {
      const filePath = hookInput.tool_input?.file_path;
      // Write 使用 content，Edit 使用 new_string
      const content = hookInput.tool_input?.content || hookInput.tool_input?.new_string;

      if (!filePath || typeof filePath !== 'string') {
        respondAllow();
        return;
      }

      handleWriteEdit(filePath, content);
      return;
    }

    // 其他工具 → allow
    respondAllow();
  } catch (err) {
    console.error(`统一守卫逻辑错误: ${err.message}`);

    if (isGitCommitCommand) {
      // git commit 相关异常 → fail-close（deny）
      respondDeny(
        `[CCG Hook] Hook 执行出错，出于安全考虑拦截此提交命令。\n` +
        `错误: ${err.message}\n` +
        `操作：请使用 /ccg:commit 命令重新发起提交。`
      );
    } else {
      // 其他异常 → fail-open（allow）
      respondAllow();
    }
  }
}

main().catch(err => {
  // 最外层异常兜底：宽容放行（极端情况，不应发生）
  console.error(`统一守卫致命错误: ${err.message}`);
  respondAllow();
  process.exit(1);
});
