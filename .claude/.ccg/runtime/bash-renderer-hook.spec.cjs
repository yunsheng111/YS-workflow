const { bashRendererHook } = require('./bash-renderer-hook.cjs');

describe('bashRendererHook', () => {
  const originalEnv = process.env;
  const originalCwd = process.cwd;

  beforeEach(() => {
    // 重置环境变量
    process.env = { ...originalEnv };
    // Mock process.cwd
    process.cwd = jest.fn(() => 'C:/Users/Administrator/.claude');
  });

  afterEach(() => {
    process.env = originalEnv;
    process.cwd = originalCwd;
  });

  test('无占位符的命令直接放行', () => {
    const params = { command: 'git status' };
    const result = bashRendererHook(params);

    expect(result.allow).toBe(true);
    expect(result.params.command).toBe('git status');
  });

  test('渲染 {{CCG_BIN}} 占位符', () => {
    const params = {
      command: '{{CCG_BIN}} --version'
    };
    const result = bashRendererHook(params);

    expect(result.allow).toBe(true);
    expect(result.params.command).toContain('codeagent-wrapper.exe');
    expect(result.params.command).not.toContain('{{CCG_BIN}}');
  });

  test('渲染 {{WORKDIR}} 占位符', () => {
    const params = {
      command: 'cd {{WORKDIR}} && ls'
    };
    const result = bashRendererHook(params);

    expect(result.allow).toBe(true);
    expect(result.params.command).toContain('C:/Users/Administrator/.claude');
    expect(result.params.command).not.toContain('{{WORKDIR}}');
  });

  test('渲染 {{LITE_MODE_FLAG}} 占位符（LITE_MODE=true）', () => {
    process.env.LITE_MODE = 'true';
    const params = {
      command: '{{CCG_BIN}} {{LITE_MODE_FLAG}}analyze'
    };
    const result = bashRendererHook(params);

    expect(result.allow).toBe(true);
    expect(result.params.command).toContain('--lite ');
    expect(result.params.command).not.toContain('{{LITE_MODE_FLAG}}');
  });

  test('渲染 {{LITE_MODE_FLAG}} 占位符（LITE_MODE=false）', () => {
    process.env.LITE_MODE = 'false';
    const params = {
      command: '{{CCG_BIN}} {{LITE_MODE_FLAG}}analyze'
    };
    const result = bashRendererHook(params);

    expect(result.allow).toBe(true);
    expect(result.params.command).not.toContain('--lite');
    expect(result.params.command).not.toContain('{{LITE_MODE_FLAG}}');
  });

  test('渲染 {{GEMINI_MODEL_FLAG}} 占位符（有模型）', () => {
    process.env.GEMINI_MODEL = 'gemini-3-pro-preview';
    const params = {
      command: '{{CCG_BIN}} {{GEMINI_MODEL_FLAG}}analyze'
    };
    const result = bashRendererHook(params);

    expect(result.allow).toBe(true);
    expect(result.params.command).toContain('--gemini-model gemini-3-pro-preview');
    expect(result.params.command).not.toContain('{{GEMINI_MODEL_FLAG}}');
  });

  test('渲染 {{GEMINI_MODEL_FLAG}} 占位符（无模型）', () => {
    delete process.env.GEMINI_MODEL;
    const params = {
      command: '{{CCG_BIN}} {{GEMINI_MODEL_FLAG}}analyze'
    };
    const result = bashRendererHook(params);

    expect(result.allow).toBe(true);
    expect(result.params.command).not.toContain('--gemini-model');
    expect(result.params.command).not.toContain('{{GEMINI_MODEL_FLAG}}');
  });

  test('渲染多个占位符', () => {
    process.env.LITE_MODE = 'true';
    process.env.GEMINI_MODEL = 'gemini-3-pro-preview';
    const params = {
      command: 'cd {{WORKDIR}} && {{CCG_BIN}} {{LITE_MODE_FLAG}}{{GEMINI_MODEL_FLAG}}analyze'
    };
    const result = bashRendererHook(params);

    expect(result.allow).toBe(true);
    expect(result.params.command).toContain('C:/Users/Administrator/.claude');
    expect(result.params.command).toContain('codeagent-wrapper.exe');
    expect(result.params.command).toContain('--lite ');
    expect(result.params.command).toContain('--gemini-model gemini-3-pro-preview');
    expect(result.params.command).not.toContain('{{');
  });

  test('未知占位符导致渲染失败', () => {
    const params = {
      command: '{{UNKNOWN_VAR}} test'
    };
    const result = bashRendererHook(params);

    expect(result.allow).toBe(false);
    expect(result.reason).toContain('渲染失败');
    expect(result.reason).toContain('{{UNKNOWN_VAR}}');
  });

  test('保留其他 Bash 参数', () => {
    const params = {
      command: '{{CCG_BIN}} --version',
      description: 'Test command',
      timeout: 5000
    };
    const result = bashRendererHook(params);

    expect(result.allow).toBe(true);
    expect(result.params.description).toBe('Test command');
    expect(result.params.timeout).toBe(5000);
  });
});
