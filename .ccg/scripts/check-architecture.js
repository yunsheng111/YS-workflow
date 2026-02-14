#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.env.TEST_PROJECT_ROOT || path.resolve(__dirname, '../..');
const COMMANDS_DIR = path.join(PROJECT_ROOT, 'commands/ccg');
const AGENTS_DIR = path.join(PROJECT_ROOT, 'agents/ccg');
const CONFIG_FILE = path.join(PROJECT_ROOT, '.ccg/config.toml');

let hasErrors = false;

function error(message) {
  console.error(`❌ ${message}`);
  hasErrors = true;
}

function success(message) {
  console.log(`✅ ${message}`);
}

function warning(message) {
  console.warn(`⚠️  ${message}`);
}

function readTomlWorkflows(configPath) {
  const content = fs.readFileSync(configPath, 'utf-8');
  const match = content.match(/\[workflows\]\s*installed\s*=\s*\[([\s\S]*?)\]/);
  if (!match) return [];

  return match[1]
    .split(',')
    .map(s => s.trim().replace(/['"]/g, ''))
    .filter(Boolean);
}

function getCommandFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));
}

function getAgentFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));
}

function extractSubagentCalls(commandsDir) {
  const calls = new Map();

  if (!fs.existsSync(commandsDir)) return calls;

  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(commandsDir, file), 'utf-8');
    const agents = [];

    // 检测 1: subagent_type 声明（YAML 格式和赋值格式）
    const subagentRegex = /subagent_type\s*[=:]\s*["']([^"']+)["']/g;
    let match;
    while ((match = subagentRegex.exec(content)) !== null) {
      agents.push(match[1]);
    }

    // 检测 2: 通过 markdown 链接引用代理文件（如：参考 [xxx-agent.md](../../agents/ccg/xxx-agent.md)）
    const linkRegex = /\[([^\]]+\.md)\]\([^)]*agents\/ccg\/([^)]+)\.md\)/g;
    while ((match = linkRegex.exec(content)) !== null) {
      const agentName = match[2];
      if (!agents.includes(agentName)) {
        agents.push(agentName);
      }
    }

    if (agents.length > 0) {
      calls.set(file.replace('.md', ''), agents);
    }
  }

  return calls;
}

function findAbsolutePaths(rootDir) {
  const issues = [];
  const pattern = /C:\/Users\/[^\s\)]+/g;

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        scanDir(fullPath);
      } else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          const matches = line.match(pattern);
          if (matches) {
            issues.push({
              file: path.relative(rootDir, fullPath),
              line: idx + 1,
              content: line.trim().substring(0, 100)
            });
          }
        });
      }
    }
  }

  scanDir(rootDir);
  return issues;
}

console.log('🔍 开始架构体检...\n');

console.log('📋 检查 1: 命令数量校验');
const installedCommands = readTomlWorkflows(CONFIG_FILE);
const actualCommands = getCommandFiles(COMMANDS_DIR);

console.log(`   config.toml 中声明: ${installedCommands.length} 个命令`);
console.log(`   commands/ccg 目录: ${actualCommands.length} 个命令文件`);

const missingInDir = installedCommands.filter(c => !actualCommands.includes(c));
const missingInConfig = actualCommands.filter(c => !installedCommands.includes(c));

if (missingInDir.length > 0) {
  error(`config.toml 中声明但文件不存在: ${missingInDir.join(', ')}`);
}

if (missingInConfig.length > 0) {
  error(`文件存在但未在 config.toml 中声明: ${missingInConfig.join(', ')}`);
}

if (missingInDir.length === 0 && missingInConfig.length === 0) {
  success('命令数量一致');
}

console.log('\n📋 检查 2: 映射完整性校验');
const subagentCalls = extractSubagentCalls(COMMANDS_DIR);
const actualAgents = getAgentFiles(AGENTS_DIR);

console.log(`   发现 ${subagentCalls.size} 个命令调用代理`);
console.log(`   agents/ccg 目录: ${actualAgents.length} 个代理文件`);

const calledAgents = new Set();
for (const agents of subagentCalls.values()) {
  agents.forEach(a => calledAgents.add(a));
}

const missingAgents = Array.from(calledAgents).filter(a => !actualAgents.includes(a));
if (missingAgents.length > 0) {
  error(`命令调用但代理文件不存在: ${missingAgents.join(', ')}`);
} else {
  success('所有被调用的代理文件都存在');
}

console.log('\n📋 检查 3: 代理调用完整性校验');
const uncalledAgents = actualAgents.filter(a => !calledAgents.has(a));

if (uncalledAgents.length > 0) {
  error(`以下代理未被任何命令调用: ${uncalledAgents.join(', ')}`);
} else {
  success('所有代理都被至少一个命令调用');
}

console.log('\n📋 检查 4: 路径规范校验');
const absolutePathIssues = findAbsolutePaths(PROJECT_ROOT);

if (absolutePathIssues.length > 0) {
  error(`发现 ${absolutePathIssues.length} 处绝对路径:`);
  absolutePathIssues.slice(0, 10).forEach(issue => {
    console.log(`   ${issue.file}:${issue.line}`);
    console.log(`      ${issue.content}`);
  });
  if (absolutePathIssues.length > 10) {
    console.log(`   ... 还有 ${absolutePathIssues.length - 10} 处问题`);
  }
} else {
  success('未发现绝对路径');
}

console.log('\n📋 检查 5: 代理模板合规校验');
const agentFiles = fs.readdirSync(AGENTS_DIR)
  .filter(f => f.endsWith('.md') && !f.startsWith('_'));

let templateIssues = 0;
let sharedSpecIssues = 0;

for (const file of agentFiles) {
  const filePath = path.join(AGENTS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // 检查是否有 template 注释
  const hasTemplate = /# template: (tool-only|single-model|multi-model) v\d+\.\d+\.\d+/.test(content);
  if (!hasTemplate) {
    error(`${file} 缺少 template 注释`);
    templateIssues++;
  }

  // 检查是否有共享规范引用
  const hasSharedSpec = /## 共享规范/.test(content);
  if (!hasSharedSpec) {
    error(`${file} 缺少共享规范引用块`);
    sharedSpecIssues++;
  }
}

if (templateIssues === 0 && sharedSpecIssues === 0) {
  success(`所有 ${agentFiles.length} 个代理文件都符合模板规范`);
} else {
  error(`模板合规问题: ${templateIssues} 个缺少 template 注释, ${sharedSpecIssues} 个缺少共享规范引用`);
}

console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('❌ 架构体检失败');
  process.exit(1);
} else {
  console.log('✅ 架构体检通过');
  process.exit(0);
}
