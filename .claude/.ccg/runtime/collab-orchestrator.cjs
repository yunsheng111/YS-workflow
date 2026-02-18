/**
 * CollabOrchestrator — 统一双模型编排内核
 *
 * 封装 collab Skill 的完整执行逻辑：
 * 命令渲染 → 进程调用 → 结果解析 → 状态判定
 *
 * 真值源：skills/collab/SKILL.md
 */

const path = require('path');
const {
  loadConfig,
  buildRuntimeVars,
  renderTemplate,
  validateNoPlaceholders
} = require('./command-renderer.cjs');
const {
  States,
  EventTypes,
  StateTransitions
} = require('./execution-ledger-schema.cjs');

// --- 安全工具 ---

/**
 * 转义 shell 单引号内的特殊字符
 * 防止命令注入：将单引号替换为 '\'' 序列
 */
function shellEscape(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/'/g, "'\\''");
}

/**
 * 校验 role 参数（白名单）
 */
const VALID_ROLES = ['architect', 'analyzer', 'reviewer', 'developer', 'frontend'];
function validateRole(role) {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`无效的 role 参数：${role}，允许值：${VALID_ROLES.join(', ')}`);
  }
}

/**
 * 校验 resume 参数（UUID 格式）
 */
function validateResume(resume) {
  if (resume && !/^[a-f0-9-]+$/i.test(resume)) {
    throw new Error(`无效的 resume 参数：${resume}，必须为 UUID 格式`);
  }
}

// --- 命令模板（来自 SKILL.md） ---

const CODEX_TEMPLATE =
  "echo 'ROLE_FILE: ~/.claude/.ccg/prompts/codex/{{ROLE}}.md\n<TASK>\n需求：{{TASK}}\n</TASK>\nOUTPUT: structured-analysis' | {{CCG_BIN}} --backend codex {{LITE_MODE_FLAG}}- \"{{WORKDIR}}\"";

const GEMINI_TEMPLATE =
  "echo 'ROLE_FILE: ~/.claude/.ccg/prompts/gemini/{{ROLE}}.md\n<TASK>\n需求：{{TASK}}\n</TASK>\nOUTPUT: structured-analysis' | {{CCG_BIN}} --backend gemini {{GEMINI_MODEL_FLAG}}- \"{{WORKDIR}}\"";

// --- SESSION_ID 提取正则 ---

const SESSION_ID_REGEX = /SESSION_ID:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;

/**
 * 双模型编排器
 */
class CollabOrchestrator {
  /**
   * @param {Object} options
   * @param {string} [options.configPath] - config.toml 路径
   * @param {string} [options.cwd] - 工作目录
   * @param {Object} [options.env] - 环境变量
   * @param {boolean} [options.verbose] - 详细输出
   * @param {boolean} [options.liteMode] - 轻量模式（跳过外部模型调用）
   */
  constructor(options = {}) {
    this._configPath = options.configPath || path.join(__dirname, '..', 'config.toml');
    this._cwd = options.cwd || process.cwd();
    this._env = options.env || process.env;
    this._verbose = options.verbose || false;
    this._liteMode = options.liteMode || false;

    // 加载配置并构建运行时变量
    const ccgBin = loadConfig(this._configPath);
    this._config = { ccgBin };
    this._runtimeVars = buildRuntimeVars({
      cwd: this._cwd,
      env: this._env,
      config: this._config
    });

    // 初始化 ledger 状态
    this._state = States.INIT;
    this._events = [];
    this._createdAt = Date.now();
    this._updatedAt = Date.now();
  }

