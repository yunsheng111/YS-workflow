# 文件组织规范迁移指南

**版本**：v1.0  
**发布日期**：2026-02-13  
**适用范围**：所有使用 CCG 工作流的项目

---

## 概述

本次迁移将分散的临时文件统一到工作流分类 + 生命周期分层的目录结构中，提升文件组织的清晰度和可维护性。

### 核心变更

1. **新增工作流目录**：
   - `.claude/agent-teams/`：Agent Teams 工作流
   - `.claude/workflow/`：六阶段工作流
   - `.claude/common/`：通用计划

2. **生命周期分层**：
   - `wip/`：临时文件（研究、分析、草稿）
   - 正式目录：`plans/`、`reviews/`、`constraints/`、`proposals/`
   - `archive/`：归档文件

3. **弃用目录**：
   - `.claude/team-plan/`（已迁移到 `.claude/agent-teams/`）
   - `.claude/plan/`（已迁移到 `.claude/common/`）

---

## 快速开始

### 对于普通用户

**无需任何操作**。所有 CCG 命令已自动适配新路径，您可以继续正常使用。

### 对于脚本维护者

如果您的脚本引用了旧路径，请按照以下步骤迁移：

1. **查找旧路径引用**：
   ```bash
   grep -r "\.claude/team-plan" your-scripts/
   grep -r "\.claude/plan" your-scripts/
   ```

2. **替换路径**：
   ```bash
   # 替换 team-plan 引用
   sed -i 's|\.claude/team-plan|.claude/agent-teams/wip|g' your-script.sh
   
   # 替换 plan 引用
   sed -i 's|\.claude/plan|.claude/common/plans|g' your-script.sh
   ```

3. **验证脚本**：
   ```bash
   bash -n your-script.sh  # 语法检查
   ./your-script.sh        # 实际运行测试
   ```

---

## 详细迁移步骤

### 步骤 1：了解新目录结构

```
.claude/
├── spec/                   # OpenSpec 工作流（保持不变）
│   ├── wip/               # 临时工作区（新增）
│   │   ├── research/      # 研究文档
│   │   ├── analysis/      # 分析文档
│   │   └── drafts/        # 草稿文档
│   ├── constraints/       # 约束集（正式）
│   ├── proposals/         # 提案（正式）
│   ├── plans/             # 计划（正式）
│   ├── reviews/           # 审查报告（正式）
│   ├── progress/          # 进度追踪（正式）
│   ├── templates/         # 模板（只读）
│   └── archive/           # 归档
│
├── agent-teams/            # Agent Teams 工作流（新增）
│   ├── wip/               # 临时工作区
│   │   ├── research/
│   │   ├── analysis/
│   │   └── drafts/
│   ├── plans/             # 计划（正式）
│   ├── reviews/           # 审查报告（正式）
│   └── archive/           # 归档
│
├── workflow/               # 六阶段工作流（新增）
│   ├── wip/               # 临时工作区
│   │   ├── research/      # 阶段 1：研究
│   │   ├── ideation/      # 阶段 2：构思
│   │   └── drafts/        # 草稿文档
│   ├── plans/             # 计划（正式）
│   │   ├── phase3-planning/
│   │   └── phase4-execution/
│   ├── reviews/           # 审查报告（正式）
│   │   ├── phase5-review/
│   │   └── phase6-acceptance/
│   └── archive/           # 归档
│
└── common/                 # 通用计划（新增）
    ├── wip/               # 临时工作区
    │   └── drafts/
    ├── plans/             # 计划（正式）
    └── archive/           # 归档
```

### 步骤 2：查看文件迁移映射

查看完整的文件迁移映射表：

```bash
cat .claude/MIGRATION-MAP.md
```

### 步骤 3：更新您的工作流

#### 使用 CCG 命令（推荐）

CCG 命令已自动适配新路径，无需修改：

```bash
# Agent Teams 工作流
/ccg:team-research "需求描述"
/ccg:team-plan
/ccg:team-exec
/ccg:team-review

# 通用计划
/ccg:plan "功能描述"
/ccg:feat "功能描述"
/ccg:execute .claude/common/plans/功能名.md

# OpenSpec 工作流
/ccg:spec-research "需求描述"
/ccg:spec-plan
/ccg:spec-impl
/ccg:spec-review
```

#### 手动操作文件

如果需要手动操作文件，请使用新路径：

```bash
# 创建研究文档
touch .claude/agent-teams/wip/research/$(date +%Y%m%d)-topic.md

# 创建计划文档
touch .claude/common/plans/$(date +%Y%m%d)-feature.md

# 查看所有临时文件
find .claude/*/wip -name "*.md" ! -name "README.md"
```

