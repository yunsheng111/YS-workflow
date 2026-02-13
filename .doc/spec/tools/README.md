# OpenSpec 数据传递验证工具

本目录包含三个验证工具，用于确保 OpenSpec 工作流中的数据传递符合标准格式。

## 工具列表

### 1. validate-constraint.js - 约束集验证工具

验证约束集文件是否符合标准格式。

**使用方法**：
```bash
node validate-constraint.js <约束集文件路径>
```

**验证规则**：
- YAML frontmatter 必须包含：version, timestamp, task
- 约束编号必须连续（HC-1, HC-2, ...）
- 硬约束（HC-*）必须包含：描述、验证方式、违反后果
- 软约束（SC-*）必须包含：描述、优先级（P0/P1/P2）、权衡考虑
- 依赖关系（DEP-*）必须包含：类型（技术/数据/时序）、描述、影响范围
- 风险（RISK-*）必须包含：描述、概率（高/中/低）、影响（高/中/低）、缓解措施

**示例**：
```bash
node validate-constraint.js .claude/spec/constraints/ccg-architecture-optimization-constraints.md
```

---

### 2. validate-plan.js - 计划验证工具

验证计划文件是否符合标准格式。

**使用方法**：
```bash
node validate-plan.js <计划文件路径>
```

**验证规则**：
- YAML frontmatter 必须包含：version, timestamp, constraints_file
- 每个子任务必须包含 7 个必填字段：
  1. 文件范围（必须标注操作类型：新建/修改/删除）
  2. 操作类型（新增/修改/删除）
  3. 实施步骤（编号列表）
  4. 验收标准
  5. 约束映射（如 [HC-1, SC-2]）
  6. 依赖（无 / 子任务 X.Y）
  7. 并行分组（Layer 1 / Layer 2）
- 必须包含文件冲突检查表
- 必须包含并行分组章节
- 必须包含约束覆盖检查
- 必须包含依赖关系图

**示例**：
```bash
node validate-plan.js .claude/spec/plans/ccg-architecture-optimization-plan.md
```

---

### 3. validate-review.js - 审查报告验证工具

验证审查报告文件是否符合标准格式。

**使用方法**：
```bash
node validate-review.js <审查报告文件路径>
```

**验证规则**：
- YAML frontmatter 必须包含：version, timestamp, plan_file, reviewer
- 必须包含问题汇总表（Critical/Warning/Info 数量）
- Critical 问题必须包含：位置、描述、影响、违反约束、修复建议、验证方式
- Warning 问题必须包含：位置、描述、影响、违反约束、修复建议、优先级（高/中/低）
- Info 问题必须包含：位置、描述、优化建议、预期收益
- 必须包含约束合规性检查
- 必须包含修复计划（如果有 Critical 问题，必须有立即修复计划）
- 总体评分必须在 0-100 范围内，且与问题数量一致

**示例**：
```bash
node validate-review.js .claude/team-plan/user-auth-module-review.md
```

---

## 错误码说明

### 约束集验证错误

| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| E001 | 缺少 YAML frontmatter | 在文件开头添加 `---` 包裹的 YAML frontmatter |
| E002 | YAML frontmatter 缺少必填字段 | 添加缺失的字段（version, timestamp, task） |
| E003 | 约束编号不连续 | 检查约束编号，确保从 1 开始连续递增 |
| E004 | 约束缺少必填字段 | 根据约束类型添加对应的必填字段 |
| E005 | 优先级格式错误 | 软约束优先级必须为 P0/P1/P2 |
| E006 | 类型格式错误 | 依赖关系类型必须为 技术依赖/数据依赖/时序依赖 |
| E007 | 概率/影响格式错误 | 风险的概率和影响必须为 高/中/低 |

### 计划验证错误

| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| P001 | 缺少 YAML frontmatter | 在文件开头添加 `---` 包裹的 YAML frontmatter |
| P002 | YAML frontmatter 缺少必填字段 | 添加缺失的字段（version, timestamp, constraints_file） |
| P003 | 未找到任何子任务 | 添加至少一个子任务 |
| P004 | 子任务缺少必填字段 | 添加缺失的 7 个必填字段 |
| P005 | 操作类型格式错误 | 操作类型必须为 新增/修改/删除 |
| P006 | 并行分组格式错误 | 并行分组必须为 Layer N 格式 |
| P007 | 文件范围为空 | 添加至少一个文件到文件范围 |
| P008 | 文件未标注操作类型 | 在文件路径后添加（新建/修改/删除） |
| P009 | 实施步骤为空 | 添加至少一个实施步骤 |
| P010 | 文件冲突未记录 | 在文件冲突检查表中记录冲突文件 |
| P011 | 缺少必要章节 | 添加缺失的章节（文件冲突检查/并行分组/约束覆盖检查/依赖关系图） |

