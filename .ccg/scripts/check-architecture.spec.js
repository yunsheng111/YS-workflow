const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCRIPT_PATH = path.join(__dirname, 'check-architecture.js');
const TEST_ROOT = path.join(__dirname, '__test_temp__');

function setup() {
  if (fs.existsSync(TEST_ROOT)) {
    fs.rmSync(TEST_ROOT, { recursive: true });
  }
  fs.mkdirSync(TEST_ROOT, { recursive: true });
}

function teardown() {
  if (fs.existsSync(TEST_ROOT)) {
    fs.rmSync(TEST_ROOT, { recursive: true });
  }
}

function createTestStructure(config) {
  const commandsDir = path.join(TEST_ROOT, 'commands/ccg');
  const agentsDir = path.join(TEST_ROOT, 'agents/ccg');
  const configDir = path.join(TEST_ROOT, '.ccg');

  fs.mkdirSync(commandsDir, { recursive: true });
  fs.mkdirSync(agentsDir, { recursive: true });
  fs.mkdirSync(configDir, { recursive: true });

  if (config.commands) {
    config.commands.forEach(cmd => {
      const content = config.commandContents?.[cmd] || `# ${cmd}`;
      fs.writeFileSync(path.join(commandsDir, `${cmd}.md`), content);
    });
  }

  if (config.agents) {
    config.agents.forEach(agent => {
      fs.writeFileSync(path.join(agentsDir, `${agent}.md`), `# ${agent}`);
    });
  }

  if (config.installedCommands) {
    const toml = `[workflows]\ninstalled = [${config.installedCommands.map(c => `"${c}"`).join(', ')}]`;
    fs.writeFileSync(path.join(configDir, 'config.toml'), toml);
  }
}

function runCheck() {
  try {
    const output = execSync(`node "${SCRIPT_PATH}"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      env: { ...process.env, TEST_PROJECT_ROOT: TEST_ROOT }
    });
    return { success: true, output };
  } catch (err) {
    const combinedOutput = (err.stdout || '') + '\n' + (err.stderr || '');
    return { success: false, output: combinedOutput };
  }
}

function test(name, fn) {
  try {
    setup();
    fn();
    console.log(`✅ ${name}`);
  } catch (err) {
    console.error(`❌ ${name}`);
    console.error(`   ${err.message}`);
    process.exitCode = 1;
  } finally {
    teardown();
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('🧪 运行架构体检脚本测试...\n');

test('应通过完全匹配的配置', () => {
  createTestStructure({
    commands: ['workflow', 'plan'],
    agents: ['fullstack-agent', 'planner'],
    installedCommands: ['workflow', 'plan'],
    commandContents: {
      workflow: 'subagent_type: "fullstack-agent"',
      plan: 'subagent_type: "planner"'
    }
  });

  const result = runCheck();
  assert(result.success, '应该通过检查');
});

test('应检测到 config.toml 中缺失的命令文件', () => {
  createTestStructure({
    commands: ['workflow'],
    agents: ['fullstack-agent'],
    installedCommands: ['workflow', 'missing-command'],
    commandContents: {
      workflow: 'subagent_type: "fullstack-agent"'
    }
  });

  const result = runCheck();
  assert(!result.success, '应该失败');
  assert(result.output.includes('missing-command'), '应该提示缺失的命令');
});

test('应检测到未在 config.toml 中声明的命令文件', () => {
  createTestStructure({
    commands: ['workflow', 'extra-command'],
    agents: ['fullstack-agent'],
    installedCommands: ['workflow'],
    commandContents: {
      workflow: 'subagent_type: "fullstack-agent"',
      'extra-command': '# extra'
    }
  });

  const result = runCheck();
  assert(!result.success, '应该失败');
  assert(result.output.includes('extra-command'), '应该提示未声明的命令');
});

test('应检测到缺失的代理文件', () => {
  createTestStructure({
    commands: ['workflow'],
    agents: [],
    installedCommands: ['workflow'],
    commandContents: {
      workflow: 'subagent_type: "missing-agent"'
    }
  });

  const result = runCheck();
  assert(!result.success, '应该失败');
  assert(result.output.includes('missing-agent'), '应该提示缺失的代理');
});

test('应检测到未被调用的代理', () => {
  createTestStructure({
    commands: ['workflow'],
    agents: ['fullstack-agent', 'unused-agent'],
    installedCommands: ['workflow'],
    commandContents: {
      workflow: 'subagent_type: "fullstack-agent"'
    }
  });

  const result = runCheck();
  assert(!result.success, '应该失败');
  assert(result.output.includes('unused-agent'), '应该提示未被调用的代理');
});

test('应检测到绝对路径', () => {
  createTestStructure({
    commands: ['workflow'],
    agents: ['fullstack-agent'],
    installedCommands: ['workflow'],
    commandContents: {
      workflow: 'subagent_type: "fullstack-agent"\nPath: C:/Users/test/file.txt'
    }
  });

  const result = runCheck();
  assert(!result.success, '应该失败');
  assert(result.output.includes('绝对路径'), '应该提示绝对路径问题');
});

test('应支持多个代理调用', () => {
  createTestStructure({
    commands: ['frontend'],
    agents: ['ui-ux-designer', 'frontend-agent'],
    installedCommands: ['frontend'],
    commandContents: {
      frontend: 'subagent_type: "ui-ux-designer"\nsubagent_type: "frontend-agent"'
    }
  });

  const result = runCheck();
  assert(result.success, '应该通过检查');
});

console.log('\n' + '='.repeat(50));
if (process.exitCode === 1) {
  console.error('❌ 测试失败');
} else {
  console.log('✅ 所有测试通过');
}
