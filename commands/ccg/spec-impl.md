---
description: "Execute changes via multi-model collaboration with spec compliance"
---

# Spec Impl - OpenSpec 实施

按零决策计划执行实施，多模型协作确保合规性。

## 使用方法

```bash
/ccg:spec-impl [计划路径]
```

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`spec-impl-agent`（`agents/ccg/spec-impl-agent.md`）

**调用**：
```
Task({
  subagent_type: "spec-impl-agent",
  prompt: "$ARGUMENTS",
  description: "按计划实施"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Grep/Glob
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`
- 代码修改：Read/Edit/Write 工具
- 外部模型：Codex + Gemini（多模型协作审计）

**详细说明**：参考 [spec-impl-agent.md](../../agents/ccg/spec-impl-agent.md)

---

## 执行流程

1. **确认执行** — 通过 zhi 确认执行计划
2. **调用实施代理** — Task 调用 `spec-impl-agent`
3. **确认结果** — 通过 zhi 展示实施结果

---

## 关键规则

1. **必须使用 Task 工具**调用 `spec-impl-agent` 子代理
2. 严格按计划执行，不允许偏离
3. 执行前后均需使用 zhi 确认

**Exit Criteria**
- [ ] 用户已确认执行计划
- [ ] 所有计划步骤已按序执行完成
- [ ] 每步执行进度已记录
- [ ] 变更清单已写入 `.doc/spec/reviews/`
- [ ] 实施结果已通过 zhi 展示给用户
