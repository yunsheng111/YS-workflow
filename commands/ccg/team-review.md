---
description: 'Agent Teams 审查 - 双模型交叉审查并行实施的产出，分级处理 Critical/Warning/Info'
---

# Team Review - Agent Teams 审查

双模型交叉审查并行实施的产出，分级处理 Critical/Warning/Info。

## 使用方法

```bash
/ccg:team-review
```

---

## Level 2: 命令层执行

**执行方式**：主代理直接执行 + 外部模型协作

**工作流**：7 个阶段（收集变更产物 → 多模型审查 → 综合发现 → 输出审查报告 → 决策门 → 归档审查结果 → 提交确认）

---

## Level 3: 工具层执行

**主代理调用的工具**：
- Git 操作：Bash（git diff）
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Grep/Glob
- 计划读取：Read 工具
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`
- 代码修复：Read/Edit/Write 工具（修复 Critical 问题时）
- 外部模型：Codex + Gemini（双模型交叉审查）

**详细说明**：参考 [team-review-agent.md](../../agents/ccg/team-review-agent.md)

---

## 执行流程

1. **收集变更产物** — 获取 git diff 和计划文件
2. **多模型审查** — Codex + Gemini 并行审查（`run_in_background: true`）
3. **综合发现** — 交叉验证、去重、分级
4. **输出审查报告** — 写入 `.doc/agent-teams/reviews/`
5. **决策门** — Critical > 0 时要求修复
6. **提交确认** — 审查通过后调用 `/ccg:commit`

---

## 关键规则

1. **双模型审查是 mandatory** — Codex + Gemini 必须都完成
2. **审查范围限于变更** — 不做范围蔓延
3. **Critical 必须修复** — 不可跳过
4. **Lead 可直接修复** — 审查阶段允许写代码

**Exit Criteria**
- [ ] Codex + Gemini 审查完成
- [ ] 所有发现已综合分级
- [ ] Critical = 0（已修复或用户确认跳过）
- [ ] 审查报告已写入
