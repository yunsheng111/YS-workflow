---
version: v1.0
timestamp: 2026-02-13T05:53:00Z
constraints_file: ".claude/spec/constraints/ccg-architecture-optimization-constraints.md"
---

# 零决策实施计划：CCG 架构优化

## 计划元信息

- **提案来源**：`.claude/spec/proposals/ccg-architecture-optimization-proposal.md`
- **总步骤数**：15
- **关联约束**：HC-1, HC-3, HC-4, SC-1, SC-2, SC-3, SC-4, SC-5, DEP-4, RISK-3, RISK-4
- **预计时间**：8-13 天
- **核心目标**：保留命令层，增强智能路由能力，标准化混合策略

## 实施阶段划分

- **Phase 1: 标准化**（P0，立即实施）- 1-2 天
- **Phase 2: 智能路由**（P1，短期实施）- 2-3 天
- **Phase 3: 混合策略**（P1，短期实施）- 3-5 天
- **Phase 4: 测试与文档**（P2，中期实施）- 2-3 天

---

## Phase 1: 标准化（P0 - 立即实施）

### 子任务 1.1：定义约束集标准格式

- **文件范围**：
  - `.claude/spec/templates/constraint-template.md`（新建）
  - `.claude/spec/README.md`（更新）
- **操作类型**：新增 + 修改
- **实施步骤**：
  1. 创建约束集模板文件，包含 YAML frontmatter（version, timestamp, task）和四大约束分类（硬约束、软约束、依赖关系、风险）
  2. 更新 spec/README.md，添加"约束集格式规范"章节，说明约束编号规则（HC-N, SC-N, DEP-N, RISK-N）
- **验收标准**：模板文件存在且格式正确，README.md 包含完整的格式说明
- **约束映射**：[SC-4, DEP-4]
- **依赖**：无
- **并行分组**：Layer 1

### 子任务 1.2：定义计划标准格式

- **文件范围**：
  - `.claude/spec/templates/plan-template.md`（新建）
  - `.claude/spec/README.md`（更新）
- **操作类型**：新增 + 修改
- **实施步骤**：
  1. 创建计划模板文件，包含 YAML frontmatter（version, timestamp, constraints_file）和子任务结构（文件范围、操作类型、实施步骤、验收标准、约束映射、依赖、并行分组）
  2. 更新 spec/README.md，添加"计划格式规范"章节，说明子任务的 5 个必填字段和并行分组规则
- **验收标准**：模板文件存在且格式正确，README.md 包含完整的格式说明
- **约束映射**：[SC-4, DEP-4]
- **依赖**：无
- **并行分组**：Layer 1

### 子任务 1.3：定义报告标准格式

- **文件范围**：
  - `.claude/spec/templates/review-template.md`（新建）
  - `.claude/spec/README.md`（更新）
- **操作类型**：新增 + 修改
- **实施步骤**：
  1. 创建审查报告模板文件，包含 YAML frontmatter（version, timestamp, plan_file）和问题分级（Critical/Warning/Info）
  2. 更新 spec/README.md，添加"审查报告格式规范"章节，说明问题等级定义和评分标准
- **验收标准**：模板文件存在且格式正确，README.md 包含完整的格式说明
- **约束映射**：[SC-4, DEP-4]
- **依赖**：无
- **并行分组**：Layer 1

### 子任务 1.4：更新 ccg:team-* 命令的数据传递规范

- **文件范围**：
  - `commands/ccg/team-research.md`（修改）
  - `commands/ccg/team-plan.md`（修改）
  - `commands/ccg/team-exec.md`（修改）
  - `commands/ccg/team-review.md`（修改）
- **操作类型**：修改
- **实施步骤**：
  1. 在 team-research.md 的"输出格式"章节添加标准化说明，引用约束集模板
  2. 在 team-plan.md 的"计划文件格式规范"章节添加标准化说明，引用计划模板
  3. 在 team-exec.md 的"计划读取"章节添加验证规则
  4. 在 team-review.md 的"审查报告"章节添加标准化说明，引用报告模板
- **验收标准**：4 个命令文件都包含标准化说明，说明中引用了模板文件路径
- **约束映射**：[SC-4, DEP-4]
- **依赖**：子任务 1.1、1.2、1.3
- **并行分组**：Layer 2