---

## 命名规范

### 临时文件（wip/ 目录）

```
YYYYMMDD-<topic>-<type>.md
```

示例：
- `20260213-file-organization-research.md`
- `20260213-agent-teams-analysis.md`
- `20260213-implementation-draft.md`

### 正式文件（plans/、reviews/ 目录）

```
YYYYMMDD-<topic>-<type>.md
```

示例：
- `20260213-ccg-upgrade-plan.md`
- `20260213-feature-x-review.md`

---

## 版本控制

### 被 Git 忽略的目录

以下目录被 `.gitignore` 忽略，不纳入版本控制：

```
.claude/*/wip/
```

包括：
- `.claude/spec/wip/`
- `.claude/agent-teams/wip/`
- `.claude/workflow/wip/`
- `.claude/common/wip/`

### 被 Git 跟踪的目录

以下目录纳入版本控制：

- `.claude/spec/constraints/`
- `.claude/spec/proposals/`
- `.claude/spec/plans/`
- `.claude/spec/reviews/`
- `.claude/agent-teams/plans/`
- `.claude/agent-teams/reviews/`
- `.claude/workflow/plans/`
- `.claude/workflow/reviews/`
- `.claude/common/plans/`

---

## 自动化清理

### 临时文件清理策略

`wip/` 目录下的文件会自动清理：

- **生命周期**：< 30 天
- **清理方式**：超过 30 天的文件自动移入 `archive/`
- **清理频率**：每周一次

### 手动归档

如需手动归档文件：

```bash
# 创建归档目录
mkdir -p .claude/agent-teams/archive/$(date +%Y%m%d-%H%M%S)

# 移动文件到归档
mv .claude/agent-teams/wip/research/*.md \
   .claude/agent-teams/archive/$(date +%Y%m%d-%H%M%S)/
```

---

## 常见问题

### Q1：旧路径的文件去哪了？

所有文件已迁移到新路径，查看迁移映射表：

```bash
cat .claude/MIGRATION-MAP.md
```

### Q2：我的脚本报错找不到文件

请更新脚本中的路径引用：

```bash
# 旧路径
.claude/team-plan/

# 新路径
.claude/agent-teams/wip/research/  # 研究文档
.claude/agent-teams/wip/analysis/  # 分析文档
.claude/agent-teams/plans/         # 正式计划
```

### Q3：如何恢复旧文件？

从 Git 历史中恢复：

```bash
# 查看历史
git log --all --full-history -- ".claude/team-plan/*"

# 恢复文件
git checkout <commit-hash> -- .claude/team-plan/filename.md
```

### Q4：临时文件会被自动删除吗？

不会删除，只会移入 `archive/` 目录。您可以随时从归档中恢复。

### Q5：如何查找已迁移的文件？

```bash
# 查找所有 Agent Teams 文件
find .claude/agent-teams -name "*.md" ! -name "README.md"

# 查找所有通用计划
find .claude/common/plans -name "*.md" ! -name "README.md"

# 查找所有临时文件
find .claude/*/wip -name "*.md" ! -name "README.md"
```

### Q6：CCG 命令需要更新吗？

不需要。所有 CCG 命令已自动适配新路径。

### Q7：旧目录什么时候会被删除？

- **弃用日期**：2026-02-13
- **完全移除日期**：2026-03-13（30 天后）

在此期间，旧目录会保留 README.md 说明弃用信息。

---

## 回滚方案

如果迁移后遇到问题，可以回滚到迁移前的状态：

### 方法 1：使用 Git 回滚

```bash
# 查看迁移前的提交
git log --oneline | grep -B 5 "file-organization"

# 回滚到迁移前
git reset --hard <commit-hash>
```

### 方法 2：使用备份恢复

如果您在迁移前创建了备份：

```bash
# 恢复备份
rm -rf .claude
cp -r .claude.backup-YYYYMMDD-HHMMSS .claude
```

---

## 获取帮助

如有问题，请参考：

- **迁移映射表**：`.claude/MIGRATION-MAP.md`
- **约束集**：`.claude/spec/constraints/file-organization-constraints.md`
- **提案**：`.claude/spec/proposals/file-organization-proposal.md`
- **实施计划**：`.claude/spec/plans/file-organization-plan.md`

---

## 更新日志

### v1.0（2026-02-13）

- 初始发布
- 新增工作流分类目录结构
- 迁移所有历史文件
- 更新所有 CCG 命令和代理配置
- 提供完整的迁移映射和回滚方案
