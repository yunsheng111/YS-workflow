---
version: v1.0
timestamp: 2026-02-13T08:00:00Z
constraints_file: ".claude/spec/constraints/file-organization-constraints.md"
---

# 提案：统一文件组织规范（工作流分类 + 生命周期分层）

## 执行摘要

### 问题陈述

当前项目中研究、分析、规划等临时文件分散在多个目录（`.claude/spec/`、`.claude/team-plan/`、`.claude/plan/`、`plan/`），导致：
1. 文件查找困难（23 个文件分散在 4 个位置）
2. 命名不一致（`*-research.md`、`*-analysis.md`、`*-plan.md`）
3. 生命周期管理混乱（临时文件与归档文件混在一起）
4. 工具路径引用复杂（66 处路径引用需要维护）

### 推荐方案

**工作流分类 + 生命周期分层**

采用两层分类体系：
- **第一层**：工作流类型（OpenSpec / Agent Teams / 六阶段工作流 / 通用）
- **第二层**：生命周期阶段（临时 wip / 正式 formal / 归档 archive）

**核心优势**：
- ✅ 符合 OpenSpec 规范（`.claude/spec/` 路径保持不变）
- ✅ 工作流职责清晰（每个工作流独立管理生命周期）
- ✅ 最小化路径变更（66 处 `.claude/spec/` 引用无需修改）
- ✅ 支持自动化清理（所有 `wip/` 目录可定期清理）

---

## 最终方案详细设计

### 目录结构

```
.claude/
├── spec/                           # OpenSpec 工作流（保持现有路径）
│   ├── wip/                       # 临时工作区（新增）
│   │   ├── research/              # 研究文档
│   │   │   ├── YYYYMMDD-topic.md
│   │   │   └── README.md
│   │   ├── analysis/              # 分析文档
│   │   │   ├── YYYYMMDD-topic.md
│   │   │   └── README.md
│   │   └── drafts/                # 草稿文档
│   │       ├── YYYYMMDD-topic.md
│   │       └── README.md
│   ├── constraints/               # 约束集（正式）
│   ├── proposals/                 # 提案（正式）
│   ├── plans/                     # 计划（正式）
│   ├── reviews/                   # 审查报告（正式）
│   ├── progress/                  # 进度追踪（正式）
│   ├── templates/                 # 模板（只读）
│   └── archive/                   # 归档
│       └── YYYYMMDD-HHMMSS/
│
├── agent-teams/                    # Agent Teams 工作流
│   ├── wip/                       # 临时工作区
│   │   ├── research/              # 研究文档
│   │   │   ├── YYYYMMDD-topic.md
│   │   │   └── README.md
│   │   ├── analysis/              # 分析文档
│   │   │   ├── YYYYMMDD-topic.md
│   │   │   └── README.md
│   │   └── drafts/                # 草稿文档
│   │       ├── YYYYMMDD-topic.md
│   │       └── README.md
│   ├── plans/                     # 计划（正式）
│   │   ├── YYYYMMDD-topic-plan.md
│   │   └── README.md
│   ├── reviews/                   # 审查报告（正式）
│   │   ├── YYYYMMDD-topic-review.md
│   │   └── README.md
│   └── archive/                   # 归档
│       └── YYYYMMDD-HHMMSS/
│
├── workflow/                       # 六阶段工作流
│   ├── wip/                       # 临时工作区
│   │   ├── research/              # 阶段 1：研究
│   │   │   ├── YYYYMMDD-topic.md
│   │   │   └── README.md
│   │   ├── ideation/              # 阶段 2：构思
│   │   │   ├── YYYYMMDD-topic.md
│   │   │   └── README.md
│   │   └── drafts/                # 草稿文档
│   │       ├── YYYYMMDD-topic.md
│   │       └── README.md
│   ├── plans/                     # 计划（正式）
│   │   ├── phase3-planning/       # 阶段 3：规划
│   │   ├── phase4-execution/      # 阶段 4：执行计划
│   │   └── README.md
│   ├── reviews/                   # 审查报告（正式）
│   │   ├── phase5-review/         # 阶段 5：审查
│   │   ├── phase6-acceptance/     # 阶段 6：验收
│   │   └── README.md
│   └── archive/                   # 归档
│       └── YYYYMMDD-HHMMSS/
│
└── common/                         # 通用计划（不属于特定工作流）
    ├── wip/                       # 临时工作区
    │   └── drafts/                # 草稿文档
    │       ├── YYYYMMDD-topic.md
    │       └── README.md
    ├── plans/                     # 通用计划（正式）
    │   ├── YYYYMMDD-feature-plan.md
    │   └── README.md
    └── archive/                   # 归档
        └── YYYYMMDD-HHMMSS/
```

