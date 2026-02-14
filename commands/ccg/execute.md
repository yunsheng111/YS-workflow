---
description: '多模型协作执行 - 根据计划获取原型 → Claude 重构实施 → 多模型审计交付'
---

# Execute - 多模型协作执行

根据计划获取原型代码，Claude 重构实施，多模型审计交付。

## 使用方法

```bash
/execute <计划文件或任务描述>
```

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`execute-agent`

**调用**：
```
Task({
  subagent_type: "execute-agent",
  prompt: "$ARGUMENTS",
  description: "多模型协作执行"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context`
- 外部模型：Codex（后端）+ Gemini（前端）
- 用户确认：`mcp______zhi`
- 浏览器验证：Chrome DevTools MCP

**详细说明**：参考 [execute-agent.md](../../agents/ccg/execute-agent.md)

---

## 执行流程（概述）

execute-agent 将执行以下工作流：

1. **加载计划** — 读取计划文件或解析任务描述
2. **获取原型** — 调用 Codex/Gemini 生成原型代码
3. **Claude 重构** — 重构原型代码，确保质量
4. **实施变更** — 写入文件
5. **多模型审计** — Codex + Gemini 并行审查
6. **交付** — 展示结果并确认

---

## 关键规则

1. **代码主权** — 外部模型零写入权限，Claude 执行所有修改
2. **必须有计划** — 无计划时先调用 `/ccg:plan`
3. **审计必须通过** — Critical 问题必须修复后才能交付
