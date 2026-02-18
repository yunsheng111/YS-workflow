const { loadConfig, buildRuntimeVars, renderTemplate, validateNoPlaceholders } = require('./command-renderer.cjs');
const path = require('path');
const fs = require('fs');

/**
 * PreToolUse Hook for Bash tool
 * 在 Bash 命令执行前自动渲染占位符
 *
 * @param {Object} params - Bash 工具参数
 * @param {string} params.command - 待执行的命令
 * @returns {Object} 渲染后的参数或错误
 */
function bashRendererHook(params) {
  const { command } = params;

  // 检测命令中是否包含占位符
  const placeholderPattern = /\{\{[^}]+\}\}/g;
  if (!placeholderPattern.test(command)) {
    // 无占位符，直接放行
    return { allow: true, params };
  }

  try {
    // 加载配置（使用 __dirname 确保路径稳定，不受 cwd 影响）
    const configPath = path.join(__dirname, '..', 'config.toml');
    const ccgBin = loadConfig(configPath);

    // 构建运行时变量
    const vars = buildRuntimeVars({
      cwd: process.cwd(),
      env: process.env,
      config: {
        ccgBin,
        environment: {
          LITE_MODE: process.env.LITE_MODE === 'true',
          GEMINI_MODEL: process.env.GEMINI_MODEL
        },
        performance: {
          liteMode: false
        }
      }
    });

    // 渲染命令
    const renderedCommand = renderTemplate(command, vars);

    // 验证无残留占位符
    validateNoPlaceholders(renderedCommand);

    // 返回渲染后的命令
    return {
      allow: true,
      params: {
        ...params,
        command: renderedCommand
      }
    };
  } catch (error) {
    // 渲染失败，拒绝执行
    return {
      allow: false,
      reason: `占位符渲染失败: ${error.message}`
    };
  }
}

module.exports = { bashRendererHook };
