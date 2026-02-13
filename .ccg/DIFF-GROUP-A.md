# A 组对比报告：spec-* 命令文件（5 个）

> 生成时间：2026-02-12
> 上游目录：`D:/Program Files/nvm/node_global/node_modules/ccg-workflow/templates/commands/`
> 本地目录：`C:/Users/Administrator/.claude/commands/ccg/`

---

## 总体架构差异概述

两版文件在**设计理念**上存在根本性差异：

| 维度 | 上游版本 | 本地版本 |
|------|----------|----------|
| **架构模式** | 单体命令文件（命令即执行逻辑） | 命令+代理分离（命令仅做路由/协调） |
| **执行主体** | 命令自身包含全部工作流步骤 | 命令调用 `Task(subagent_type: "spec-*-agent")` 子代理 |
| **用户交互工具** | `AskUserQuestion` | `mcp______zhi`（三术 zhi） |
| **搜索工具** | `{{MCP_SEARCH_TOOL}}`（占位符） | `mcp__Grok_Search_Mcp__*` + 完整降级链 |
| **文件格式** | HTML 注释标记 `<!-- CCG:SPEC:*:START/END -->` | Markdown 标题层级结构 |
| **OPSX 路径** | `openspec/` 目录（OPSX 官方结构） | `.claude/spec/` 目录（自定义结构） |
| **多模型调用** | 直接 `codeagent-wrapper` Bash 命令 | 委托给子代理内部处理 |
| **网络搜索** | 无专门章节 | 每个文件都有「网络搜索规范」标准段落 |
| **description** | 中文描述 | 英文描述 |

---

## 1. spec-init.md 对比

### 基本信息

| 项目 | 上游 | 本地 |
|------|------|------|
| description | `初始化 OpenSpec (OPSX) 环境 + 验证多模型 MCP 工具` | `Initialize OpenSpec environment with multi-model MCP validation` |
| 文件包裹 | `<!-- CCG:SPEC:INIT:START/END -->` | 无 HTML 注释包裹 |
| 总行数 | ~107 行 | ~92 行 |

### 逐段对比

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|-----------|-------------|-------------|----------|----------|
| **Core Philosophy** | 3 条原则：OPSX+CCG 协作、工具就绪检查、快速失败 | 缺失 | **上游有，本地缺失** | 建议同步到子代理 `spec-init-agent` 中 |
| **Guardrails** | 4 条：检测 OS、按步执行、可操作错误信息、尊重现有配置 | 缺失 | **上游有，本地缺失** | 建议同步到子代理中 |
| **标题与用法说明** | 无 | `# /ccg:spec-init` + 使用方法 + 上下文说明 | **本地新增** | 本地架构需要，保留 |
| **角色定义** | 无 | `你是协调者，负责调用子代理完成 OpenSpec 环境初始化` | **本地新增** | 本地架构需要，保留 |
| **网络搜索规范** | 无 | 完整 GrokSearch 优先 + 降级链（5 步） | **本地新增** | 本地架构需要，保留 |
| **步骤 1：检测 OS** | `uname -s` 或环境变量检测 Windows | 缺失（委托给子代理） | **上游有，本地缺失** | 确认子代理是否包含 |
| **步骤 2：检查安装 OpenSpec** | 详细 4 步：`npx` 验证 → 全局安装 → 再验证 → `npx` 降级；强调 `openspec` 非 `opsx` | 缺失（委托给子代理） | **上游有，本地缺失** | 确认子代理是否包含 |
| **步骤 3：初始化 OPSX** | 检查已初始化 → `openspec init --tools claude` → 验证 3 个目录 | 缺失（委托给子代理） | **上游有，本地缺失** | 确认子代理是否包含 |
| **步骤 4：验证多模型 MCP** | `codeagent-wrapper` 版本检查 + Codex/Gemini 后端测试；含 `{{WORKDIR}}` 占位符和 `--gemini-model gemini-3-pro-preview` | 缺失（委托给子代理） | **上游有，本地缺失** | 确认子代理是否包含 |
| **步骤 5：验证上下文检索 MCP** | 可选步骤；检查 `{{MCP_SEARCH_TOOL}}` → 检查配置 → 3 级状态诊断 | 缺失（委托给子代理） | **上游有，本地缺失** | 确认子代理是否包含 |
| **步骤 6：汇总报告** | 7 行状态表 + Next Steps + Standalone Tools | 缺失（委托给子代理） | **上游有，本地缺失** | 确认子代理是否包含 |
| **执行工作流 - 步骤 1** | 无 | `Task({ subagent_type: "spec-init-agent", ... })` 调用子代理 | **本地新增** | 本地架构需要，保留 |
| **执行工作流 - 步骤 2** | 无 | `mcp______zhi` 确认结果，含预定义选项 3 个 | **本地新增** | 本地架构需要，保留 |
| **关键规则** | 无 | 3 条规则：必须用 Task 调用子代理、不修改源码、使用 zhi 确认 | **本地新增** | 本地架构需要，保留 |
| **Reference** | 5 条参考：OPSX CLI、OPSX Commands、CCG Workflow、Codex/Gemini MCP、Node.js 要求 | 缺失 | **上游有，本地缺失** | 建议同步到子代理或保留为注释 |

