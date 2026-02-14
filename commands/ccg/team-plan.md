---
description: 'Agent Teams 规划 - Lead 调用 Codex/Gemini 并行分析，产出零决策并行实施计划'
---

# Team Plan - Agent Teams 规划

调用 Codex/Gemini 并行分析，产出零决策并行实施计划。

## 使用方法

```bash
/ccg:team-plan <任务描述>
```

---

## Level 2: 命令层执行

**执行方式**：主代理直接执行 + 外部模型协作

**工作流**：7 个阶段（上下文收集 → 多模型并行分析 → 综合分析 + 任务拆分 → 写入计划文件 → 归档计划 → 用户确认 → 上下文检查点）

---

## Level 3: 工具层执行

**主代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Grep/Glob
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`
- 外部模型：Codex（后端权威）+ Gemini（前端权威）并行分析

**详细说明**：参考 [team-plan-agent.md](../../agents/ccg/team-plan-agent.md)

---

## 执行流程

1. **上下文收集** — 检索项目结构和关键文件
2. **多模型并行分析** — Codex + Gemini 同时分析（`run_in_background: true`）
3. **综合分析 + 任务拆分** — 后端以 Codex 为准，前端以 Gemini 为准
4. **文件冲突检测** — 确保子任务文件范围不重叠
5. **写入计划文件** — 输出到 `.doc/agent-teams/plans/`
6. **用户确认** — 通过 zhi 确认计划
7. **上下文检查点** — 报告使用量，建议 `/clear`

---

## 关键规则

1. **多模型分析是 mandatory** — 必须同时调用 Codex 和 Gemini
2. **不写产品代码** — 只做分析和规划
3. **文件范围必须隔离** — 确保并行不冲突
4. **计划必须包含分析摘要** — Codex/Gemini 的实际返回内容

**Exit Criteria**
- [ ] Codex + Gemini 分析完成
- [ ] 子任务文件范围无冲突
- [ ] 计划文件已写入 `.doc/agent-teams/plans/`
- [ ] 用户已确认计划