  /**
   * 执行双模型编排
   *
   * @param {Object} config
   * @param {string} [config.backend='both'] - 调用后端：codex / gemini / both
   * @param {string} config.role - 角色：architect / analyzer / reviewer / developer
   * @param {string} config.task - 任务描述
   * @param {boolean} [config.parallel=true] - 是否并行调用
   * @param {number} [config.timeout=600000] - 超时（毫秒）
   * @param {string} [config.resume] - 复用的 SESSION_ID
   * @param {boolean} [config.progress_callback=true] - 启用进度回调
   * @param {number} [config.progress_interval=30000] - 进度间隔（毫秒）
   * @param {boolean} [config.stream=false] - 流式输出
   * @returns {Object} 执行结果
   */
  async execute(config) {
    const {
      backend = 'both',
      role,
      task,
      parallel = true,
      timeout = 600000,
      resume,
      progress_callback = true,
      progress_interval = 30000,
      stream = false
    } = config;

    const startTime = Date.now();

    // LITE_MODE：跳过外部模型调用，直接返回降级结果
    if (this._liteMode) {
      this._transitionTo(States.RUNNING);
      this._recordEvent(EventTypes.DEGRADED, {
        reason: 'LITE_MODE: 跳过外部模型调用',
        backend
      });
      this._transitionTo(States.DEGRADED);

      return {
        status: 'DEGRADED',
        degraded_level: 'ACCEPTABLE',
        missing_dimensions: backend === 'codex' ? ['backend'] : backend === 'gemini' ? ['frontend'] : ['backend', 'frontend'],
        codex_session: null,
        gemini_session: null,
        codex_output: null,
        gemini_output: null,
        duration_ms: Date.now() - startTime,
        degraded_reason: 'LITE_MODE: 跳过外部模型调用'
      };
    }

    // 1. 初始化阶段：转换到 RUNNING 状态后记录事件
    this._transitionTo(States.RUNNING);
    this._recordEvent(EventTypes.DOCS_READ, { phase: 'init', backend, role, task });

    const commands = {};
    const taskIds = {};

    try {
      if (backend === 'codex' || backend === 'both') {
        commands.codex = this._renderCommand('codex', role, task, resume);
      }
      if (backend === 'gemini' || backend === 'both') {
        commands.gemini = this._renderCommand('gemini', role, task, resume);
      }
    } catch (err) {
      this._recordEvent(EventTypes.DEGRADED, { reason: err.message });
      this._transitionTo(States.FAILED);
      return {
        status: 'FAILED',
        degraded_level: null,
        missing_dimensions: [],
        codex_session: null,
        gemini_session: null,
        codex_output: null,
        gemini_output: null,
        duration_ms: Date.now() - startTime,
        degraded_reason: err.message
      };
    }

    // 2. 调用阶段：记录模型调用事件
    this._recordEvent(EventTypes.MODEL_CALLED, {
      phase: 'running',
      backends: Object.keys(commands),
      parallel
    });

    // 返回命令和任务 ID，由调用方实际执行进程
    // 生成唯一 taskId
    for (const key of Object.keys(commands)) {
      taskIds[key] = `collab-${key}-${Date.now()}`;
    }

    return { commands, taskIds };
  }