### 工具调用差异

| 工具/参数 | 上游 | 本地 |
|-----------|------|------|
| 用户交互 | 无明确工具（隐含直接输出） | `mcp______zhi` |
| 搜索工具 | `{{MCP_SEARCH_TOOL}}`（占位符） | 无（委托子代理） |
| 多模型测试 | `codeagent-wrapper --backend codex/gemini` | 委托子代理 |
| `--gemini-model` | `gemini-3-pro-preview` | 无（委托子代理） |
| `{{WORKDIR}}` | 有，需替换为绝对路径 | 无（使用 `$PWD`） |

---

## 2. spec-research.md 对比

### 基本信息

| 项目 | 上游 | 本地 |
|------|------|------|
| description | `需求 → 约束集（并行探索 + OPSX 提案）` | `Transform requirements into constraint sets via parallel exploration` |
| 文件包裹 | `<!-- CCG:SPEC:RESEARCH:START/END -->` | 无 HTML 注释包裹 |
| 总行数 | ~101 行 | ~93 行 |

### 逐段对比

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|-----------|-------------|-------------|----------|----------|
| **Core Philosophy** | 4 条：约束集而非信息堆、缩小方案空间、可验证成功判据、遵循 OPSX 规则 | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **Guardrails** | 6 条：必须先 enhance、按上下文边界而非角色分 subagent、自包含输出、用 `{{MCP_SEARCH_TOOL}}`、不做架构决策 | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **标题与用法说明** | 无 | `# /ccg:spec-research` + 使用方法 + 上下文 | **本地新增** | 保留 |
| **角色定义** | 无 | `你是协调者` | **本地新增** | 保留 |
| **网络搜索规范** | 无 | GrokSearch 优先 + 降级链 | **本地新增** | 保留 |
| **步骤 0：MANDATORY Enhance** | 详细 enhance 逻辑：分析意图、缺失信息、隐含假设、补全结构化需求；按 `/ccg:enhance` 逻辑执行 | 缺失（写在子代理 prompt 中简要提及 `增强需求（enhance）`） | **上游详细，本地简化** | 确认子代理是否包含完整 enhance 逻辑 |
| **步骤 1：Generate OPSX Change** | `openspec list --json` 检查 → `openspec new change` 创建 → 处理已存在情况 | 缺失（委托子代理） | **上游有，本地缺失** | 确认子代理 |
| **步骤 2：Initial Codebase Assessment** | `{{MCP_SEARCH_TOOL}}` 扫描 → 判断单/多目录 → 决策启用并行探索 | 缺失（委托子代理简要提及「检索项目上下文」） | **上游有，本地缺失** | 确认子代理 |
| **步骤 3：Define Exploration Boundaries** | 按上下文边界划分 3 个 subagent（用户域、认证、基础设施）；强调自包含 | 缺失 | **上游有，本地缺失** | 确认子代理 |
| **步骤 4：Parallel Multi-Model Exploration** | 完整 JSON 输出模板（8 字段）；Codex→后端、Gemini→前端 | 缺失 | **上游有，本地缺失** | 确认子代理 |
| **步骤 5：Aggregate and Synthesize** | 收集 → 合并为 4 类约束集（硬/软/依赖/风险） | 缺失（子代理 prompt 简要提及「识别硬约束、软约束、依赖关系、风险」） | **上游有，本地缺失** | 确认子代理 |
| **步骤 6：User Interaction** | `AskUserQuestion` 工具；分组提问、提供上下文、建议默认值 | 缺失 | **上游有，本地缺失** | 确认子代理 |
| **步骤 7：Finalize OPSX Proposal** | 转换为 OPSX 格式：Context + Requirements + Success Criteria；4 项确保事项 | 缺失（子代理 prompt 简要提及「生成约束集文件和提案」） | **上游有，本地缺失** | 确认子代理 |
| **步骤 8：Context Checkpoint** | 报告上下文使用；接近 80K tokens 建议 `/clear` | 缺失 | **上游有，本地缺失** | 可选同步 |
| **执行工作流** | 无 | `Task(subagent_type: "spec-research-agent")` + `mcp______zhi` 确认 | **本地新增** | 保留 |
| **关键规则** | 无 | 3 条 | **本地新增** | 保留 |
| **Reference** | 3 条：OPSX CLI、检查先前研究、`AskUserQuestion` 用于消歧 | 缺失 | **上游有，本地缺失** | 同步到子代理 |

