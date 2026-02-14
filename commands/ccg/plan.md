---
description: '多模型协作规划 - 上下文检索 + 双模型分析 → 生成 Step-by-step 实施计划'
---

# Plan - 多模型协作规划

上下文检索 + 双模型分析，生成 Step-by-step 实施计划。

## 使用方法

```bash
/plan <任务描述>
```

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`planner`

**调用**：
```
Task({
  subagent_type: "planner",
  prompt: "$ARGUMENTS",
  description: "多模型协作规划"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context`
- 外部模型：Codex（后端）+ Gemini（前端）
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`

**详细说明**：参考 [planner.md](../../agents/ccg/planner.md)

---

## 执行流程（概述）

planner 将执行以下工作流：

1. **需求增强** — 结构化用户需求
2. **上下文检索** — 检索相关代码和架构
3. **双模型分析** — Codex + Gemini 并行分析
4. **生成计划** — Step-by-step 实施计划
5. **用户确认** — 通过 zhi 确认计划

---

## 关键规则

1. **仅规划，不实施** — 实施请使用 `/ccg:execute`
2. **计划必须可执行** — 每步有明确输入输出
3. **必须通过 zhi 确认** — 用户批准后才能保存
