# CCG 架构优化迁移指南

本指南帮助您将现有项目升级到 CCG 架构优化后的版本。

---

## 概述

CCG 架构优化引入了以下主要变更：

1. **标准化数据传递格式**：约束集、计划、审查报告使用统一格式
2. **智能路由**：命令层添加路由元数据，支持成本预估和动态降级
3. **混合策略优化**：workflow 命令明确标注各阶段执行模式
4. **验证工具**：提供数据格式验证工具

---

## 迁移检查清单

### Phase 1：标准化（必须）

- [ ] 检查现有约束集文件是否符合新格式
- [ ] 检查现有计划文件是否符合新格式
- [ ] 检查现有审查报告文件是否符合新格式
- [ ] 运行验证工具检查格式

### Phase 2：智能路由（可选）

- [ ] 了解新的路由元数据
- [ ] 学习如何使用成本预估
- [ ] 配置 Agent Teams（如需要）

### Phase 3：混合策略（可选）

- [ ] 了解 workflow 命令的混合策略
- [ ] 评估是否需要调整工作流

### Phase 4：测试与验证（必须）

- [ ] 运行现有命令，验证兼容性
- [ ] 检查输出格式是否正确
- [ ] 验证数据传递是否正常

---

## 详细迁移步骤

### 步骤 1：备份现有文件

在开始迁移前，备份以下目录：

```bash
# 备份约束集
cp -r .claude/spec/constraints .claude/spec/constraints.backup

# 备份计划文件
cp -r .claude/spec/plans .claude/spec/plans.backup
cp -r .claude/team-plan .claude/team-plan.backup

# 备份审查报告
cp -r .claude/spec/reviews .claude/spec/reviews.backup
```

---

### 步骤 2：更新约束集格式

#### 旧格式示例

```markdown
# Team Research: 用户认证模块

## 约束集

### 硬约束
- [HC-1] 必须使用 JWT 认证 — 来源：Codex
- [HC-2] 密码必须加密存储 — 来源：安全规范

### 软约束
- [SC-1] 建议使用 bcrypt 加密 — 来源：Gemini
```

#### 新格式示例

```markdown
---
version: v1.0
timestamp: 2026-02-13T06:00:00Z
task: "用户认证模块开发"
---

# Team Research: 用户认证模块

## 硬约束（Hard Constraints）

### HC-1: JWT 认证
- **描述**：必须使用 JWT 认证
- **来源**：Codex
- **影响范围**：auth/middleware, auth/service
- **验证方式**：检查 JWT 库是否正确配置
- **违反后果**：认证功能无法正常工作

### HC-2: 密码加密
- **描述**：密码必须加密存储
- **来源**：安全规范
- **影响范围**：user/model, auth/service
- **验证方式**：检查密码字段是否使用加密
- **违反后果**：存在安全漏洞

## 软约束（Soft Constraints）

### SC-1: bcrypt 加密
- **描述**：建议使用 bcrypt 加密
- **来源**：Gemini
- **影响范围**：auth/service
- **优先级**：P1（短期）
- **权衡考虑**：可以使用其他加密算法（如 argon2）
```

#### 迁移工具

使用验证工具检查格式：

```bash
node .claude/spec/tools/validate-constraint.js .claude/spec/constraints/your-file.md
```

---

### 步骤 3：更新计划文件格式

#### 旧格式示例

```markdown
# Team Plan: 用户认证模块

## 子任务列表

### Task 1: 创建用户模型
- **类型**: 后端
- **文件范围**: models/user.js
- **依赖**: 无
- **实施步骤**:
  1. 创建 User 模型
  2. 添加密码加密
- **验收标准**: 模型创建成功
```

#### 新格式示例

```markdown
---
version: v1.0
timestamp: 2026-02-13T06:00:00Z
constraints_file: ".claude/team-plan/user-auth-research.md"
---

# Team Plan: 用户认证模块

## 计划元信息

- **提案来源**：`.claude/team-plan/user-auth-research.md`
- **总步骤数**：3
- **关联约束**：[HC-1, HC-2, SC-1]
- **预计时间**：2-3 天
- **核心目标**：实现用户认证功能

## 子任务列表

### 子任务 1.1: 创建用户模型

- **文件范围**：
  - `models/user.js`（新建）
- **操作类型**：新增
- **实施步骤**：
  1. 创建 User 模型，包含 username, email, password 字段
  2. 添加密码加密中间件（使用 bcrypt）
  3. 添加密码验证方法
- **验收标准**：User 模型创建成功，密码加密正常工作
- **约束映射**：[HC-2, SC-1]
- **依赖**：无
- **并行分组**：Layer 1

## 文件冲突检查

| 文件路径 | 归属任务 | 状态 |
|----------|----------|------|
| models/user.js | 子任务 1.1 | ✅ 唯一 |

**结论**：✅ 无冲突

## 并行分组

- **Layer 1**（并行）：子任务 1.1

## 约束覆盖检查

| 约束编号 | 覆盖步骤 | 状态 |
|----------|----------|------|
| HC-1 | 1.2 | ✅ 已覆盖 |
| HC-2 | 1.1 | ✅ 已覆盖 |
| SC-1 | 1.1 | ✅ 已覆盖 |

**结论**：✅ 所有约束已覆盖

## 依赖关系图

```
Layer 1:
  1.1
```
```

#### 迁移工具

使用验证工具检查格式：

```bash
node .claude/spec/tools/validate-plan.js .claude/spec/plans/your-file.md
```

---

