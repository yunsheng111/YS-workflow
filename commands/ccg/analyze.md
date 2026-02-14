---
description: '多模型技术分析（并行执行）：Codex 后端视角 + Gemini 前端视角，交叉验证后综合见解'
---

# Analyze - 多模型技术分析

双模型并行分析，交叉验证得出综合技术见解。**仅分析，不修改代码。**

## 使用方法

```bash
/analyze <分析问题或任务>
```

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`analyze-agent`

**调用**：
```
Task({
  subagent_type: "analyze-agent",
  prompt: "$ARGUMENTS",
  description: "多模型技术分析"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context`
- 外部模型：Codex（后端）+ Gemini（前端）
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`

**详细说明**：参考 [analyze-agent.md](../../agents/ccg/analyze-agent.md)

---

## 执行流程（概述）

analyze-agent 将执行以下 5 阶段工作流：

1. **增强需求** — 结构化技术问题
2. **检索上下文** — 获取相关代码和配置
3. **并行分析** — Codex 后端 + Gemini 前端
4. **交叉验证** — 识别一致观点、分歧点、互补见解
5. **可行性评估** — 输出方案对比和推荐

---

## 关键规则

1. **仅分析，不修改代码**
2. **禁止基于假设分析** — 必须先检索实际代码
3. **方案对比至少 2 个**
4. **后端以 Codex 为准，前端以 Gemini 为准**
