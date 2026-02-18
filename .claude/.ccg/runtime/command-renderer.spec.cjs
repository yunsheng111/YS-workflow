const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  getRoutingBackend,
  loadConfig,
  buildRuntimeVars,
  buildGeminiModelFlag,
  renderTemplate,
  validateNoPlaceholders,
  getMigrationMode
} = require('./command-renderer.cjs');

function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

describe('command-renderer', () => {
  describe('loadConfig', () => {
    it('应该从 config.toml 读取 CCG_BIN', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
      const configPath = path.join(tmpDir, 'config.toml');
      fs.writeFileSync(configPath, 'CCG_BIN = "C:/custom/path/ccg.exe"');

      const result = loadConfig(configPath);
      assert.strictEqual(result, 'C:/custom/path/ccg.exe');

      fs.unlinkSync(configPath);
      fs.rmdirSync(tmpDir);
    });

    it('配置文件不存在时应返回默认值', () => {
      const result = loadConfig('/nonexistent/config.toml');
      assert.strictEqual(result, 'C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe');
    });
  });

  describe('buildGeminiModelFlag', () => {
    it('环境变量存在时应生成标志', () => {
      const env = { GEMINI_MODEL: 'gemini-2.0-flash-exp' };
      const result = buildGeminiModelFlag(env);
      assert.strictEqual(result, '--gemini-model gemini-2.0-flash-exp ');
    });

    it('环境变量不存在时应返回空字符串', () => {
      const env = {};
      const result = buildGeminiModelFlag(env);
      assert.strictEqual(result, '');
    });

    it('环境变量为空字符串时应返回空字符串', () => {
      const env = { GEMINI_MODEL: '' };
      const result = buildGeminiModelFlag(env);
      assert.strictEqual(result, '');
    });

    it('环境变量仅包含空格时应返回空字符串', () => {
      const env = { GEMINI_MODEL: '   ' };
      const result = buildGeminiModelFlag(env);
      assert.strictEqual(result, '');
    });
  });

  describe('buildRuntimeVars', () => {
    it('应正确构建所有运行时变量', () => {
      const options = {
        cwd: 'C:/project',
        env: {
          LITE_MODE: 'true',
          GEMINI_MODEL: 'gemini-2.0-flash-exp'
        },
        config: {
          ccgBin: 'C:/custom/ccg.exe'
        }
      };

      const vars = buildRuntimeVars(options);
      assert.strictEqual(vars.CCG_BIN, 'C:/custom/ccg.exe');
      assert.strictEqual(vars.WORKDIR, 'C:/project');
      assert.strictEqual(vars.LITE_MODE_FLAG, '--lite ');
      assert.strictEqual(vars.GEMINI_MODEL_FLAG, '--gemini-model gemini-2.0-flash-exp ');
    });

    it('LITE_MODE 为 false 时应返回空字符串', () => {
      const options = {
        cwd: 'C:/project',
        env: { LITE_MODE: 'false' },
        config: {}
      };

      const vars = buildRuntimeVars(options);
      assert.strictEqual(vars.LITE_MODE_FLAG, '');
    });

    it('配置为空时应使用默认值', () => {
      const options = {
        cwd: 'C:/project',
        env: {},
        config: {}
      };

      const vars = buildRuntimeVars(options);
      assert.strictEqual(vars.CCG_BIN, 'C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe');
      assert.strictEqual(vars.LITE_MODE_FLAG, '');
      assert.strictEqual(vars.GEMINI_MODEL_FLAG, '');
    });
  });

  describe('renderTemplate', () => {
    it('应正确替换所有占位符', () => {
      const template = '{{CCG_BIN}} {{LITE_MODE_FLAG}}--backend codex {{GEMINI_MODEL_FLAG}}- "{{WORKDIR}}"';
      const vars = {
        CCG_BIN: 'C:/ccg.exe',
        WORKDIR: 'C:/project',
        LITE_MODE_FLAG: '--lite ',
        GEMINI_MODEL_FLAG: '--gemini-model gemini-2.0-flash-exp '
      };

      const result = renderTemplate(template, vars);
      assert.strictEqual(result, 'C:/ccg.exe --lite --backend codex --gemini-model gemini-2.0-flash-exp - "C:/project"');
    });

    it('应处理空值占位符', () => {
      const template = '{{CCG_BIN}} {{LITE_MODE_FLAG}}analyze';
      const vars = {
        CCG_BIN: 'C:/ccg.exe',
        LITE_MODE_FLAG: ''
      };

      const result = renderTemplate(template, vars);
      assert.strictEqual(result, 'C:/ccg.exe analyze');
    });

    it('应处理多次出现的相同占位符', () => {
      const template = '{{WORKDIR}}/input {{WORKDIR}}/output';
      const vars = {
        WORKDIR: 'C:/project'
      };

      const result = renderTemplate(template, vars);
      assert.strictEqual(result, 'C:/project/input C:/project/output');
    });

    it('应压缩空占位符产生的多余空格', () => {
      const template = '{{CCG_BIN}} --backend codex {{LITE_MODE_FLAG}}{{GEMINI_MODEL_FLAG}}- "{{WORKDIR}}"';
      const vars = {
        CCG_BIN: 'C:/ccg.exe',
        WORKDIR: 'C:/project',
        LITE_MODE_FLAG: '',
        GEMINI_MODEL_FLAG: ''
      };

      const result = renderTemplate(template, vars);
      assert.strictEqual(result, 'C:/ccg.exe --backend codex - "C:/project"');
    });
  });

  describe('validateNoPlaceholders', () => {
    it('无残留占位符时应通过验证', () => {
      const command = 'C:/ccg.exe --backend codex - "C:/project"';
      assert.doesNotThrow(() => {
        validateNoPlaceholders(command);
      });
    });

    it('存在残留占位符时应抛出错误', () => {
      const command = 'C:/ccg.exe --backend codex - "{{WORKDIR}}"';
      assert.throws(() => {
        validateNoPlaceholders(command);
      }, /渲染失败：命令中存在残留占位符 \{\{WORKDIR\}\}/);
    });

    it('存在多个残留占位符时应列出所有占位符', () => {
      const command = '{{CCG_BIN}} --backend codex - "{{WORKDIR}}" {{UNKNOWN_FLAG}}';
      assert.throws(() => {
        validateNoPlaceholders(command);
      }, /渲染失败：命令中存在残留占位符 \{\{CCG_BIN\}\}, \{\{WORKDIR\}\}, \{\{UNKNOWN_FLAG\}\}/);
    });
  });
});

