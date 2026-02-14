---
description: "Multi-model compliance review before archiving"
---

# Spec Review - OpenSpec 合规审查

双模型交叉审查实施结果，Critical 问题必须修复，通过后归档。

## 使用方法

```bash
/ccg:spec-review [计划路径]
```

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`spec-review-agent`（`agents/ccg/spec-review-agent.md`）

**调用**：
```
Task({
  subagent_type: "spec-review-agent",
  prompt: "$ARGUMENTS",
  description: "合规审查"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Grep/Glob
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`
- 外部模型：Codex + Gemini（双模型交叉审查）

**详细说明**：参考 [spec-review-agent.md](../../agents/ccg/spec-review-agent.md)

---

## 执行流程

1. **调用审查代理** — Task 调用 `spec-review-agent`
2. **确认结果** — 通过 zhi 展示审查结果
3. **提交/归档** — Critical = 0 时可提交代码或归档

---

## 关键规则

1. **必须使用 Task 工具**调用 `spec-review-agent` 子代理
2. Critical 问题必须修复才能归档
3. 审查结果必须使用 zhi 确认
4. 归档后调用 `mcp______ji` 存储项目约束经验

**Exit Criteria**
- [ ] 双模型交叉审查已完成
- [ ] 问题已分级：Critical / Warning / Info
- [ ] Critical 问题已全部修复（或无 Critical 问题）
- [ ] 审查报告已写入 `.doc/spec/reviews/`
- [ ] 审查结果已通过 zhi 展示给用户
- [ ] 归档完成后约束经验已通过 ji 记录