### 工具调用差异

| 工具/参数 | 上游 | 本地 |
|-----------|------|------|
| 用户交互 | `AskUserQuestion` | `mcp______zhi` |
| 搜索工具 | `{{MCP_SEARCH_TOOL}}` | 无（委托子代理） |
| Enhance | 内联执行（按 `/ccg:enhance` 逻辑） | 委托子代理 |
| OPSX 目录 | `openspec/changes/<name>/` | `.claude/spec/constraints/` + `.claude/spec/proposals/` |

### 路径差异

| 路径用途 | 上游 | 本地 |
|----------|------|------|
| 约束集存储 | `openspec/changes/<name>/` | `.claude/spec/constraints/<name>.md` |
| 提案存储 | `openspec/changes/<name>/proposal.md` | `.claude/spec/proposals/<name>.md` |

---

## 3. spec-plan.md 对比

### 基本信息

| 项目 | 上游 | 本地 |
|------|------|------|
| description | `多模型分析 → 消除歧义 → 零决策可执行计划` | `Refine proposals into zero-decision executable plans` |
| 文件包裹 | `<!-- CCG:SPEC:PLAN:START/END -->` | 无 |
| 总行数 | ~111 行 | ~92 行 |

### 逐段对比

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|-----------|-------------|-------------|----------|----------|
| **Core Philosophy** | 4 条：消除所有决策点、解决所有歧义、多模型发现盲点、PBT 属性 | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **Guardrails** | 4 条：歧义未解不能进实施、多模型必须用、无法完全约束则升级、参考 `openspec/config.yaml` | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **标题与用法说明** | 无 | `# /ccg:spec-plan` + 使用方法 + 上下文 | **本地新增** | 保留 |
| **网络搜索规范** | 无 | GrokSearch + 降级链 | **本地新增** | 保留 |
| **步骤 1：Select Change** | `openspec list --json` + 用户确认 change ID + `openspec status --change` | 缺失（委托子代理简要提及「读取提案和约束集」） | **上游有，本地缺失** | 确认子代理 |
| **步骤 2：Multi-Model Analysis (PARALLEL)** | **极其详细**：MUST 两个 Bash 并行调用；完整 Codex/Gemini 命令模板；`run_in_background: true`；`{{WORKDIR}}` 占位符；`--gemini-model gemini-3-pro-preview`；`TaskOutput` 等待结果 | 缺失（委托子代理简要提及「多模型分析消除歧义」） | **上游有，本地缺失** | 核心差异！确认子代理是否包含并行调用逻辑 |
| **步骤 3：Uncertainty Elimination Audit** | Codex + Gemini 分别审查；Anti-Pattern 检测 3 项；Target Pattern 3 项；迭代直到 0 歧义 | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **步骤 4：PBT Property Extraction** | Codex + Gemini 提取属性；6 类 PBT 属性（交换律、幂等性、往返、不变量、单调性、边界） | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **步骤 5：Update OPSX Artifacts** | OpenSpec skills 生成 specs/design/tasks | 缺失 | **上游有，本地缺失** | 确认子代理 |
| **步骤 6：Context Checkpoint** | 80K tokens 建议 `/clear` | 缺失 | **上游有，本地缺失** | 可选 |
| **Exit Criteria** | 5 项清单（多模型完成、0 歧义、PBT 文档化、Artifacts 生成、用户批准） | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **执行工作流** | 无 | `Task(subagent_type: "spec-plan-agent")` + `mcp______zhi` 确认 | **本地新增** | 保留 |
| **关键规则** | 无 | 4 条：必须用 Task、仅写 `.claude/spec/`、零决策、zhi 确认 | **本地新增** | 保留 |
| **Reference** | 4 条：inspect change、list changes、search patterns、`AskUserQuestion` | 缺失 | **上游有，本地缺失** | 同步 |

