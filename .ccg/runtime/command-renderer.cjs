const fs = require('fs');
const path = require('path');

/**
 * 从 config.toml 读取 CCG_BIN 路径
 * @param {string} configPath - config.toml 文件路径
 * @returns {string} CCG_BIN 路径
 */
function loadConfig(configPath) {
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const match = content.match(/CCG_BIN\s*=\s*["'](.+?)["']/);
    if (match) {
      return match[1];
    }
  } catch (err) {
    // 配置文件不存在或读取失败，返回默认值
  }
  return 'C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe';
}

/**
 * 构建运行时变量映射
 * @param {Object} options
 * @param {string} options.cwd - 当前工作目录
 * @param {Object} options.env - 环境变量
 * @param {Object} options.config - 配置对象
 * @returns {Object} 变量映射
 */
function buildRuntimeVars({ cwd, env, config }) {
  // 优先读取环境变量，其次读取 config.toml
  const liteMode = env.LITE_MODE === 'true' ||
                   (config.environment?.LITE_MODE === true) ||
                   (config.performance?.liteMode === true);

  const vars = {
    CCG_BIN: config.ccgBin || 'C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe',
    WORKDIR: cwd,
    LITE_MODE_FLAG: liteMode ? '--lite ' : '',
    GEMINI_MODEL_FLAG: buildGeminiModelFlag(env, config)
  };
  return vars;
}

/**
 * 生成 Gemini 模型标志
 * @param {Object} env - 环境变量
 * @param {Object} config - 配置对象
 * @returns {string} --gemini-model <model> 或空字符串
 */
function buildGeminiModelFlag(env, config) {
  const geminiModel = env.GEMINI_MODEL || config.environment?.GEMINI_MODEL;
  if (geminiModel && geminiModel.trim()) {
    return `--gemini-model ${geminiModel} `;
  }
  return '';
}

/**
 * 替换模板中的占位符
 * @param {string} commandTemplate - 命令模板
 * @param {Object} vars - 变量映射
 * @returns {string} 渲染后的命令
 */
function renderTemplate(commandTemplate, vars) {
  let rendered = commandTemplate;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`;
    rendered = rendered.split(placeholder).join(value);
  }
  return rendered;
}

/**
 * 验证渲染后的命令中是否存在残留占位符
 * @param {string} renderedCommand - 渲染后的命令
 * @throws {Error} 如果存在残留占位符
 */
function validateNoPlaceholders(renderedCommand) {
  const placeholderPattern = /\{\{[^}]+\}\}/g;
  const matches = renderedCommand.match(placeholderPattern);
  if (matches && matches.length > 0) {
    throw new Error(`渲染失败：命令中存在残留占位符 ${matches.join(', ')}`);
  }
}

module.exports = {
  loadConfig,
  buildRuntimeVars,
  buildGeminiModelFlag,
  renderTemplate,
  validateNoPlaceholders
};