### 子任务 1.5：创建数据传递验证工具

- **文件范围**：
  - `.claude/spec/tools/validate-constraint.js`（新建）
  - `.claude/spec/tools/validate-plan.js`（新建）
  - `.claude/spec/tools/validate-review.js`（新建）
  - `.claude/spec/tools/README.md`（新建）
- **操作类型**：新增
- **实施步骤**：
  1. 创建约束集验证工具（验证 YAML frontmatter、约束编号格式、结构完整性）
  2. 创建计划验证工具（验证 YAML frontmatter、子任务必填字段、文件冲突检查、并行分组）
  3. 创建审查报告验证工具（验证 YAML frontmatter、问题等级、修复计划格式）
  4. 创建工具说明文档（使用说明、验证规则、错误码说明）
- **验收标准**：3 个验证工具可正常运行，能正确识别格式错误，README.md 包含完整的使用说明
- **约束映射**：[SC-4, DEP-4, RISK-4]
- **依赖**：子任务 1.1、1.2、1.3
- **并行分组**：Layer 2

---

## Phase 2: 智能路由（P1 - 短期实施）

### 子任务 2.1：为命令添加路由元数据

- **文件范围**：
  - 所有 26 个命令文件：`commands/ccg/*.md`
- **操作类型**：修改
- **实施步骤**：
  1. 在每个命令文件的 YAML frontmatter 中添加路由元数据（complexity, collaboration, default_mode, cost_estimate, file_count_threshold, requires_realtime_alignment）
  2. 为每个命令确定路由元数据值（基于决策树）
  3. 在每个命令文件末尾添加"路由决策"章节，说明为什么选择该模式
- **验收标准**：所有 26 个命令文件都包含路由元数据，元数据值符合决策树规则，包含路由决策说明
- **约束映射**：[SC-3, HC-3]
- **依赖**：无
- **并行分组**：Layer 1

### 子任务 2.2：实现成本预估工具

- **文件范围**：
  - `.ccg/runtime/cost-estimator.cjs`（新建）
  - `.ccg/runtime/cost-estimator.spec.cjs`（新建）
- **操作类型**：新增
- **实施步骤**：
  1. 创建成本预估模块（读取命令路由元数据、预估 Token 成本、生成成本预估消息）
  2. 创建单元测试（测试简单/中等/复杂/Agent Teams 命令的成本预估）
- **验收标准**：成本预估模块可正常运行，单元测试全部通过，预估结果符合约束集定义
- **约束映射**：[HC-3, RISK-3]
- **依赖**：子任务 2.1
- **并行分组**：Layer 2

### 子任务 2.3：实现动态降级机制

- **文件范围**：
  - `.ccg/runtime/downgrade-handler.cjs`（新建）
  - `.ccg/runtime/downgrade-handler.spec.cjs`（新建）
  - `CLAUDE.md`（更新）
- **操作类型**：新增 + 修改
- **实施步骤**：
  1. 创建降级处理模块（检测 Agent Teams 可用性、生成降级方案、生成降级消息）
  2. 更新 CLAUDE.md 降级策略章节，添加 Agent Teams 降级说明
  3. 创建单元测试（测试可用性检测、降级方案生成、降级消息格式）
- **验收标准**：降级处理模块可正常运行，单元测试全部通过，CLAUDE.md 包含降级说明
- **约束映射**：[SC-3, RISK-3]
- **依赖**：子任务 2.1
- **并行分组**：Layer 2

---

## Phase 3: 混合策略（P1 - 短期实施）

### 子任务 3.1：优化 ccg:team-* 命令的阶段间数据传递

- **文件范围**：
  - `commands/ccg/team-research.md`（修改）
  - `commands/ccg/team-plan.md`（修改）
  - `commands/ccg/team-exec.md`（修改）
  - `commands/ccg/team-review.md`（修改）
- **操作类型**：修改
- **实施步骤**：
  1. 在 team-research.md 中添加数据传递检查点（调用验证工具、展示约束集摘要）
  2. 在 team-plan.md 中添加数据传递检查点（调用验证工具、展示计划摘要）
  3. 在 team-exec.md 中添加数据读取验证（检查计划文件、调用验证工具）
  4. 在 team-review.md 中添加数据传递检查点（调用验证工具、展示审查摘要）