  /**
   * 轮询结果并构建最终输出
   *
   * @param {Object} results - 各后端的执行输出 { codex?: string, gemini?: string }
   * @param {string} role - 角色（用于降级分级）
   * @param {number} startTime - 开始时间戳
   * @param {string} [configBackend] - 调用配置中的 backend 参数（优先于输出推断）
   * @returns {Object} 最终结果
   */
  processResults(results, role, startTime, configBackend) {
    // 状态守卫：允许独立调用（未经 execute()），自动推进到 RUNNING
    if (this._state === States.INIT) {
      this._transitionTo(States.RUNNING);
    }

    const codexOutput = results.codex ?? null;
    const geminiOutput = results.gemini ?? null;

    // 3. 提取 SESSION_ID
    const codexSession = this._extractSessionId(codexOutput);
    const geminiSession = this._extractSessionId(geminiOutput);

    if (codexSession) {
      this._recordEvent(EventTypes.SESSION_CAPTURED, { backend: 'codex', session: codexSession });
    }
    if (geminiSession) {
      this._recordEvent(EventTypes.SESSION_CAPTURED, { backend: 'gemini', session: geminiSession });
    }

    // 4. 状态判定（优先使用调用配置，回退到输出推断）
    const backend = configBackend || (
      (codexOutput !== null && geminiOutput !== null) ? 'both'
      : codexOutput !== null ? 'codex'
      : 'gemini'
    );

    const status = this._determineStatus(codexSession, geminiSession, backend);
    const missingDimensions = this._getMissingDimensions(codexSession, geminiSession);
    const degradedLevel = status === 'DEGRADED'
      ? this._determineDegradedLevel(role, missingDimensions)
      : null;

    // 状态转换
    if (status === 'SUCCESS') {
      this._transitionTo(States.SUCCESS);
      this._recordEvent(EventTypes.SESSION_CAPTURED, { phase: 'success' });
    } else if (status === 'DEGRADED') {
      this._transitionTo(States.DEGRADED);
      this._recordEvent(EventTypes.DEGRADED, {
        phase: 'degraded',
        missing: missingDimensions,
        level: degradedLevel
      });
    } else {
      this._transitionTo(States.FAILED);
      this._recordEvent(EventTypes.DEGRADED, { phase: 'failed', reason: '双模型均无有效 SESSION_ID' });
    }

    const degradedReason = status === 'DEGRADED'
      ? `单模型降级：缺失维度 ${missingDimensions.join(', ')}`
      : status === 'FAILED'
        ? '双模型均无有效 SESSION_ID'
        : null;

    return {
      status,
      degraded_level: degradedLevel,
      missing_dimensions: status === 'DEGRADED' ? missingDimensions : null,
      codex_session: codexSession,
      gemini_session: geminiSession,
      codex_output: codexOutput,
      gemini_output: geminiOutput,
      duration_ms: Date.now() - startTime,
      degraded_reason: degradedReason
    };
  }

  // ========== 内部方法 ==========

  /**
   * 渲染命令模板
   *
   * @param {string} backend - codex / gemini
   * @param {string} role - 角色名
   * @param {string} task - 任务描述
   * @param {string} [resume] - 复用 SESSION_ID
   * @returns {string} 渲染后的命令
   */
  _renderCommand(backend, role, task, resume) {
    // 安全校验
    validateRole(role);
    if (resume) validateResume(resume);

    const template = backend === 'codex' ? CODEX_TEMPLATE : GEMINI_TEMPLATE;

    // 先替换 ROLE 和 TASK 占位符（task 做 shell 转义）
    let command = template
      .replace(/\{\{ROLE\}\}/g, role)
      .replace(/\{\{TASK\}\}/g, shellEscape(task));

    // 如果有 resume，在命令末尾追加 resume 参数
    if (resume) {
      command = command.replace(
        /- "(\{\{WORKDIR\}\})"$/,
        `- "$1" --resume ${resume}`
      );
    }

    // 使用 command-renderer 替换运行时占位符
    const rendered = renderTemplate(command, this._runtimeVars);

    // 验证无残留占位符
    validateNoPlaceholders(rendered);

    if (this._verbose) {
      console.log(`[collab-orchestrator] ${backend} 命令渲染结果：\n${rendered}`);
    }

    return rendered;
  }

  /**
   * 从输出中提取 SESSION_ID
   *
   * @param {string|null} output - 命令输出
   * @returns {string|null} SESSION_ID 或 null
   */
  _extractSessionId(output) {
    if (!output) return null;
    const match = output.match(SESSION_ID_REGEX);
    return match ? match[1] : null;
  }

