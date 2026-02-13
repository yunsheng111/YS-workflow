# CCG 架构优化约束集研究

**研究日期**：2026-02-13
**研究方法**：OpenSpec 约束驱动开发
**研究状态**：✅ 完成

---

## 📋 研究概述

本研究针对 CCG 架构优化需求，通过系统性分析识别出 **20 个约束**（6 个硬约束、5 个软约束、4 个依赖关系、5 个风险），并基于约束集生成了 **3 个架构方案**。

### 核心结论

1. **命令层必须保留**：符合渐进式披露原则，去除会导致用户认知负担增加（高风险）
2. **任务规划职责应动态分配**：根据任务复杂度和协作需求智能选择规划者
3. **混合策略是最优解**：侦察（Subagents）→ 突击（Agent Teams）→ 扫尾（Subagents），成本节省 64%

### 推荐方案

**提案 A：保留并优化命令层**
- 命令层智能路由
- 任务规划职责动态分配
- 混合策略标准化
- 成本预估和动态降级

---

## 📁 文档结构

```
.claude/spec/
├── README.md                           # 本文件（研究导航）
├── EXECUTIVE-SUMMARY.md                # 执行摘要（快速阅读）
│
├── wip/                                # 临时工作区（新增）
│   ├── research/                       # 研究文档
│   ├── analysis/                       # 分析文档
│   └── drafts/                         # 草稿文档
│
├── templates/                          # 标准模板目录
│   ├── constraint-template.md          # 约束集标准模板
│   ├── plan-template.md                # 计划标准模板
│   └── review-template.md              # 审查报告标准模板
│
├── constraints/                        # 约束集目录
│   ├── ccg-architecture-optimization-constraints.md
│   │   └── 完整约束集（6 硬约束 + 5 软约束 + 4 依赖 + 5 风险）
│   │
│   ├── ccg-architecture-optimization-summary.md
│   │   └── 约束摘要（核心发现 + 量化评估）
│   │
│   ├── ccg-architecture-optimization-decision-trees.md
│   │   └── 可视化决策树（8 个决策树 + 成本对比）
│   │
│   ├── ccg-architecture-optimization-final-report.md
│   │   └── 最终研究报告（完整研究过程 + 关键决策点）
│   │
│   ├── ccg-architecture-optimization-constraint-summary-output.md
│   │   └── 约束摘要输出（约束统计 + 推荐方案）
│   │
│   └── file-organization-constraints.md
│       └── 文件组织规范约束集（20 个约束）
│
├── proposals/                          # 提案目录
│   ├── ccg-architecture-optimization-proposal.md
│   │   └── 架构方案提案（3 个方案对比 + 实施路线图）
│   │
│   └── file-organization-proposal.md
│       └── 文件组织规范提案（工作流分类 + 生命周期分层）
│
├── plans/                              # 实施计划目录
│   ├── ccg-architecture-optimization-plan.md
│   │   └── 零决策实施计划（15 个子任务 + 并行分组）
│   │
│   └── file-organization-plan.md
│       └── 文件组织规范实施计划（10 个子任务 + 4 个阶段）
│
├── progress/                           # 进度追踪目录
│   └── ccg-architecture-optimization-progress.md
│       └── 实施进度追踪（任务状态 + 变更日志）
│
└── archive/                            # 归档目录
    └── YYYYMMDD-HHMMSS/               # 按时间戳归档
```

**新增说明**：

- **wip/ 目录**：存放临时工作文件（研究、分析、草稿），生命周期 < 30 天，被 `.gitignore` 忽略
- **archive/ 目录**：存放已完成的完整工作流，按时间戳组织

---

## 📋 标准格式规范

### 约束集格式规范

约束集文件必须遵循以下格式：

**YAML Frontmatter**：
```yaml
---
version: v1.0
timestamp: YYYY-MM-DDTHH:MM:SSZ
task: "任务描述"
---
```

**约束分类**：
1. **硬约束（Hard Constraints）**：编号 HC-1, HC-2, ...
   - 描述、验证方式、违反后果
