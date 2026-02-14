#!/usr/bin/env node
/**
 * ccg-commit-msg-generator 单元测试
 *
 * 运行测试：
 *   node ccg-commit-msg-generator.spec.cjs
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 简单的测试框架
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function run() {
  console.log(`\n🧪 运行 ${tests.length} 个测试...\n`);

  for (const { name, fn } of tests) {
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`❌ ${name}`);
      console.log(`   ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 结果: ${passed} 通过, ${failed} 失败\n`);
  process.exit(failed > 0 ? 1 : 0);
}

// ============================================================================
// 测试用例
// ============================================================================

test('配置文件存在', () => {
  const configPath = path.join(__dirname, '..', '.ccg', 'commit-config.json');
  assert(fs.existsSync(configPath), `配置文件不存在: ${configPath}`);
});

test('配置文件有效', () => {
  const configPath = path.join(__dirname, '..', '.ccg', 'commit-config.json');
  const content = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(content);
  assert(config.emoji === true, '应启用 emoji');
  assert(config.language === 'zh-CN', '应使用中文');
  assert(config.coAuthoredBy, '应配置 Co-Authored-By');
});

test('生成器脚本存在', () => {
  const generatorPath = path.join(__dirname, 'ccg-commit-msg-generator.cjs');
  assert(fs.existsSync(generatorPath), `生成器脚本不存在: ${generatorPath}`);
});

test('生成器脚本可执行', () => {
  const generatorPath = path.join(__dirname, 'ccg-commit-msg-generator.cjs');
  const content = fs.readFileSync(generatorPath, 'utf8');
  assert(content.includes('function main()'), '应包含 main 函数');
  assert(content.includes('module.exports'), '应导出模块或有执行逻辑');
});

test('拦截器脚本存在', () => {
  const interceptorPath = path.join(__dirname, 'ccg-commit-interceptor.cjs');
  assert(fs.existsSync(interceptorPath), `拦截器脚本不存在: ${interceptorPath}`);
});

test('安装脚本存在', () => {
  const installerPath = path.join(__dirname, 'install-git-hooks.cjs');
  assert(fs.existsSync(installerPath), `安装脚本不存在: ${installerPath}`);
});

test('安装脚本包含安装逻辑', () => {
  const installerPath = path.join(__dirname, 'install-git-hooks.cjs');
  const content = fs.readFileSync(installerPath, 'utf8');
  assert(content.includes('installHook'), '应包含 installHook 函数');
  assert(content.includes('uninstallHook'), '应包含 uninstallHook 函数');
});

test('Git hook 入口脚本存在', () => {
  const hookPath = path.join(__dirname, '..', 'prepare-commit-msg');
  assert(fs.existsSync(hookPath), `Hook 脚本不存在: ${hookPath}`);
});

test('Git hook 脚本有效', () => {
  const hookPath = path.join(__dirname, '..', 'prepare-commit-msg');
  const content = fs.readFileSync(hookPath, 'utf8');
  assert(content.includes('#!/bin/sh'), '应是 shell 脚本');
  assert(content.includes('ccg-commit-msg-generator'), '应调用生成器脚本');
});

test('settings.json 包含 PreToolUse hook', () => {
  const settingsPath = path.join(__dirname, '..', 'settings.json');
  const content = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  assert(content.hooks.PreToolUse, '应配置 PreToolUse hook');
  assert(content.hooks.PreToolUse[0].matcher === 'Bash', 'PreToolUse 应匹配 Bash 工具');
});

test('package.json 包含 hook scripts', () => {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert(pkg.scripts['install-hooks'], '应包含 install-hooks script');
  assert(pkg.scripts['uninstall-hooks'], '应包含 uninstall-hooks script');
  assert(pkg.scripts['verify-hooks'], '应包含 verify-hooks script');
});

test('生成器正确处理无改动情况', () => {
  // 这是一个集成测试占位符
  // 实际运行需要一个有效的 Git 仓库和暂存改动
  const generatorPath = path.join(__dirname, 'ccg-commit-msg-generator.cjs');
  const content = fs.readFileSync(generatorPath, 'utf8');
  assert(content.includes('count.total === 0'), '应检查是否有改动');
});

test('拦截器包含白名单检测逻辑', () => {
  const interceptorPath = path.join(__dirname, 'ccg-commit-interceptor.cjs');
  const content = fs.readFileSync(interceptorPath, 'utf8');
  assert(content.includes('isWhitelisted'), '应有白名单检测函数');
  assert(content.includes('git commit'), '应识别 git commit 命令');
});

test('拦截器白名单仅包含 -F 和 --no-verify', () => {
  const interceptorPath = path.join(__dirname, 'ccg-commit-interceptor.cjs');
  const content = fs.readFileSync(interceptorPath, 'utf8');
  assert(content.includes('-F'), '应包含 -F 白名单');
  assert(content.includes('--no-verify'), '应包含 --no-verify 白名单');
});

test('拦截器包含 deny 响应逻辑', () => {
  const interceptorPath = path.join(__dirname, 'ccg-commit-interceptor.cjs');
  const content = fs.readFileSync(interceptorPath, 'utf8');
  assert(content.includes('respondDeny'), '应有 respondDeny 函数');
});

test('拦截器 deny reason 包含 /ccg:commit 引导', () => {
  const interceptorPath = path.join(__dirname, 'ccg-commit-interceptor.cjs');
  const content = fs.readFileSync(interceptorPath, 'utf8');
  assert(content.includes('/ccg:commit'), 'deny reason 应包含 /ccg:commit 引导信息');
});

test('拦截器不再包含生成器调用', () => {
  const interceptorPath = path.join(__dirname, 'ccg-commit-interceptor.cjs');
  const content = fs.readFileSync(interceptorPath, 'utf8');
  assert(!content.includes('generateCommitMessage'), '不应包含 generateCommitMessage 函数');
});

test('拦截器不再包含命令修改逻辑', () => {
  const interceptorPath = path.join(__dirname, 'ccg-commit-interceptor.cjs');
  const content = fs.readFileSync(interceptorPath, 'utf8');
  assert(!content.includes('modifyCommand'), '不应包含 modifyCommand 函数');
});

test('拦截器使用 exit(2) 退出码', () => {
  const interceptorPath = path.join(__dirname, 'ccg-commit-interceptor.cjs');
  const content = fs.readFileSync(interceptorPath, 'utf8');
  assert(content.includes('process.exit(2)'), '应使用 process.exit(2) 退出码');
});

test('配置文件包含所有必需字段', () => {
  const configPath = path.join(__dirname, '..', '.ccg', 'commit-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert(config.scopeMap, '应包含 scopeMap');
  assert(config.typeEmojis, '应包含 typeEmojis');
  assert(config.typeEmojis.feat === '✨', 'feat 应映射到 ✨');
  assert(config.typeEmojis.fix === '🐛', 'fix 应映射到 🐛');
});

// ============================================================================
// 执行测试
// ============================================================================

run();
