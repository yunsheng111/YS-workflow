---
description: "Refine proposals into zero-decision executable plans"
---

# Spec Plan - OpenSpec 零决策规划

将提案和约束集转化为零决策可执行计划，消除所有歧义点。

## 使用方法

```bash
/ccg:spec-plan [提案路径]
```

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`spec-plan-agent`（`agents/ccg/spec-plan-agent.md`）

**调用**：
```
Task({
  subagent_type: "spec-plan-agent",
  prompt: "$ARGUMENTS",
  description: "零决策规划"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Grep/Glob
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`
- 外部模型：Codex + Gemini（多模型分析消除歧义）

**详细说明**：参考 [spec-plan-agent.md](../../agents/ccg/spec-plan-agent.md)

---

## 执行流程

1. **调用规划代理** — Task 调用 `spec-plan-agent`
2. **确认结果** — 通过 zhi 展示计划摘要

---

## 关键规则

1. **必须使用 Task 工具**调用 `spec-plan-agent` 子代理
2. 仅写入 `.doc/spec/` 目录，不修改项目源代码
3. 计划必须"零决策"——每步可直接执行，无需人工判断
4. 计划完成后必须使用 zhi 确认

**Exit Criteria**
- [ ] 提案和约束集已读取并分析
- [ ] 所有歧义点已通过多模型分析消除
- [ ] 零决策计划已生成
- [ ] 计划文件已写入 `.doc/spec/plans/`
- [ ] 计划摘要已通过 zhi 展示给用户