---

## 设计说明

### 1. 工作流分类（第一层）

| 工作流 | 目录 | 使用场景 | 关联命令 |
|--------|------|----------|----------|
| OpenSpec | `.claude/spec/` | 约束驱动开发 | `ccg:spec-*` |
| Agent Teams | `.claude/agent-teams/` | 并行协作开发 | `ccg:team-*` |
| 六阶段工作流 | `.claude/workflow/` | 复杂全栈开发 | `ccg:workflow` |
| 通用计划 | `.claude/common/` | 简单功能开发 | `ccg:plan`、`ccg:feat` |

### 2. 生命周期分类（第二层）

| 阶段 | 目录 | 文件类型 | 版本控制 | 清理策略 |
|------|------|----------|----------|----------|
| 临时 | `wip/` | 研究、分析、草稿 | 忽略 | 自动清理（> 30 天） |
| 正式 | `constraints/`、`proposals/`、`plans/`、`reviews/` | 约束集、提案、计划、审查 | 跟踪 | 手动归档 |
| 归档 | `archive/` | 已完成的完整工作流 | 跟踪 | 手动清理 |

### 3. 目录职责定义

| 目录 | 职责 | 包含文件类型 | 版本控制 |
|------|------|--------------|----------|
| `.claude/spec/wip/` | OpenSpec 临时工作区 | 研究、分析、草稿 | 忽略 |
| `.claude/spec/constraints/` | 约束集（正式） | `*-constraints.md` | 跟踪 |
| `.claude/spec/proposals/` | 提案（正式） | `*-proposal.md` | 跟踪 |
| `.claude/spec/plans/` | OpenSpec 计划（正式） | `*-plan.md` | 跟踪 |
| `.claude/spec/reviews/` | 审查报告（正式） | `*-review.md` | 跟踪 |
| `.claude/spec/progress/` | 进度追踪（正式） | `*-progress.md` | 跟踪 |
| `.claude/spec/templates/` | 模板（只读） | `*-template.md` | 跟踪 |
| `.claude/spec/archive/` | OpenSpec 归档 | 完整工作流 | 跟踪 |
| `.claude/agent-teams/wip/` | Agent Teams 临时工作区 | 研究、分析、草稿 | 忽略 |
| `.claude/agent-teams/plans/` | Agent Teams 计划（正式） | `*-plan.md` | 跟踪 |
| `.claude/agent-teams/reviews/` | Agent Teams 审查（正式） | `*-review.md` | 跟踪 |
| `.claude/agent-teams/archive/` | Agent Teams 归档 | 完整工作流 | 跟踪 |
| `.claude/workflow/wip/` | 六阶段临时工作区 | 研究、构思、草稿 | 忽略 |
| `.claude/workflow/plans/` | 六阶段计划（正式） | 阶段 3-4 计划 | 跟踪 |
| `.claude/workflow/reviews/` | 六阶段审查（正式） | 阶段 5-6 审查 | 跟踪 |
| `.claude/workflow/archive/` | 六阶段归档 | 完整工作流 | 跟踪 |
| `.claude/common/wip/` | 通用临时工作区 | 草稿 | 忽略 |
| `.claude/common/plans/` | 通用计划（正式） | `*-plan.md` | 跟踪 |
| `.claude/common/archive/` | 通用归档 | 完整工作流 | 跟踪 |

---

## 迁移映射表

| 源路径 | 目标路径 | 工作流 | 生命周期 |
|--------|----------|--------|----------|
| `.claude/team-plan/agent-teams-vs-subagents-analysis.md` | `.claude/agent-teams/wip/analysis/20260213-agent-teams.md` | Agent Teams | 临时 |
| `.claude/team-plan/ccg-next-iteration-research.md` | `.claude/agent-teams/wip/research/20260213-ccg-next-iteration.md` | Agent Teams | 临时 |
| `.claude/team-plan/claude-code-features-research.md` | `.claude/agent-teams/wip/research/20260213-claude-code-features.md` | Agent Teams | 临时 |
| `.claude/team-plan/contextweaver-research.md` | `.claude/agent-teams/wip/research/20260213-contextweaver.md` | Agent Teams | 临时 |
| `.claude/team-plan/ccg-upgrade-plan.md` | `.claude/common/plans/20260213-ccg-upgrade-plan.md` | 通用 | 正式 |
| `.claude/team-plan/ccg-next-iteration-implementation.md` | `.claude/agent-teams/wip/drafts/20260213-ccg-implementation.md` | Agent Teams | 临时 |
| `plan/ccg-command-upstream-diff-20260212.md` | `.claude/agent-teams/wip/analysis/20260212-ccg-command-diff.md` | Agent Teams | 临时 |