- **验收标准**：4 个命令都包含数据传递检查点，检查点调用验证工具，验证失败时有明确的错误提示
- **约束映射**：[SC-4, DEP-4, RISK-4]
- **依赖**：子任务 1.4、1.5
- **并行分组**：Layer 1

### 子任务 3.2：实现阶段状态追踪

- **文件范围**：
  - `.ccg/runtime/stage-tracker.cjs`（新建）
  - `.ccg/runtime/stage-tracker.spec.cjs`（新建）
- **操作类型**：新增
- **实施步骤**：
  1. 创建阶段状态追踪模块（定义阶段状态、记录阶段进度、生成进度报告）
  2. 创建单元测试（测试状态转换、进度记录、报告生成）
- **验收标准**：阶段状态追踪模块可正常运行，单元测试全部通过
- **约束映射**：[SC-4, DEP-4]
- **依赖**：无
- **并行分组**：Layer 1

### 子任务 3.3：更新 ccg:workflow 命令的混合策略

- **文件范围**：
  - `commands/ccg/workflow.md`（修改）
- **操作类型**：修改
- **实施步骤**：
  1. 在"6 阶段工作流"章节明确标注每个阶段的执行模式（侦察-Subagents、规划-主代理/Subagent、突击-Agent Teams、扫尾-Subagents）
  2. 添加"混合策略说明"章节，说明为什么在不同阶段使用不同模式
  3. 添加成本预估（混合策略 2-3x vs 纯 Agent Teams 7x）
- **验收标准**：workflow.md 包含混合策略说明，明确标注每个阶段的执行模式，包含成本预估
- **约束映射**：[SC-4, HC-3]
- **依赖**：子任务 3.1、3.2
- **并行分组**：Layer 2

---

## Phase 4: 测试与文档（P2 - 中期实施）

### 子任务 4.1：创建集成测试套件

- **文件范围**：
  - `.ccg/tests/integration/routing.spec.cjs`（新建）
  - `.ccg/tests/integration/cost-estimation.spec.cjs`（新建）
  - `.ccg/tests/integration/downgrade.spec.cjs`（新建）
  - `.ccg/tests/integration/data-passing.spec.cjs`（新建）
- **操作类型**：新增
- **实施步骤**：
  1. 创建路由测试（测试所有 26 个命令的路由决策）
  2. 创建成本预估测试（测试不同任务场景的成本预估）
  3. 创建降级测试（测试 Agent Teams 不可用时的降级流程）
  4. 创建数据传递测试（测试 team-* 命令的阶段间数据传递）
- **验收标准**：4 个集成测试套件可正常运行，测试覆盖率 > 80%
- **约束映射**：[SC-5]
- **依赖**：子任务 2.1、2.2、2.3、3.1
- **并行分组**：Layer 1

### 子任务 4.2：更新架构文档

- **文件范围**：
  - `.ccg/ARCHITECTURE.md`（修改）
  - `.ccg/ARCHITECTURE-VISUAL.md`（修改）
  - `CLAUDE.md`（修改）
- **操作类型**：修改
- **实施步骤**：
  1. 在 ARCHITECTURE.md 中添加"智能路由"章节，说明路由决策树和元数据定义
  2. 在 ARCHITECTURE-VISUAL.md 中更新"命令调用流程图"，添加路由决策节点
  3. 在 CLAUDE.md 的"任务路由决策"章节添加成本预估和降级机制说明
- **验收标准**：3 个文档都包含智能路由和混合策略的说明，文档内容一致
- **约束映射**：[SC-5]
- **依赖**：子任务 2.1、2.2、2.3、3.3
- **并行分组**：Layer 2

### 子任务 4.3：创建用户指南

- **文件范围**：
  - `.ccg/docs/user-guide-routing.md`（新建）
  - `.ccg/docs/user-guide-cost-optimization.md`（新建）
- **操作类型**：新增
- **实施步骤**：
  1. 创建路由指南（如何选择合适的命令、如何理解成本预估、如何处理降级）
  2. 创建成本优化指南（如何降低 Token 成本、何时使用混合策略、如何避免成本失控）
- **验收标准**：2 个用户指南存在且内容完整，包含实际案例和最佳实践
- **约束映射**：[SC-1, SC-5]
- **依赖**：子任务 4.2
- **并行分组**：Layer 2

