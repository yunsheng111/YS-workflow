---
version: v1.0
timestamp: 2026-02-12T23:40:00Z
constraints_file: ".claude/spec/constraints/file-organization-constraints.md"
---

# 零决策实施计划：文件组织规范统一

## 计划元信息

- **提案来源**：`.claude/spec/proposals/file-organization-proposal.md`
- **总步骤数**：10
- **关联约束**：HC-1, HC-2, HC-3, HC-4, HC-5, HC-6, SC-1, SC-2, SC-3, SC-4, SC-5, DEP-1, DEP-2, DEP-3, DEP-4, RISK-1, RISK-2, RISK-3, RISK-4, RISK-5
- **预计时间**：0.5-1 天
- **核心目标**：将分散在 `.claude/team-plan/`、`.claude/plan/`、`plan/` 的文件统一迁移到工作流 + 生命周期分层结构，并保证路径引用与命令行为可用

## 实施阶段划分

- **Phase 1: 目录骨架与 Git 规则**（P0，立即实施）- 0.5 小时
- **Phase 2: 文件迁移与兼容层**（P0，立即实施）- 1 小时
- **Phase 3: 路径引用修复**（P1，短期实施）- 2 小时
- **Phase 4: 文档与验证交付**（P1，短期实施）- 1 小时

---

## Phase 1: 目录骨架与 Git 规则（P0 - 立即实施）

### 子任务 1.1: 创建统一目录骨架与子目录 README

**文件范围**：
  - `.claude/spec/wip/research/README.md`（新建）
  - `.claude/spec/wip/analysis/README.md`（新建）
  - `.claude/spec/wip/drafts/README.md`（新建）
  - `.claude/agent-teams/wip/research/README.md`（新建）
  - `.claude/agent-teams/wip/analysis/README.md`（新建）
  - `.claude/agent-teams/wip/drafts/README.md`（新建）
  - `.claude/agent-teams/plans/README.md`（新建）
  - `.claude/agent-teams/reviews/README.md`（新建）
  - `.claude/workflow/wip/research/README.md`（新建）
  - `.claude/workflow/wip/ideation/README.md`（新建）
  - `.claude/workflow/wip/drafts/README.md`（新建）
  - `.claude/workflow/plans/phase3-planning/README.md`（新建）
  - `.claude/workflow/plans/phase4-execution/README.md`（新建）
  - `.claude/workflow/reviews/phase5-review/README.md`（新建）
  - `.claude/workflow/reviews/phase6-acceptance/README.md`（新建）
  - `.claude/common/wip/drafts/README.md`（新建）
  - `.claude/common/plans/README.md`（新建）
**操作类型**：新增
**实施步骤**：
  1. 按提案目录结构创建缺失目录，目录深度严格控制在 4 层以内。
  2. 在每个新增子目录写入 README，固定包含「目录用途 / 命名规范 / 清理策略 / 是否纳入版本控制」四段。
  3. 使用脚本遍历 `.claude/` 校验目录层级与 Windows 路径长度（目标 < 200 字符）。
**验收标准**：所有目标目录和 README 文件存在，目录层级与路径长度校验通过。
**约束映射**：[HC-3, HC-5, SC-1, SC-2, SC-5, RISK-5]
**依赖**：无
**并行分组**：Layer 1

### 子任务 1.2: 更新 .gitignore 忽略策略

**文件范围**：
  - `.gitignore`（修改）
**操作类型**：修改
**实施步骤**：
  1. 删除旧规则 `plan/`，新增规则 `.claude/*/wip/`。
  2. 保留 `.claude/spec/constraints/`、`.claude/spec/proposals/`、`.claude/spec/plans/` 等正式目录的跟踪能力。
  3. 使用 `git check-ignore -v` 验证 `wip/` 被忽略，正式目录未被误忽略。
**验收标准**：`.gitignore` 规则更新完成，忽略行为与生命周期策略一致。
**约束映射**：[HC-2, SC-4, DEP-3, RISK-4]
**依赖**：无
**并行分组**：Layer 1

