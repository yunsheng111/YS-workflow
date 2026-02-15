#!/usr/bin/env node
/**
 * Claude Code PreToolUse Hook -- 路径校验器（deny 模式）
 *
 * 目的：强制执行代理输出路径规范，防止路径混乱
 *   1. 拦截 Write/Edit 工具调用
 *   2. 提取 file_path 参数
 *   3. 根据当前代理类型校验路径是否符合规范
 *   4. 若路径不符合，返回 deny + 正确路径建议
 *   5. 白名单：wip 目录、临时文件、非文档文件
 */

const path = require('path');

/**
 * 路径规范映射表
 * 格式：{ 'agent-name': { pattern: RegExp, description: string } }
 */
const PATH_RULES = {
  'team-research-agent': {
    pattern: /^\.doc[\/\\]agent-teams[\/\\]research[\/\\]/,
    correctPath: '.doc/agent-teams/research/',
    description: 'Agent Teams 研究产出',
  },
  'team-plan-agent': {
    pattern: /^\.doc[\/\\]agent-teams[\/\\]plans[\/\\]/,
    correctPath: '.doc/agent-teams/plans/',
    description: 'Agent Teams 计划文件',
  },
  'team-review-agent': {
    pattern: /^\.doc[\/\\]agent-teams[\/\\]reviews[\/\\]/,
    correctPath: '.doc/agent-teams/reviews/',
    description: 'Agent Teams 审查报告',
  },
  'spec-research-agent': {
    pattern: /^\.doc[\/\\]spec[\/\\](constraints|proposals)[\/\\]/,
    correctPath: '.doc/spec/constraints/ 或 .doc/spec/proposals/',
    description: 'OpenSpec 约束集或提案',
  },
  'spec-plan-agent': {
    pattern: /^\.doc[\/\\]spec[\/\\]plans[\/\\]/,
    correctPath: '.doc/spec/plans/',
    description: 'OpenSpec 计划文件',
  },
  'spec-impl-agent': {
    pattern: /^\.doc[\/\\]spec[\/\\]reviews[\/\\]/,
    correctPath: '.doc/spec/reviews/',
    description: 'OpenSpec 实施报告',
  },
  'spec-review-agent': {
    pattern: /^\.doc[\/\\]spec[\/\\](reviews|archive)[\/\\]/,
    correctPath: '.doc/spec/reviews/ 或 .doc/spec/archive/',
    description: 'OpenSpec 审查记录或归档',
  },
  'analyze-agent': {
    pattern: /^\.doc[\/\\]workflow[\/\\]research[\/\\]/,
    correctPath: '.doc/workflow/research/',
    description: '技术分析产出',
  },
  'fullstack-agent': {
    pattern: /^\.doc[\/\\]workflow[\/\\]plans[\/\\]/,
    correctPath: '.doc/workflow/plans/',
    description: '全栈开发计划',
  },
  'fullstack-light-agent': {
    pattern: /^\.doc[\/\\]common[\/\\]plans[\/\\]/,
    correctPath: '.doc/common/plans/',
    description: '轻量全栈计划',
  },
  'review-agent': {
    pattern: /^\.doc[\/\\]workflow[\/\\]reviews[\/\\]/,
    correctPath: '.doc/workflow/reviews/',
    description: '代码审查报告',
  },
  'backend-agent': {
    pattern: /^\.doc[\/\\]workflow[\/\\]wip[\/\\]execution[\/\\]/,
    correctPath: '.doc/workflow/wip/execution/',
    description: '后端开发过程记录',
  },
  'frontend-agent': {
    pattern: /^\.doc[\/\\]workflow[\/\\]wip[\/\\]execution[\/\\]/,
    correctPath: '.doc/workflow/wip/execution/',
    description: '前端开发过程记录',
  },
  'execute-agent': {
    pattern: /^\.doc[\/\\]workflow[\/\\]wip[\/\\]execution[\/\\]/,
    correctPath: '.doc/workflow/wip/execution/',
    description: '执行过程记录',
  },
  'debug-agent': {
    pattern: /^\.doc[\/\\]workflow[\/\\]wip[\/\\]execution[\/\\]/,
    correctPath: '.doc/workflow/wip/execution/',
    description: '调试过程记录',
  },
  'optimize-agent': {
    pattern: /^\.doc[\/\\]workflow[\/\\]wip[\/\\]execution[\/\\]/,
    correctPath: '.doc/workflow/wip/execution/',
    description: '优化过程记录',
  },
  'test-agent': {
    pattern: /^\.doc[\/\\]workflow[\/\\]wip[\/\\]execution[\/\\]/,
    correctPath: '.doc/workflow/wip/execution/',
    description: '测试过程记录',
  },
};

/**
 * 白名单规则
 * 满足以下条件之一的路径不需要校验
 */