---

## .gitignore 更新

```gitignore
# 工具缓存
.ace-tool/

# 运行时数据
debug/
todos/
telemetry/
projects/
shell-snapshots/
nul

# 统计和缓存
stats-cache.json
statsig/

# 会话历史
history.jsonl

# 三术记忆
.sanshu-memory/

# 所有工作流的临时文件（新增）
.claude/*/wip/

# IDE 锁文件
ide/*.lock

# 敏感配置
settings.json
```

---

## 实施计划

### Phase 1：创建新目录结构（5 分钟）

**目标**：创建所有工作流的目录结构

**步骤**：
```bash
# 创建 OpenSpec 工作流临时目录
mkdir -p .claude/spec/wip/{research,analysis,drafts}

# 创建 Agent Teams 工作流目录
mkdir -p .claude/agent-teams/{wip/{research,analysis,drafts},plans,reviews,archive}

# 创建六阶段工作流目录
mkdir -p .claude/workflow/{wip/{research,ideation,drafts},plans/{phase3-planning,phase4-execution},reviews/{phase5-review,phase6-acceptance},archive}

# 创建通用计划目录
mkdir -p .claude/common/{wip/drafts,plans,archive}
```

**验收标准**：
- [ ] 所有目录已创建
- [ ] 目录结构符合设计

---

### Phase 2：创建 README 文件（10 分钟）

**目标**：为每个目录创建说明文档

**步骤**：
1. 创建 `.claude/spec/wip/README.md`
2. 创建 `.claude/agent-teams/README.md`
3. 创建 `.claude/workflow/README.md`
4. 创建 `.claude/common/README.md`
5. 创建各子目录的 README.md

**验收标准**：
- [ ] 所有 README.md 已创建
- [ ] 文档内容清晰说明目录用途

---

### Phase 3：迁移现有文件（15 分钟）

**目标**：将现有文件迁移到新位置

**步骤**：
```bash
# 迁移 Agent Teams 文件
mv .claude/team-plan/agent-teams-vs-subagents-analysis.md \
   .claude/agent-teams/wip/analysis/20260213-agent-teams.md

mv .claude/team-plan/ccg-next-iteration-research.md \
   .claude/agent-teams/wip/research/20260213-ccg-next-iteration.md

mv .claude/team-plan/claude-code-features-research.md \
   .claude/agent-teams/wip/research/20260213-claude-code-features.md

mv .claude/team-plan/contextweaver-research.md \
   .claude/agent-teams/wip/research/20260213-contextweaver.md

mv .claude/team-plan/ccg-next-iteration-implementation.md \
   .claude/agent-teams/wip/drafts/20260213-ccg-implementation.md

# 迁移通用计划
mv .claude/team-plan/ccg-upgrade-plan.md \
   .claude/common/plans/20260213-ccg-upgrade-plan.md

# 迁移 plan/ 目录文件
mv plan/ccg-command-upstream-diff-20260212.md \
   .claude/agent-teams/wip/analysis/20260212-ccg-command-diff.md

# 删除空目录
rmdir .claude/team-plan
rmdir .claude/plan
rmdir plan
```

**验收标准**：
- [ ] 所有文件已迁移到新位置
- [ ] 旧目录已删除
- [ ] 文件内容完整无损

---

### Phase 4：更新 .gitignore（5 分钟）

**目标**：更新 Git 忽略规则

**步骤**：
1. 编辑 `.gitignore`
2. 添加 `.claude/*/wip/` 规则
3. 移除旧的 `plan/` 规则

**验收标准**：
- [ ] `.gitignore` 已更新
- [ ] 所有 `wip/` 目录被 Git 忽略
- [ ] 正式目录仍被 Git 跟踪

---

### Phase 5：验证测试（10 分钟）

**目标**：验证迁移后功能正常

**步骤**：
1. 测试 CCG 命令
   ```bash
   # 测试 spec-research 命令
   /ccg:spec-research "测试需求"

   # 验证约束集是否正确写入 .claude/spec/constraints/
   ```

2. 测试路径引用
   ```bash
   # 搜索所有路径引用
   grep -r "\.claude/spec" commands/ agents/

   # 验证所有引用仍然有效
   ```

3. 测试 Git 状态
   ```bash
   git status

   # 验证 wip/ 目录被忽略
   # 验证正式文件被跟踪
   ```

