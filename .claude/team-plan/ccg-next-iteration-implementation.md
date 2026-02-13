# Team Plan: CCG 架构下次迭代优化实施

## 概述
对 CCG 架构的遗留问题进行系统性修复，包括占位符渲染层实现、命令-代理映射对齐、代理编排重构、文档自动化治理。

## Codex 分析摘要
**技术可行性评估（HC-5 占位符渲染层）**：
- 可行性高（8.5/10），采用"确定性渲染 + fail-fast"策略
- 占位符种类少、规则固定（CCG_BIN/WORKDIR/LITE_MODE_FLAG/GEMINI_MODEL_FLAG）
- 关键前提：渲染后必须执行"未解析占位符检测"，若仍含 `{{...}}` 直接报错
- **重要发现**：Gemini 参数必须为 `--gemini-model`（不是 `--model`）

**推荐架构方案**：
- 新增统一渲染层：`.ccg/runtime/command-renderer.cjs`（含单测）
- 命令层瘦身：6 个命令改为 Task 路由（plan/execute/frontend/backend/feat/analyze）
- 代理层增强：对应 6 个代理承接外部模型调用逻辑
- 剩余 7 个未接入代理映射：workflow→fullstack-agent, debug→debug-agent, optimize→optimize-agent, test→test-agent, review→review-agent, commit→commit-agent, frontend 增加 ui-ux-designer 分流

**风险评估**：
- R1: 渲染层"看似生效、实际漏替换" → 缓解：validateNoPlaceholders() 强制拦截
- R2: Gemini 参数错误（高风险）→ 缓解：统一由 buildGeminiModelFlag() 输出 `--gemini-model`
- R3: 命令瘦身后能力倒挂到代理，短期行为回归 → 缓解：先迁移 6 命令做模板
- R4: UI/UX 代理接入点不清 → 缓解：frontend 前置分流并用 zhi 确认
- R5: 文档再次漂移 → 缓解：体检脚本 + 后续 manifest 自动生成

## Gemini 分析摘要
**用户体验优化方案（SC-1/SC-2）**：
- 增强工具"断路器"机制：单次请求重试 1 次，10 分钟内连续失败 3 次进入"Basic 模式"
- 结构化降级反馈：通过 zhi 展示状态更新（当前模式、原因、策略、建议）

**文档自动化建议（SC-3）**：
- 命令清单（Command Manifest）：扩展 `.ccg/config.toml` 的 `[workflows.commands]`，增加 execution_mode/subagent/last_verified 字段
- 架构体检脚本（ccg:check-architecture）：映射校验、路径校验、文档同步

**交互设计要点**：
- 代理切换必须使用 zhi 进行显式确认
- 多模型视角融合提示：主代理输出 `[Subagent: analyze] 正在征询 Codex (后端) 与 Gemini (UI) 的专家建议...`
- 占位符透明化：回显 Bash 命令时显示替换后的真实路径

## 技术方案
综合 Codex 和 Gemini 的分析，采用"统一渲染层 + 命令路由层瘦身 + 代理执行层增强 + 文档自动化治理"的四层架构优化方案。

**核心决策**：
1. 占位符渲染层（HC-5）：新增 `.ccg/runtime/command-renderer.cjs`，在主代理调用 Bash 前强制渲染
2. 命令-代理对齐（HC-6）：6 个命令改为 Task 调用，代理内部封装外部模型调用
3. 代理全接入（HC-8）：剩余 7 个代理迁移接入，确保所有代理都被至少一个命令调用
4. 文档自动化（SC-3）：架构体检脚本 + 后续 manifest 机制

## 子任务列表

### Task 1: 占位符渲染层实现（HC-5）
- **类型**: 基础设施
- **文件范围**:
  - `.ccg/runtime/command-renderer.cjs`（新增）
  - `.ccg/runtime/command-renderer.spec.cjs`（新增）
  - `CLAUDE.md`（修改，增加渲染协议）
