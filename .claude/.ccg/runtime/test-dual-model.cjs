#!/usr/bin/env node
/**
 * 双模型调用测试脚本
 *
 * 用途：验证 Codex + Gemini 并行调用的完整流程
 * 测试内容：
 * 1. 配置读取
 * 2. 命令渲染
 * 3. 并行调用
 * 4. SESSION_ID 提取
 * 5. 状态判定
 * 6. 降级处理
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 读取配置
function loadConfig() {
  const configPath = path.join(__dirname, '../config.toml');
  const configContent = fs.readFileSync(configPath, 'utf-8');

  // 简单的 TOML 解析（仅提取需要的值）
  const ccgBinMatch = configContent.match(/CCG_BIN\s*=\s*"([^"]+)"/);
  const liteModeMatch = configContent.match(/LITE_MODE\s*=\s*(true|false)/);
  const geminiModelMatch = configContent.match(/GEMINI_MODEL\s*=\s*"([^"]+)"/);

  return {
    ccgBin: ccgBinMatch ? ccgBinMatch[1] : null,
    liteMode: liteModeMatch ? liteModeMatch[1] === 'true' : false,
    geminiModel: geminiModelMatch ? geminiModelMatch[1] : 'gemini-2.5-pro'
  };
}

// 执行命令并捕获输出
function executeCommand(command, args, stdin) {
  return new Promise((resolve, reject) => {
    log(`\n执行命令: ${command} ${args.join(' ')}`, 'cyan');

    const proc = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`命令执行失败，退出码: ${code}\nstderr: ${stderr}`));
      }
    });

    if (stdin) {
      proc.stdin.write(stdin);
      proc.stdin.end();
    }
  });
}

// 提取 SESSION_ID
function extractSessionId(output) {
  const regex = /SESSION_ID:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
  const match = output.match(regex);
  return match ? match[1] : null;
}

// 测试单个模型调用
async function testSingleModel(backend, config) {
  log(`\n=== 测试 ${backend.toUpperCase()} 调用 ===`, 'blue');

  const workdir = process.cwd();
  const roleFile = path.join(__dirname, `../prompts/${backend}/analyzer.md`);

  // 构建命令
  const args = ['--backend', backend];

  if (config.liteMode) {
    args.push('--lite');
  }

  if (backend === 'gemini' && config.geminiModel) {
    args.push('--gemini-model', config.geminiModel);
  }

  args.push('-', workdir);

  // 构建 stdin
  const stdin = `ROLE_FILE: ${roleFile}
<TASK>
需求：分析当前项目的双模型调用机制
上下文：测试脚本正在验证 Codex 和 Gemini 的并行调用
</TASK>
OUTPUT: 简要分析（不超过 200 字）`;

  try {
    const startTime = Date.now();
    const { stdout, stderr } = await executeCommand(config.ccgBin, args, stdin);
    const duration = Date.now() - startTime;

    log(`✓ ${backend.toUpperCase()} 调用成功 (${duration}ms)`, 'green');

    // 提取 SESSION_ID
    const sessionId = extractSessionId(stdout);
    if (sessionId) {
      log(`✓ SESSION_ID: ${sessionId}`, 'green');
    } else {
      log(`✗ 未找到 SESSION_ID`, 'red');
      log(`输出预览:\n${stdout.substring(0, 500)}...`, 'yellow');
    }

    return {
      success: true,
      sessionId,
      duration,
      output: stdout
    };
  } catch (error) {
    log(`✗ ${backend.toUpperCase()} 调用失败: ${error.message}`, 'red');
    return {
      success: false,
      sessionId: null,
      duration: 0,
      error: error.message
    };
  }
}

// 判定状态
function determineStatus(codexResult, geminiResult) {
  const codexSession = codexResult.sessionId;
  const geminiSession = geminiResult.sessionId;

  if (codexSession && geminiSession) {
    return { status: 'SUCCESS', degraded_level: null, missing_dimensions: [] };
  }

  if (codexSession || geminiSession) {
    const missing = [];
    if (!codexSession) missing.push('backend');
    if (!geminiSession) missing.push('frontend');

    return {
      status: 'DEGRADED',
      degraded_level: 'ACCEPTABLE', // 简化判定
      missing_dimensions: missing
    };
  }

  return {
    status: 'FAILED',
    degraded_level: null,
    missing_dimensions: ['backend', 'frontend']
  };
}

// 主测试流程
async function main() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   双模型调用测试脚本                  ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');

  // 1. 读取配置
  log('\n[步骤 1] 读取配置', 'blue');
  const config = loadConfig();
  log(`CCG_BIN: ${config.ccgBin}`, 'cyan');
  log(`LITE_MODE: ${config.liteMode}`, 'cyan');
  log(`GEMINI_MODEL: ${config.geminiModel}`, 'cyan');

  if (!config.ccgBin || !fs.existsSync(config.ccgBin)) {
    log(`✗ CCG_BIN 不存在: ${config.ccgBin}`, 'red');
    process.exit(1);
  }

  if (config.liteMode) {
    log('\n⚠️  LITE_MODE 已启用，将跳过外部模型调用', 'yellow');
    log('如需测试真实调用，请在 config.toml 中设置 LITE_MODE = false', 'yellow');
    process.exit(0);
  }

  // 2. 测试 Codex 调用
  log('\n[步骤 2] 测试 Codex 调用', 'blue');
  const codexResult = await testSingleModel('codex', config);

  // 3. 测试 Gemini 调用
  log('\n[步骤 3] 测试 Gemini 调用', 'blue');
  const geminiResult = await testSingleModel('gemini', config);

  // 4. 判定状态
  log('\n[步骤 4] 判定状态', 'blue');
  const { status, degraded_level, missing_dimensions } = determineStatus(codexResult, geminiResult);

  log(`\n最终状态: ${status}`, status === 'SUCCESS' ? 'green' : status === 'DEGRADED' ? 'yellow' : 'red');
  if (degraded_level) {
    log(`降级等级: ${degraded_level}`, 'yellow');
  }
  if (missing_dimensions.length > 0) {
    log(`缺失维度: ${missing_dimensions.join(', ')}`, 'yellow');
  }

  // 5. 输出总结
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   测试总结                            ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');

  log(`\nCodex:`, 'cyan');
  log(`  状态: ${codexResult.success ? '✓ 成功' : '✗ 失败'}`, codexResult.success ? 'green' : 'red');
  log(`  SESSION_ID: ${codexResult.sessionId || '未获取'}`, codexResult.sessionId ? 'green' : 'red');
  log(`  耗时: ${codexResult.duration}ms`, 'cyan');

  log(`\nGemini:`, 'cyan');
  log(`  状态: ${geminiResult.success ? '✓ 成功' : '✗ 失败'}`, geminiResult.success ? 'green' : 'red');
  log(`  SESSION_ID: ${geminiResult.sessionId || '未获取'}`, geminiResult.sessionId ? 'green' : 'red');
  log(`  耗时: ${geminiResult.duration}ms`, 'cyan');

  log(`\n整体状态: ${status}`, status === 'SUCCESS' ? 'green' : status === 'DEGRADED' ? 'yellow' : 'red');

  // 6. 退出码
  if (status === 'SUCCESS') {
    log('\n✓ 测试通过！双模型调用正常工作。', 'green');
    process.exit(0);
  } else if (status === 'DEGRADED') {
    log('\n⚠️  测试部分通过，存在降级情况。', 'yellow');
    process.exit(1);
  } else {
    log('\n✗ 测试失败！双模型调用均失败。', 'red');
    process.exit(2);
  }
}

// 运行测试
main().catch((error) => {
  log(`\n✗ 测试脚本执行失败: ${error.message}`, 'red');
  console.error(error);
  process.exit(3);
});
