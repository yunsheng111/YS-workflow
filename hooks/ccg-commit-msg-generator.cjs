#!/usr/bin/env node
/**
 * Git Commit 智能生成引擎
 * 分析暂存改动，生成 Conventional Commit 格式的提交信息
 *
 * 使用方式：
 *   node ccg-commit-msg-generator.cjs <commit-msg-file> [source] [commit-sha]
 *
 * 参数说明：
 *   - commit-msg-file: Git 提交信息文件路径（通常是 .git/COMMIT_EDITMSG）
 *   - source: 提交来源（message/merge/squash/commit，可选）
 *   - commit-sha: 提交 SHA（可选）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// 配置管理
// ============================================================================

function loadConfig() {
  const configPath = path.join(process.cwd(), '.ccg', 'commit-config.json');
  const defaultConfig = {
    emoji: true,
    language: 'zh-CN',
    format: 'conventional',
    coAuthoredBy: 'Claude Opus 4.6 <noreply@anthropic.com>',
    scopeMap: {
      'hooks/': 'hooks',
      'commands/': 'ccg',
      'agents/': 'ccg',
      'src/components/': 'ui',
      'src/api/': 'api',
      'src/utils/': 'utils',
      'tests/': 'test',
      'docs/': 'docs',
      '.ccg/': 'ccg',
    },
    typeEmojis: {
      feat: '✨',
      fix: '🐛',
      docs: '📝',
      style: '🎨',
      refactor: '♻️',
      perf: '⚡',
      test: '✅',
      chore: '🔧',
      ci: '👷',
      revert: '⏪',
    },
    excludePatterns: ['.env', '*.key', '*.pem', 'secret', 'password'],
  };

  try {
    if (fs.existsSync(configPath)) {
      const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { ...defaultConfig, ...customConfig };
    }
  } catch (err) {
    console.warn(`⚠️  配置文件读取失败: ${err.message}`);
  }

  return defaultConfig;
}

// ============================================================================
// Diff 分析引擎
// ============================================================================

function analyzeStagedChanges() {
  try {
    // 获取暂存文件列表及状态
    const statusOutput = execSync('git diff --staged --name-status', { encoding: 'utf8' });
    const files = statusOutput
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [status, ...fileParts] = line.split('\t');
        return {
          status, // M=修改, A=新增, D=删除, R=重命名, etc.
          path: fileParts.join('\t'),
        };
      });

    // 获取改动统计
    const statOutput = execSync('git diff --staged --stat', { encoding: 'utf8' });

    return {
      files,
      stat: statOutput,
      count: {
        added: files.filter(f => f.status === 'A').length,
        modified: files.filter(f => f.status === 'M').length,
        deleted: files.filter(f => f.status === 'D').length,
        renamed: files.filter(f => f.status === 'R').length,
        total: files.length,
      },
    };
  } catch (err) {
    console.warn(`⚠️  无法分析 git diff: ${err.message}`);
    return {
      files: [],
      stat: '',
      count: { added: 0, modified: 0, deleted: 0, renamed: 0, total: 0 },
    };
  }
}

// ============================================================================
// 类型和范围推断
// ============================================================================

function inferCommitType(analysis) {
  const { files } = analysis;

  if (files.length === 0) return 'chore';

  // 对所有文件进行分类统计
  const fileNames = files.map(f => f.path.toLowerCase());

  // 定义优先级检查器（优先级排序）
  const checkers = [
    { pattern: /\.md$|docs\//, type: 'docs', weight: 10 },
    { pattern: /\.test\.|\.spec\.|__tests__\//, type: 'test', weight: 10 },
    { pattern: /\.css$|\.scss$|\.less$/, type: 'style', weight: 8 },
    { pattern: /\.ya?ml$|\.toml$|\.json$|\.config\./, type: 'chore', weight: 5 },
    { pattern: /github.*workflows|\.gitlab-ci|\.circleci|jenkinsfile/i, type: 'ci', weight: 10 },
    { pattern: /package\.json|package-lock\.json|yarn\.lock|composer\.json/, type: 'chore', weight: 5 },
  ];

  // 统计各类型的权重
  const typeScores = {};

  for (const fileName of fileNames) {
    for (const { pattern, type, weight } of checkers) {
      if (pattern.test(fileName)) {
        typeScores[type] = (typeScores[type] || 0) + weight;
        break; // 每个文件只计一次（取优先级最高的匹配）
      }
    }
  }

  // 如果有明确的类型优先级，返回得分最高的
  if (Object.keys(typeScores).length > 0) {
    const topType = Object.entries(typeScores).sort(([, a], [, b]) => b - a)[0][0];
    return topType;
  }

  // 特殊情况：全是新增文件，倾向于 feat
  const allAdded = files.every(f => f.status === 'A');
  if (allAdded && files.length >= 2) {
    return 'feat';
  }

  // 默认为修复或重构
  return files.some(f => f.status === 'D') ? 'refactor' : 'fix';
}

function inferScope(analysis, config) {
  const { files } = analysis;
  if (files.length === 0) return '';

  const scopeMap = config.scopeMap || {};

  // 收集所有文件的 scope
  const scopes = new Set();

  for (const file of files) {
    const filePath = file.path;

    // 根据文件路径匹配 scope
    for (const [pattern, scope] of Object.entries(scopeMap)) {
      if (filePath.startsWith(pattern)) {
        scopes.add(scope);
        break; // 取优先级最高的匹配
      }
    }

    // 如果没有匹配，尝试从顶级目录提取 scope
    if (scopes.size === 0 || !scopes.has('')) {
      const topDir = filePath.split('/')[0];
      if (topDir && topDir !== '.' && !topDir.startsWith('.')) {
        scopes.add(topDir);
      }
    }
  }

  // 处理 scope 冲突
  if (scopes.size === 0) {
    return '';
  } else if (scopes.size === 1) {
    // 单一 scope，直接返回
    return Array.from(scopes)[0];
  } else {
    // 多个 scope 的情况
    const scopeArray = Array.from(scopes).sort();

    // 查看是否有公共父级
    const commonPrefix = scopeArray[0];
    if (scopeArray.every(s => s.startsWith(commonPrefix))) {
      return commonPrefix;
    }

    // 如果没有公共前缀，返回第一个（按字母序）
    return scopeArray[0];
  }
}

// ============================================================================
// 提交信息生成
// ============================================================================

/**
 * 检查文件是否为敏感文件
 */