- **依赖**: 无
- **实施步骤**:
  1. 创建 `.ccg/runtime/command-renderer.cjs`，实现以下函数：
     - `loadConfig(configPath)`: 读取 `.ccg/config.toml` 获取 CCG_BIN 路径
     - `buildRuntimeVars({ cwd, env, config })`: 构建运行时变量映射
     - `buildGeminiModelFlag(env)`: 生成 `--gemini-model <model> `（注意尾随空格）
     - `renderTemplate(commandTemplate, vars)`: 替换占位符
     - `validateNoPlaceholders(renderedCommand)`: 检测残留占位符，若存在则抛出错误
  2. 创建 `.ccg/runtime/command-renderer.spec.cjs`，覆盖测试用例：
     - 4 类占位符正常替换
     - 空值处理
     - 非法值处理
     - 残留占位符检测
  3. 修改 `CLAUDE.md`，在"工具使用约束"章节增加：
     - 执行 Bash 前必须调用渲染层（概念函数）：`preRender(commandTemplate)` → `validateNoPlaceholders()` → `executeRendered()`
     - 替换规则：
       - `{{CCG_BIN}}` → 从 config.toml 读取或默认 `C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe`
       - `{{WORKDIR}}` → 当前工作目录的绝对路径
       - `{{LITE_MODE_FLAG}}` → 根据 `LITE_MODE` 环境变量生成 `--lite ` 或空字符串
       - `{{GEMINI_MODEL_FLAG}}` → 根据 `GEMINI_MODEL` 环境变量生成 `--gemini-model <model> ` 或空字符串
- **验收标准**:
  - 单测全部通过
  - 执行包含占位符的命令时，Bash 命令中不再出现 `{{...}}`
  - 若渲染后仍有残留占位符，主代理拒绝执行并报错

### Task 2: init 命名统一（HC-7）
- **类型**: 基础设施
- **文件范围**:
  - `.ccg/config.toml`
- **依赖**: 无
- **实施步骤**:
  1. 打开 `.ccg/config.toml`
  2. 找到 `workflows.installed` 列表中的 `"init-project"`
  3. 修改为 `"init"`
  4. 保存文件
- **验收标准**:
  - config.toml 中不再出现 `"init-project"`
  - 执行 `/ccg:init` 命令能正常路由到 `commands/ccg/init.md`

### Task 3: plan 命令改为 Task 调用（HC-6-1）
- **类型**: 命令重构
- **文件范围**:
  - `commands/ccg/plan.md`
  - `agents/ccg/planner.md`
- **依赖**: Task 1（占位符渲染层）
- **实施步骤**:
  1. 修改 `commands/ccg/plan.md`：
     - 移除所有 Bash 调用 codeagent-wrapper 的代码块
     - 改为 `Task(subagent_type="planner", prompt="<用户需求>", description="WBS 任务分解")`
  2. 修改 `agents/ccg/planner.md`：
     - 在"工作流程"章节增加"阶段 0：多模型并行分析"
     - 增加 Codex/Gemini 并行调用规范（使用占位符，由渲染层处理）
     - 增加 TaskOutput 等待逻辑
     - 增加 SESSION_ID 交接规范
- **验收标准**:
  - 执行 `/ccg:plan` 命令时，主代理调用 Task 工具启动 planner 代理
  - planner 代理内部能正常调用 Codex/Gemini
  - 输出质量与原外部模型调用一致

### Task 4: execute 命令改为 Task 调用（HC-6-2）
- **类型**: 命令重构
- **文件范围**:
  - `commands/ccg/execute.md`
  - `agents/ccg/execute-agent.md`
- **依赖**: Task 1（占位符渲染层）
- **实施步骤**:
  1. 修改 `commands/ccg/execute.md`：
     - 移除所有 Bash 调用 codeagent-wrapper 的代码块
     - 改为 `Task(subagent_type="execute-agent", prompt="<计划文件路径>", description="严格按计划执行")`
  2. 修改 `agents/ccg/execute-agent.md`：
     - 增加"原型生成"阶段（调用 Codex/Gemini 生成 Unified Diff Patch）
     - 增加"审计"阶段（多模型交叉审查）
     - 增加占位符调用规范
- **验收标准**:
  - 执行 `/ccg:execute` 命令时，主代理调用 Task 工具启动 execute-agent 代理
  - execute-agent 代理内部能正常调用 Codex/Gemini
  - 输出质量与原外部模型调用一致

### Task 5: frontend 命令改为 Task 调用（HC-6-3）
- **类型**: 命令重构
- **文件范围**:
  - `commands/ccg/frontend.md`
  - `agents/ccg/frontend-agent.md`
- **依赖**: Task 1（占位符渲染层）
- **实施步骤**:
  1. 修改 `commands/ccg/frontend.md`：
     - 移除所有 Bash 调用 codeagent-wrapper 的代码块
     - 增加前置分流逻辑：若需求为"设计方案"，调用 `ui-ux-designer` 代理；否则调用 `frontend-agent` 代理
     - 使用 zhi 确认分流决策
  2. 修改 `agents/ccg/frontend-agent.md`：
     - 增加 Gemini 主导的 6 阶段工作流
     - 增加占位符调用规范
- **验收标准**:
  - 执行 `/ccg:frontend` 命令时，主代理根据需求类型分流到正确的代理
  - frontend-agent 代理内部能正常调用 Gemini
  - 输出质量与原外部模型调用一致