### 子任务 4.4：创建迁移指南

- **文件范围**：
  - `.ccg/docs/migration-guide.md`（新建）
- **操作类型**：新增
- **实施步骤**：
  1. 创建迁移指南（现有项目如何升级到新架构、如何更新自定义命令、如何处理兼容性问题）
  2. 提供迁移检查清单（需要更新的文件、需要运行的测试、需要验证的功能）
- **验收标准**：迁移指南存在且内容完整，包含检查清单和常见问题解答
- **约束映射**：[SC-5]
- **依赖**：子任务 4.2
- **并行分组**：Layer 2

---

## 文件冲突检查

| 文件路径 | 归属任务 | 状态 |
|----------|----------|------|
| `.claude/spec/README.md` | 1.1, 1.2, 1.3 | ⚠️ 多任务修改（已通过依赖关系解决：1.1/1.2/1.3 并行，累积更新） |
| `commands/ccg/team-research.md` | 1.4, 3.1 | ⚠️ 多任务修改（已通过依赖关系解决：1.4 → 3.1） |
| `commands/ccg/team-plan.md` | 1.4, 3.1 | ⚠️ 多任务修改（已通过依赖关系解决：1.4 → 3.1） |
| `commands/ccg/team-exec.md` | 1.4, 3.1 | ⚠️ 多任务修改（已通过依赖关系解决：1.4 → 3.1） |
| `commands/ccg/team-review.md` | 1.4, 3.1 | ⚠️ 多任务修改（已通过依赖关系解决：1.4 → 3.1） |
| `CLAUDE.md` | 2.3, 4.2 | ⚠️ 多任务修改（已通过依赖关系解决：2.3 → 4.2） |
| `.ccg/ARCHITECTURE.md` | 4.2 | ✅ 唯一 |
| `.ccg/ARCHITECTURE-VISUAL.md` | 4.2 | ✅ 唯一 |

**结论**：⚠️ 已通过依赖关系解决所有冲突

---

## 并行分组

### Phase 1
- **Layer 1**（并行）：任务 1.1, 1.2, 1.3
- **Layer 2**（依赖 Layer 1）：任务 1.4, 1.5

### Phase 2
- **Layer 1**（并行）：任务 2.1
- **Layer 2**（依赖 Layer 1）：任务 2.2, 2.3

### Phase 3
- **Layer 1**（并行）：任务 3.1, 3.2
- **Layer 2**（依赖 Layer 1）：任务 3.3

### Phase 4
- **Layer 1**（并行）：任务 4.1
- **Layer 2**（依赖 Layer 1）：任务 4.2, 4.3, 4.4

---

## 约束覆盖检查

| 约束编号 | 覆盖步骤 | 状态 |
|----------|----------|------|
| HC-1 | 无直接覆盖（通信拓扑差异已在提案中确认保留两种模式） | ✅ 已确认 |
| HC-3 | 2.1, 2.2, 3.3 | ✅ 已覆盖 |
| HC-4 | 无直接覆盖（嵌套约束已在现有架构中遵守） | ✅ 已确认 |
| SC-1 | 4.3 | ✅ 已覆盖 |
| SC-2 | 2.1 | ✅ 已覆盖 |
| SC-3 | 2.1, 2.3 | ✅ 已覆盖 |
| SC-4 | 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3 | ✅ 已覆盖 |
| SC-5 | 4.1, 4.2, 4.3, 4.4 | ✅ 已覆盖 |
| DEP-4 | 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2 | ✅ 已覆盖 |
| RISK-3 | 2.2, 2.3 | ✅ 已覆盖 |
| RISK-4 | 1.5, 3.1 | ✅ 已覆盖 |

**结论**：✅ 所有约束已覆盖

---

## 依赖关系图

```
Phase 1:
  1.1, 1.2, 1.3 (并行)
    ↓
  1.4, 1.5 (并行)

Phase 2:
  2.1
    ↓
  2.2, 2.3 (并行)

Phase 3:
  3.1, 3.2 (并行)
    ↓
  3.3

Phase 4:
  4.1
    ↓
  4.2, 4.3, 4.4 (并行)
```

---

## 下一步

运行 `/ccg:spec-impl` 按此计划执行实施。
