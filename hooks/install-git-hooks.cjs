#!/usr/bin/env node
/**
 * Git Hook 安装/卸载工具
 *
 * 用法：
 *   node install-git-hooks.cjs install   # 安装 hook
 *   node install-git-hooks.cjs uninstall # 卸载 hook
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOOK_NAME = 'prepare-commit-msg';

/**
 * 验证路径安全性（防止路径遍历）
 */
function validatePath(filePath, baseDir) {
  try {
    const realPath = path.resolve(filePath);
    const realBase = path.resolve(baseDir);

    // 确保解析后的路径在预期的基目录下
    if (!realPath.startsWith(realBase)) {
      throw new Error(`Path traversal detected: ${filePath}`);
    }

    return realPath;
  } catch (err) {
    throw new Error(`Invalid path: ${err.message}`);
  }
}

/**
 * 获取项目根目录和 hook 目录
 */
function getPaths() {
  try {
    const projectRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim();

    const gitHooksDir = path.join(projectRoot, '.git', 'hooks');
    const hookPath = path.join(gitHooksDir, HOOK_NAME);
    const hookPathBak = `${hookPath}.bak`;
    const sourceHookPath = path.join(__dirname, '..', HOOK_NAME);

    // 验证所有路径安全性
    const validatedProjectRoot = validatePath(projectRoot, projectRoot);
    const validatedGitHooksDir = validatePath(gitHooksDir, validatedProjectRoot);
    const validatedHookPath = validatePath(hookPath, validatedGitHooksDir);
    const validatedSourceHookPath = validatePath(sourceHookPath, path.dirname(__dirname));

    return {
      projectRoot: validatedProjectRoot,
      gitHooksDir: validatedGitHooksDir,
      hookPath: validatedHookPath,
      hookPathBak: validatedHookPath + '.bak',
      sourceHookPath: validatedSourceHookPath,
    };
  } catch (err) {
    throw new Error('未能检测到 Git 仓库');
  }
}

/**
 * 安装 hook
 */
function installHook() {
  const { gitHooksDir, hookPath, hookPathBak, sourceHookPath } = getPaths();

  console.log('📦 安装 Git Hook...');

  // 检查源文件
  if (!fs.existsSync(sourceHookPath)) {
    throw new Error(`源 hook 文件不存在: ${sourceHookPath}`);
  }

  // 确保 .git/hooks 目录存在
  if (!fs.existsSync(gitHooksDir)) {
    fs.mkdirSync(gitHooksDir, { recursive: true });
    console.log(`✅ 创建目录: ${gitHooksDir}`);
  }

  // 如果 hook 已存在，备份为 .bak
  if (fs.existsSync(hookPath)) {
    console.log(`⚠️  hook 已存在，备份为: ${hookPathBak}`);
    fs.copyFileSync(hookPath, hookPathBak);
  }

  // 复制源文件到 .git/hooks
  fs.copyFileSync(sourceHookPath, hookPath);
  console.log(`✅ 复制 hook: ${hookPath}`);

  // Windows 上 Git 会自动处理可执行权限，Unix 上手动设置
  try {
    fs.chmodSync(hookPath, 0o755);
    console.log(`✅ 设置可执行权限`);
  } catch (err) {
    // Windows 可能不支持 chmod，忽略
    if (process.platform !== 'win32') {
      console.warn(`⚠️  设置权限失败: ${err.message}`);
    }
  }

  console.log('✅ Git Hook 安装成功！');
  console.log(`\n📌 下次执行 git commit 时会自动生成 Conventional Commit 格式的提交信息`);
}

/**
 * 卸载 hook
 */
function uninstallHook() {
  const { hookPath, hookPathBak } = getPaths();

  console.log('🗑️  卸载 Git Hook...');

  if (!fs.existsSync(hookPath)) {
    console.log(`ℹ️  hook 不存在，无需卸载`);
    return;
  }

  // 删除当前 hook
  fs.unlinkSync(hookPath);
  console.log(`✅ 删除 hook: ${hookPath}`);

  // 如果备份存在，恢复
  if (fs.existsSync(hookPathBak)) {
    fs.renameSync(hookPathBak, hookPath);
    console.log(`✅ 恢复备份: ${hookPath}`);
  }

  console.log('✅ Git Hook 卸载成功！');
}

/**
 * 验证 hook 安装状态
 */
function verifyHook() {
  const { hookPath } = getPaths();

  if (fs.existsSync(hookPath)) {
    const content = fs.readFileSync(hookPath, 'utf8');
    const isValid = content.includes('ccg-commit-msg-generator');

    if (isValid) {
      console.log('✅ Git Hook 已正确安装');
      return true;
    } else {
      console.log('⚠️  hook 文件存在但内容不正确');
      return false;
    }
  } else {
    console.log('❌ Git Hook 未安装');
    return false;
  }
}

/**
 * 主逻辑
 */
function main() {
  const command = process.argv[2] || 'install';

  try {
    switch (command) {
      case 'install':
        installHook();
        break;
      case 'uninstall':
        uninstallHook();
        break;
      case 'verify':
        verifyHook();
        break;
      default:
        console.log('未知命令:', command);
        console.log('\n用法:');
        console.log('  node install-git-hooks.cjs install    # 安装 hook');
        console.log('  node install-git-hooks.cjs uninstall  # 卸载 hook');
        console.log('  node install-git-hooks.cjs verify     # 验证 hook 状态');
        process.exit(1);
    }
  } catch (err) {
    console.error(`❌ 错误: ${err.message}`);
    process.exit(1);
  }
}

main();