### Task 6: backend 命令改为 Task 调用（HC-6-4）
- **类型**: 命令重构
- **文件范围**:
  - `commands/ccg/backend.md`
  - `agents/ccg/backend-agent.md`
- **依赖**: Task 1（占位符渲染层）
- **实施步骤**:
  1. 修改 `commands/ccg/backend.md`：
     - 移除所有 Bash 调用 codeagent-wrapper 的代码块
     - 改为 `Task(subagent_type="backend-agent", prompt="<用户需求>", description="后端专项开发")`
  2. 修改 `agents/ccg/backend-agent.md`：
     - 增加 Codex 主导的 6 阶段工作流
     - 增加占位符调用规范
- **验收标准**:
  - 执行 `/ccg:backend` 命令时，主代理调用 Task 工具启动 backend-agent 代理
  - backend-agent 代理内部能正常调用 Codex
  - 输出质量与原外部模型调用一致

### Task 7: feat 命令改为 Task 调用（HC-6-5）
- **类型**: 命令重构
- **文件范围**:
  - `commands/ccg/feat.md`
  - `agents/ccg/fullstack-light-agent.md`
- **依赖**: Task 1（占位符渲染层）
- **实施步骤**:
  1. 修改 `commands/ccg/feat.md`：
     - 移除所有 Bash 调用 codeagent-wrapper 的代码块
     - 改为 `Task(subagent_type="fullstack-light-agent", prompt="<用户需求>", description="智能功能开发")`
  2. 修改 `agents/ccg/fullstack-light-agent.md`：
     - 增加"自动识别前/后/全栈"逻辑
     - 增加占位符调用规范
- **验收标准**:
  - 执行 `/ccg:feat` 命令时，主代理调用 Task 工具启动 fullstack-light-agent 代理
  - fullstack-light-agent 代理内部能正常调用 Codex/Gemini
  - 输出质量与原外部模型调用一致

### Task 8: analyze 命令改为 Task 调用（HC-6-6）
- **类型**: 命令重构
- **文件范围**:
  - `commands/ccg/analyze.md`
  - `agents/ccg/analyze-agent.md`
- **依赖**: Task 1（占位符渲染层）
- **实施步骤**:
  1. 修改 `commands/ccg/analyze.md`：
     - 移除所有 Bash 调用 codeagent-wrapper 的代码块
     - 改为 `Task(subagent_type="analyze-agent", prompt="<用户需求>", description="多模型技术分析")`
  2. 修改 `agents/ccg/analyze-agent.md`：
     - 增加 Codex + Gemini 并行分析逻辑
     - 增加占位符调用规范
- **验收标准**:
  - 执行 `/ccg:analyze` 命令时，主代理调用 Task 工具启动 analyze-agent 代理
  - analyze-agent 代理内部能正常调用 Codex/Gemini
  - 输出质量与原外部模型调用一致

### Task 9: workflow 命令改为 Task 调用（HC-8-1）
- **类型**: 命令重构
- **文件范围**:
  - `commands/ccg/workflow.md`
  - `agents/ccg/fullstack-agent.md`
- **依赖**: Task 3-8（6 个命令迁移完成，作为模板参考）
- **实施步骤**:
  1. 修改 `commands/ccg/workflow.md`：
     - 移除所有 Bash 调用 codeagent-wrapper 的代码块
     - 改为 `Task(subagent_type="fullstack-agent", prompt="<用户需求>", description="6 阶段全栈开发")`
  2. 修改 `agents/ccg/fullstack-agent.md`：
     - 增加 6 阶段工作流（研究→构思→规划→实施→审查→验收）
     - 增加占位符调用规范
- **验收标准**:
  - 执行 `/ccg:workflow` 命令时，主代理调用 Task 工具启动 fullstack-agent 代理
  - fullstack-agent 代理内部能正常调用 Codex/Gemini
  - 输出质量与原外部模型调用一致

### Task 10: debug/optimize/test/review/commit 命令改为 Task 调用（HC-8-2）
- **类型**: 命令重构
- **文件范围**:
  - `commands/ccg/debug.md` → `agents/ccg/debug-agent.md`
  - `commands/ccg/optimize.md` → `agents/ccg/optimize-agent.md`
  - `commands/ccg/test.md` → `agents/ccg/test-agent.md`
  - `commands/ccg/review.md` → `agents/ccg/review-agent.md`
  - `commands/ccg/commit.md` → `agents/ccg/commit-agent.md`