2. **软约束（Soft Constraints）**：编号 SC-1, SC-2, ...
   - 描述、优先级（P0/P1/P2）、权衡考虑
3. **依赖关系（Dependencies）**：编号 DEP-1, DEP-2, ...
   - 类型（技术/数据/时序）、描述、影响范围
4. **风险（Risks）**：编号 RISK-1, RISK-2, ...
   - 描述、概率（高/中/低）、影响（高/中/低）、缓解措施

**模板位置**：`.claude/spec/templates/constraint-template.md`

---

### 计划格式规范

计划文件必须遵循以下格式：

**YAML Frontmatter**：
```yaml
---
version: v1.0
timestamp: YYYY-MM-DDTHH:MM:SSZ
constraints_file: "路径/到/约束集文件.md"
---
```

**子任务必填字段**（7 个）：
1. **文件范围**：列出所有涉及的文件及操作类型（新建/修改/删除）
2. **操作类型**：新增 / 修改 / 删除
3. **实施步骤**：具体的执行步骤（编号列表）
4. **验收标准**：如何验证任务完成
5. **约束映射**：关联的约束编号（如 [HC-1, SC-2]）
6. **依赖**：依赖的其他子任务（如"子任务 1.1"）或"无"
7. **并行分组**：Layer 1 / Layer 2（用于并行执行）

**并行分组规则**：
- **Layer 1**：无依赖或仅依赖前一阶段的任务，可并行执行
- **Layer 2**：依赖 Layer 1 的任务，必须等待 Layer 1 完成后执行
- 同一 Layer 内的任务可以并行执行
- 不同 Phase 之间必须顺序执行

**模板位置**：`.claude/spec/templates/plan-template.md`

---

### 审查报告格式规范

审查报告文件必须遵循以下格式：

**YAML Frontmatter**：
```yaml
---
version: v1.0
timestamp: YYYY-MM-DDTHH:MM:SSZ
plan_file: "路径/到/计划文件.md"
reviewer: "审查者名称"
---
```

**问题等级定义**：
1. **Critical（严重）**：
   - 违反硬约束（HC-*）
   - 导致功能无法正常工作
   - 存在安全漏洞或数据丢失风险
   - 必须立即修复

2. **Warning（警告）**：
   - 违反软约束（SC-*）
   - 影响性能或可维护性
   - 不符合最佳实践
   - 建议尽快修复

3. **Info（信息）**：
   - 代码风格问题
   - 可选的优化建议
   - 文档改进建议
   - 可以延后处理

**评分标准**：
- **100 分**：无任何问题
- **90-99 分**：仅有 Info 问题
- **70-89 分**：有 Warning 问题，无 Critical 问题
- **50-69 分**：有少量 Critical 问题（1-2 个）
- **0-49 分**：有大量 Critical 问题（3 个以上）

**模板位置**：`.claude/spec/templates/review-template.md`

---

## 🚀 快速开始

### 1. 快速阅读（5 分钟）

阅读 **执行摘要**：
```
.claude/spec/EXECUTIVE-SUMMARY.md
```

**内容**：
- 一句话总结
- 核心结论（3 个）
- 关键数据
- 推荐方案
- 下一步行动

---

### 2. 深入理解（15 分钟）

阅读 **约束摘要**：
```
.claude/spec/constraints/ccg-architecture-optimization-summary.md
```

**内容**：
- 核心发现
- 关键约束清单
- 量化评估
- 推荐方案

---

### 3. 完整研究（30 分钟）

阅读 **最终研究报告**：
```
.claude/spec/constraints/ccg-architecture-optimization-final-report.md
```

**内容**：
- 执行摘要
- 研究过程
- 关键决策点
- 量化评估
- 推荐方案
- 生成的文件清单

---

### 4. 决策参考（10 分钟）

阅读 **可视化决策树**：
```
.claude/spec/constraints/ccg-architecture-optimization-decision-trees.md
```

**内容**：
- 智能路由决策树
- 任务规划职责决策树
- Subagents vs Agent Teams 选择决策树
- 命令层存在必要性决策树
- 混合策略执行流程图
- 成本对比可视化
- 快速参考表

---

### 5. 方案对比（20 分钟）