### 审查报告验证错误

| 错误码 | 描述 | 解决方法 |
|--------|------|----------|
| R001 | 缺少 YAML frontmatter | 在文件开头添加 `---` 包裹的 YAML frontmatter |
| R002 | YAML frontmatter 缺少必填字段 | 添加缺失的字段（version, timestamp, plan_file, reviewer） |
| R003 | 问题汇总表格式错误 | 确保问题汇总表包含 Critical/Warning/Info 三行 |
| R004 | 问题缺少必填字段 | 根据问题等级添加对应的必填字段 |
| R005 | 位置格式错误 | 位置必须为 \`文件路径:行号\` 格式 |
| R006 | 修复建议为空 | 添加至少一个修复步骤 |
| R007 | 优先级格式错误 | Warning 问题优先级必须为 高/中/低 |
| R008 | 缺少必要章节 | 添加缺失的章节（约束合规性检查/修复计划） |
| R009 | 缺少立即修复计划 | 存在 Critical 问题时必须有立即修复计划 |
| R010 | 评分格式错误 | 总体评分必须为 0-100 的数字 |
| R011 | 评分与问题数量不一致 | 存在 Critical 问题时评分不能 >= 70 |

---

## 集成到工作流

### 在 ccg:team-research 中使用

```javascript
// 研究阶段完成后验证约束集
const { validateConstraint } = require('.claude/spec/tools/validate-constraint.js');
const result = validateConstraint('.claude/team-plan/<任务名>-research.md');

if (!result.valid) {
  console.error('约束集格式验证失败：');
  result.errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}
```

### 在 ccg:team-plan 中使用

```javascript
// 规划阶段完成后验证计划
const { validatePlan } = require('.claude/spec/tools/validate-plan.js');
const result = validatePlan('.claude/team-plan/<任务名>.md');

if (!result.valid) {
  console.error('计划格式验证失败：');
  result.errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}
```

### 在 ccg:team-exec 中使用

```javascript
// 实施阶段开始前验证计划
const { validatePlan } = require('.claude/spec/tools/validate-plan.js');
const result = validatePlan('.claude/team-plan/<任务名>.md');

if (!result.valid) {
  console.error('计划文件格式不符合标准，请先运行 /ccg:team-plan 重新生成计划');
  process.exit(1);
}
```

### 在 ccg:team-review 中使用

```javascript
// 审查阶段完成后验证报告
const { validateReview } = require('.claude/spec/tools/validate-review.js');
const result = validateReview('.claude/team-plan/<任务名>-review.md');

if (!result.valid) {
  console.error('审查报告格式验证失败：');
  result.errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}
```

---

## 开发指南

### 添加新的验证规则

1. 在对应的验证工具中添加验证逻辑
2. 在错误数组中添加错误信息
3. 更新本 README 的错误码说明
4. 添加单元测试（如果有测试框架）

### 测试验证工具

```bash
# 测试约束集验证
node validate-constraint.js .claude/spec/templates/constraint-template.md

# 测试计划验证
node validate-plan.js .claude/spec/templates/plan-template.md

# 测试审查报告验证
node validate-review.js .claude/spec/templates/review-template.md
```

---

## 常见问题

### Q: 验证工具报错但文件看起来正确？

A: 检查以下几点：
1. 文件编码是否为 UTF-8 无 BOM
2. YAML frontmatter 的 `---` 是否在文件开头（第一行）
3. 字段名是否使用了中文全角冒号（应使用英文半角冒号）
4. 列表项是否使用了正确的 Markdown 格式（`- ` 或 `1. `）

### Q: 如何跳过验证？

A: 不建议跳过验证。如果确实需要，可以在命令中添加 `--skip-validation` 参数（需要在命令文件中实现）。

### Q: 验证工具可以自动修复错误吗？

A: 当前版本仅提供验证功能，不提供自动修复。未来版本可能会添加 `--fix` 参数来自动修复常见错误。

---

## 版本历史

- **v1.0** (2026-02-13): 初始版本，支持约束集、计划、审查报告的基本验证