- **依赖**: Task 3-8（6 个命令迁移完成，作为模板参考）
- **实施步骤**:
  1. 对每个命令文件：
     - 移除所有 Bash 调用 codeagent-wrapper 的代码块
     - 改为 `Task(subagent_type="<对应代理名>", prompt="<用户需求>", description="<简短描述>")`
  2. 对每个代理文件：
     - 增加对应的工作流逻辑
     - 增加占位符调用规范（如需要）
- **验收标准**:
  - 执行对应命令时，主代理调用 Task 工具启动对应代理
  - 代理内部能正常调用 Codex/Gemini（如需要）
  - 输出质量与原外部模型调用一致

### Task 11: 清理硬编码路径（HC-4）
- **类型**: 全栈
- **文件范围**:
  - `commands/ccg/*.md`（26 个文件）
  - `agents/ccg/*.md`（20 个文件）
- **依赖**: Task 3-10（命令重构完成后，ROLE_FILE 路径已迁移到代理内部）
- **实施步骤**:
  1. 使用 Grep 搜索所有包含 `C:/Users/Administrator/.claude/.ccg/prompts/` 的文件
  2. 将绝对路径替换为 `~/.claude/.ccg/prompts/` 或相对路径
  3. 验证替换后的路径在不同平台上可正常解析
- **验收标准**:
  - 所有命令和代理文件中不再出现 `C:/Users/...` 绝对路径
  - 执行命令时，ROLE_FILE 路径能正常解析

### Task 12: 更新架构文档（HC-2）
- **类型**: 全栈
- **文件范围**:
  - `.ccg/ARCHITECTURE.md`
  - `.ccg/ARCHITECTURE-VISUAL.md`
- **依赖**: Task 3-10（命令重构完成后，映射关系已确定）
- **实施步骤**:
  1. 修改 `.ccg/ARCHITECTURE.md`：
     - 更新"命令-代理映射表"，反映 Task 3-10 的变更
     - 更新"执行方式"说明（Task 调用数量从 7 个增加到 20 个）
  2. 修改 `.ccg/ARCHITECTURE-VISUAL.md`：
     - 更新"命令-代理映射矩阵"
     - 更新"代理工具集配置矩阵"
- **验收标准**:
  - 架构文档中的映射表与实际执行方式一致
  - 所有 20 个代理都在映射表中出现

### Task 13: 架构体检脚本（RISK-3 缓解）
- **类型**: 基础设施
- **文件范围**:
  - `.ccg/scripts/check-architecture.js`（新增）
  - `.ccg/scripts/check-architecture.spec.js`（新增）
- **依赖**: Task 12（架构文档更新完成）
- **实施步骤**:
  1. 创建 `.ccg/scripts/check-architecture.js`，实现以下检查：
     - 命令数量校验：扫描 `commands/ccg/` 目录，对比 `config.toml` 的 `workflows.installed` 列表
     - 映射完整性校验：扫描命令文件中的 `Task(subagent_type="...")` 调用，对比 `agents/ccg/` 目录
     - 路径规范校验：检索所有 MD 文件，标记包含 `C:/Users/...` 绝对路径的行
     - 代理调用完整性校验：确保每个代理都被至少一个命令调用
  2. 创建 `.ccg/scripts/check-architecture.spec.js`，覆盖测试用例
  3. 在 `package.json` 中增加脚本：`"check-arch": "node .ccg/scripts/check-architecture.js"`
- **验收标准**:
  - 执行 `npm run check-arch` 能正常运行
  - 所有检查项通过
  - 若检查失败，输出清晰的错误信息

### Task 14: enhance 工具可靠性改进（SC-1/SC-2）
- **类型**: 全栈
- **文件范围**:
  - `CLAUDE.md`（修改，增加断路器和降级反馈规范）
- **依赖**: 无
- **实施步骤**:
  1. 修改 `CLAUDE.md` 的"降级策略"章节：
     - 增加断路器模式：`mcp______enhance` 单次失败后重试 1 次，10 分钟内连续失败 3 次进入"Basic 模式"
     - 增加降级反馈规范：通过 `mcp______zhi` 展示结构化状态更新（当前模式、原因、策略、建议）
     - 降级反馈模板：
       ```
       🔄 **状态更新：Prompt 增强模式切换**
       - **当前模式**：`Fallback (Claude-native)`
       - **原因**：`mcp______enhance` 响应超时 (Timeout > 30s)
       - **策略**：已启用本地启发式增强，确保任务继续执行。
       - **建议**：若增强效果不佳，请检查网络或重试 `/ccg:enhance`。
       ```
