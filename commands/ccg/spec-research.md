---
description: "Transform requirements into constraint sets via parallel exploration"
---

# Spec Research - OpenSpec 约束集研究

将需求转化为约束集（硬约束/软约束/依赖/风险），通过并行探索生成 OpenSpec 提案。

## 使用方法

```bash
/ccg:spec-research <需求描述>
```

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`spec-research-agent`（`agents/ccg/spec-research-agent.md`）

**调用**：
```
Task({
  subagent_type: "spec-research-agent",
  prompt: "$ARGUMENTS",
  description: "约束集研究"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- Prompt 增强：`mcp______enhance` → `mcp__ace-tool__enhance_prompt` → Claude 自增强
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Grep/Glob
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`
- 外部模型：Codex（后端）+ Gemini（前端）并行探索

**详细说明**：参考 [spec-research-agent.md](../../agents/ccg/spec-research-agent.md)

---

## 执行流程

1. **调用研究代理** — Task 调用 `spec-research-agent`
2. **确认结果** — 通过 zhi 展示约束集摘要

---

## 关键规则

1. **必须使用 Task 工具**调用 `spec-research-agent` 子代理
2. 仅写入 `.doc/spec/` 目录，不修改项目源代码
3. 约束集完成后必须使用 zhi 确认

**Exit Criteria**
- [ ] 需求已增强并确认
- [ ] 硬约束、软约束、依赖关系、风险已分类识别
- [ ] 约束集文件已写入 `.doc/spec/constraints/`
- [ ] 提案文件已写入 `.doc/spec/proposals/`
- [ ] 约束摘要已通过 zhi 展示给用户
