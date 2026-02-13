const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  loadConfig,
  buildRuntimeVars,
  buildGeminiModelFlag,
  renderTemplate,
  validateNoPlaceholders
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
      const template = '{{CCG_BIN}} --workdir {{WORKDIR}} {{LITE_MODE_FLAG}}{{GEMINI_MODEL_FLAG}}analyze';
      const vars = {
        CCG_BIN: 'C:/ccg.exe',
        WORKDIR: 'C:/project',
        LITE_MODE_FLAG: '--lite ',
        GEMINI_MODEL_FLAG: '--gemini-model gemini-2.0-flash-exp '
      };

      const result = renderTemplate(template, vars);
      assert.strictEqual(result, 'C:/ccg.exe --workdir C:/project --lite --gemini-model gemini-2.0-flash-exp analyze');
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
  });

  describe('validateNoPlaceholders', () => {
    it('无残留占位符时应通过验证', () => {
      const command = 'C:/ccg.exe --workdir C:/project analyze';
      assert.doesNotThrow(() => {
        validateNoPlaceholders(command);
      });
    });

    it('存在残留占位符时应抛出错误', () => {
      const command = 'C:/ccg.exe --workdir {{WORKDIR}} analyze';
      assert.throws(() => {
        validateNoPlaceholders(command);
      }, /渲染失败：命令中存在残留占位符 \{\{WORKDIR\}\}/);
    });

    it('存在多个残留占位符时应列出所有占位符', () => {
      const command = '{{CCG_BIN}} --workdir {{WORKDIR}} {{UNKNOWN_FLAG}}';
      assert.throws(() => {
        validateNoPlaceholders(command);
      }, /渲染失败：命令中存在残留占位符 \{\{CCG_BIN\}\}, \{\{WORKDIR\}\}, \{\{UNKNOWN_FLAG\}\}/);
    });
  });
});
