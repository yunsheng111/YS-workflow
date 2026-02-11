# CCG 系统架构

> 本文件是详细参考文档，不会自动加载。CLAUDE.md 的"按需查阅"表指引何时阅读本文件。

## 系统概览

```
用户 → /ccg:<name> 命令 → 注入到主代理（Claude）
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
               直接执行    子代理      外部模型
              (简单任务)  (Task tool)  (codeagent-wrapper)
                              │         │
                        独立上下文   Codex / Gemini
                        返回结果     分析建议
```

CCG (Claude Code Gateway) 通过**命令 → 主代理 → 动态分配子代理**的方式组织工作。每个子代理拥有独立的 skills、MCP、工作流。

## 核心架构

### 命令层（入口）

`commands/ccg/*.md` — 22 个 CCG 命令，用户通过 `/ccg:<name>` 触发。

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

### 提示词层（外部模型角色）

`.ccg/prompts/{codex,gemini,claude}/*.md` — 外部模型的角色提示词。

通过 codeagent-wrapper 传递给 Codex/Gemini，定义其分析视角和输出格式。

### 协作流程

```
1. 用户运行 /ccg:<name> 命令
2. 命令注入到主代理上下文
3. 主代理根据任务复杂度选择执行路径：
   a. 简单任务 → 主代理直接完成
   b. 需要独立上下文 → Task tool 启动子代理
   c. 需要外部模型视角 → codeagent-wrapper 调用 Codex/Gemini
   d. 复杂任务 → 组合使用 b + c
4. 子代理/外部模型返回结果
5. 主代理整合结果并实施代码变更
6. 使用三术(zhi)确认关键决策
```

## 组件目录结构

```
.claude/
├── CLAUDE.md                  # 全局提示词（所有会话自动加载）
├── settings.json              # MCP + 环境变量 + 权限
├── commands/ccg/              # 22 个 CCG 命令
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
│   └── spec-*.md              #   OpenSpec 约束驱动开发（5 个）
├── agents/ccg/                # 子代理定义
│   ├── init-architect.md      #   项目初始化扫描
│   ├── planner.md             #   任务规划（WBS 方法论）
│   ├── ui-ux-designer.md      #   UI/UX 设计
│   ├── get-current-datetime.md #  时间工具
│   ├── analyze-agent.md       #   技术分析
│   ├── frontend-agent.md      #   前端开发
│   ├── backend-agent.md       #   后端开发
│   ├── fullstack-light-agent.md # 全栈轻量开发
│   ├── fullstack-agent.md     #   全栈复杂开发
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
├── .ccg/
│   ├── config.toml            # CCG 运行时配置
│   ├── ARCHITECTURE.md        # 本文件
│   └── prompts/               # 外部模型角色提示词
│       ├── codex/             #   6 个角色（analyzer/architect/reviewer/debugger/tester/optimizer）
│       ├── gemini/            #   7 个角色（同上 + frontend）
│       └── claude/            #   6 个角色
└── bin/
    └── codeagent-wrapper.exe  # 外部模型调用桥接
```

## codeagent-wrapper 调用语法

### 新会话

```bash
C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe --backend <codex|gemini> - "$PWD" <<'EOF'
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
C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe --backend <codex|gemini> resume <SESSION_ID> - "$PWD" <<'EOF'
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

每个阶段对应 `commands/ccg/spec-*.md` 命令。适用于需求复杂、约束众多、需要严格合规审查的场景。