function isSensitiveFile(filePath, excludePatterns) {
  const patterns = excludePatterns || [
    '.env', '.env.local', '.env.*.local',
    '*.key', '*.pem', '*.p12', '*.pfx',
    '*.jks', '*.keystore',
    'secret', 'private', 'password', 'credential',
    '.aws', '.ssh', '.docker', '.kube',
    'credentials.json', 'oauth.json',
  ];

  const fileName = path.basename(filePath).toLowerCase();

  for (const pattern of patterns) {
    // 简单的模式匹配（支持 * 通配符）
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`, 'i');
    if (regex.test(fileName) || regex.test(filePath)) {
      return true;
    }
  }

  return false;
}

/**
 * 混淆敏感文件名
 */
function obfuscateFileName(filePath) {
  const ext = path.extname(filePath);
  const dir = path.dirname(filePath);
  return `${dir}/(敏感文件)${ext}`;
}

function generateSubject(analysis, commitType, scope, config) {
  const { files } = analysis;

  if (files.length === 0) {
    return '无提交信息';
  }

  const typeMap = {
    feat: '新增功能',
    fix: '修复问题',
    docs: '更新文档',
    style: '调整代码风格',
    refactor: '重构代码',
    perf: '性能优化',
    test: '补充测试',
    chore: '更新配置',
    ci: '更新 CI/CD',
    revert: '回滚变更',
  };

  const typeDesc = typeMap[commitType] || '更新代码';

  // 简单生成 subject（最多 50 个字）
  let subject = '';
  if (files.length === 1) {
    let fileName = path.basename(files[0].path);
    // 检查是否为敏感文件
    if (isSensitiveFile(files[0].path, config.excludePatterns)) {
      fileName = '(敏感文件)';
    }
    subject = `${typeDesc}: ${fileName}`;
  } else if (files.length <= 3) {
    subject = `${typeDesc} (${files.length} 个文件)`;
  } else {
    subject = `${typeDesc} (${files.length} 个文件)`;
  }

  return subject.substring(0, 50);
}

function generateBody(analysis, config) {
  const { files, stat } = analysis;

  if (files.length === 0) {
    return '';
  }

  const lines = ['变更详情:'];
  const excludePatterns = config.excludePatterns || [];

  // 分类展示文件（过滤敏感文件）
  const added = files.filter(f => f.status === 'A');
  const modified = files.filter(f => f.status === 'M');
  const deleted = files.filter(f => f.status === 'D');

  // 统计敏感文件
  let sensitiveAddedCount = 0;
  let sensitiveModifiedCount = 0;
  let sensitiveDeletedCount = 0;

  if (added.length > 0) {
    const nonSensitiveAdded = added.filter(f => !isSensitiveFile(f.path, excludePatterns));
    sensitiveAddedCount = added.length - nonSensitiveAdded.length;

    if (nonSensitiveAdded.length > 0) {
      lines.push(`- 新增: ${nonSensitiveAdded.map(f => path.basename(f.path)).join(', ')}`);
    }
    if (sensitiveAddedCount > 0) {
      lines.push(`- 新增: ${sensitiveAddedCount} 个敏感文件`);
    }
  }

  if (modified.length > 0) {
    const nonSensitiveModified = modified.filter(f => !isSensitiveFile(f.path, excludePatterns));
    sensitiveModifiedCount = modified.length - nonSensitiveModified.length;

    if (nonSensitiveModified.length > 0) {
      lines.push(`- 修改: ${nonSensitiveModified.length} 个文件`);
    }
    if (sensitiveModifiedCount > 0) {
      lines.push(`- 修改: ${sensitiveModifiedCount} 个敏感文件`);
    }
  }

  if (deleted.length > 0) {
    const nonSensitiveDeleted = deleted.filter(f => !isSensitiveFile(f.path, excludePatterns));
    sensitiveDeletedCount = deleted.length - nonSensitiveDeleted.length;

    if (nonSensitiveDeleted.length > 0) {
      lines.push(`- 删除: ${nonSensitiveDeleted.map(f => path.basename(f.path)).join(', ')}`);
    }
    if (sensitiveDeletedCount > 0) {
      lines.push(`- 删除: ${sensitiveDeletedCount} 个敏感文件`);
    }
  }

  return lines.join('\n');
}

function generateFooter(config) {
  const footer = [];

  if (config.coAuthoredBy) {
    footer.push(`Co-Authored-By: ${config.coAuthoredBy}`);
  }

  return footer.join('\n');
}

function generateCommitMessage(analysis, config) {
  const commitType = inferCommitType(analysis);
  const scope = inferScope(analysis, config);

  const emoji = config.emoji ? (config.typeEmojis[commitType] || '') : '';
  const scopeStr = scope ? `(${scope})` : '';

  const subject = generateSubject(analysis, commitType, scope, config);
  const body = generateBody(analysis, config);
  const footer = generateFooter(config);

  // 构建完整提交信息
  const lines = [];

  // 标题行
  const title = `${emoji} ${commitType}${scopeStr}: ${subject}`.trim();
  lines.push(title);

  // 空行
  if (body || footer) {
    lines.push('');
  }

  // body
  if (body) {
    lines.push(body);
  }

  // 空行 + footer
  if (footer) {
    if (body) lines.push('');
    lines.push(footer);
  }

  return lines.join('\n');
}

// ============================================================================
// 主逻辑
// ============================================================================

function main() {
  const msgFile = process.argv[2] || '.git/COMMIT_EDITMSG';
  const source = process.argv[3] || 'commit';

  // 跳过某些提交来源（merge、squash 等）
  if (['merge', 'squash'].includes(source)) {
    return 0;
  }

  try {
    const config = loadConfig();
    const analysis = analyzeStagedChanges();

    // 如果没有暂存改动，跳过
    if (analysis.count.total === 0) {
      return 0;
    }

    // 读取当前提交信息文件
    const currentMsg = fs.readFileSync(msgFile, 'utf8');

    // 如果文件已有实质内容（不仅是注释），则不覆盖
    const nonCommentLines = currentMsg
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .filter(line => line.trim());

    if (nonCommentLines.length > 0) {
      // 已有提交信息，不生成
      return 0;
    }

    // 生成提交信息
    const generatedMsg = generateCommitMessage(analysis, config);

    // 写入提交信息文件
    fs.writeFileSync(msgFile, generatedMsg, 'utf8');

    return 0;
  } catch (err) {
    console.error(`❌ 生成提交信息失败: ${err.message}`);
    return 1;
  }
}

// 作为独立脚本执行时的入口
if (require.main === module) {
  process.exit(main());
}

// 支持作为模块导入使用
module.exports = {
  loadConfig,
  analyzeStagedChanges,
  inferCommitType,
  inferScope,
  generateSubject,
  generateBody,
  generateFooter,
  generateCommitMessage,
  main,
};
