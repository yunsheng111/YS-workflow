# D 组对比报告：team-* 命令文件（Agent Teams 系列）

> 生成时间：2026-02-12
> 上游目录：`D:/Program Files/nvm/node_global/node_modules/ccg-workflow/templates/commands/`
> 本地目录：`C:/Users/Administrator/.claude/commands/ccg/`

---

## 1. 一致性验证结果表

| 文件名 | 上游字节数 | 本地字节数 | diff 结果 | 一致性 |
|--------|-----------|-----------|-----------|--------|
| team-exec.md | 3692 | 3692 | 无差异 | 完全一致 |
| team-plan.md | 4445 | 4445 | 无差异 | 完全一致 |
| team-research.md | 5497 | 5497 | 无差异 | 完全一致 |
| team-review.md | 4276 | 4276 | 无差异 | 完全一致 |

**结论：4 个文件全部与上游完全一致，本地无任何定制修改。**

---

## 2. 每个文件的工作流结构摘要

### 2.1 team-exec.md（并行实施）

**定位**：读取 team-plan 产出的计划文件，spawn Builder teammates 并行写代码。

**核心哲学**：
- 实施是纯机械执行，所有决策已在 team-plan 阶段完成
- Lead 不写代码，只做协调和汇总
- Builder teammates 并行实施，文件范围严格隔离

**步骤流程**：
1. **前置检查** - 检测 Agent Teams 是否可用 + 读取计划文件
2. **解析计划** - 解析子任务列表、文件范围、依赖关系、并行分组；向用户展示摘要并确认
3. **创建 Team + spawn Builders** - 按 Layer 分组 spawn Builder（Sonnet）；每个 Builder 有严格的文件范围约束
4. **监控进度** - 等待所有 Builder 完成；处理求助和失败
5. **汇总 + 清理** - 输出变更摘要表格；关闭所有 teammates

**退出标准**：所有 Builder 完成 / 变更摘要已输出 / Team 已清理

---

### 2.2 team-plan.md（规划）

**定位**：Lead 调用 Codex/Gemini 并行分析，产出零决策并行实施计划。

**核心哲学**：
- 计划必须让 Builder teammates 能无决策机械执行
- 子任务文件范围必须隔离，确保并行不冲突
- 多模型协作强制：Codex（后端权威）+ Gemini（前端权威）

**步骤流程**：
1. **上下文收集** - Glob/Grep/Read 分析项目结构；优先使用语义检索
2. **多模型并行分析（PARALLEL）** - 同时发起 Codex + Gemini 后台分析；使用 codeagent-wrapper
3. **综合分析 + 任务拆分** - 后端以 Codex 为准，前端以 Gemini 为准；按 Layer 分组
4. **写入计划文件** - 路径 `.claude/team-plan/<任务名>.md`；包含分析摘要、子任务列表、并行分组
5. **用户确认** - 展示计划摘要；AskUserQuestion 确认
6. **上下文检查点** - 报告上下文使用量

**退出标准**：双模型分析完成 / 子任务文件范围无冲突 / 计划文件已写入 / 用户已确认

---

### 2.3 team-research.md（需求研究）

**定位**：并行探索代码库，产出约束集 + 可验证成功判据。

**核心哲学**：
- 产出的是约束集，不是信息堆砌；每条约束缩小解决方案空间
- 约束告诉后续阶段"不要考虑这个方向"
- 输出：约束集合 + 可验证的成功判据

**步骤流程**：
0. **MANDATORY: Prompt 增强** - 分析意图、缺失信息、隐含假设；补全为结构化需求
1. **代码库评估** - 扫描项目结构、判断规模、识别技术栈
2. **定义探索边界** - 按上下文边界划分（非角色划分）：用户域/认证授权/基础设施
3. **多模型并行探索（PARALLEL）** - Codex 后端边界 + Gemini 前端边界；输出 JSON 格式约束
4. **聚合与综合** - 硬约束/软约束/依赖/风险 四维分类
5. **歧义消解** - 优先级排序的开放问题；AskUserQuestion 系统性确认
6. **写入研究文件** - 路径 `.claude/team-plan/<任务名>-research.md`
7. **上下文检查点** - 报告使用量；提示运行 team-plan

