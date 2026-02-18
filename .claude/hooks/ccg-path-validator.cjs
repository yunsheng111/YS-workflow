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
  // commands 目录（命令定义文件）
  /^commands[\/\\]/,
  // hooks 目录（Hook 脚本）
  /^hooks[\/\\]/,
  // skills 目录（Skill 文件）
  /^skills[\/\\]/,
  // .doc/framework 目录（框架文档，预期写入者：主代理、init-architect、fullstack-light-agent；非代理产出目录）
  /^\.doc[\/\\]framework[\/\\]/,
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
 * 将绝对路径转为项目相对路径
 * 处理 Windows 绝对路径（C:/Users/.../xxx）和 Unix 绝对路径（/home/.../xxx）
 */
function toRelativePath(filePath) {
  // 规范化为正斜杠
  const normalized = filePath.replace(/\\/g, '/');

  // 检测项目根目录标记（.claude/ 目录）
  const claudeMarker = '/.claude/';
  const claudeIdx = normalized.indexOf(claudeMarker);
  if (claudeIdx !== -1) {
    // 返回 .claude/ 之后的部分（不含 .claude/ 前缀）
    return normalized.substring(claudeIdx + claudeMarker.length);
  }

  // 检测项目路径中的 .doc/ 标记（处理项目根目录下的绝对路径）
  // 适用于 D:/CLIGUI/sanshu/.doc/agent-teams/... 等路径
  const docMarker = '/.doc/';
  const docIdx = normalized.indexOf(docMarker);
  if (docIdx !== -1) {
    // 返回从 .doc/ 开始的相对路径
    return normalized.substring(docIdx + 1);
  }

  // 如果已经是相对路径，直接返回
  if (!path.isAbsolute(filePath)) {
    return normalized;
  }

  // 兜底：返回原始规范化路径
  return normalized;
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

  // 同时检查原始路径和相对路径，确保两种情况都能匹配
  const relativePath = toRelativePath(filePath);

  for (const pattern of WHITELIST_PATTERNS) {
    if (pattern.test(normalizedPath) || pattern.test(relativePath)) {
      return true;
    }
  }

  return false;
}

/**
 * 从文件内容推断代理类型
 */
function inferAgentTypeFromContent(content) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // 检查特征关键词
  const contentLower = content.toLowerCase();

  // Agent Teams 工作流
  if (contentLower.includes('team research:') || contentLower.includes('agent teams 研究')) {
    return 'team-research-agent';
  }
  if (contentLower.includes('team plan:') || contentLower.includes('agent teams 规划')) {
    return 'team-plan-agent';
  }
  if (contentLower.includes('team review:') || contentLower.includes('agent teams 审查')) {
    return 'team-review-agent';
  }

  // OpenSpec 工作流
  if (contentLower.includes('openspec') && (contentLower.includes('约束集') || contentLower.includes('constraints'))) {
    return 'spec-research-agent';
  }
  if (contentLower.includes('openspec') && (contentLower.includes('零决策计划') || contentLower.includes('zero-decision plan'))) {
    return 'spec-plan-agent';
  }
  if (contentLower.includes('openspec') && contentLower.includes('实施报告')) {
    return 'spec-impl-agent';
  }
  if (contentLower.includes('openspec') && (contentLower.includes('合规审查') || contentLower.includes('compliance review'))) {
    return 'spec-review-agent';
  }

  return null;
}

/**
 * 从文件名推断代理类型
 */
function inferAgentTypeFromFilename(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }

  const filename = filePath.split(/[\/\\]/).pop().toLowerCase();

  // 根据文件名后缀推断
  if (filename.endsWith('-research.md')) {
    // 需要进一步判断是哪个 research agent
    if (filePath.includes('agent-teams')) {
      return 'team-research-agent';
    }
    if (filePath.includes('spec')) {
      return 'spec-research-agent';
    }
    // 默认是 analyze-agent（workflow/research）
    return 'analyze-agent';
  }

  if (filename.endsWith('-plan.md')) {
    if (filePath.includes('agent-teams')) {
      return 'team-plan-agent';
    }
    if (filePath.includes('spec')) {
      return 'spec-plan-agent';
    }
    if (filePath.includes('common')) {
      return 'fullstack-light-agent';
    }
    return 'fullstack-agent';
  }

  if (filename.endsWith('-review.md')) {
    if (filePath.includes('agent-teams')) {
      return 'team-review-agent';
    }
    if (filePath.includes('spec')) {
      return 'spec-review-agent';
    }
    return 'review-agent';
  }

  if (filename.endsWith('-constraints.md')) {
    return 'spec-research-agent';
  }

  if (filename.endsWith('-proposal.md')) {
    return 'spec-research-agent';
  }

  return null;
}

/**
 * 从上下文推断当前代理类型
 * 策略：多层推断，优先级从高到低
 */
function inferAgentType(hookInput) {
  const filePath = hookInput.tool_input?.file_path;
  const content = hookInput.tool_input?.content;
  const description = hookInput.tool_input?.description;

  // 策略 1：从 tool_input.description 中提取（最高优先级）
  if (description && typeof description === 'string') {
    for (const agentName of Object.keys(PATH_RULES)) {
      if (description.toLowerCase().includes(agentName.replace('-agent', ''))) {
        return agentName;
      }
    }
  }

  // 策略 2：从文件内容推断（高优先级）
  const agentFromContent = inferAgentTypeFromContent(content);
  if (agentFromContent) {
    return agentFromContent;
  }

  // 策略 3：从文件名推断（中优先级）
  const agentFromFilename = inferAgentTypeFromFilename(filePath);
  if (agentFromFilename) {
    return agentFromFilename;
  }

  // 策略 4：从 file_path 推断（低优先级，反向匹配）
  if (filePath && typeof filePath === 'string') {
    const normalizedPath = filePath.replace(/\\/g, '/');

    // 建立路径优先级：更具体的路径优先匹配
    const prioritizedAgents = [
      // Agent Teams 和 OpenSpec 优先（更具体）
      'team-research-agent',
      'team-plan-agent',
      'team-review-agent',
      'spec-research-agent',
      'spec-plan-agent',
      'spec-impl-agent',
      'spec-review-agent',
      // 其他代理
      'fullstack-light-agent',
      'analyze-agent',
      'fullstack-agent',
      'review-agent',
      'backend-agent',
      'frontend-agent',
      'execute-agent',
      'debug-agent',
      'optimize-agent',
      'test-agent',
    ];

    for (const agentName of prioritizedAgents) {
      const rule = PATH_RULES[agentName];
      if (rule && rule.pattern.test(normalizedPath)) {
        return agentName;
      }
    }
  }

  // 策略 5：无法推断，返回 null（允许执行，不校验）
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
  const relativePath = toRelativePath(filePath);

  if (rule.pattern.test(normalizedPath) || rule.pattern.test(relativePath)) {
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