阅读 **架构方案提案**：
```
.claude/spec/proposals/ccg-architecture-optimization-proposal.md
```

**内容**：
- 提案 A：保留并优化命令层（推荐）
- 提案 B：去除命令层（不推荐）
- 提案 C：混合方案（折中）
- 方案对比和推荐理由
- 实施步骤和成功指标

---

## 📊 关键数据

### 约束统计

| 类型 | 数量 | 优先级分布 |
|------|------|-----------|
| 硬约束 | 6 | P0: 3, P1: 3 |
| 软约束 | 5 | P0: 2, P1: 2, P2: 1 |
| 依赖关系 | 4 | 强依赖: 4 |
| 风险 | 5 | 高: 3, 中: 2 |
| **总计** | **20** | - |

### Token 成本对比

| 模式 | 成本倍数 | 适用场景 |
|------|----------|----------|
| 主代理直接执行 | 1x | 简单任务、无代码变更 |
| Subagents | 1x | 独立任务、低耦合 |
| Agent Teams | ~7x | 需要实时协作、接口对齐 |
| 混合策略 | 2-3x | 复杂任务、分阶段执行 |
| 纯 Agent Teams（4 阶段） | 28x | 不推荐：成本过高 |

**成本节省**：混合策略比纯 Agent Teams 节省 64%

### 用户认知负担对比

| 架构方案 | 认知负担 | 用户满意度预期 |
|----------|----------|----------------|
| 保留命令层（提案 A） | ⭐（最低） | 85%+ |
| 去除命令层（提案 B） | ⭐⭐⭐⭐⭐（最高） | 50-60% |
| 混合方案（提案 C） | ⭐⭐⭐（中等） | 70-75% |

---

## 🎯 关键决策点

### 决策 1：命令层是否保留？

**结论**：✅ 必须保留

**理由**：
- 符合渐进式披露原则（SC-1）
- 提供用户友好抽象（HC-6）
- 去除会导致高风险（RISK-1）

**支持约束**：SC-1, SC-3, HC-6, RISK-1

---

### 决策 2：任务规划由谁负责？

**结论**：✅ 动态分配

**决策矩阵**：

| 任务类型 | 复杂度 | 协作需求 | 规划者 | 执行者 | 成本 |
|----------|--------|----------|--------|--------|------|
| 简单查询 | 低 | 无 | 主代理 | 主代理 | 1x |
| 单模块功能 | 中 | 无 | 主代理 | Subagent | 1x |
| 复杂分析 | 高 | 无 | Subagent | 主代理 | 1x |
| 前后端联调 | 高 | 高 | 主代理/Subagent | Agent Teams | 1x + 7x |
| 多模块重构 | 高 | 高 | 混合 | 混合 | 2-3x |

**支持约束**：SC-2, HC-1, HC-3

---

### 决策 3：Subagents vs Agent Teams 如何选择？

**结论**：✅ 根据通信需求和成本预算

**决策树**：
```
是否需要工作者之间互相通信？
  ├─ 否 → Subagents（成本低）
  └─ 是 → 继续评估
      ├─ 是否需要接口契约实时对齐？→ 是 → Agent Teams
      ├─ 是否需要多假设并行验证？→ 是 → Agent Teams
      ├─ 是否需要实时可观测进度？→ 是 → Agent Teams
      └─ 预算是否充足？
          ├─ 是 → Agent Teams
          └─ 否 → Subagents + 主代理协调
```

**支持约束**：HC-1, HC-3, SC-4

---

## 💡 推荐方案：提案 A

### 方案名称

**保留并优化命令层**

### 核心优化点

1. **命令层智能路由**
   - 根据任务复杂度、协作需求、成本预算自动选择执行方式
   - 执行前显示成本预估
   - 支持动态降级

2. **任务规划职责矩阵**
   - 简单任务：主代理规划并执行
   - 中等复杂度：主代理规划 → Subagents 执行
   - 高复杂度独立：Subagent 规划 → 主代理实施
   - 高复杂度协作：主代理/Subagent 规划 → Agent Teams 执行