### 工具调用差异

| 工具/参数 | 上游 | 本地 |
|-----------|------|------|
| 多模型并行 | `codeagent-wrapper` 两个 Bash 并行 + `run_in_background: true` + `TaskOutput` 等待 | 委托子代理 |
| `--gemini-model` | `gemini-3-pro-preview` | 无（委托子代理） |
| `{{WORKDIR}}` | 有 | 无（使用 `$PWD`） |
| 用户交互 | `AskUserQuestion` | `mcp______zhi` |
| OPSX 操作 | `openspec list/status --json` | 无 |

### 路径差异

| 路径用途 | 上游 | 本地 |
|----------|------|------|
| 输入提案 | `openspec/changes/<id>/` | `.claude/spec/proposals/` |
| 约束目录 | 内嵌于 OPSX change | `.claude/spec/constraints/` |
| 输出计划 | `openspec/changes/<id>/tasks.md` | `.claude/spec/plans/` |
| 配置参考 | `openspec/config.yaml` | 无 |

---

## 4. spec-impl.md 对比

### 基本信息

| 项目 | 上游 | 本地 |
|------|------|------|
| description | `按规范执行 + 多模型协作 + 归档` | `Execute changes via multi-model collaboration with spec compliance` |
| 文件包裹 | `<!-- CCG:SPEC:IMPL:START/END -->` | 无 |
| 总行数 | ~127 行 | ~109 行 |