  /**
   * 判定最终状态
   *
   * @param {string|null} codexSession - Codex SESSION_ID
   * @param {string|null} geminiSession - Gemini SESSION_ID
   * @param {string} backend - 调用模式：codex / gemini / both
   * @returns {string} SUCCESS / DEGRADED / FAILED
   */
  _determineStatus(codexSession, geminiSession, backend) {
    // 单模型模式：该模型有 SESSION_ID 即 SUCCESS
    if (backend === 'codex') {
      return codexSession ? 'SUCCESS' : 'FAILED';
    }
    if (backend === 'gemini') {
      return geminiSession ? 'SUCCESS' : 'FAILED';
    }

    // 双模型模式
    if (codexSession && geminiSession) return 'SUCCESS';
    if (codexSession || geminiSession) return 'DEGRADED';
    return 'FAILED';
  }

  /**
   * 获取缺失维度列表
   *
   * @param {string|null} codexSession
   * @param {string|null} geminiSession
   * @returns {string[]}
   */
  _getMissingDimensions(codexSession, geminiSession) {
    const missing = [];
    if (!codexSession) missing.push('backend');
    if (!geminiSession) missing.push('frontend');
    return missing;
  }

  /**
   * 判定降级分级
   * 严格遵循 SKILL.md 门禁协议 (HC-2)
   *
   * @param {string} role - 角色
   * @param {string[]} missingDimensions - 缺失维度
   * @returns {string} ACCEPTABLE / UNACCEPTABLE
   */
  _determineDegradedLevel(role, missingDimensions) {
    // role=architect: 后端(Codex)为核心 → 缺 frontend 可接受，缺 backend 不可接受
    if (role === 'architect') {
      return missingDimensions.includes('backend') ? 'UNACCEPTABLE' : 'ACCEPTABLE';
    }

    // role=analyzer: 双重视角均为核心 → 任何缺失均不可接受
    if (role === 'analyzer') {
      return 'UNACCEPTABLE';
    }

    // role=reviewer: 前端(Gemini)为核心 → 缺 backend 可接受，缺 frontend 不可接受
    if (role === 'reviewer') {
      return missingDimensions.includes('frontend') ? 'UNACCEPTABLE' : 'ACCEPTABLE';
    }

    // role=developer 或其他：默认不可接受
    return 'UNACCEPTABLE';
  }

  /**
   * 记录事件到内部事件数组
   *
   * @param {string} eventType - 事件类型（EventTypes 枚举值）
   * @param {Object} data - 事件数据
   */
  _recordEvent(eventType, data) {
    this._events.push({
      type: eventType,
      timestamp: Date.now(),
      data: data || {}
    });
    this._updatedAt = Date.now();
  }

  /**
   * 状态转换（严格遵循 StateTransitions）
   *
   * @param {string} newState - 目标状态
   * @throws {Error} 非法状态转换
   */
  _transitionTo(newState) {
    const allowed = StateTransitions[this._state];
    if (!allowed || !allowed.includes(newState)) {
      throw new Error(`非法状态转换：${this._state} → ${newState}`);
    }
    this._state = newState;
    this._updatedAt = Date.now();
  }

  /**
   * 构建进度消息
   *
   * @param {string} state - 当前状态
   * @param {number} elapsed - 已耗时（毫秒）
   * @returns {string} Markdown 格式进度消息
   */
  _buildProgressMessage(state, elapsed) {
    const elapsedSec = Math.round(elapsed / 1000);
    return `## collab 执行状态\n\n**当前状态**：${state}\n**已耗时**：${elapsedSec}s`;
  }

  // ========== 公开查询方法 ==========

  /**
   * 获取当前状态
   * @returns {string}
   */
  getState() {
    return this._state;
  }

  /**
   * 获取事件数组
   * @returns {Array}
   */
  getEvents() {
    return [...this._events];
  }

  /**
   * 获取完整 Ledger 记录
   * @returns {Object}
   */
  getLedger() {
    return {
      task_id: null,
      session_id: null,
      state: this._state,
      events: [...this._events],
      created_at: this._createdAt,
      updated_at: this._updatedAt
    };
  }
}

module.exports = { CollabOrchestrator };