---

## Phase 2: 文件迁移与兼容层（P0 - 立即实施）

### 子任务 2.1: 迁移 Agent Teams 历史文件

**文件范围**：
  - `.claude/team-plan/agent-teams-vs-subagents-analysis.md`（删除）
  - `.claude/agent-teams/wip/analysis/20260213-agent-teams.md`（新建）
  - `.claude/team-plan/ccg-next-iteration-research.md`（删除）
  - `.claude/agent-teams/wip/research/20260213-ccg-next-iteration.md`（新建）
  - `.claude/team-plan/claude-code-features-research.md`（删除）
  - `.claude/agent-teams/wip/research/20260213-claude-code-features.md`（新建）
  - `.claude/team-plan/contextweaver-research.md`（删除）
  - `.claude/agent-teams/wip/research/20260213-contextweaver.md`（新建）
  - `.claude/team-plan/ccg-next-iteration-implementation.md`（删除）
  - `.claude/agent-teams/wip/drafts/20260213-ccg-implementation.md`（新建）
  - `.claude/team-plan/ccg-upgrade-plan.md`（删除）
  - `.claude/common/plans/20260213-ccg-upgrade-plan.md`（新建）
**操作类型**：修改
**实施步骤**：
  1. 按迁移映射表执行逐文件移动，确保迁移后命名符合 `YYYYMMDD-topic.md` 规范。
  2. 逐文件比对哈希（或字节数）确认内容无损。
  3. 记录迁移结果到临时检查清单，标记成功/失败与原因。
**验收标准**：6 个源文件全部迁移成功，目标文件内容一致，源路径不再保留旧文件。
**约束映射**：[HC-5, SC-3, DEP-4, RISK-1]
**依赖**：子任务 1.1
**并行分组**：Layer 1

### 子任务 2.2: 迁移根目录 plan 文件

**文件范围**：
  - `plan/ccg-command-upstream-diff-20260212.md`（删除）
  - `.claude/agent-teams/wip/analysis/20260212-ccg-command-diff.md`（新建）
**操作类型**：修改
**实施步骤**：
  1. 将根目录 `plan/` 下历史文件迁移到 Agent Teams 的 `wip/analysis/`。
  2. 迁移后执行内容一致性检查（文件大小 + 摘要校验）。
  3. 更新迁移清单中的源/目标路径状态。
**验收标准**：根目录历史计划文件已迁移，目标文件可读且内容完整。
**约束映射**：[HC-5, SC-3, DEP-4, RISK-1]
**依赖**：子任务 1.1
**并行分组**：Layer 1

### 子任务 2.3: 建立旧路径兼容提示与映射文档

**文件范围**：
  - `.claude/team-plan/README.md`（新建）
  - `.claude/plan/README.md`（新建）
  - `plan/README.md`（新建）
  - `.claude/MIGRATION-MAP.md`（新建）
**操作类型**：新增
**实施步骤**：
  1. 在旧目录写入弃用说明，明确新目录位置与停用日期。
  2. 在 `.claude/MIGRATION-MAP.md` 固化旧路径到新路径映射（逐文件映射 + 目录级映射）。
  3. 为外部脚本用户提供过渡建议（例如替换路径前缀与命名规则）。
**验收标准**：旧路径访问时可看到明确重定向信息，迁移映射文档完整可查。
**约束映射**：[HC-4, SC-1, DEP-4, RISK-2]
**依赖**：子任务 2.1、子任务 2.2
**并行分组**：Layer 2

---

## Phase 3: 路径引用修复（P1 - 短期实施）

### 子任务 3.1: 更新 team-* 命令路径语义

**文件范围**：
  - `commands/ccg/team-research.md`（修改）
  - `commands/ccg/team-plan.md`（修改）
  - `commands/ccg/team-exec.md`（修改）
  - `commands/ccg/team-review.md`（修改）
