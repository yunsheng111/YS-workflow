# Team Plan: CCG 架构补齐/增强/优化方案（混合策略版）

## 概述

基于 7 组对比报告（79 个文件，137KB 详细分析），采用 **Agent Teams + Subagents 混合策略** 实施 CCG 架构的系统性补齐、增强和优化。

### 混合策略设计理念

参考 [agent-teams-vs-subagents-analysis.md](./agent-teams-vs-subagents-analysis.md) 的"侦察-突击-扫尾"模式：

```
Phase 1: 侦察（Subagents）     → 低成本并行扫描，产出约束集
Phase 2: 突击（Agent Teams）   → 高协作并行实施，实时对齐接口
Phase 3: 扫尾（Subagents）     → 独立验证审查，pass/fail 判定
```

---

## 执行架构

### Phase 1: 侦察阶段（Subagents 并行探索）

**目标**：快速扫描代码库，确认每个任务的实际文件范围和修改点

**执行方式**：使用 `Task` 工具 spawn 3 个 Explore 子代理并行扫描

```
┌─────────────────────────────────────────────────────────┐
│  Phase 1: 侦察（~5 min，低 Token 成本）                   │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Explore-A   │  │  Explore-B   │  │  Explore-C   │  │
│  │  扫描命令文件  │  │  扫描代理文件  │  │  扫描 prompts │  │
│  │  T1/T2/T3/T4 │  │  T7/T12      │  │  T8          │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                │                │            │
│         └────────────────┼────────────────┘            │
│                          ↓                             │
│              产出：侦察报告（文件清单 + 修改点）           │
└─────────────────────────────────────────────────────────┘
```

**产出物**：`~/.claude/tasks/ccg-upgrade/recon-report.md`

---

### Phase 2: 突击阶段（Agent Teams 并行实施）

**目标**：6 个 Teammates 并行修改文件，通过共享任务列表协调，避免冲突

**执行方式**：
1. `TeamCreate` 创建 `ccg-upgrade` 团队
2. `Task` spawn 6 个 Teammates（带 `team_name: "ccg-upgrade"`）
3. 队长通过 `SendMessage` 协调，队员通过任务列表自主认领

```
┌─────────────────────────────────────────────────────────┐
│  Phase 2: 突击（Agent Teams 并行实施）                    │
│                                                         │
│  Team Lead (Delegate Mode)                              │
│       │                                                 │
│       ├── Teammate-A: T1 resume 语法修复                │
│       ├── Teammate-B: T2+T3 LITE_MODE + GEMINI_MODEL   │
│       ├── Teammate-C: T4+T11 WORKDIR + init.md MCP     │
│       ├── Teammate-D: T5 team-exec + team-plan 增强    │
│       ├── Teammate-E: T6 team-research + team-review   │
│       └── Teammate-F: T7 spec-* Core Philosophy        │
│                                                         │
│  共享任务列表：~/.claude/tasks/ccg-upgrade/              │
│  通信机制：SendMessage 点对点 + 广播                     │
└─────────────────────────────────────────────────────────┘
```

**Layer 1 任务分配**（无依赖，可并行）：

| Teammate | 任务 | 文件范围 | 预计修改量 |
|----------|------|----------|-----------|
| A | T1: resume 语法修复 | workflow.md | 1-2 处 |
| B | T2+T3: LITE_MODE + GEMINI_MODEL | 10 个命令文件 | 每文件 2-3 处 |
| C | T4+T11: WORKDIR + init.md MCP | 15+ 文件 | 每文件 1-2 处 |
| D | T5: team-exec + team-plan 增强 | 2 文件 | 新增章节 |
| E | T6: team-research + team-review 增强 | 2 文件 | 新增章节 |
| F | T7: spec-* Core Philosophy | 5 文件 | 新增章节 |

**Layer 2 任务**（依赖 Layer 1，串行执行）：

| 任务 | 依赖 | 执行者 |
|------|------|--------|
| T8: enhance.md + prompts 引用 | T2/T3 | Teammate-B 或新 spawn |
| T10: 分级名称统一 | T7 | Teammate-F 继续 |
| T12: spec-agent 审查（可选） | T2/T3 | Teammate-B 或新 spawn |

---

### Phase 3: 扫尾阶段（Subagents 验证）

**目标**：独立验证所有修改，确保无语法错误、格式一致

**执行方式**：使用 `Task` 工具 spawn 2 个验证子代理

```
┌─────────────────────────────────────────────────────────┐
│  Phase 3: 扫尾（Subagents 独立验证）                      │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  Reviewer-A  │  │  Reviewer-B  │                    │
│  │  语法检查     │  │  格式一致性   │                    │
│  │  Markdown    │  │  风格统一     │                    │
│  └──────────────┘  └──────────────┘                    │
│         │                │                             │
│         └────────────────┘                             │
│                ↓                                       │
│         产出：验收报告（pass/fail + 问题清单）            │
└─────────────────────────────────────────────────────────┘
```

**产出物**：`~/.claude/tasks/ccg-upgrade/review-report.md`

---

## 详细任务定义

