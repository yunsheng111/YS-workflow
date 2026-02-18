const fs = require('fs');
const path = require('path');

/**
 * 从 config.toml 读取命令的路由后端配置
 * @param {string} configPath - config.toml 文件路径
 * @param {string} commandName - 命令名称（如 frontend, backend 等）
 * @returns {string} "--backend <primary> " 或空字符串（无配置时）
 */
function getRoutingBackend(configPath, commandName) {
  // 输入验证：防止正则注入（commandName 仅允许小写字母、连字符、数字）
  if (!/^[a-z][-a-z0-9]*$/.test(commandName)) return '';
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    // 匹配 [routing.<commandName>] 区块中的 primary 值
    // 使用行首 \[ 作为下一区块的边界，避免误匹配 toml 数组值中的 [
    const sectionPattern = new RegExp(
      `\\[routing\\.${commandName.replace(/-/g, '[-_]')}\\]([\\s\\S]*?)(?=\\n\\[|$)`
    );
    const sectionMatch = content.match(sectionPattern);
    if (sectionMatch) {
      const section = sectionMatch[1];
      const primaryMatch = section.match(/primary\s*=\s*["'](\w+)["']/);
      if (primaryMatch) {
        return `--backend ${primaryMatch[1]} `;
      }
    }
  } catch (err) {
    // 配置读取失败，返回空字符串（不指定后端，由 wrapper 决定）
  }
  return '';
}

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
 * @param {string} [options.configPath] - config.toml 文件路径（用于读取 routing 配置）
 * @param {string} [options.commandName] - 当前命令名称（用于读取 routing 配置）
 * @returns {Object} 变量映射
 */
function buildRuntimeVars({ cwd, env, config, configPath, commandName }) {
  // 优先读取环境变量，其次读取 config.toml
  const liteMode = env.LITE_MODE === 'true' ||
                   (config.environment?.LITE_MODE === true) ||
                   (config.performance?.liteMode === true);

  // 读取命令路由后端配置（需要 configPath 和 commandName）
  let backendFlag = '';
  if (configPath && commandName) {
    backendFlag = getRoutingBackend(configPath, commandName);
  }

  const vars = {
    CCG_BIN: config.ccgBin || 'C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe',
    WORKDIR: cwd,
    LITE_MODE_FLAG: liteMode ? '--lite ' : '',
    GEMINI_MODEL_FLAG: buildGeminiModelFlag(env, config),
    BACKEND_FLAG: backendFlag
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
  const geminiModel = env.GEMINI_MODEL || (config && config.environment && config.environment.GEMINI_MODEL);
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
  // 防御性空格压缩：消除占位符为空时产生的多余空格
  rendered = rendered.replace(/ {2,}/g, ' ');
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

/**
 * 获取命令的迁移模式（agent 或 skill）
 * 多区块匹配：优先 p2，其次 p1，否则默认 agent
 * @param {string} configPath - config.toml 文件路径
 * @param {string} commandName - 命令名称（如 analyze, plan, push 等）
 * @returns {string} "agent" | "skill"
 */
function getMigrationMode(configPath, commandName) {
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const cmdRegex = new RegExp(`(?:^|\\n)\\s*${commandName.replace(/-/g, '[-_]')}\\s*=\\s*["']?(\\w+)["']?`);
    // 优先匹配 p2 区块
    const p2Match = content.match(/\[migration\.p2\]([\s\S]*?)(?=\n\[|$)/);
    if (p2Match) {
      const section = p2Match[1];
      const cmdMatch = section.match(cmdRegex);
      if (cmdMatch && ['agent', 'skill'].includes(cmdMatch[1])) {
        return cmdMatch[1];
      }
    }
    // 其次匹配 p1 区块
    const p1Match = content.match(/\[migration\.p1\]([\s\S]*?)(?=\n\[|$)/);
    if (p1Match) {
      const section = p1Match[1];
      const cmdMatch = section.match(cmdRegex);
      if (cmdMatch && ['agent', 'skill'].includes(cmdMatch[1])) {
        return cmdMatch[1];
      }
    }
  } catch (err) {
    // 配置读取失败，默认使用 agent 模式（安全回退）
  }
  return 'agent';
}

module.exports = {
  getRoutingBackend,
  loadConfig,
  buildRuntimeVars,
  buildGeminiModelFlag,
  renderTemplate,
  validateNoPlaceholders,
  getMigrationMode
};
