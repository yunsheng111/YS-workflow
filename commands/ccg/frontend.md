---
description: '前端专项工作流 - 智能分流到设计方案或开发实施'
---

# Frontend - 前端专项开发

前端专项开发，智能分流到设计方案或开发实施。

## 使用方法

```bash
/frontend <UI任务描述>
```

---

## Level 2: 命令层执行

**执行方式**：主代理路由到子代理

**路由决策**：
- 设计方案类（设计、原型、规范）→ `ui-ux-designer` 代理
- 开发实施类（实现、修复、优化）→ `frontend-agent` 代理

**调用**：
```
Task({
  subagent_type: "ui-ux-designer",  // 或 "frontend-agent"
  prompt: "$ARGUMENTS"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context`
- 外部模型：Gemini（前端权威）
- 用户确认：`mcp______zhi`
- UI/UX Skill：`ui-ux-pro-max`

**详细说明**：参考 [frontend-agent.md](../../agents/ccg/frontend-agent.md)

---

## 执行流程

1. **需求分析** — 判断任务类型（设计方案 / 开发实施）
2. **分流确认** — 通过 `mcp______zhi` 确认分流决策
3. **调用代理** — 根据确认结果调用对应代理

**分流判断**：
- **设计方案类**：设计方案、UI 设计、交互设计、原型、设计文档
- **开发实施类**：实现、开发、编码、组件、页面、样式、修复、优化

---

## 关键规则

1. **必须先分流再执行** — 不得跳过分流决策
2. **必须使用 zhi 确认** — 分流决策需用户确认
3. **Gemini 前端意见可信赖**
4. **Codex 前端意见仅供参考**