### Task 1: resume 语法修复
- **类型**: 配置修复
- **文件**: `commands/ccg/workflow.md`
- **修改**: `--resume xxx` → `resume xxx`
- **验收**: 无 `--resume` 出现（注释除外）

### Task 2+3: LITE_MODE + GEMINI_MODEL 补齐
- **类型**: 配置补齐
- **文件**: 10 个命令文件（analyze/backend/debug/execute/frontend/optimize/plan/review/test/workflow）
- **修改**:
  - 在 codeagent-wrapper 调用前插入 `{{LITE_MODE_FLAG}}`
  - 在 `--backend gemini` 后插入 `{{GEMINI_MODEL_FLAG}}`
- **验收**: 所有含 codeagent-wrapper 的文件均包含两个占位符

### Task 4+11: WORKDIR + init.md MCP
- **类型**: 配置补齐 + 增强
- **文件**: 15+ 命令/代理文件 + init.md
- **修改**:
  - `$PWD` → `{{WORKDIR}}`
  - init.md 添加 `mcp______zhi` 确认流程
- **验收**: 无 `$PWD` 硬编码；init.md 含 MCP 工具调用

### Task 5: team-exec + team-plan 增强
- **类型**: 增强
- **文件**: `commands/ccg/team-exec.md`, `commands/ccg/team-plan.md`
- **修改**:
  - `AskUserQuestion` → `mcp______zhi`
  - 添加 `mcp______ji` 归档
- **验收**: 无 `AskUserQuestion`，全部替换为 `mcp______zhi`

### Task 6: team-research + team-review 增强
- **类型**: 增强
- **文件**: `commands/ccg/team-research.md`, `commands/ccg/team-review.md`
- **修改**: 同 T5 模式
- **验收**: 同 T5

### Task 7: spec-* Core Philosophy
- **类型**: 优化
- **文件**: 5 个 spec-* 命令文件
- **修改**: 添加 Core Philosophy + Guardrails 精简摘要（≤10 行）
- **验收**: 每个 spec-* 命令含完整摘要

### Task 8: enhance.md + prompts 引用（Layer 2）
- **依赖**: T2/T3
- **文件**: enhance.md + 19 个 prompts 文件
- **修改**: 补回"增强原则"段 + 统一命令引用

### Task 10: 分级名称统一（Layer 2）
- **依赖**: T7
- **文件**: 4 个审查相关文件
- **修改**: 统一为 Critical/Warning/Info

### Task 12: spec-agent 审查（Layer 2，可选）
- **依赖**: T2/T3
- **文件**: 5 个 spec-*-agent.md
- **修改**: 确认是否需要注入占位符

---

## 执行命令

### Step 1: 启动侦察（主代理执行）

```markdown
使用 Task 工具并行 spawn 3 个 Explore 子代理：

1. Explore-A: 扫描 commands/ccg/*.md 中的 --resume、codeagent-wrapper、$PWD
2. Explore-B: 扫描 agents/ccg/*.md 中的 codeagent-wrapper 调用
3. Explore-C: 扫描 .ccg/prompts/**/*.md 中的命令引用

产出汇总到 recon-report.md
```

### Step 2: 创建团队并 spawn Teammates

```markdown
1. TeamCreate: team_name="ccg-upgrade", description="CCG 架构升级并行实施"

2. 并行 spawn 6 个 Teammates（使用 Task 工具，带 team_name 参数）：
   - Teammate-A: T1 任务
   - Teammate-B: T2+T3 任务
   - Teammate-C: T4+T11 任务
   - Teammate-D: T5 任务
   - Teammate-E: T6 任务
   - Teammate-F: T7 任务

3. 队长进入 Delegate Mode，监控进度
```

### Step 3: Layer 2 串行执行

```markdown
等待 Layer 1 全部完成后：

1. SendMessage 给 Teammate-B: 继续执行 T8
2. SendMessage 给 Teammate-F: 继续执行 T10
3. （可选）spawn 新 Teammate 执行 T12
```

### Step 4: 验证扫尾

```markdown
1. SendMessage type="shutdown_request" 关闭所有 Teammates
2. TeamDelete 清理团队资源
3. spawn 2 个 Subagent 执行验证
4. 产出 review-report.md
```

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| Teammates 修改同一文件 | 任务分配时确保文件范围不重叠 |
| Layer 2 依赖未满足 | 队长监控 Layer 1 完成状态后再分派 |
| Token 成本过高 | 侦察/扫尾用 Subagents，仅突击用 Teams |
| 占位符未展开 | 确认 CCG CLI 运行时替换机制 |

---

## 成功判据

- [x] Phase 1 产出侦察报告，确认文件范围
- [ ] Phase 2 所有 Layer 1 任务完成，无文件冲突
- [ ] Phase 2 所有 Layer 2 任务完成
- [ ] Phase 3 验证通过，无语法错误
- [ ] 所有修改符合验收标准

---

## 修订记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-02-12 | v1.0 | 初始计划（Subagent 模式） |
| 2026-02-12 | v2.0 | 重写为混合策略（Agent Teams + Subagents） |
