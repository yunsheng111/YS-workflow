#!/usr/bin/env node
/**
 * Claude Code PreToolUse Hook -- 双模型产出验证器
 *
 * 三层强制执行方案的 Layer 3 安全网：
 *   1. 拦截 Write/Edit 工具写入研究产出目录的操作
 *   2. 验证文件内容包含真实的 SESSION_ID（双模型调用证据）
 *   3. 白名单：LITE 模式、Level 3 降级、wip 临时文件
 */

/**
 * 读取 Claude Code 传入的 hook 数据
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

    setTimeout(() => {
      if (!data) {
        resolve(null);
      }
    }, 100);
  });
}

/**
 * 研究产出目录匹配模式
 * 覆盖 4 个工作流的所有正式产出目录
 */
const PROTECTED_PATH_PATTERN = /\.doc\/(workflow|common|agent-teams|spec)\/(research|plans|reviews|constraints|proposals)\//;

/**
 * SESSION_ID 格式（标准 UUID）
 */
const SESSION_ID_PATTERN = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;

/**
 * 白名单检查
 */
function isWhitelisted(filePath, content) {
  // wip 临时文件不拦截
  if (/\/wip\//.test(filePath)) {
    return true;
  }

  if (!content || typeof content !== 'string') {
    return false;
  }

  // LITE 模式豁免
  if (/LITE_MODE:\s*true/i.test(content) || /LITE\s*模式/.test(content)) {
    return true;
  }

  // Level 3 降级（主代理接管）豁免
  if (/降级/.test(content) && /主代理/.test(content)) {
    return true;
  }

  // 状态为 FAILED 的报告豁免
  if (/状态.*FAILED/i.test(content) || /FAILED.*状态/.test(content)) {
    return true;
  }

  return false;
}

/**
 * 验证文件内容是否包含双模型调用证据
 */
function validateDualModelEvidence(content) {
  if (!content || typeof content !== 'string') {
    return { valid: false, reason: '文件内容为空' };
  }

  // 检查 SESSION_ID
  const hasSessionId = SESSION_ID_PATTERN.test(content);
  if (!hasSessionId) {
    return {
      valid: false,
      reason: '未检测到 SESSION_ID（UUID 格式），可能未实际调用双模型'
    };
  }

  // 检查是否提及 Codex 或 Gemini
  const hasCodex = /Codex/i.test(content);
  const hasGemini = /Gemini/i.test(content);
  if (!hasCodex && !hasGemini) {
    return {
      valid: false,
      reason: '未检测到 Codex 或 Gemini 关键词，可能未使用双模型分析'
    };
  }

  return { valid: true };
}

function respondAllow() {
  const response = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
    },
  };
  console.log(JSON.stringify(response));
}

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

const DENY_TEMPLATE = `[CCG Hook] 研究报告缺少双模型验证标记。
规则：多模型代理的产出文档必须包含真实的 SESSION_ID。
原因：{reason}
操作：请先通过 collab Skill 调用双模型，获取真实 SESSION_ID 后再写入报告。
参考：~/.claude/skills/collab/SKILL.md`;

async function main() {
  try {
    const hookInput = await readHookInput();

    // 非 Write/Edit 工具 → allow
    if (!hookInput || (hookInput.tool_name !== 'Write' && hookInput.tool_name !== 'Edit')) {
      respondAllow();
      return;
    }

    const filePath = hookInput.tool_input?.file_path;
    const content = hookInput.tool_input?.content || hookInput.tool_input?.new_string;

    // 路径不匹配研究产出目录 → allow
    if (!filePath || typeof filePath !== 'string') {
      respondAllow();
      return;
    }

    // 统一路径分隔符为正斜杠
    const normalizedPath = filePath.replace(/\\/g, '/');

    if (!PROTECTED_PATH_PATTERN.test(normalizedPath)) {
      respondAllow();
      return;
    }

    // 白名单检查
    if (isWhitelisted(normalizedPath, content)) {
      respondAllow();
      return;
    }

    // 验证双模型调用证据
    const validation = validateDualModelEvidence(content);
    if (!validation.valid) {
      respondDeny(DENY_TEMPLATE.replace('{reason}', validation.reason));
      return;
    }

    // 验证通过
    respondAllow();
  } catch (err) {
    // 出错时允许执行（宽容策略，避免阻断合法操作）
    console.error(`PreToolUse hook 错误: ${err.message}`);
    respondAllow();
  }
}

main().catch(err => {
  console.error(`Hook 执行失败: ${err.message}`);
  respondAllow();
  process.exit(1);
});