**验收标准**：
- [ ] 所有 CCG 命令正常运行
- [ ] 路径引用全部有效
- [ ] Git 状态符合预期

---

### Phase 6：文档更新（10 分钟）

**目标**：更新用户文档和开发者文档

**步骤**：
1. 更新 `.claude/spec/README.md`
   - 添加 `wip/` 目录说明
   - 更新目录结构图

2. 更新 `CLAUDE.md`
   - 更新路径引用说明
   - 添加新工作流目录说明

3. 创建迁移指南
   - `.claude/MIGRATION-GUIDE.md`

**验收标准**：
- [ ] README.md 已更新
- [ ] CLAUDE.md 已更新
- [ ] 迁移指南已创建

---

## 成功指标

| 指标 | 目标 | 验证方式 |
|------|------|----------|
| 文件迁移成功率 | 100% | 检查所有文件是否完整迁移 |
| 路径引用有效性 | 100% | 运行所有 CCG 命令测试 |
| 功能正常性 | 100% | 测试所有 MCP 工具和代理 |
| 用户满意度 | > 90% | 收集用户反馈 |
| 迁移时间 | < 55 分钟 | 记录实际迁移时间 |

---

## 约束映射

| 约束编号 | 约束名称 | 满足情况 |
|----------|----------|----------|
| HC-1 | 路径引用兼容性 | ✅ 满足（`.claude/spec/` 路径保持不变） |
| HC-2 | Git 规范合规性 | ✅ 满足（更新 .gitignore） |
| HC-3 | 目录结构层级限制 | ✅ 满足（最多 4 层） |
| HC-4 | 向后兼容性保证 | ✅ 满足（旧路径保持有效） |
| HC-5 | 文件类型隔离 | ✅ 满足（wip/ 与正式目录隔离） |
| HC-6 | 工具集成约束 | ✅ 满足（无需重建缓存） |
| SC-1 | 语义清晰性 | ✅ 满足（工作流 + 生命周期双层分类） |
| SC-2 | 扁平化优先 | ✅ 满足（最多 4 层嵌套） |
| SC-3 | 时间戳命名规范 | ✅ 满足（YYYYMMDD- 前缀） |
| SC-4 | 自动化清理支持 | ✅ 满足（提供清理脚本） |
| SC-5 | 文档自描述性 | ✅ 满足（每个目录有 README.md） |

---

## 风险缓解措施

| 风险编号 | 风险名称 | 缓解措施 |
|----------|----------|----------|
| RISK-1 | 迁移过程中的数据丢失 | 1. 完整备份<br>2. Git 版本控制<br>3. 提供回滚脚本<br>4. 分阶段迁移 |
| RISK-2 | 路径引用遗漏导致功能失效 | 1. `.claude/spec/` 路径保持不变<br>2. 完整测试所有 CCG 命令 |
| RISK-3 | 工具缓存失效导致性能下降 | 1. 无需重建缓存（路径未变）<br>2. 提供缓存清理脚本 |
| RISK-4 | 多人协作冲突 | 1. 在主分支完成迁移<br>2. 提供迁移指南<br>3. 通知所有协作者 |
| RISK-5 | Windows 路径长度限制 | 1. 控制路径长度 < 200 字符<br>2. 使用短命名<br>3. 在 Windows 测试 |

---

## 回滚方案

如果迁移失败，可通过以下步骤回滚：

1. 恢复备份
   ```bash
   rm -rf .claude
   cp -r .claude.backup-YYYYMMDD-HHMMSS .claude
   ```

2. 恢复 .gitignore
   ```bash
   git checkout .gitignore
   ```

3. 验证回滚
   ```bash
   git status
   ls -la .claude/
   ```

---

## 下一步行动

1. **评审提案**（通过 `mcp______zhi` 确认）
   - [ ] 确认方案是否满足需求
   - [ ] 确认迁移计划是否可行
   - [ ] 确认风险缓解措施是否充分

2. **生成零决策实施计划**（调用 `ccg:spec-plan`）
   - [ ] 基于本提案生成详细的实施计划
   - [ ] 定义每个子任务的文件范围、操作类型、实施步骤
   - [ ] 确定并行分组和依赖关系

3. **执行迁移**（调用 `ccg:spec-impl`）
   - [ ] 按计划执行迁移
   - [ ] 记录进度和变更
   - [ ] 验证每个阶段的完成情况

4. **审查与归档**（调用 `ccg:spec-review`）
   - [ ] 多模型交叉审查迁移结果
   - [ ] 处理 Critical/Warning/Info 问题
   - [ ] 归档完成的文件