**操作类型**：修改
**实施步骤**：
  1. 将 `.claude/team-plan/` 输出路径改为 `.claude/agent-teams/` 分层路径（`wip/research`、`plans`、`reviews`）。
  2. 统一命名规范示例：`YYYYMMDD-<topic>.md`、`YYYYMMDD-<topic>-plan.md`、`YYYYMMDD-<topic>-review.md`。
  3. 更新前置条件、输出格式示例和 Exit Criteria，确保所有引用可直接执行。
**验收标准**：4 个 team 命令文件不再引用 `.claude/team-plan/`，且示例路径与新目录一致。
**约束映射**：[HC-1, SC-1, DEP-1, RISK-2]
**依赖**：子任务 2.3
**并行分组**：Layer 1

### 子任务 3.2: 更新 plan/feat/workflow/execute 命令路径

**文件范围**：
  - `commands/ccg/plan.md`（修改）
  - `commands/ccg/feat.md`（修改）
  - `commands/ccg/workflow.md`（修改）
  - `commands/ccg/execute.md`（修改）
**操作类型**：修改
**实施步骤**：
  1. 将 `.claude/plan/` 引用替换为 `.claude/common/plans/`。
  2. 修正示例命令中的输入输出路径，避免出现旧目录前缀。
  3. 对每个命令补充「旧路径已弃用」说明并指向 `.claude/MIGRATION-MAP.md`。
**验收标准**：4 个命令文件不再引用 `.claude/plan/`，示例路径可直接复用。
**约束映射**：[HC-1, SC-1, DEP-1, RISK-2]
**依赖**：子任务 2.3
**并行分组**：Layer 1

### 子任务 3.3: 更新代理文件中的计划路径引用

**文件范围**：
  - `agents/ccg/planner.md`（修改）
  - `agents/ccg/execute-agent.md`（修改）
  - `agents/ccg/backend-agent.md`（修改）
  - `agents/ccg/frontend-agent.md`（修改）
  - `agents/ccg/fullstack-agent.md`（修改）
**操作类型**：修改
**实施步骤**：
  1. 批量替换 `.claude/plan/` 为 `.claude/common/plans/`。
  2. 检查每个代理的 I/O 示例、默认路径和说明文字，确保路径一致。
  3. 对执行代理补充旧路径兼容提示，避免历史计划读取失败。
**验收标准**：5 个代理文件路径统一到 `.claude/common/plans/`，无旧路径残留。
**约束映射**：[HC-1, HC-6, DEP-2, RISK-2, RISK-3]
**依赖**：子任务 2.3
**并行分组**：Layer 1

---

## Phase 4: 文档与验证交付（P1 - 短期实施）

### 子任务 4.1: 更新核心文档并发布迁移指南

**文件范围**：
  - `.claude/spec/README.md`（修改）
  - `CLAUDE.md`（修改）
  - `.claude/MIGRATION-GUIDE.md`（新建）
**操作类型**：修改
**实施步骤**：
  1. 在 `.claude/spec/README.md` 更新目录结构图与 `wip/` 策略说明。
  2. 在 `CLAUDE.md` 更新工作流目录说明和路径使用规范。
  3. 编写 `.claude/MIGRATION-GUIDE.md`，包含迁移步骤、常见问题、回滚命令。
**验收标准**：3 份文档路径说明一致，用户可按迁移指南独立完成路径替换。
**约束映射**：[SC-1, SC-5, DEP-4, RISK-4]
**依赖**：子任务 3.1、子任务 3.2、子任务 3.3
**并行分组**：Layer 1

### 子任务 4.2: 执行迁移验证并产出进度报告

**文件范围**：
  - `.claude/spec/progress/20260212-file-organization-progress.md`（新建）
