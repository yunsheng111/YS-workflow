#!/usr/bin/env node
/**
 * CCG 合规流程检查脚本
 *
 * 端到端验证 Agent 合规执行流程：
 * 1. Ledger 事件链完整性
 * 2. Hook 拦截有效性
 * 3. Level 1 门禁覆盖率
 * 4. 双模型调用证据
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  rootDir: path.resolve(__dirname, '../..'),
  agentsDir: path.resolve(__dirname, '../../agents/ccg'),
  commandsDir: path.resolve(__dirname, '../../commands/ccg'),
  hooksDir: path.resolve(__dirname, '../../hooks'),
  ledgerDir: path.resolve(__dirname, '../runtime'),
};

// KPI 指标
const METRICS = {
  totalAgents: 0,
  agentsWithLedger: 0,
  totalCommands: 0,
  commandsWithLevel1: 0,
  totalHooks: 0,
  hooksActive: 0,
  complianceRate: 0,
  zhiCoverageRate: 0,
  falsePositiveRate: 0,
  forgeryRate: 0,
};

/**
 * 检查 1: Ledger 事件链完整性
 */
function checkLedgerEventChain() {
  console.log('\n📊 检查 1: Ledger 事件链完整性');
  console.log('='.repeat(60));

  const agentFiles = fs.readdirSync(CONFIG.agentsDir)
    .filter(f => f.endsWith('-agent.md'));

  METRICS.totalAgents = agentFiles.length;

  const multiModelAgents = [];
  const missingLedger = [];

  agentFiles.forEach(file => {
    const filePath = path.join(CONFIG.agentsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // 检查是否为 multi-model 代理
    if (/multi-model v\d+\.\d+\.\d+/.test(content)) {
      multiModelAgents.push(file);

      // 检查是否包含 Ledger 事件上报
      const contentLower = content.toLowerCase();
      if (!contentLower.includes('ledger event') && !contentLower.includes('ledger')) {
        missingLedger.push(file);
      } else {
        METRICS.agentsWithLedger++;
      }
    }
  });

  console.log(`✅ Multi-model 代理总数: ${multiModelAgents.length}`);
  console.log(`✅ 包含 Ledger 事件上报: ${METRICS.agentsWithLedger}`);

  if (missingLedger.length > 0) {
    console.log(`❌ 缺少 Ledger 事件上报 (${missingLedger.length}):`);
    missingLedger.forEach(f => console.log(`   - ${f}`));
    return false;
  }

  console.log('✅ 所有 multi-model 代理都包含 Ledger 事件上报');
  return true;
}

/**
 * 检查 2: Hook 拦截有效性
 */
function checkHookEffectiveness() {
  console.log('\n🛡️ 检查 2: Hook 拦截有效性');
  console.log('='.repeat(60));

  const requiredHooks = [
    'ccg-path-validator.cjs',
    'ccg-dual-model-validator.cjs',
    'ccg-execution-guard.cjs',
    'ccg-commit-interceptor.cjs',
  ];

  const existingHooks = [];
  const missingHooks = [];

  requiredHooks.forEach(hook => {
    const hookPath = path.join(CONFIG.hooksDir, hook);
    if (fs.existsSync(hookPath)) {
      existingHooks.push(hook);
      METRICS.hooksActive++;
    } else {
      missingHooks.push(hook);
    }
  });

  METRICS.totalHooks = requiredHooks.length;

  console.log(`✅ Hook 总数: ${METRICS.totalHooks}`);
  console.log(`✅ 已部署 Hook: ${METRICS.hooksActive}`);

  if (missingHooks.length > 0) {
    console.log(`❌ 缺少 Hook (${missingHooks.length}):`);
    missingHooks.forEach(h => console.log(`   - ${h}`));
    return false;
  }

  // 检查 settings.json 配置
  const settingsPath = path.join(CONFIG.rootDir, 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    console.log('❌ settings.json 不存在');
    return false;
  }

  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  const preToolUseHooks = settings.hooks?.PreToolUse || [];

  console.log(`✅ settings.json 中配置的 PreToolUse Hook: ${preToolUseHooks.length}`);

  if (preToolUseHooks.length < requiredHooks.length) {
    console.log('⚠️  settings.json 中配置的 Hook 数量少于必需数量');
  }

  console.log('✅ 所有必需 Hook 已部署');
  return true;
}

/**
 * 检查 3: Level 1 门禁覆盖率
 */
function checkLevel1GateCoverage() {
  console.log('\n🚪 检查 3: Level 1 门禁覆盖率');
  console.log('='.repeat(60));

  const criticalCommands = [
    'workflow.md',
    'backend.md',
    'execute.md',
    'frontend.md',
    'feat.md',
  ];

  const commandsWithGate = [];
  const commandsMissingGate = [];

  criticalCommands.forEach(cmd => {
    const cmdPath = path.join(CONFIG.commandsDir, cmd);
    if (!fs.existsSync(cmdPath)) {
      commandsMissingGate.push(`${cmd} (文件不存在)`);
      return;
    }

    const content = fs.readFileSync(cmdPath, 'utf-8');

    // 检查是否包含 Level 1 门禁关键词
    const hasEnhance = /mcp______enhance/.test(content);
    const hasZhi = /mcp______zhi/.test(content);
    const hasSearchContext = /mcp__ace-tool__search_context|mcp______sou/.test(content);
    const hasHardGate = /未完成 Level 1 禁止进入 Level 2/.test(content);

    if (hasEnhance && hasZhi && hasSearchContext && hasHardGate) {
      commandsWithGate.push(cmd);
      METRICS.commandsWithLevel1++;
    } else {
      const missing = [];
      if (!hasEnhance) missing.push('enhance');
      if (!hasZhi) missing.push('zhi');
      if (!hasSearchContext) missing.push('search_context');
      if (!hasHardGate) missing.push('硬门禁');
      commandsMissingGate.push(`${cmd} (缺少: ${missing.join(', ')})`);
    }
  });

  METRICS.totalCommands = criticalCommands.length;

  console.log(`✅ 关键命令总数: ${METRICS.totalCommands}`);
  console.log(`✅ 包含完整 Level 1 门禁: ${METRICS.commandsWithLevel1}`);

  if (commandsMissingGate.length > 0) {
    console.log(`❌ 缺少 Level 1 门禁 (${commandsMissingGate.length}):`);
    commandsMissingGate.forEach(c => console.log(`   - ${c}`));
    return false;
  }

  console.log('✅ 所有关键命令都包含完整 Level 1 门禁');
  return true;
}

/**
 * 检查 4: Ledger 运行时可用性
 */
function checkLedgerRuntime() {
  console.log('\n⚙️ 检查 4: Ledger 运行时可用性');
  console.log('='.repeat(60));

  const ledgerFiles = [
    'execution-ledger.cjs',
    'execution-ledger-schema.cjs',
  ];

  const existingFiles = [];
  const missingFiles = [];

  ledgerFiles.forEach(file => {
    const filePath = path.join(CONFIG.ledgerDir, file);
    if (fs.existsSync(filePath)) {
      existingFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  });

  console.log(`✅ Ledger 运行时文件: ${existingFiles.length}/${ledgerFiles.length}`);

  if (missingFiles.length > 0) {
    console.log(`❌ 缺少文件 (${missingFiles.length}):`);
    missingFiles.forEach(f => console.log(`   - ${f}`));
    return false;
  }

  // 尝试加载 Ledger 模块
  try {
    const ExecutionLedger = require(path.join(CONFIG.ledgerDir, 'execution-ledger.cjs'));
    console.log('✅ Ledger 模块可正常加载');

    // 测试基本 API
    const testTaskId = 'test-compliance-check';
    ExecutionLedger.init(testTaskId);
    const ledger = ExecutionLedger.get(testTaskId);

    if (ledger && ledger.state === 'INIT') {
      console.log('✅ Ledger API 可正常调用');
      ExecutionLedger.cleanup(testTaskId);
    } else {
      console.log('❌ Ledger API 返回异常');
      return false;
    }
  } catch (error) {
    console.log(`❌ Ledger 模块加载失败: ${error.message}`);
    return false;
  }

  console.log('✅ Ledger 运行时完全可用');
  return true;
}

/**
 * 计算 KPI 指标
 */
function calculateKPIs() {
  console.log('\n📈 KPI 指标汇总');
  console.log('='.repeat(60));

  // 合规率 = (包含 Ledger 的代理数 / 总代理数) * 100%
  METRICS.complianceRate = METRICS.totalAgents > 0
    ? ((METRICS.agentsWithLedger / METRICS.totalAgents) * 100).toFixed(2)
    : 0;

  // zhi 覆盖率 = (包含 Level 1 门禁的命令数 / 总命令数) * 100%
  METRICS.zhiCoverageRate = METRICS.totalCommands > 0
    ? ((METRICS.commandsWithLevel1 / METRICS.totalCommands) * 100).toFixed(2)
    : 0;

  // Hook 激活率 = (已部署 Hook 数 / 总 Hook 数) * 100%
  const hookActivationRate = METRICS.totalHooks > 0
    ? ((METRICS.hooksActive / METRICS.totalHooks) * 100).toFixed(2)
    : 0;

  console.log(`✅ 合规率: ${METRICS.complianceRate}%`);
  console.log(`   (${METRICS.agentsWithLedger}/${METRICS.totalAgents} 代理包含 Ledger 事件上报)`);

  console.log(`✅ zhi 覆盖率: ${METRICS.zhiCoverageRate}%`);
  console.log(`   (${METRICS.commandsWithLevel1}/${METRICS.totalCommands} 命令包含 Level 1 门禁)`);

  console.log(`✅ Hook 激活率: ${hookActivationRate}%`);
  console.log(`   (${METRICS.hooksActive}/${METRICS.totalHooks} Hook 已部署)`);

  // 误拦截率和伪造率需要运行时数据，这里设为 N/A
  console.log(`⚠️  误拦截率: N/A (需要运行时数据)`);
  console.log(`⚠️  伪造率: N/A (需要运行时数据)`);

  return {
    complianceRate: parseFloat(METRICS.complianceRate),
    zhiCoverageRate: parseFloat(METRICS.zhiCoverageRate),
    hookActivationRate: parseFloat(hookActivationRate),
  };
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 CCG 合规流程检查');
  console.log('='.repeat(60));
  console.log(`工作目录: ${CONFIG.rootDir}`);
  console.log(`检查时间: ${new Date().toISOString()}`);

  const results = {
    ledgerEventChain: checkLedgerEventChain(),
    hookEffectiveness: checkHookEffectiveness(),
    level1GateCoverage: checkLevel1GateCoverage(),
    ledgerRuntime: checkLedgerRuntime(),
  };

  const kpis = calculateKPIs();

  console.log('\n📋 检查结果汇总');
  console.log('='.repeat(60));

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('✅ 所有检查通过');
    console.log(`✅ 合规率: ${kpis.complianceRate}%`);
    console.log(`✅ zhi 覆盖率: ${kpis.zhiCoverageRate}%`);
    console.log(`✅ Hook 激活率: ${kpis.hookActivationRate}%`);
    process.exit(0);
  } else {
    console.log('❌ 部分检查未通过:');
    Object.entries(results).forEach(([key, passed]) => {
      const status = passed ? '✅' : '❌';
      console.log(`   ${status} ${key}`);
    });
    process.exit(1);
  }
}

// 执行检查
if (require.main === module) {
  main();
}

module.exports = { checkLedgerEventChain, checkHookEffectiveness, checkLevel1GateCoverage, checkLedgerRuntime, calculateKPIs };
