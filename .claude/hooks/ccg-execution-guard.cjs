#!/usr/bin/env node
/**
 * Execution Guard Hook - 校验执行状态和证据链
 */

const LedgerAdapter = require('./lib/ledger-adapter.cjs');
const EvidenceParser = require('./lib/evidence-parser.cjs');

/**
 * 读取 Hook 输入
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
 * 受保护路径模式
 */
const PROTECTED_PATH_PATTERN = /\.doc[/\\](workflow|common|agent-teams|spec)[/\\](research|plans|reviews|constraints|proposals)[/\\]/;

/**
 * 响应 allow
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
 * 响应 deny
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

async function main() {
  try {
    const hookInput = await readHookInput();

    // 非 Write 工具 → allow
    if (!hookInput || hookInput.tool_name !== 'Write') {
      respondAllow();
      return;
    }

    const filePath = hookInput.tool_input?.file_path;
    const content = hookInput.tool_input?.content;

    // 路径不匹配受保护目录 → allow
    if (!filePath || typeof filePath !== 'string') {
      respondAllow();
      return;
    }

    const normalizedPath = filePath.replace(/\\/g, '/');
    if (!PROTECTED_PATH_PATTERN.test(normalizedPath)) {
      respondAllow();
      return;
    }

    // 白名单检查（wip 目录、LITE_MODE）
    if (/\/wip\//.test(normalizedPath)) {
      respondAllow();
      return;
    }

    if (process.env.LITE_MODE === 'true') {
      respondAllow();
      return;
    }

    // 获取 task_id（从环境变量）
    const taskId = process.env.TASK_ID;

    // 降级场景检测：文档内容包含 DEGRADED 或 单模型 关键词
    const isDegradedScenario = content && (
      /DEGRADED/i.test(content) ||
      /单模型/i.test(content) ||
      /降级/i.test(content)
    );

    // 降级场景且无 TASK_ID：允许通过（豁免）
    if (isDegradedScenario && !taskId) {
      respondAllow();
      return;
    }

    // 非降级场景且无 TASK_ID：拒绝（fail-close）
    if (!taskId) {
      respondDeny('❌ Execution Guard: TASK_ID 缺失，拒绝执行');
      return;
    }

    const ledger = LedgerAdapter.get(taskId);

    // 校验状态
    const stateValidation = LedgerAdapter.validateState(ledger);
    if (!stateValidation.valid) {
      respondDeny(`❌ Execution Guard: ${stateValidation.reason}`);
      return;
    }

    // 校验事件链
    const eventChainValidation = LedgerAdapter.validateEventChain(ledger);
    if (!eventChainValidation.valid) {
      respondDeny(
        `❌ Execution Guard: 缺少必需事件: ${eventChainValidation.missing.join(', ')}`
      );
      return;
    }

    // 提取文档中的 SESSION_ID
    const documentSessionId = EvidenceParser.extractSessionId(content);

    // 降级场景：允许缺少 SESSION_ID（单模型可能未生成）
    if (!documentSessionId && isDegradedScenario) {
      respondAllow();
      return;
    }

    // 非降级场景：必须有 SESSION_ID
    if (!documentSessionId) {
      respondDeny('❌ Execution Guard: 文档中未找到 SESSION_ID');
      return;
    }

    // 校验 SESSION_ID 绑定
    const sessionValidation = LedgerAdapter.validateSessionBinding(
      ledger,
      documentSessionId
    );
    if (!sessionValidation.valid) {
      respondDeny(`❌ Execution Guard: ${sessionValidation.reason}`);
      return;
    }

    // 所有校验通过
    respondAllow();
  } catch (err) {
    // 受保护路径异常时 fail-close（拒绝写入，防止绕过）
    console.error(`Execution Guard 错误: ${err.message}`);
    respondDeny(`❌ Execution Guard 异常: ${err.message}`);
  }
}

main().catch(err => {
  console.error(`Hook 执行失败: ${err.message}`);
  respondDeny(`❌ Hook 执行失败: ${err.message}`);
  process.exit(1);
});