### 逐段对比

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|-----------|-------------|-------------|----------|----------|
| **Core Philosophy** | 4 条：纯机械执行、外部模型输出仅为原型、严格范围控制、最小化文档 | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **Guardrails** | 4 条：绝不直接应用原型、必须要求 unified diff 格式、严守 tasks.md 范围、参考 config.yaml | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **标题与用法说明** | 无 | `# /ccg:spec-impl` + 使用方法 + 上下文 | **本地新增** | 保留 |
| **网络搜索规范** | 无 | GrokSearch + 降级链 | **本地新增** | 保留 |
| **步骤 1：Select Change** | `openspec list/status --json` + 用户确认 change ID | 缺失（本地步骤 1 是 `mcp______zhi` 确认执行计划） | **差异大** | 上游用 OPSX change，本地用 `.claude/spec/plans/` |
| **步骤 2：Apply OPSX Change** | 使用 OpenSpec skills 进入实施模式 | 本地步骤 2 是调用 `spec-impl-agent` 子代理 | **架构差异** | 各自保留 |
| **步骤 3：Identify Minimal Verifiable Phase** | 最小可验证阶段；不一次完成所有任务；控制上下文窗口 | 缺失（委托子代理简要提及「逐步实施」） | **上游有，本地缺失** | 同步到子代理 |
| **步骤 4：Route Tasks to Model** | 详细路由规则：Gemini→前端、Codex→后端；完整 `codeagent-wrapper` 命令模板；`{{WORKDIR}}`；`--gemini-model`；unified diff patch 格式 | 缺失 | **上游有，本地缺失** | 核心差异！同步到子代理 |
| **步骤 5：Rewrite Prototype** | 5 项重写规则（移除冗余、清晰命名、对齐风格、消除注释、无新依赖） | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **步骤 6：Side-Effect Review** | 4 项检查清单（范围、模块影响、依赖、接口） | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **步骤 7：Multi-Model Review (PARALLEL)** | 完整并行 Codex+Gemini 审查模板（correctness/security + maintainability/patterns）；`run_in_background: true`；`TaskOutput` 等待 | 缺失 | **上游有，本地缺失** | 核心差异！同步到子代理 |
| **步骤 8：Update Task Status** | `tasks.md` 标记完成 + 提交 | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **步骤 9：Context Checkpoint** | 80K tokens 检查；`/clear` 建议 | 缺失 | **上游有，本地缺失** | 可选 |
| **步骤 10：Archive on Completion** | 所有任务 `[x]` 后用 OpenSpec skills 归档 | 缺失（本地在结果确认中提供「回滚变更」选项） | **上游有，本地缺失** | 确认子代理 |
| **执行工作流** | 无 | 步骤 1（zhi 确认）→ 步骤 2（`spec-impl-agent`）→ 步骤 3（zhi 结果） | **本地新增** | 保留 |
| **Exit Criteria** | 4 项（所有任务完成、多模型审查通过、副作用审查确认、归档成功） | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **关键规则** | 无 | 3 条 | **本地新增** | 保留 |
| **Reference** | 3 条：task status、active changes、search patterns | 缺失 | **上游有，本地缺失** | 同步 |

### 本地独有特性

| 特性 | 说明 |
|------|------|
| **执行前确认** | 本地步骤 1 使用 `mcp______zhi` 确认执行计划，上游无此步骤 |
| **结果确认** | 本地步骤 3 使用 `mcp______zhi` 展示实施结果，含变更文件表格 |
| **回滚选项** | 本地在确认选项中包含「回滚变更」，上游无 |

### 工具调用差异

| 工具/参数 | 上游 | 本地 |
|-----------|------|------|
| 模型路由 | Route A: Gemini(前端), Route B: Codex(后端) + 完整命令 | 委托子代理 |
| 并行审查 | 两个 Bash 并行 + `run_in_background` + `TaskOutput` | 委托子代理 |
| `--gemini-model` | `gemini-3-pro-preview` | 无 |
| `{{WORKDIR}}` | 有 | 使用 `$PWD` |
| 归档 | OpenSpec skills | 委托子代理 |
| 执行确认 | 无 | `mcp______zhi`（执行前+执行后双重确认） |

---

## 5. spec-review.md 对比

### 基本信息

| 项目 | 上游 | 本地 |
|------|------|------|
| description | `双模型交叉审查（独立工具，随时可用）` | `Multi-model compliance review before archiving` |
| 文件包裹 | `<!-- CCG:SPEC:REVIEW:START/END -->` | 无 |
| 总行数 | ~122 行 | ~92 行 |