- **验收标准**:
  - 触发 enhance 降级时，用户能看到结构化的状态更新
  - 降级反馈包含"当前模式"和"降级原因"
  - 连续失败 3 次后，自动进入"Basic 模式"

## 文件冲突检查
| 文件路径 | 归属任务 | 状态 |
|----------|----------|------|
| `.ccg/runtime/command-renderer.cjs` | Task 1 | ✅ 唯一 |
| `.ccg/runtime/command-renderer.spec.cjs` | Task 1 | ✅ 唯一 |
| `CLAUDE.md` | Task 1, Task 14 | ⚠️ 不同章节，无冲突 |
| `.ccg/config.toml` | Task 2 | ✅ 唯一 |
| `commands/ccg/plan.md` | Task 3 | ✅ 唯一 |
| `agents/ccg/planner.md` | Task 3 | ✅ 唯一 |
| `commands/ccg/execute.md` | Task 4 | ✅ 唯一 |
| `agents/ccg/execute-agent.md` | Task 4 | ✅ 唯一 |
| `commands/ccg/frontend.md` | Task 5 | ✅ 唯一 |
| `agents/ccg/frontend-agent.md` | Task 5 | ✅ 唯一 |
| `commands/ccg/backend.md` | Task 6 | ✅ 唯一 |
| `agents/ccg/backend-agent.md` | Task 6 | ✅ 唯一 |
| `commands/ccg/feat.md` | Task 7 | ✅ 唯一 |
| `agents/ccg/fullstack-light-agent.md` | Task 7 | ✅ 唯一 |
| `commands/ccg/analyze.md` | Task 8 | ✅ 唯一 |
| `agents/ccg/analyze-agent.md` | Task 8 | ✅ 唯一 |
| `commands/ccg/workflow.md` | Task 9 | ✅ 唯一 |
| `agents/ccg/fullstack-agent.md` | Task 9 | ✅ 唯一 |
| `commands/ccg/debug.md` | Task 10 | ✅ 唯一 |
| `commands/ccg/optimize.md` | Task 10 | ✅ 唯一 |
| `commands/ccg/test.md` | Task 10 | ✅ 唯一 |
| `commands/ccg/review.md` | Task 10 | ✅ 唯一 |
| `commands/ccg/commit.md` | Task 10 | ✅ 唯一 |
| `agents/ccg/debug-agent.md` | Task 10 | ✅ 唯一 |
| `agents/ccg/optimize-agent.md` | Task 10 | ✅ 唯一 |
| `agents/ccg/test-agent.md` | Task 10 | ✅ 唯一 |
| `agents/ccg/review-agent.md` | Task 10 | ✅ 唯一 |
| `agents/ccg/commit-agent.md` | Task 10 | ✅ 唯一 |
| `commands/ccg/*.md` | Task 11 | ⚠️ 依赖 Task 3-10 完成 |
| `agents/ccg/*.md` | Task 11 | ⚠️ 依赖 Task 3-10 完成 |
| `.ccg/ARCHITECTURE.md` | Task 12 | ✅ 唯一 |
| `.ccg/ARCHITECTURE-VISUAL.md` | Task 12 | ✅ 唯一 |
| `.ccg/scripts/check-architecture.js` | Task 13 | ✅ 唯一 |
| `.ccg/scripts/check-architecture.spec.js` | Task 13 | ✅ 唯一 |

结论：✅ 无冲突（Task 11 依赖 Task 3-10 完成后执行，Task 1 和 Task 14 修改 CLAUDE.md 的不同章节）

## 并行分组
- **Layer 1 (并行)**: Task 1, Task 2, Task 14 — 基础设施 + 独立优化
- **Layer 2 (依赖 Layer 1)**: Task 3, Task 4, Task 5, Task 6, Task 7, Task 8 — 6 个核心命令迁移（可并行）
- **Layer 3 (依赖 Layer 2)**: Task 9, Task 10 — 剩余代理迁移（可并行）
- **Layer 4 (依赖 Layer 3)**: Task 11, Task 12 — 清理和文档更新（可并行）
- **Layer 5 (依赖 Layer 4)**: Task 13 — 架构体检脚本

预计 Builder 数量：14 个（Layer 1: 3 个，Layer 2: 6 个，Layer 3: 2 个，Layer 4: 2 个，Layer 5: 1 个）

## 与 team-exec 的衔接
- 计划确认后运行：`/ccg:team-exec .claude/team-plan/ccg-next-iteration-implementation.md`
- team-exec 将按 Layer 顺序 spawn Builder
- 每个 Task 段落将完整注入对应 Builder 的 prompt
- Layer 1 的 3 个 Builder 并行执行，完成后再启动 Layer 2 的 6 个 Builder，以此类推
