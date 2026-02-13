# 文件组织规范迁移映射表

**迁移日期**：2026-02-13  
**迁移版本**：v1.0

---

## 旧路径到新路径映射

### Agent Teams 工作流文件

| 旧路径 | 新路径 | 状态 |
|--------|--------|------|
| `.claude/team-plan/agent-teams-vs-subagents-analysis.md` | `.claude/agent-teams/wip/analysis/20260213-agent-teams.md` | ✅ 已迁移 |
| `.claude/team-plan/ccg-next-iteration-research.md` | `.claude/agent-teams/wip/research/20260213-ccg-next-iteration.md` | ✅ 已迁移 |
| `.claude/team-plan/claude-code-features-research.md` | `.claude/agent-teams/wip/research/20260213-claude-code-features.md` | ✅ 已迁移 |
| `.claude/team-plan/contextweaver-research.md` | `.claude/agent-teams/wip/research/20260213-contextweaver.md` | ✅ 已迁移 |
| `.claude/team-plan/ccg-next-iteration-implementation.md` | `.claude/agent-teams/wip/drafts/20260213-ccg-implementation.md` | ✅ 已迁移 |
| `plan/ccg-command-upstream-diff-20260212.md` | `.claude/agent-teams/wip/analysis/20260212-ccg-command-diff.md` | ✅ 已迁移 |

### 通用计划文件

| 旧路径 | 新路径 | 状态 |
|--------|--------|------|
| `.claude/team-plan/ccg-upgrade-plan.md` | `.claude/common/plans/20260213-ccg-upgrade-plan.md` | ✅ 已迁移 |

---

## 目录级映射

### 旧目录结构

```
.claude/
├── team-plan/          # 已弃用
│   └── *.md
├── plan/               # 已弃用
└── spec/               # 保持不变
```

### 新目录结构

```
.claude/
├── spec/               # OpenSpec 工作流（保持不变）
│   ├── wip/           # 临时工作区（新增）
│   ├── constraints/
│   ├── proposals/
│   ├── plans/
│   ├── reviews/
│   ├── progress/
│   ├── templates/
│   └── archive/
│
├── agent-teams/        # Agent Teams 工作流（新增）
│   ├── wip/
│   ├── plans/
│   ├── reviews/
│   └── archive/
│
├── workflow/           # 六阶段工作流（新增）
│   ├── wip/
│   ├── plans/
│   ├── reviews/
│   └── archive/
│
└── common/             # 通用计划（新增）
    ├── wip/
    ├── plans/
    └── archive/
```

---

## 命名规范变更

### 旧命名规范

- 无统一规范
- 示例：`ccg-upgrade-plan.md`、`contextweaver-research.md`

### 新命名规范

**临时文件（wip/ 目录）**：
```
YYYYMMDD-<topic>-<type>.md
```

示例：
- `20260213-ccg-upgrade-research.md`
- `20260213-contextweaver-analysis.md`
- `20260213-implementation-draft.md`

**正式文件（plans/、reviews/ 目录）**：
```
YYYYMMDD-<topic>-<type>.md
```

示例：
- `20260213-ccg-upgrade-plan.md`
- `20260213-feature-x-review.md`

---

## 路径引用更新指南

### 命令文件更新

**需要更新的命令**：
- `commands/ccg/team-research.md`
- `commands/ccg/team-plan.md`
- `commands/ccg/team-exec.md`
- `commands/ccg/team-review.md`
- `commands/ccg/plan.md`
- `commands/ccg/feat.md`
- `commands/ccg/workflow.md`
- `commands/ccg/execute.md`

**替换规则**：
```bash
# 旧路径
.claude/team-plan/

# 新路径
.claude/agent-teams/wip/research/  # 研究文档
.claude/agent-teams/wip/analysis/  # 分析文档
.claude/agent-teams/wip/drafts/    # 草稿文档
.claude/agent-teams/plans/         # 正式计划
.claude/agent-teams/reviews/       # 审查报告
```

```bash
# 旧路径
.claude/plan/

# 新路径
.claude/common/plans/              # 通用计划
```

### 代理文件更新

**需要更新的代理**：
- `agents/ccg/planner.md`
- `agents/ccg/execute-agent.md`
- `agents/ccg/backend-agent.md`
- `agents/ccg/frontend-agent.md`
- `agents/ccg/fullstack-agent.md`

**替换规则**：
```bash
# 批量替换
sed -i 's|\.claude/plan/|.claude/common/plans/|g' agents/ccg/*.md
```

---

## 外部脚本迁移建议

如果您的外部脚本引用了旧路径，请按以下步骤迁移：

### 1. 查找所有路径引用

```bash
# 查找引用旧路径的脚本
grep -r "\.claude/team-plan" your-scripts/
grep -r "\.claude/plan" your-scripts/
```

### 2. 替换路径前缀

```bash
# 替换 team-plan 引用
sed -i 's|\.claude/team-plan|.claude/agent-teams/wip|g' your-script.sh

# 替换 plan 引用
sed -i 's|\.claude/plan|.claude/common/plans|g' your-script.sh
```

### 3. 更新文件命名逻辑

如果脚本中有文件命名逻辑，请更新为新的命名规范：

```bash
# 旧命名
filename="ccg-upgrade-plan.md"

# 新命名
filename="$(date +%Y%m%d)-ccg-upgrade-plan.md"
```

---

## 过渡期支持

### 旧目录保留说明

- `.claude/team-plan/`：已清空，仅保留 README.md 说明弃用信息
- `.claude/plan/`：已清空，仅保留 README.md 说明弃用信息
- `plan/`：已删除

### 弃用时间表

| 目录 | 弃用日期 | 完全移除日期 |
|------|----------|--------------|
| `.claude/team-plan/` | 2026-02-13 | 2026-03-13（30 天后） |
| `.claude/plan/` | 2026-02-13 | 2026-03-13（30 天后） |

---

## 常见问题

### Q1：如何查找已迁移的文件？

```bash
# 查找所有 Agent Teams 文件
find .claude/agent-teams -name "*.md" ! -name "README.md"

# 查找所有通用计划
find .claude/common/plans -name "*.md" ! -name "README.md"
```

### Q2：如何恢复旧文件？

如果需要恢复旧文件，可以从 Git 历史中恢复：

```bash
# 查看迁移前的文件
git log --all --full-history -- ".claude/team-plan/*"

# 恢复特定文件
git checkout <commit-hash> -- .claude/team-plan/filename.md
```

### Q3：临时文件会被自动清理吗？

是的，`wip/` 目录下超过 30 天的文件会被自动移入 `archive/` 目录。

### Q4：如何手动归档文件？

```bash
# 创建归档目录
mkdir -p .claude/agent-teams/archive/$(date +%Y%m%d-%H%M%S)

# 移动文件到归档
mv .claude/agent-teams/wip/research/*.md \
   .claude/agent-teams/archive/$(date +%Y%m%d-%H%M%S)/
```

---

## 联系支持

如有迁移问题，请参考：
- 约束集：`.claude/spec/constraints/file-organization-constraints.md`
- 提案：`.claude/spec/proposals/file-organization-proposal.md`
- 实施计划：`.claude/spec/plans/file-organization-plan.md`