### 逐段对比

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|-----------|-------------|-------------|----------|----------|
| **Core Philosophy** | 4 条：双模型交叉验证、Critical 必须处理、验证 spec 约束+代码质量、独立工具不绑定归档 | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **Guardrails** | 3 条：Codex+Gemini 都必须完成、范围限定、参考 `openspec/AGENTS.md` | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **标题与用法说明** | 无 | `# /ccg:spec-review` + 使用方法 + 上下文 | **本地新增** | 保留 |
| **网络搜索规范** | 无 | GrokSearch + 降级链 | **本地新增** | 保留 |
| **步骤 1：Select Proposal** | `openspec list/status --json` + 用户确认 proposal ID | 缺失（委托子代理） | **上游有，本地缺失** | 确认子代理 |
| **步骤 2：Collect Artifacts** | `git diff` + 加载 spec 约束和 PBT 属性从 `openspec/changes/<id>/specs/` | 缺失（委托子代理简要提及「对照约束集验证合规性」） | **上游有，本地缺失** | 确认子代理 |
| **步骤 3：Multi-Model Review (PARALLEL)** | **极其详细**的并行审查：Codex 5 维度（Spec 合规、PBT、逻辑、安全、回归）+ Gemini 5 维度（模式一致性、可维护性、集成风险、前端安全、Spec 对齐）；完整 JSON 输出格式（severity/dimension/file/line/description/fix）；`run_in_background: true`；`TaskOutput` 等待 | 缺失（委托子代理简要提及「多模型交叉审查」） | **核心差异！上游有，本地缺失** | 同步到子代理 |
| **步骤 4：Synthesize Findings** | 合并 → 去重 → 分级（Critical/Warning/Info）；3 级详细定义 | 缺失（子代理简要提及「分类问题 Critical/Major/Minor」） | **上游有，本地缺失** | 注意分级名称差异：上游 Warning/Info vs 本地 Major/Minor |
| **步骤 5：Present Review Report** | 完整报告模板：按严重度分组 + Passed Checks 列表；含具体格式示例 | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **步骤 6：Decision Gate** | 两分支：Critical>0 不允许归档 + Critical=0 可归档；Warning>0 建议处理 | 缺失（本地在 zhi 选项中间接处理） | **上游有，本地缺失** | 确认子代理 |
| **步骤 7：Inline Fix Mode** | 可选修复模式：路由到对应模型 → unified diff → 重新审查受影响维度 → 循环直到 Critical=0 | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **步骤 8：Context Checkpoint** | 80K tokens 检查 | 缺失 | **上游有，本地缺失** | 可选 |
| **Exit Criteria** | 4 项（双模型完成、分类完成、0 Critical、用户决策） | 缺失 | **上游有，本地缺失** | 同步到子代理 |
| **执行工作流** | 无 | 步骤 1（`spec-review-agent`）→ 步骤 2（`mcp______zhi` 确认） | **本地新增** | 保留 |
| **关键规则** | 无 | 4 条（含归档后调用 `mcp______ji` 存储经验） | **本地新增** | 保留 |
| **Reference** | 4 条：view proposal、check constraints、view diff、archive 引用 | 缺失 | **上游有，本地缺失** | 同步 |

### 本地独有特性

| 特性 | 说明 |
|------|------|
| **归档操作** | 本地提供「归档完成」选项，将文件移入 `.claude/spec/archive/` |
| **知识沉淀** | 本地关键规则第 4 条：归档后调用 `mcp______ji` 存储项目约束经验 |
| **分级差异** | 上游用 Critical/Warning/Info，本地用 Critical/Major/Minor |

### Gemini `--gemini-model` 参数差异

| 文件 | 上游 | 本地 |
|------|------|------|
| spec-review.md | Gemini 调用**未带** `--gemini-model` 参数 | 无（委托子代理） |
| spec-plan.md | `--gemini-model gemini-3-pro-preview` | 无 |
| spec-impl.md | `--gemini-model gemini-3-pro-preview` | 无 |

> 注意：上游 spec-review.md 的 Gemini 调用缺少 `--gemini-model` 参数，这可能是上游的一个遗漏。

---

## 跨文件共性差异总结

### 1. 架构模式差异（所有 5 个文件共同）

| 差异点 | 上游 | 本地 |
|--------|------|------|
| 命令定位 | 命令 = 完整执行逻辑 | 命令 = 路由层（调用子代理） |
| 执行者 | 命令自身 | `spec-*-agent` 子代理 |
| 工作流细节 | 在命令文件中详尽描述 | 在子代理定义中描述 |

### 2. 所有文件共同缺失的上游内容