**退出标准**：双模型探索完成 / 歧义已解决 / 约束集已写入 / 零开放问题

---

### 2.4 team-review.md（审查）

**定位**：双模型交叉审查并行实施的产出，分级处理 Critical/Warning/Info。

**核心哲学**：
- 双模型交叉验证捕获单模型审查遗漏的盲区
- Critical 问题必须修复后才能结束
- 审查范围严格限于 team-exec 的变更

**步骤流程**：
1. **收集变更产物** - git diff 获取变更；读取计划文件作为审查基准
2. **多模型审查（PARALLEL）** - Codex 审查维度：logic/security/performance/error_handling；Gemini 审查维度：patterns/maintainability/accessibility/ux/frontend_security
3. **综合发现** - 合并去重；三级分类：Critical/Warning/Info
4. **输出审查报告** - 按严重性分级的 Markdown 报告
5. **决策门** - Critical > 0 时：询问修复/跳过；Lead 可直接修复 Critical 问题
6. **上下文检查点** - 报告使用量

**退出标准**：双模型审查完成 / 发现已分级 / Critical = 0 / 报告已输出

---

## 3. Agent Teams 工作流模式分析

### 3.1 设计理念

Agent Teams 系列实现了一个 **研究 -> 规划 -> 实施 -> 审查** 的四阶段工作流：

```
team-research  -->  team-plan  -->  team-exec  -->  team-review
  (约束发现)       (零决策规划)    (并行实施)      (交叉审查)
```

### 3.2 核心设计模式

| 模式 | 描述 | 体现文件 |
|------|------|----------|
| **多模型强制协作** | 每个阶段都要求 Codex + Gemini 并行分析 | 全部 4 个文件 |
| **文件范围隔离** | 子任务文件范围不重叠，保证并行安全 | team-plan, team-exec |
| **零决策执行** | 实施阶段不做决策，所有决策在规划阶段完成 | team-plan, team-exec |
| **约束驱动** | research 产出约束集（非信息），缩小方案空间 | team-research |
| **Lead-Builder 分离** | Lead 只协调不写码（exec）；唯一例外是 review 修复 Critical | team-exec, team-review |
| **分层并行（Layer）** | 同 Layer 并行，跨 Layer 串行 | team-plan, team-exec |
| **上下文检查点** | 每阶段结束报告上下文使用量，建议 /clear | 全部 4 个文件 |
| **codeagent-wrapper** | 统一的多模型调用接口，支持 codex/gemini 后端 | team-plan, team-research, team-review |

### 3.3 数据流

```
team-research 输出:
  .claude/team-plan/<任务名>-research.md  (约束集 + 成功判据)
       |
       v
team-plan 输入: research 文件
team-plan 输出:
  .claude/team-plan/<任务名>.md  (子任务列表 + 并行分组 + 文件范围)
       |
       v
team-exec 输入: plan 文件
team-exec 输出: 实际代码变更 (由 Builder teammates 产出)
       |
       v
team-review 输入: git diff + plan 文件(作为审查基准)
team-review 输出: 审查报告 + Critical 修复
```

---

## 4. 本地定制建议

### 4.1 总览：适用于全部 team-* 文件的增强

| 增强特性 | 适用性 | 优先级 | 说明 |
|----------|--------|--------|------|
| **zhi (交互确认)** | 全部 4 个 | 高 | 替换 `AskUserQuestion` 为 `mcp______zhi`，与本地其他命令保持一致 |
| **ji (知识管理)** | team-research | 中 | 约束集可归档到记忆系统供后续复用 |
| **GrokSearch** | team-research | 中 | 外部技术调研时使用 Grok Search 替代内置搜索 |
| **路径硬编码** | 全部 4 个 | 低 | 当前使用 `{{WORKDIR}}` 占位符，无需硬编码 |
| **Chrome DevTools** | team-review | 中 | 前端审查时可增加浏览器实际验证步骤 |