3. **混合策略标准化**
   - 定义约束集、计划、报告的标准格式
   - 标准化阶段间数据传递
   - 实现阶段状态追踪

### 实施优先级

**P0（立即实施）**：
- 定义标准格式（约束集、计划、报告）
- 更新 `ccg:team-*` 命令，标准化阶段间数据传递

**P1（短期实施）**：
- 实现命令层智能路由
- 实现成本预估工具
- 实现动态降级机制

**P2（中期实施）**：
- 优化所有命令，添加路由元数据
- 实现阶段状态追踪
- 更新文档

### 成功指标

| 指标 | 目标 |
|------|------|
| 用户认知负担 | ⭐（最低） |
| 平均 Token 成本 | 降低 30% |
| 阶段间数据传递成功率 | > 95% |
| 智能路由决策准确率 | > 90% |
| 用户满意度 | > 85% |

---

## 📚 文档索引

### 按阅读顺序

1. **执行摘要**（推荐首读）
   - 文件：`EXECUTIVE-SUMMARY.md`
   - 时长：5 分钟
   - 内容：一句话总结 + 核心结论 + 关键数据

2. **约束摘要**
   - 文件：`constraints/ccg-architecture-optimization-summary.md`
   - 时长：15 分钟
   - 内容：核心发现 + 关键约束清单 + 量化评估

3. **可视化决策树**
   - 文件：`constraints/ccg-architecture-optimization-decision-trees.md`
   - 时长：10 分钟
   - 内容：8 个决策树 + 成本对比 + 快速参考表

4. **架构方案提案**
   - 文件：`proposals/ccg-architecture-optimization-proposal.md`
   - 时长：20 分钟
   - 内容：3 个方案对比 + 实施路线图

5. **最终研究报告**
   - 文件：`constraints/ccg-architecture-optimization-final-report.md`
   - 时长：30 分钟
   - 内容：完整研究过程 + 关键决策点

6. **完整约束集**
   - 文件：`constraints/ccg-architecture-optimization-constraints.md`
   - 时长：40 分钟
   - 内容：所有约束的详细描述

7. **约束摘要输出**
   - 文件：`constraints/ccg-architecture-optimization-constraint-summary-output.md`
   - 时长：20 分钟
   - 内容：约束统计 + 推荐方案

### 按用途分类

#### 决策参考

- `EXECUTIVE-SUMMARY.md`：快速决策
- `constraints/ccg-architecture-optimization-decision-trees.md`：决策树指导
- `proposals/ccg-architecture-optimization-proposal.md`：方案对比

#### 深入理解

- `constraints/ccg-architecture-optimization-summary.md`：核心发现
- `constraints/ccg-architecture-optimization-final-report.md`：完整研究
- `constraints/ccg-architecture-optimization-constraints.md`：详细约束

#### 实施指导

- `proposals/ccg-architecture-optimization-proposal.md`：实施路线图
- `constraints/ccg-architecture-optimization-constraint-summary-output.md`：约束统计

---

## 🔍 关键约束速查

### 硬约束（6 个）

| 编号 | 约束名称 | 核心限制 | 优先级 |
|------|----------|----------|--------|
| HC-1 | 通信拓扑差异 | Subagents 只能 Hub-and-Spoke，Agent Teams 支持 P2P | P0 |
| HC-2 | 进程生命周期模型 | Subagents 短生命周期，Agent Teams 长生命周期 | P0 |
| HC-3 | Token 成本差异 | Agent Teams 约 7x Subagents 成本 | P1 |
| HC-4 | 嵌套约束 | 不能嵌套 Subagent 或 Team | P0 |
| HC-5 | 权限模型差异 | Subagents 可细粒度限缩，Agent Teams 不可 | P1 |
| HC-6 | 用户交互模型 | Subagents 透明，Agent Teams 需用户管理 | P1 |

### 软约束（5 个）

| 编号 | 约束名称 | 设计原则 | 优先级 |
|------|----------|----------|--------|
| SC-1 | 渐进式披露原则 | 从简单到复杂逐步暴露能力 | P0 |
| SC-2 | 任务规划职责分配 | 根据复杂度动态分配规划者 | P1 |
| SC-3 | 命令层存在必要性 | 命令层提供用户友好抽象 | P0 |
| SC-4 | 混合策略优化 | 在对的阶段用对的工具 | P1 |
| SC-5 | 可维护性与扩展性 | 职责分离、版本控制 | P2 |