describe('getMigrationMode', () => {
  const tmpDir = path.join(os.tmpdir(), 'ccg-test-migration');

  // 每个测试前创建临时目录
  function setup() {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // 每个测试后清理
  function teardown() {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  it('默认返回 agent（配置文件不存在）', () => {
    assert.strictEqual(getMigrationMode('/nonexistent/config.toml', 'analyze'), 'agent');
  });

  it('正确读取 migration.p1 区块中的命令模式', () => {
    setup();
    const configContent = `[general]\nversion = "1.0.3"\n\n[migration.p1]\nanalyze = "skill"\nplan = "agent"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'analyze'), 'skill');
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'plan'), 'agent');
    teardown();
  });

  it('未配置的命令默认返回 agent', () => {
    setup();
    const configContent = `[migration.p1]\nanalyze = "skill"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'unknown-cmd'), 'agent');
    teardown();
  });

  it('支持连字符命令名（clean-branches）', () => {
    setup();
    const configContent = `[migration.p1]\nclean-branches = "skill"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'clean-branches'), 'skill');
    teardown();
  });

  it('支持多连字符命令名（spec-research 等）', () => {
    setup();
    const configContent = `[migration.p1]\nspec-research = "skill"\nteam-plan = "agent"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'spec-research'), 'skill');
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'team-plan'), 'agent');
    teardown();
  });

  // P2 多区块匹配测试（步骤 3）
  it('p2 区块命中时返回默认值 agent', () => {
    setup();
    const configContent = `[migration.p1]\nanalyze = "skill"\n\n[migration.p2]\npush = "agent"\noptimize = "agent"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'push'), 'agent');
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'optimize'), 'agent');
    teardown();
  });

  it('p2 区块设为 skill 后正确返回 skill', () => {
    setup();
    const configContent = `[migration.p1]\nanalyze = "skill"\n\n[migration.p2]\npush = "skill"\noptimize = "agent"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'push'), 'skill');
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'optimize'), 'agent');
    teardown();
  });

  it('p2 区块优先于 p1 区块（同名命令 p2 优先）', () => {
    setup();
    // analyze 在 p1 中是 skill，在 p2 中是 agent -> 应返回 p2 的 agent
    const configContent = `[migration.p1]\nanalyze = "skill"\nplan = "skill"\n\n[migration.p2]\nanalyze = "agent"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'analyze'), 'agent');
    // plan 仅在 p1 中有配置，p2 中没有 -> 应返回 p1 的 skill
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'plan'), 'skill');
    teardown();
  });

  it('p2 非法值回退 agent（值不是 agent/skill 时回退）', () => {
    setup();
    const configContent = `[migration.p2]\npush = "invalid"\noptimize = "unknown"\n\n[migration.p1]\nanalyze = "skill"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    // p2 中 push 为非法值，p1 中 push 也没有 -> 默认 agent
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'push'), 'agent');
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'optimize'), 'agent');
    teardown();
  });

  it('p2 区块不存在时不影响 p1', () => {
    setup();
    // 只有 p1 区块，没有 p2 区块
    const configContent = `[general]\nversion = "1.0.3"\n\n[migration.p1]\nanalyze = "skill"\nplan = "agent"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'analyze'), 'skill');
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'plan'), 'agent');
    // 未配置的命令仍返回默认 agent
    assert.strictEqual(getMigrationMode(path.join(tmpDir, 'config.toml'), 'push'), 'agent');
    teardown();
  });
});

describe('getRoutingBackend', () => {
  const tmpDir = path.join(os.tmpdir(), 'ccg-test-routing');

  function setup() {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  function teardown() {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  it('应返回 frontend 命令的 --backend gemini', () => {
    setup();
    const configContent = `[routing.frontend]\nmodels = ["gemini"]\nprimary = "gemini"\nstrategy = "fallback"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    const result = getRoutingBackend(path.join(tmpDir, 'config.toml'), 'frontend');
    assert.strictEqual(result, '--backend gemini ');
    teardown();
  });

  it('应返回 backend 命令的 --backend codex', () => {
    setup();
    const configContent = `[routing.backend]\nmodels = ["codex"]\nprimary = "codex"\nstrategy = "fallback"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    const result = getRoutingBackend(path.join(tmpDir, 'config.toml'), 'backend');
    assert.strictEqual(result, '--backend codex ');
    teardown();
  });

  it('无 routing 配置时应返回空字符串', () => {
    setup();
    const configContent = `[general]\nversion = "1.0.3"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    const result = getRoutingBackend(path.join(tmpDir, 'config.toml'), 'frontend');
    assert.strictEqual(result, '');
    teardown();
  });

  it('配置文件不存在时应返回空字符串', () => {
    const result = getRoutingBackend('/nonexistent/config.toml', 'frontend');
    assert.strictEqual(result, '');
  });

  it('命令无 primary 配置时应返回空字符串', () => {
    setup();
    const configContent = `[routing.review]\nmodels = ["codex", "gemini"]\nstrategy = "parallel"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    const result = getRoutingBackend(path.join(tmpDir, 'config.toml'), 'review');
    assert.strictEqual(result, '');
    teardown();
  });

  it('应匹配多连字符命令名（如 spec-research）', () => {
    setup();
    const configContent = `[routing.spec-research]\nprimary = "gemini"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    const result = getRoutingBackend(path.join(tmpDir, 'config.toml'), 'spec-research');
    assert.strictEqual(result, '--backend gemini ');
    teardown();
  });

  it('应匹配三连字符命令名（如 clean-branches-all）', () => {
    setup();
    const configContent = `[routing.clean-branches-all]\nprimary = "codex"\n`;
    fs.writeFileSync(path.join(tmpDir, 'config.toml'), configContent);
    const result = getRoutingBackend(path.join(tmpDir, 'config.toml'), 'clean-branches-all');
    assert.strictEqual(result, '--backend codex ');
    teardown();
  });
});