### 4.2 各文件定制详情

#### team-exec.md

| 增强项 | 建议内容 |
|--------|----------|
| **zhi** | 步骤 2 "向用户展示摘要并确认" -> 使用 `mcp______zhi` 替代隐含的用户确认 |
| **zhi** | 步骤 5 汇总报告后，增加 `mcp______zhi` 确认是否运行 team-review |
| **ji** | 可选：实施完成后将变更摘要写入记忆，供 team-review 参照 |

#### team-plan.md

| 增强项 | 建议内容 |
|--------|----------|
| **zhi** | 步骤 5 "用 AskUserQuestion 请求确认" -> 替换为 `mcp______zhi`（支持 predefined_options: ["确认计划", "修改计划", "重新分析"]） |
| **zhi** | 步骤 6 上下文检查点 -> 用 `mcp______zhi` 提示是否 /clear |
| **ji** | 可选：将关键技术决策写入记忆系统，供后续 team-exec 和 team-review 参照 |

#### team-research.md

| 增强项 | 建议内容 |
|--------|----------|
| **zhi** | 步骤 5 歧义消解 -> 替换 `AskUserQuestion` 为 `mcp______zhi`（支持分组展示选项） |
| **ji** | 步骤 6 写入研究文件后，同步将约束集存入 `mcp______ji`（category: "context"），便于跨会话复用 |
| **GrokSearch** | 步骤 0 Prompt 增强后，如需外部技术调研（如框架版本兼容性），使用 `mcp__Grok_Search_Mcp__web_search` |
| **enhance** | 步骤 0 已有 Prompt 增强逻辑，可统一使用 `mcp______enhance` 工具 |

#### team-review.md

| 增强项 | 建议内容 |
|--------|----------|
| **zhi** | 步骤 5 决策门 -> 替换 `AskUserQuestion` 为 `mcp______zhi`（predefined_options: ["立即修复", "跳过", "逐个确认"]） |
| **Chrome DevTools** | 步骤 1 收集变更产物后，增加前端可视化验证步骤：使用 Chrome DevTools MCP 截图对比变更前后的 UI |
| **Chrome DevTools** | 步骤 5 修复 Critical 后，用浏览器实际验证修复效果（特别是前端 accessibility/ux 维度的问题） |
| **ji** | 可选：将审查发现的模式问题（Warning/Info 类）归档到记忆系统，作为后续开发的参考基线 |

### 4.3 定制优先级排序

**第一优先级（高收益、低风险）**：
1. 全部 4 个文件：`AskUserQuestion` -> `mcp______zhi` 统一替换
2. team-research.md：步骤 0 使用 `mcp______enhance`

**第二优先级（中等收益）**：
3. team-research.md：约束集归档到 `mcp______ji`
4. team-review.md：增加 Chrome DevTools 验证步骤
5. team-research.md：增加 GrokSearch 外部调研

**第三优先级（可选增强）**：
6. team-plan.md / team-exec.md：关键决策/变更摘要写入 `mcp______ji`

---

## 5. 总结

- **一致性**：4 个 team-* 文件与上游 100% 一致，字节数完全匹配
- **工作流设计**：research -> plan -> exec -> review 四阶段流水线，核心模式为多模型强制协作 + 零决策执行 + 文件范围隔离
- **定制空间**：主要集中在交互确认工具统一（zhi）、知识持久化（ji）、外部搜索（GrokSearch）和浏览器验证（Chrome DevTools）四个维度
- **路径硬编码**：不需要，当前使用 `{{WORKDIR}}` 占位符机制已满足需求