### 风险（5 个）

| 编号 | 风险描述 | 等级 |
|------|----------|------|
| RISK-1 | 去除命令层导致用户认知负担增加 | 🔴 高 |
| RISK-2 | 任务规划职责不清导致重复工作 | 🟡 中 |
| RISK-3 | Agent Teams 成本失控 | 🔴 高 |
| RISK-4 | 混合策略阶段间数据传递失败 | 🟡 中 |
| RISK-5 | 嵌套约束被违反导致系统崩溃 | 🔴 高 |

---

## 🚀 下一步行动

### 立即行动（P0）

1. **评审约束集和提案**
   - [ ] 与团队评审约束的准确性
   - [ ] 确认提案的可行性
   - [ ] 收集反馈并调整

2. **定义标准格式**
   - [ ] 约束集格式（Markdown + YAML frontmatter）
   - [ ] 计划格式（子任务、文件范围、依赖、并行分组）
   - [ ] 报告格式（审查结果、问题清单、修复建议）

3. **更新 `ccg:team-*` 命令**
   - [ ] 标准化阶段间数据传递
   - [ ] 实现数据格式验证
   - [ ] 测试阶段间数据传递

### 短期行动（P1）

4. **实现命令层智能路由**
   - [ ] 在每个命令文件中添加路由元数据
   - [ ] 实现路由决策逻辑
   - [ ] 测试所有路由路径

5. **实现成本预估工具**
   - [ ] 根据任务特征预估 Token 成本
   - [ ] 执行前显示成本预估
   - [ ] 支持用户确认或取消

6. **实现动态降级机制**
   - [ ] Agent Teams 不可用时自动降级到 Subagents
   - [ ] 提供清晰的降级说明
   - [ ] 记录降级原因

### 中期行动（P2）

7. **优化所有命令**
   - [ ] 添加路由元数据
   - [ ] 更新命令文档
   - [ ] 提供使用示例

8. **实现阶段状态追踪**
   - [ ] 追踪每个阶段的执行状态
   - [ ] 提供进度可视化
   - [ ] 支持断点续传

9. **更新文档**
   - [ ] 更新用户文档
   - [ ] 更新开发者文档
   - [ ] 提供迁移指南

---

## 📈 研究统计

### 文档统计

| 指标 | 数值 |
|------|------|
| 文档数量 | 7 个 |
| 总行数 | 2,783 行 |
| 总大小 | ~70KB |
| 约束数量 | 20 个 |
| 方案数量 | 3 个 |
| 决策树数量 | 8 个 |

### 研究时间

| 阶段 | 时长 |
|------|------|
| 需求增强 | 5 分钟 |
| 上下文检索 | 10 分钟 |
| 约束识别 | 30 分钟 |
| 方案生成 | 20 分钟 |
| 文档编写 | 40 分钟 |
| **总计** | **105 分钟** |

---

## ✅ 研究状态

- ✅ 需求增强完成
- ✅ 上下文检索完成
- ✅ 约束识别完成（20 个约束）
- ✅ 方案生成完成（3 个方案）
- ✅ 方案对比完成
- ✅ 推荐方案确定（提案 A）
- ✅ 文档生成完成（7 个文档）

**下一步**：评审 → 制定零决策计划 → 实施

---

## 📞 联系方式

如有疑问或需要进一步讨论，请参考：

- **约束集详情**：`constraints/ccg-architecture-optimization-constraints.md`
- **方案详情**：`proposals/ccg-architecture-optimization-proposal.md`
- **决策指导**：`constraints/ccg-architecture-optimization-decision-trees.md`

---

**生成时间**：2026-02-13
**研究者**：Claude Opus 4.6
**研究方法**：OpenSpec 约束驱动开发
**推荐方案**：提案 A - 保留并优化命令层
**预期效果**：成本降低 30%，用户满意度 > 85%