| 缺失内容 | 影响 | 建议 |
|----------|------|------|
| Core Philosophy 段落 | 子代理可能缺乏设计指导 | 同步到对应 agent 文件 |
| Guardrails 段落 | 子代理可能缺乏约束 | 同步到对应 agent 文件 |
| 详细工作流步骤 | 子代理可能执行粗糙 | 确认 agent 文件是否包含 |
| Exit Criteria | 无明确完成标准 | 同步到对应 agent 文件 |
| Reference 段落 | 缺乏参考命令 | 同步到对应 agent 文件 |
| Context Checkpoint | 无上下文管理 | 可选同步 |

### 3. 所有文件共同新增的本地内容

| 新增内容 | 说明 |
|----------|------|
| 标题 + 使用方法 + 上下文 | 本地命令规范化格式 |
| 角色定义（协调者） | 本地架构要求 |
| 网络搜索规范（GrokSearch） | 本地统一的搜索降级链 |
| `mcp______zhi` 确认流程 | 替代 `AskUserQuestion` |
| 关键规则 | 本地统一的规则约束 |

### 4. 工具映射总表

| 功能 | 上游工具 | 本地工具 |
|------|----------|----------|
| 用户交互 | `AskUserQuestion` | `mcp______zhi` |
| 代码检索 | `{{MCP_SEARCH_TOOL}}` | 委托子代理（内部用 `mcp__ace-tool__search_context` 等） |
| 多模型调用 | `codeagent-wrapper --backend codex/gemini` Bash 直调 | 委托子代理内部处理 |
| Gemini 模型 | `--gemini-model gemini-3-pro-preview` | 子代理内部处理 |
| 工作目录 | `{{WORKDIR}}` 占位符 | `$PWD` |
| OPSX 操作 | `openspec list/status/new --json` | 无（使用 `.claude/spec/` 目录） |
| 网络搜索 | 无 | `mcp__Grok_Search_Mcp__web_search` + 降级链 |
| 知识管理 | 无 | `mcp______ji` |

### 5. 路径体系差异

| 用途 | 上游路径 | 本地路径 |
|------|----------|----------|
| 约束/提案/任务 | `openspec/changes/<id>/` | `.claude/spec/constraints/` `.claude/spec/proposals/` `.claude/spec/plans/` |
| 审查结果 | 内嵌于 OPSX change | `.claude/spec/reviews/` |
| 归档 | `openspec/specs/` + archive | `.claude/spec/archive/` |
| 配置 | `openspec/config.yaml` | 无等价物 |

---

## 同步建议优先级

### P0（必须同步）

1. **确认子代理文件是否包含上游的详细工作流步骤**——这是最关键的验证点。如果子代理文件缺少这些内容，执行质量将严重下降。
2. **Core Philosophy + Guardrails** 必须存在于子代理中，否则执行缺乏约束。
3. **多模型并行调用逻辑**（`run_in_background: true` + `TaskOutput`）必须在某处实现。
4. **Exit Criteria** 每个阶段都需要明确完成标准。

### P1（建议同步）

5. **Gemini `--gemini-model` 参数** 在上游 spec-review.md 中缺失，应统一为 `gemini-3-pro-preview`。
6. **分级名称统一** 上游用 Critical/Warning/Info，本地用 Critical/Major/Minor——应统一。
7. **Reference 段落** 同步到子代理文件。
8. **Context Checkpoint**（80K tokens 管理）同步到子代理。

### P2（可选同步）

9. **description 语言** 上游中文，本地英文——建议统一为中文。
10. **HTML 注释标记** `<!-- CCG:SPEC:*:START/END -->`——本地已不使用，可忽略。
11. **OPSX vs .claude/spec/ 路径体系**——这是架构选择差异，两者不矛盾（本地是 OPSX 的 CCG 封装层）。

---

## 下一步行动

1. **读取 5 个 spec-*-agent 代理文件**，验证上游命令中的详细工作流步骤是否已迁移到子代理中
2. 根据验证结果，生成具体的补丁建议
3. 统一分级名称和工具参数