### 步骤 4：更新审查报告格式

#### 旧格式示例

```markdown
# Team Review: 用户认证模块

## 发现详情

### Critical (1 issues)

| # | 维度 | 文件:行 | 描述 | 来源 |
|---|------|---------|------|------|
| 1 | 安全 | auth.js:42 | 密码未加密 | Codex |
```

#### 新格式示例

```markdown
---
version: v1.0
timestamp: 2026-02-13T06:00:00Z
plan_file: ".claude/team-plan/user-auth.md"
reviewer: "Codex + Gemini"
---

# Team Review: 用户认证模块

## 审查元信息

- **审查时间**：2026-02-13 06:00:00
- **审查范围**：team-exec 产出的所有变更
- **审查方法**：双模型交叉验证（Codex + Gemini）
- **总体评分**：65

## 问题汇总

| 等级 | 数量 | 必须修复 |
|------|------|----------|
| Critical | 1 | 是 |
| Warning | 0 | 建议 |
| Info | 0 | 可选 |

## Critical 问题（必须修复）

### C-1: 密码未加密

- **位置**：`auth.js:42`
- **描述**：密码直接存储到数据库，未进行加密
- **影响**：存在严重安全漏洞，用户密码可能泄露
- **违反约束**：[HC-2]
- **来源**：Codex
- **修复建议**：
  1. 安装 bcrypt 库：`npm install bcrypt`
  2. 在保存密码前使用 bcrypt 加密
  3. 更新密码验证逻辑
- **验证方式**：检查数据库中的密码字段是否为加密后的哈希值

## 约束合规性检查

| 约束编号 | 合规状态 | 备注 |
|----------|----------|------|
| HC-1 | ✅ 合规 | - |
| HC-2 | ❌ 违反 | 见 C-1 |
| SC-1 | ✅ 合规 | - |

**结论**：❌ 存在 Critical 问题，必须修复后才能通过审查

## 修复计划

### 立即修复（Critical）

1. **C-1**: 密码未加密
   - 负责人：Lead
   - 预计时间：1 小时
   - 验证方式：检查数据库密码字段
```

#### 迁移工具

使用验证工具检查格式：

```bash
node .claude/spec/tools/validate-review.js .claude/team-plan/your-file-review.md
```

---

### 步骤 5：了解智能路由

#### 查看命令路由元数据

所有命令文件现在包含路由元数据：

```yaml
routing:
  complexity: high
  collaboration: high
  default_mode: mixed
  cost_estimate: 2-3x
  file_count_threshold: 5
  requires_realtime_alignment: false
```

#### 使用成本预估工具

```bash
node .ccg/runtime/cost-estimator.cjs workflow 1000
```

#### 配置 Agent Teams（可选）

如果需要使用 Agent Teams，配置环境变量：

1. 打开配置文件：
   - Windows: `%APPDATA%\Claude\settings.json`
   - macOS/Linux: `~/.config/Claude/settings.json`

2. 添加配置：
   ```json
   {
     "env": {
       "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
     }
   }
   ```

3. 重启 Claude Code

---

### 步骤 6：测试验证

#### 测试约束集验证

```bash
node .claude/spec/tools/validate-constraint.js .claude/spec/constraints/test.md
```

#### 测试计划验证

```bash
node .claude/spec/tools/validate-plan.js .claude/spec/plans/test.md
```

#### 测试审查报告验证

```bash
node .claude/spec/tools/validate-review.js .claude/team-plan/test-review.md
```

#### 测试成本预估

```bash
node .ccg/runtime/cost-estimator.cjs workflow 1000
node .ccg/runtime/cost-estimator.cjs team-exec 1000
```

#### 测试降级处理

```bash
node .ccg/runtime/downgrade-handler.cjs team-exec
```

---

## 兼容性说明

### 向后兼容

- ✅ 旧格式的约束集、计划、审查报告仍然可以使用
- ✅ 现有命令仍然可以正常执行
- ✅ 不影响现有工作流

### 不兼容变更

- ❌ 验证工具要求新格式（旧格式会报错）
- ❌ 成本预估工具要求路由元数据（旧命令无法预估）

### 建议

- 新项目：使用新格式
- 现有项目：逐步迁移，优先迁移常用文件

---

## 常见问题

### Q: 必须立即迁移吗？

A: 不必须。旧格式仍然可以使用，但建议逐步迁移以享受新功能（成本预估、格式验证）。

### Q: 如何批量迁移文件？

A: 目前没有自动迁移工具，建议手动迁移重要文件，或编写脚本批量处理。

### Q: 迁移后会影响现有工作流吗？

A: 不会。新格式是向后兼容的，现有命令仍然可以正常执行。

### Q: 验证工具报错怎么办？

A: 根据错误信息修复格式问题。参考 `.claude/spec/tools/README.md` 中的错误码说明。

### Q: 成本预估不准确怎么办？

A: 成本预估是基于路由元数据的估算，实际成本可能有偏差。可以根据实际使用情况调整基准成本。

---

## 迁移支持

如果在迁移过程中遇到问题，请参考：

- [标准格式规范](./.claude/spec/README.md) - 约束集、计划、审查报告格式
- [验证工具文档](./.claude/spec/tools/README.md) - 验证工具使用说明
- [智能路由用户指南](./user-guide-routing.md) - 智能路由使用指南
- [成本优化指南](./user-guide-cost-optimization.md) - 成本优化策略

---

**版本**：v1.0
**更新时间**：2026-02-13
**适用于**：CCG 架构优化后的版本