**操作类型**：新增
**实施步骤**：
  1. 运行路径扫描，确认 `commands/` 与 `agents/` 不再出现 `.claude/team-plan/` 与 `.claude/plan/`。
  2. 运行 Git 验证：检查 `wip/` 忽略是否生效、正式目录是否被跟踪。
  3. 执行命令级 smoke test（`/ccg:spec-research`、`/ccg:team-plan`、`/ccg:plan`）并记录结果。
  4. 在进度报告中汇总覆盖率、剩余风险、回滚点与下一步动作。
**验收标准**：验证项全部通过，进度报告包含证据、问题列表与处置状态。
**约束映射**：[HC-1, HC-2, HC-6, SC-4, RISK-3, RISK-5]
**依赖**：子任务 4.1
**并行分组**：Layer 2

---

## 文件冲突检查

| 文件路径 | 归属任务 | 状态 |
|----------|----------|------|
| `.gitignore` | 1.2 | ✅ 唯一 |
| `commands/ccg/team-plan.md` | 3.1 | ✅ 唯一 |
| `commands/ccg/plan.md` | 3.2 | ✅ 唯一 |
| `agents/ccg/planner.md` | 3.3 | ✅ 唯一 |
| `.claude/spec/README.md` | 4.1 | ✅ 唯一 |
| `CLAUDE.md` | 4.1 | ✅ 唯一 |

**结论**：✅ 当前计划无多任务同文件冲突。

---

## 并行分组

### Phase 1
- **Layer 1**（并行）：任务 1.1, 1.2

### Phase 2
- **Layer 1**（并行）：任务 2.1, 2.2
- **Layer 2**（依赖 Layer 1）：任务 2.3

### Phase 3
- **Layer 1**（并行）：任务 3.1, 3.2, 3.3

### Phase 4
- **Layer 1**（并行）：任务 4.1
- **Layer 2**（依赖 Layer 1）：任务 4.2

---

## 约束覆盖检查

| 约束编号 | 覆盖步骤 | 状态 |
|----------|----------|------|
| HC-1 | 3.1, 3.2, 3.3, 4.2 | ✅ 已覆盖 |
| HC-2 | 1.2, 4.2 | ✅ 已覆盖 |
| HC-3 | 1.1 | ✅ 已覆盖 |
| HC-4 | 2.3 | ✅ 已覆盖 |
| HC-5 | 1.1, 2.1, 2.2 | ✅ 已覆盖 |
| HC-6 | 3.3, 4.2 | ✅ 已覆盖 |
| SC-1 | 1.1, 2.3, 3.1, 3.2, 4.1 | ✅ 已覆盖 |
| SC-2 | 1.1 | ✅ 已覆盖 |
| SC-3 | 2.1, 2.2 | ✅ 已覆盖 |
| SC-4 | 1.2, 4.2 | ✅ 已覆盖 |
| SC-5 | 1.1, 4.1 | ✅ 已覆盖 |
| DEP-1 | 3.1, 3.2 | ✅ 已覆盖 |
| DEP-2 | 3.3 | ✅ 已覆盖 |
| DEP-3 | 1.2 | ✅ 已覆盖 |
| DEP-4 | 2.1, 2.2, 2.3, 4.1 | ✅ 已覆盖 |
| RISK-1 | 2.1, 2.2 | ✅ 已覆盖 |
| RISK-2 | 2.3, 3.1, 3.2, 3.3 | ✅ 已覆盖 |
| RISK-3 | 3.3, 4.2 | ✅ 已覆盖 |
| RISK-4 | 1.2, 4.1 | ✅ 已覆盖 |
| RISK-5 | 1.1, 4.2 | ✅ 已覆盖 |

**结论**：✅ 所有约束均有对应实施步骤。

---

## 依赖关系图

```
Phase 1:
  1.1, 1.2 (并行)

Phase 2:
  2.1, 2.2 (并行)
    ↓
  2.3

Phase 3:
  3.1, 3.2, 3.3 (并行)

Phase 4:
  4.1
    ↓
  4.2
```

---

## 下一步

运行 `/ccg:spec-impl .claude/spec/plans/file-organization-plan.md` 按此计划执行实施。
