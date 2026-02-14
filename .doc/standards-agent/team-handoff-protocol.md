# Agent Teams 阶段间数据传递协议 (v1.0.0)

Agent Teams 工作流 `research → plan → exec → review` 四个阶段之间的标准化数据传递规范。

## 文件路径约定

| 阶段 | 产出路径 | 文件名格式 |
|------|----------|-----------|
| research | `.doc/agent-teams/research/` | `<task-name>-research.md` |
| plan | `.doc/agent-teams/plans/` | `<task-name>.md` |
| exec | 项目代码目录（由 plan 指定） | 由计划文件定义 |
| review | `.doc/agent-teams/reviews/` | `<task-name>-review.md` |

## 阶段间数据传递

### research → plan

**必传字段**：
- 约束集文件路径（research 产出）
- SESSION_ID（CODEX_SESSION / GEMINI_SESSION，供 plan 复用会话）
- 增强后的需求描述

**传递方式**：
- plan 阶段读取 `.doc/agent-teams/research/<task-name>-research.md`
- 从研究文件中提取约束编号（HC-x / SC-x / DEP-x / RISK-x）
- 约束编号在后续阶段中保持不变，用于追溯

**plan 阶段职责**：
- 引用约束时标注编号（如"因 [HC-1]，此模块必须使用 TypeScript"）
- 将约束转化为子任务的具体实施要求

### plan → exec

**必传字段**：
- 计划文件路径
- 子任务列表（含文件范围、实施步骤、验收标准）
- 并行分组信息（Layer 划分）

**传递方式**：
- exec 阶段读取 `.doc/agent-teams/plans/<task-name>.md`
- 计划文件是 exec 的唯一输入，exec 不做任何决策

**exec 阶段职责**：
- 将子任务内容完整注入 Builder 的 spawn prompt
- 不修改、不重新解释计划内容

### exec → review

**必传字段**：
- 计划文件路径（用于对照验证）
- 变更范围（`git diff` 获取）
- Builder 执行状态摘要（成功/失败/修改的文件列表）

**传递方式**：
- review 阶段通过 `git diff` 获取实际变更
- 读取计划文件对照验证子任务完成度
- 从 exec 的归档记录（`mcp______ji`）获取执行摘要

**review 阶段职责**：
- 逐条验证计划中的验收标准
- 检查越界修改（区分 Critical 和 Warning）
- 验证约束合规性（引用 research 阶段的约束编号）

## 上下文清理建议

每个阶段完成后建议执行 `/clear`，通过文件传递（而非会话上下文）保持阶段间的信息连续性。这是控制 token 成本的关键措施。

## 错误传递

当前序阶段产出缺失或不完整时：
1. 后序阶段应明确报错，指出缺失的必传字段
2. 提示用户重新运行前序命令
3. 不尝试推断或补全缺失信息

## 端到端执行示例

以下是一个完整的 Agent Teams 工作流执行示例：

### 场景：为项目添加用户认证模块

```
# 阶段 1：需求研究
/ccg:team-research 添加用户认证模块，支持 JWT + OAuth2

  → team-research-agent 启动
  → Codex 探索后端：发现现有中间件模式、数据库 ORM 约定
  → Gemini 探索前端：发现现有路由守卫模式、状态管理方案
  → 产出：.doc/agent-teams/research/user-auth-research.md
    包含：[HC-1] 必须使用项目现有 ORM / [SC-1] 前端使用 Pinia / [DEP-1] API → 前端
  → 建议：/clear 后执行下一阶段

# 阶段 2：规划
/ccg:team-plan user-auth

  → team-plan-agent 读取 research 产出
  → Codex 分析后端任务拆分、Gemini 分析前端任务拆分
  → 产出：.doc/agent-teams/plans/user-auth.md
    Task 1: 后端 API（/api/auth/*）— Layer 1
    Task 2: 前端登录页 — Layer 1
    Task 3: 路由守卫集成 — Layer 2（依赖 Task 1, 2）
  → 用户确认计划
  → 建议：/clear 后执行下一阶段

# 阶段 3：并行实施
/ccg:team-exec

  → team-exec-agent 读取 plan 产出
  → 创建 Agent Team
  → Layer 1：spawn Builder-1（后端 API）+ Builder-2（前端页面）并行
  → Layer 1 完成后 → Layer 2：spawn Builder-3（集成）
  → 汇总变更报告
  → 建议：/clear 后执行下一阶段

# 阶段 4：审查
/ccg:team-review

  → team-review-agent 获取 git diff + 读取 plan
  → Codex 审查后端安全性、Gemini 审查前端可维护性
  → Critical: 0, Warning: 2, Info: 3
  → 审查通过 → 提交代码
```

### 阶段间文件流转

```
research 产出               plan 读取 + 产出            exec 读取 + 产出            review 读取
      │                          │                          │                          │
      ▼                          ▼                          ▼                          ▼
user-auth-research.md  →  user-auth.md（计划）  →  项目代码变更  →  user-auth-review.md
 [约束集+判据]             [子任务+文件范围]       [git diff]        [审查报告]
```

## 成本估算指导

Agent Teams 的 token 成本显著高于普通会话：

| 模式 | 预估倍率 | 适用场景 |
|------|---------|----------|
| 单代理（Subagent） | ~1-2x | 简单独立任务 |
| Agent Teams（2-3 Builder） | ~4-5x | 中等复杂度并行开发 |
| Agent Teams（4+ Builder） | ~7x+ | 高复杂度多模块并行 |

**成本控制建议**：
- 阶段间执行 `/clear` 释放上下文
- 只在真正需要 P2P 通信的阶段使用 Agent Teams
- research / review 可使用 Subagent 模式降低成本
- Builder 数量控制在 2-4 个为宜