describe('buildRuntimeVars - BACKEND_FLAG', () => {
  const tmpDir = path.join(os.tmpdir(), 'ccg-test-backend-flag');

  function setup() {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  function teardown() {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  it('提供 configPath 和 commandName 时应包含 BACKEND_FLAG', () => {
    setup();
    const configContent = `[routing.frontend]\nprimary = "gemini"\n`;
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, configContent);

    const vars = buildRuntimeVars({
      cwd: 'C:/project',
      env: {},
      config: {},
      configPath: configPath,
      commandName: 'frontend'
    });
    assert.strictEqual(vars.BACKEND_FLAG, '--backend gemini ');
    teardown();
  });

  it('未提供 configPath 时 BACKEND_FLAG 应为空字符串', () => {
    const vars = buildRuntimeVars({
      cwd: 'C:/project',
      env: {},
      config: {}
    });
    assert.strictEqual(vars.BACKEND_FLAG, '');
  });

  it('未提供 commandName 时 BACKEND_FLAG 应为空字符串', () => {
    const vars = buildRuntimeVars({
      cwd: 'C:/project',
      env: {},
      config: {},
      configPath: '/some/config.toml'
    });
    assert.strictEqual(vars.BACKEND_FLAG, '');
  });

  it('BACKEND_FLAG 应正确渲染到命令模板中', () => {
    setup();
    const configContent = `[routing.frontend]\nprimary = "gemini"\n`;
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, configContent);

    const vars = buildRuntimeVars({
      cwd: 'C:/project',
      env: {},
      config: { ccgBin: 'C:/ccg.exe' },
      configPath: configPath,
      commandName: 'frontend'
    });

    const template = '{{CCG_BIN}} {{BACKEND_FLAG}}{{LITE_MODE_FLAG}}{{GEMINI_MODEL_FLAG}}- "{{WORKDIR}}"';
    const result = renderTemplate(template, vars);
    assert.strictEqual(result, 'C:/ccg.exe --backend gemini - "C:/project"');
    teardown();
  });
});
