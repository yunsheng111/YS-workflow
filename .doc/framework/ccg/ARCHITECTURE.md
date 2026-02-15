# CCG 系统架构

> 本文件是详细参考文档，不会自动加载。CLAUDE.md 的"按需查阅"表指引何时阅读本文件。
>
> **📊 可视化架构图**：查看 [ARCHITECTURE-VISUAL.md](./ARCHITECTURE-VISUAL.md) 获取完整的架构图和流程图。

---

## 快速导航

- [系统概览](#系统概览)
- [核心架构](#核心架构)
- [命令-代理映射表](#命令-代理映射表)
- [代理工具集矩阵](#代理工具集矩阵)
- [组件目录结构](#组件目录结构)
- [codeagent-wrapper 调用语法](#codeagent-wrapper-调用语法)
- [子代理工具集规范](#子代理工具集规范)
- [OpenSpec 约束驱动开发](#openspec-约束驱动开发)

**🎯 推荐阅读顺序**：
1. 新用户：系统概览 → 可视化架构图 → 命令-代理映射表
2. 开发者：核心架构 → 代理工具集矩阵 → codeagent-wrapper 调用语法
3. 故障排查：按需查阅表（CLAUDE.md 第 8 节）→ 对应章节

---

## 系统概览

```
用户输入 → Level 1 智能路由（增强 → 推荐命令 → 确认）
                              │
                    Level 2 命令调度（单命令/多命令串行/多命令并行）
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
               直接执行    子代理      外部模型
              (主代理)   (Task tool)  (codeagent-wrapper)
                              │         │
                        独立上下文   Codex / Gemini
                        返回结果     分析建议
```

CCG (Claude Code Gateway) 通过 **Level 0（用户输入）→ Level 1（智能路由）→ Level 2（命令调度）→ Level 3（代理执行）** 的四层模型组织工作。所有输入统一经过 Level 1 增强和路由，支持多命令串行/并行调度。每个子代理拥有独立的 skills、MCP、工作流。

**📊 查看完整的系统三层架构图**：[ARCHITECTURE-VISUAL.md - 系统三层架构图](./ARCHITECTURE-VISUAL.md#系统三层架构图)

## 核心架构

### 命令层（入口）

`commands/ccg/*.md` — 26 个 CCG 命令，用户通过 `/ccg:<name>` 触发。

命令注入到主代理的上下文中，定义：
- 工作流阶段（如 6 阶段结构化开发）
- 外部模型调用规范（Codex/Gemini via codeagent-wrapper）
- 用户交互模式（三术(zhi)确认、选项选择）

### 代理层（执行者）

`agents/ccg/*.md` — 子代理定义，通过 `Task(subagent_type="name")` 启动。

每个代理定义：
- **角色**：专项职责描述
- **工具集**：允许使用的 MCP 工具和内置工具
- **Skills**：可调用的技能
- **工作流**：执行步骤和输出格式

子代理在**独立上下文窗口**中运行，完成后将结果返回主代理。

#### 代理调用机制（约定式命名）

**重要**：CCG 使用**约定式命名**而非注册表机制：

1. **文件名匹配**：Task 工具通过文件名查找代理
   - `Task(subagent_type="analyze-agent")` → 查找 `agents/ccg/analyze-agent.md`
   - 如果文件不存在，回退到 `general-purpose` 代理

2. **无需注册**：不存在"代理注册表"或配置文件
   - 添加新代理：创建 `agents/ccg/<name>.md` 文件即可
   - 删除代理：删除对应文件即可

3. **命名规范**：
   - 代理文件名：`<name>-agent.md` 或 `<name>.md`
   - `subagent_type` 参数：必须与文件名（不含 `.md`）完全一致

4. **代理嵌套调用**：
   - 代理可以调用其他代理：`Task(subagent_type="planner")`
   - 嵌套深度无限制，但建议不超过 3 层
   - 每个代理在独立上下文中运行，互不干扰

#### Claude Code 平台限制：子代理工具访问限制

> **关键约束**：通过 `Task` 工具 spawn 的子代理**无法使用**以下工具：
> - `Task`（防止无限嵌套）
> - `TeamCreate` / `SendMessage` / `TeamDelete`（Agent Teams 协调工具）
>
> 这是 Claude Code 平台级设计决策，无法通过 frontmatter `tools:` 声明或环境变量绕过。
>
> 参考：[官方文档](https://docs.anthropic.com/en/docs/claude-code/sub-agents)、GitHub Issue #4182、#19077

**影响范围**：

| 场景 | 正确做法 | 错误做法 |
|------|----------|----------|
| 需要 Agent Teams 工具 | 命令内执行（主代理直接执行） | Task 调用子代理 |
| 需要 spawn 其他子代理 | 命令内执行或主代理编排 | 子代理内部调用 Task |
| 纯分析/文件操作 | Task 调用子代理（正常） | — |

**受影响的命令**（必须使用"命令内执行"模式）：
- `ccg:team-exec` — 需要 TeamCreate + Task(team_name) + SendMessage
- `ccg:team-research` — 需要 Task 调用 Codex/Gemini 并行探索
- `ccg:team-plan` — 需要 Task 调用 Codex/Gemini 并行分析
- `ccg:team-review` — 需要 Task 调用 Codex/Gemini 双模型审查

### 提示词层（外部模型角色）

`.ccg/prompts/{codex,gemini,claude}/*.md` — 外部模型的角色提示词。

通过 codeagent-wrapper 传递给 Codex/Gemini，定义其分析视角和输出格式。

### 协作流程

```
1. 用户输入需求（自然语言或命令+自然语言）
2. Level 1 智能路由：
   a. 增强用户需求（mcp______enhance）
   b. 检测输入类型（路径 A: 纯自然语言 / 路径 B: 命令+自然语言）
   c. 推荐一个或多个 CCG 命令（附理由、串行/并行标注）
   d. 用户确认推荐方案
3. Level 2 命令调度：根据确认的命令列表调用对应代理
   a. 单命令 → 直接调用代理
   b. 多命令串行 → 按序调用，前序输出作为后序输入
   c. 多命令并行 → 同时启动多个代理
4. Level 3 代理执行：代理按需加载 MCP/Skills/子代理/Agent Teams/外部模型
5. 主代理整合结果并实施代码变更
6. 使用三术(zhi)确认关键决策
```

**📊 查看完整的命令调用流程图**：[ARCHITECTURE-VISUAL.md - 命令调用流程图](./ARCHITECTURE-VISUAL.md#命令调用流程图)

---

## 命令-代理映射表

完整的 26 个 CCG 命令到代理的映射关系：

| # | CCG 命令 | 执行方式 | 调用的代理 | 说明 |
|---|----------|----------|------------|------|
| 1 | `ccg:workflow` | Task 调用 | `fullstack-agent` | 6 阶段全栈开发工作流 |
| 2 | `ccg:plan` | Task 调用 | `planner` | WBS 任务分解规划 |
| 3 | `ccg:execute` | Task 调用 | `execute-agent` | 严格按计划执行 |
| 4 | `ccg:frontend` | Task 调用 | `frontend-agent` | 前端专项开发（Gemini 主导） |
| 5 | `ccg:backend` | Task 调用 | `backend-agent` | 后端专项开发（Codex 主导） |
| 6 | `ccg:feat` | Task 调用 | `fullstack-light-agent` | 智能功能开发（自动识别前/后/全栈） |
| 7 | `ccg:analyze` | Task 调用 | `analyze-agent` | 多模型技术分析 |
| 8 | `ccg:debug` | Task 调用 | `debug-agent` | 假设驱动缺陷定位 |
| 9 | `ccg:optimize` | Task 调用 | `optimize-agent` | 性能分析与优化 |
| 10 | `ccg:test` | Task 调用 | `test-agent` | 测试用例生成 + E2E |
| 11 | `ccg:review` | Task 调用 | `review-agent` | 多维度代码审查 |
| 12 | `ccg:commit` | Task 调用 | `commit-agent` | Conventional Commits 生成 |
| 13 | `ccg:enhance` | 直接执行 | - | 主代理调用 enhance 工具 |
| 14 | `ccg:init` | Task 调用 | `init-architect` | 项目 CLAUDE.md 初始化 |
| 15 | `ccg:rollback` | 直接执行 | - | 主代理交互式 Git 回滚 |
| 16 | `ccg:clean-branches` | 直接执行 | - | 主代理清理 Git 分支 |
| 17 | `ccg:worktree` | 直接执行 | - | 主代理管理 Git Worktree |
| 18 | `ccg:spec-init` | Task 调用 | `spec-init-agent` | OpenSpec 环境初始化 |
| 19 | `ccg:spec-research` | Task 调用 | `spec-research-agent` | 需求转约束集 |
| 20 | `ccg:spec-plan` | Task 调用 | `spec-plan-agent` | 约束集转零决策计划 |
| 21 | `ccg:spec-impl` | Task 调用 | `spec-impl-agent` | 按计划执行 + 多模型审计 |
| 22 | `ccg:spec-review` | Task 调用 | `spec-review-agent` | 合规审查 + 归档 |
| 23 | `ccg:team-research` | 外部模型 + 主代理 | - | Agent Teams 需求研究（约束集） |
| 24 | `ccg:team-plan` | 外部模型 + 主代理 | - | Agent Teams 并行规划（零决策计划） |
| 25 | `ccg:team-exec` | Agent Teams | - | 并行 spawn Builder teammates 实施 |
| 26 | `ccg:team-review` | 外部模型 + 主代理 | - | Agent Teams 双模型交叉审查 |

**执行方式说明**：
- **Task 调用**（18 个）：使用 `Task(subagent_type="xxx")` 启动子代理，独立上下文执行
- **直接执行**（4 个）：主代理直接完成，无需子代理或外部模型
- **命令内执行**（4 个）：主代理读取代理指令文件作为参考，直接执行工作流。因 Claude Code 平台限制（子代理无法使用 Task/TeamCreate/SendMessage），这些命令不能通过 Task 调用子代理

**📊 查看工具选择决策树**：[ARCHITECTURE-VISUAL.md - 工具选择决策树](./ARCHITECTURE-VISUAL.md#工具选择决策树)

---

## 代理工具集矩阵

20 个子代理的工具集配置和核心职责：

| 代理 | MCP 工具数量 | Skills 数量 | 核心职责 | 特殊能力 |
|------|-------------|------------|----------|----------|
| **fullstack-agent** | 10 | 3 | 复杂多模块全栈（6 阶段） | Chrome DevTools + GitHub MCP |
| **planner** | 4 | 0 | WBS 任务分解 | Grok Search |
| **execute-agent** | 5 | 0 | 严格按计划执行 | Chrome DevTools 验证 |
| **frontend-agent** | 9 | 2 | 组件/页面/样式开发 | Chrome DevTools + UI/UX 工具链 |
| **backend-agent** | 5 | 1 | API/服务/数据库开发 | database-designer |
| **fullstack-light-agent** | 7 | 2 | 中等复杂度单模块全栈 | 快速迭代 |
| **analyze-agent** | 6 | 0 | 多模型技术可行性分析 | enhance + uiux_suggest |
| **debug-agent** | 6 | 0 | 假设驱动缺陷定位 | Chrome DevTools 诊断 |
| **optimize-agent** | 6 | 0 | 性能分析与优化 | Chrome DevTools 性能追踪 |
| **test-agent** | 6 | 0 | 测试用例生成 + E2E | Chrome DevTools 交互测试 |
| **review-agent** | 6 | 0 | 多维度代码审查 | Chrome DevTools 视觉/A11y 审查 |
| **commit-agent** | 2 | 1 | Conventional Commits 生成 | git-workflow |
| **ui-ux-designer** | 8 | 0 | UI/UX 设计文档生成 | Chrome DevTools 动态交互审查 |
| **init-architect** | 0 | 0 | 项目 CLAUDE.md 初始化 | 文件扫描 |
| **get-current-datetime** | 0 | 0 | 获取当前日期时间 | 时间工具 |
| **spec-init-agent** | 3 | 0 | OpenSpec 环境初始化 | 约束驱动 |
| **spec-research-agent** | 5 | 0 | 需求转约束集 | enhance + Grok Search |
| **spec-plan-agent** | 4 | 0 | 约束集转可执行计划 | 零决策规划 |
| **spec-impl-agent** | 4 | 0 | 计划执行 + 审计 | 多模型审计 |
| **spec-review-agent** | 4 | 0 | 合规审查 | Critical 必须修复 |

**工具集通用配置**：
- **ace-tool**：18 个代理使用（代码检索首选）
- **zhi**：18 个代理使用（关键决策确认）
- **ji**：18 个代理使用（知识存储）
- **Grok search**：15 个代理使用（网络搜索）
- **Chrome DevTools**：8 个代理使用（浏览器自动化）

**📊 查看完整的代理工具集配置矩阵**：[ARCHITECTURE-VISUAL.md - 代理工具集配置矩阵](./ARCHITECTURE-VISUAL.md#代理工具集配置矩阵)

## 组件目录结构

```
.claude/
├── CLAUDE.md                  # 全局提示词（所有会话自动加载）
├── settings.json              # MCP + 环境变量 + 权限
├── commands/ccg/              # 26 个 CCG 命令
│   ├── workflow.md            #   全栈工作流（6阶段）
│   ├── review.md              #   代码审查（双模型交叉验证）
│   ├── debug.md               #   调试（竞争假设）
│   ├── feat.md                #   功能开发（智能路由）
│   ├── plan.md                #   协作规划
│   ├── execute.md             #   计划执行
│   ├── analyze.md             #   技术分析
│   ├── frontend.md            #   前端专项（Gemini 主导）
│   ├── backend.md             #   后端专项（Codex 主导）
│   ├── test.md                #   测试生成
│   ├── optimize.md            #   性能优化
│   ├── commit.md              #   智能提交
│   ├── enhance.md             #   Prompt 增强
│   ├── init.md                #   项目初始化
│   ├── rollback.md            #   Git 回滚
│   ├── clean-branches.md      #   分支清理
│   ├── worktree.md            #   Git Worktree
│   ├── spec-*.md              #   OpenSpec 约束驱动开发（5 个）
│   └── team-*.md              #   Agent Teams 并行开发（4 个）
├── agents/ccg/                # 子代理定义（20 个）
│   ├── init-architect.md      #   项目初始化扫描
│   ├── planner.md             #   任务规划（WBS 方法论）
│   ├── ui-ux-designer.md      #   UI/UX 设计
│   ├── get-current-datetime.md #  时间工具
│   ├── analyze-agent.md       #   技术分析
│   ├── frontend-agent.md      #   前端开发
│   ├── backend-agent.md       #   后端开发
│   ├── fullstack-light-agent.md # 全栈轻量开发
│   ├── fullstack-agent.md     #   全栈复杂开发（6阶段）
│   ├── execute-agent.md       #   计划执行
│   ├── review-agent.md        #   代码审查
│   ├── debug-agent.md         #   调试
│   ├── test-agent.md          #   测试
│   ├── optimize-agent.md      #   性能优化
│   ├── commit-agent.md        #   Git 提交
│   ├── spec-init-agent.md     #   OpenSpec 环境初始化
│   ├── spec-research-agent.md #   OpenSpec 约束研究
│   ├── spec-plan-agent.md     #   OpenSpec 零决策规划
│   ├── spec-impl-agent.md     #   OpenSpec 实施
│   └── spec-review-agent.md   #   OpenSpec 合规审查
├── .ccg/                      # CCG 运行时目录
│   ├── config.toml            #   运行时配置（版本、路由、路径）
│   └── prompts/               #   外部模型角色提示词
│       ├── codex/             #     6 个角色（analyzer/architect/reviewer/debugger/tester/optimizer）
│       ├── gemini/            #     7 个角色（同上 + frontend）
│       └── claude/            #     6 个角色
├── .doc/                      # 工作流文档产出目录
│   ├── framework/ccg/         #   架构文档（ARCHITECTURE.md、ARCHITECTURE-VISUAL.md）
│   ├── workflow/              #   六阶段工作流
│   │   ├── wip/               #     进度追踪（research/ideation/execution/review/acceptance）
│   │   ├── research/          #     正式研究产出
│   │   ├── plans/             #     正式计划文件
│   │   ├── progress/          #     进度追踪
│   │   └── archive/           #     归档
│   ├── agent-teams/           #   Agent Teams 工作流
│   │   ├── wip/               #     进度追踪（research/planning/execution/review）
│   │   ├── research/          #     正式研究产出
│   │   ├── plans/             #     正式计划文件
│   │   ├── reviews/           #     正式审查报告
│   │   ├── progress/          #     进度追踪
│   │   └── archive/           #     归档
│   ├── spec/                  #   OpenSpec 工作流
│   │   ├── wip/               #     进度追踪（research/planning/execution/review）
│   │   ├── constraints/       #     正式约束集
│   │   ├── proposals/         #     正式提案
│   │   ├── plans/             #     正式计划文件
│   │   ├── reviews/           #     审查报告
│   │   ├── progress/          #     进度追踪
│   │   ├── templates/         #     模板
│   │   └── archive/           #     归档
│   └── common/                #   通用规划
│       ├── wip/               #     进度追踪（research/planning/execution）
│       ├── plans/             #     正式计划文件
│       ├── reviews/           #     审查报告
│       ├── progress/          #     进度追踪
│       └── archive/           #     归档
└── bin/
    └── codeagent-wrapper.exe  # 外部模型调用桥接
```

## codeagent-wrapper 调用语法

### 新会话

```bash
~/.claude/bin/codeagent-wrapper.exe --backend <codex|gemini> - "$PWD" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
需求：<需求描述>
上下文：<项目上下文>
</TASK>
OUTPUT: <期望输出格式>
EOF
```

### 复用会话

```bash
~/.claude/bin/codeagent-wrapper.exe --backend <codex|gemini> resume <SESSION_ID> - "$PWD" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
需求：<需求描述>
上下文：<项目上下文>
</TASK>
OUTPUT: <期望输出格式>
EOF
```

### 角色提示词映射

| 阶段 | Codex | Gemini |
|------|-------|--------|
| 分析 | `.ccg/prompts/codex/analyzer.md` | `.ccg/prompts/gemini/analyzer.md` |
| 规划 | `.ccg/prompts/codex/architect.md` | `.ccg/prompts/gemini/architect.md` |
| 审查 | `.ccg/prompts/codex/reviewer.md` | `.ccg/prompts/gemini/reviewer.md` |
| 调试 | `.ccg/prompts/codex/debugger.md` | `.ccg/prompts/gemini/debugger.md` |
| 测试 | `.ccg/prompts/codex/tester.md` | `.ccg/prompts/gemini/tester.md` |
| 优化 | `.ccg/prompts/codex/optimizer.md` | `.ccg/prompts/gemini/optimizer.md` |
| 前端 | — | `.ccg/prompts/gemini/frontend.md` |

### 调用约束

- 并行调用：`run_in_background: true`，用 `TaskOutput` 等待（`timeout: 600000`）
- 每次调用返回 `SESSION_ID`，后续用 `resume <SESSION_ID>` 复用上下文
- 等所有模型返回后才进入下一阶段
- 超时后继续用 `TaskOutput` 轮询，用 `mcp______zhi` 询问用户是否 Kill（不自动终止）

## 子代理工具集规范

每个子代理可使用的工具：

### MCP 工具

| 工具 | 用途 | 哪些代理使用 |
|------|------|-------------|
| `mcp__ace-tool__search_context` | 代码检索 | 所有代理 |
| `mcp__ace-tool__enhance_prompt` | Prompt 增强 | analyze-agent |
| `mcp______zhi` | 用户确认 | 需要用户交互的代理 |
| `mcp______ji` | 知识存储 | 所有代理 |
| `mcp______sou` | 备用代码搜索 | 所有代理（ace-tool 不可用时） |
| `mcp______context7` | 框架文档 | frontend/backend/fullstack 代理 |
| `mcp__Grok_Search_Mcp__web_search` | 网络搜索 | analyze/debug/optimize/fullstack/fullstack-light/backend/review/spec-research/frontend/test/execute/planner/spec-plan/spec-impl/spec-review/ui-ux-designer 代理 |
| `mcp__Grok_Search_Mcp__web_fetch` | 网页抓取 | 同上（需要全文时配合 web_search 使用） |
| Chrome DevTools MCP | 浏览器操作 | frontend-agent, fullstack-agent, debug-agent, optimize-agent, ui-ux-designer, test-agent, execute-agent, review-agent |

### 内置工具

| 工具 | 用途 |
|------|------|
| Read / Write / Edit | 文件操作 |
| Glob / Grep | 文件搜索 |
| Bash | 命令执行（构建、测试、Git） |
| Task | 启动嵌套子代理 |

## OpenSpec 约束驱动开发

高复杂度 + 零决策执行的结构化工作流：

```
spec-init → spec-research → spec-plan → spec-impl → spec-review
```

---

## Agent 合规执行流程

### 概述

CCG 框架通过 **Execution Ledger + PreToolUse Hook** 双层机制确保 Agent 执行流程的合规性、可追溯性和安全性。

### 核心组件

#### 1. Execution Ledger（执行账本）

**位置**: `.ccg/runtime/execution-ledger.cjs`

**职责**: 记录 Agent 执行过程中的关键事件和状态转换。

**状态模型**:
- `INIT` - 初始化
- `RUNNING` - 运行中
- `DEGRADED` - 降级模式（部分工具不可用）
- `FAILED` - 失败
- `SUCCESS` - 成功

**事件类型**:
- `docs_read` - 读取 collab Skill 文档
- `model_called` - 调用 Codex/Gemini
- `session_captured` - 提取 SESSION_ID
- `zhi_confirmed` - 用户确认关键决策
- `degraded` - 降级事件（记录原因）

**API**:
```javascript
ExecutionLedger.init(taskId)                    // 初始化 Ledger
ExecutionLedger.append(taskId, event)           // 追加事件
ExecutionLedger.bindSession(taskId, sessionId)  // 绑定 SESSION_ID
ExecutionLedger.transition(taskId, newState)    // 状态转换
ExecutionLedger.get(taskId)                     // 获取 Ledger
ExecutionLedger.cleanup(taskId)                 // 清理 Ledger
```

#### 2. PreToolUse Hook 体系

**执行顺序**（按 `settings.json` 配置）:

1. **ccg-path-validator.cjs** - 路径白名单校验
   - 检查文件路径是否在白名单内
   - 白名单：`agents/`, `.ccg/`, `hooks/`, `skills/`, `commands/`
   - 非白名单路径拒绝写入

2. **ccg-execution-guard.cjs** - Ledger 状态与事件链校验
   - 校验 Ledger 状态（仅允许 SUCCESS/DEGRADED）
   - 校验事件链完整性（docs_read → model_called → session_captured → zhi_confirmed）
   - 校验 SESSION_ID 绑定（Ledger 中的 SESSION_ID 必须与文档中的一致）
   - DEGRADED 状态必须包含降级事件

3. **ccg-dual-model-validator.cjs** - 双模型调用证据校验
   - 检查受保护目录的写入是否包含双模型证据（Codex/Gemini）
   - 受保护目录：`.doc/workflow/`, `.doc/agent-teams/`, `.doc/spec/`, `.doc/common/` 的正式产出目录
   - 白名单豁免：`wip/` 目录、`LITE_MODE=true`、DEGRADED 状态

4. **ccg-commit-interceptor.cjs** - Git 提交与 Bash 重定向拦截
   - 拦截 bare `git commit` 命令（必须通过 `/ccg:commit`）
   - 检测 Bash 重定向写文件（`>`, `>>`, `tee`）
   - 重定向到受保护目录时校验双模型证据

### 合规流程示例

#### 正常流程（SUCCESS）

```
1. Agent 初始化
   ExecutionLedger.init(taskId)
   → state: INIT

2. 读取 collab Skill 文档
   ExecutionLedger.append(taskId, { type: 'docs_read', data: { file: 'collab.md' } })

3. 调用 Codex/Gemini
   ExecutionLedger.append(taskId, { type: 'model_called', data: { backend: 'codex' } })

4. 提取 SESSION_ID
   ExecutionLedger.append(taskId, { type: 'session_captured', data: { session_id: 'xxx' } })
   ExecutionLedger.bindSession(taskId, 'xxx')

5. 用户确认
   ExecutionLedger.append(taskId, { type: 'zhi_confirmed', data: { decision: 'approve' } })

6. 状态转换
   ExecutionLedger.transition(taskId, 'SUCCESS')
   → state: SUCCESS

7. 写入正式产出
   Write tool → PreToolUse Hook 链路：
   - ccg-path-validator: ✅ 路径在白名单外（正式产出目录）
   - ccg-execution-guard: ✅ state=SUCCESS, 事件链完整, SESSION_ID 匹配
   - ccg-dual-model-validator: ✅ 文档包含 Codex/Gemini 证据
   - ccg-commit-interceptor: N/A（非 Bash 工具）
   → 写入成功
```

#### 降级流程（DEGRADED）

```
1. Agent 初始化
   ExecutionLedger.init(taskId)

2. 尝试调用外部模型失败
   ExecutionLedger.append(taskId, { type: 'degraded', data: { reason: 'Codex timeout' } })
   ExecutionLedger.transition(taskId, 'DEGRADED')
   → state: DEGRADED

3. 使用 Claude 自增强替代
   ExecutionLedger.append(taskId, { type: 'fallback', data: { method: 'claude-native' } })

4. 用户确认降级方案
   ExecutionLedger.append(taskId, { type: 'zhi_confirmed', data: { decision: 'approve_degraded' } })

5. 写入正式产出
   Write tool → PreToolUse Hook 链路：
   - ccg-path-validator: ✅ 路径在白名单外
   - ccg-execution-guard: ✅ state=DEGRADED, 包含降级事件
   - ccg-dual-model-validator: ✅ DEGRADED 状态豁免双模型证据
   - ccg-commit-interceptor: N/A
   → 写入成功（降级模式）
```

#### 拒绝场景

**场景 1: 缺少事件链**
```
Write tool → ccg-execution-guard
→ ❌ deny: 缺少必需事件: model_called, session_captured
```

**场景 2: SESSION_ID 不匹配**
```
Write tool → ccg-execution-guard
→ ❌ deny: SESSION_ID 不匹配: Ledger=abc-123, Document=xyz-789
```

**场景 3: 缺少双模型证据**
```
Write tool → ccg-dual-model-validator
→ ❌ deny: 受保护目录缺少双模型调用证据（Codex/Gemini）
```

**场景 4: Bash 重定向到受保护目录**
```
Bash: echo "test" > .doc/workflow/plans/plan.md
→ ccg-commit-interceptor
→ ❌ deny: Bash 重定向到受保护目录被拒绝
```

### 合规指标

**查看完整的 KPI 定义**: [COMPLIANCE-METRICS.md](./COMPLIANCE-METRICS.md)

**核心指标**:
- **合规率**: ≥ 95%（包含 Ledger 事件上报的代理占比）
- **zhi 覆盖率**: 100%（包含 Level 1 门禁的关键命令占比）
- **Hook 激活率**: 100%（已部署 Hook 占比）
- **误拦截率**: ≤ 5%（合法操作被错误拦截的比例）
- **伪造率**: 0%（伪造 SESSION_ID 或证据的尝试）

**一键检查**:
```bash
npm run check-compliance
```

### 回滚与恢复

**场景 1: Hook 误拦截导致无法写入**

1. 检查拦截原因（Hook 返回的 `reason` 字段）
2. 如果是误拦截：
   - 临时设置 `LITE_MODE=true` 环境变量
   - 或将文件写入 `wip/` 目录
3. 修复后移动到正式目录

**场景 2: Ledger 状态异常**

1. 检查 Ledger 状态：
   ```javascript
   const ledger = ExecutionLedger.get(taskId);
   console.log(ledger.state, ledger.events);
   ```
2. 如果状态为 FAILED：
   - 分析失败原因（最后一个事件）
   - 清理 Ledger：`ExecutionLedger.cleanup(taskId)`
   - 重新初始化：`ExecutionLedger.init(taskId)`

**场景 3: SESSION_ID 丢失**

1. 从外部模型输出中重新提取 SESSION_ID
2. 手动绑定：
   ```javascript
   ExecutionLedger.bindSession(taskId, sessionId);
   ```
3. 补充 `session_captured` 事件：
   ```javascript
   ExecutionLedger.append(taskId, {
     type: 'session_captured',
     data: { session_id: sessionId }
   });
   ```

### 最佳实践

1. **Multi-model 代理必须上报 Ledger 事件**
   - 在代理文档中增加"Ledger 事件上报"章节
   - 明确列出上报的事件类型

2. **关键命令必须包含 Level 1 门禁**
   - enhance → zhi 确认 → search_context
   - 包含"未完成 Level 1 禁止进入 Level 2"硬门禁

3. **降级时必须记录原因**
   - 使用 `degraded` 事件类型
   - 在 `data.reason` 中说明降级原因

4. **SESSION_ID 必须一致**
   - Ledger 中的 SESSION_ID 必须与文档中的一致
   - 使用 `bindSession()` API 绑定

5. **定期运行合规检查**
   - 每次重大变更后运行 `npm run check-compliance`
   - 确保合规率 ≥ 95%

每个阶段对应 `commands/ccg/spec-*.md` 命令。适用于需求复杂、约束众多、需要严格合规审查的场景。
