---
description: '智能功能开发 - 自动识别输入类型，规划/讨论/实施全流程'
---

# Feat - 智能功能开发

自动识别输入类型，智能路由到规划、讨论或实施流程。

## 使用方法

```bash
/ccg:feat <功能描述>
```

---

## 执行方式

**执行方式**：主代理智能路由

**路由决策**：
- 需要规划 → `planner` 代理
- 需要设计 → `ui-ux-designer` 代理
- 可直接实施 → `fullstack-light-agent` 代理

**调用示例**：
```
Task({
  subagent_type: "fullstack-light-agent",
  prompt: "$ARGUMENTS",
  description: "智能功能开发"
})
```

---

## 工具集

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context`
- Prompt 增强：`mcp______enhance`
- 用户确认：`mcp______zhi`
- 子代理：`planner`、`ui-ux-designer`、`fullstack-light-agent`

**详细说明**：参考 [fullstack-light-agent.md](../../agents/ccg/fullstack-light-agent.md)

---

## 执行流程

1. **输入类型判断** — 分析用户输入，判断任务类型
2. **路由确认** — 通过 zhi 确认路由决策
3. **调用对应代理** — 执行规划/设计/实施

---

## 输入类型判断

| 类型 | 特征 | 路由 |
|------|------|------|
| 规划类 | 复杂、多步骤、需要分析 | `planner` |
| 设计类 | UI/UX、原型、设计方案 | `ui-ux-designer` |
| 实施类 | 明确、可直接编码 | `fullstack-light-agent` |

---

## 关键规则

1. **必须先判断输入类型** — 不得跳过路由决策
2. **必须通过 zhi 确认** — 用户可覆盖自动判断
3. **复杂任务建议使用 `/ccg:workflow`**

---

## 完成后推荐

功能开发完成后，可能需要的后续操作：

- `/ccg:test` — 生成测试用例
- `/ccg:review` — 代码审查
- `/ccg:commit` — 提交代码变更