const WHITELIST_PATTERNS = [
  // wip 目录（临时文件）
  /^\.doc[\/\\].*[\/\\]wip[\/\\]/,
  // 临时文件
  /^\/tmp[\/\\]/,
  /^C:\\Windows\\Temp[\/\\]/i,
  /\.tmp$/,
  /\.temp$/,
  // 非文档文件（代码、配置、测试）
  /\.(js|ts|jsx|tsx|py|java|go|rs|c|cpp|h|hpp)$/,
  /\.(json|yaml|yml|toml|ini|env)$/,
  /\.(test|spec)\.(js|ts|jsx|tsx|py)$/,
  // 项目根目录文件
  /^(package\.json|tsconfig\.json|\.gitignore|README\.md|LICENSE)$/,
  // .ccg 目录（CCG 框架内部文件）
  /^\.ccg[\/\\]/,
  // agents 目录（代理规范文件）
  /^agents[\/\\]/,
  // hooks 目录（Hook 脚本）
  /^hooks[\/\\]/,
  // skills 目录（Skill 文件）
  /^skills[\/\\]/,
];

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

    // 防止无限等待
    setTimeout(() => {
      if (!data) {
        resolve(null);
      }
    }, 100);
  });
}

/**
 * 检查路径是否在白名单中
 */
function isWhitelisted(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  // 规范化路径（统一使用正斜杠）
  const normalizedPath = filePath.replace(/\\/g, '/');

  for (const pattern of WHITELIST_PATTERNS) {
    if (pattern.test(normalizedPath)) {
      return true;
    }
  }

  return false;
}

/**
 * 从上下文推断当前代理类型
 * 策略：从 hookInput 的 context 或 conversation_history 中提取
 */
function inferAgentType(hookInput) {
  // 策略 1：从 tool_input.description 中提取（如果有）
  const description = hookInput.tool_input?.description;
  if (description && typeof description === 'string') {
    for (const agentName of Object.keys(PATH_RULES)) {
      if (description.toLowerCase().includes(agentName.replace('-agent', ''))) {
        return agentName;
      }
    }
  }

  // 策略 2：从 file_path 推断（反向匹配）
  const filePath = hookInput.tool_input?.file_path;
  if (filePath && typeof filePath === 'string') {
    const normalizedPath = filePath.replace(/\\/g, '/');

    // 尝试匹配每个代理的路径规范
    for (const [agentName, rule] of Object.entries(PATH_RULES)) {
      if (rule.pattern.test(normalizedPath)) {
        return agentName;
      }
    }
  }

  // 策略 3：无法推断，返回 null（允许执行，不校验）
  return null;
}

/**
 * 校验路径是否符合代理规范
 */
function validatePath(agentType, filePath) {
  if (!agentType || !PATH_RULES[agentType]) {
    // 无法确定代理类型，允许执行
    return { valid: true };
  }

  const rule = PATH_RULES[agentType];
  const normalizedPath = filePath.replace(/\\/g, '/');

  if (rule.pattern.test(normalizedPath)) {
    return { valid: true };
  }

  // 路径不符合规范
  return {
    valid: false,
    agentType,
    expectedPath: rule.correctPath,
    description: rule.description,
  };
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
 * 主逻辑
 */
async function main() {
  try {
    const hookInput = await readHookInput();

    // 非 Write/Edit 工具 → allow
    if (!hookInput || !['Write', 'Edit'].includes(hookInput.tool_name)) {
      respondAllow();
      return;
    }

    const filePath = hookInput.tool_input?.file_path;

    // 无 file_path 参数 → allow
    if (!filePath || typeof filePath !== 'string') {
      respondAllow();
      return;
    }

    // 白名单命中 → allow
    if (isWhitelisted(filePath)) {
      respondAllow();
      return;
    }

    // 推断代理类型
    const agentType = inferAgentType(hookInput);

    // 校验路径
    const validation = validatePath(agentType, filePath);

    if (validation.valid) {
      respondAllow();
      return;
    }

    // 路径不符合规范 → deny
    const denyReason = `[CCG Hook] 路径校验失败

检测到的代理：${validation.agentType}
当前路径：${filePath}
预期路径：${validation.expectedPath}
路径用途：${validation.description}

规则：所有代理必须将文档输出到规范路径。
操作：请修改输出路径为 ${validation.expectedPath}，然后重新执行。

如果您认为这是误拦截，请检查：
1. 文件是否应该在 wip 目录（临时文件）
2. 文件是否是代码/配置文件（非文档）
3. 代理规范是否需要更新`;

    respondDeny(denyReason);
  } catch (err) {
    // 出错时允许执行原命令（宽容策略，避免阻断合法操作）
    console.error(`PreToolUse hook 错误: ${err.message}`);
    respondAllow();
  }
}

main().catch(err => {
  console.error(`Hook 执行失败: ${err.message}`);
  respondAllow();
  process.exit(1);
});
