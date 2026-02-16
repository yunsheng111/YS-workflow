---
description: '多模型协作开发工作流（研究→构思→计划→执行→审查与修复→验收），智能路由前端→Gemini、后端→Codex'
---

# Workflow - 多模型协作开发

使用质量把关、MCP 服务和多模型协作执行结构化开发工作流。

## 使用方法

```bash
/ccg:workflow <任务描述>
```

---

## 执行方式

**执行方式**：Task 调用代理

**代理**：`fullstack-agent`

**调用**：
```
Task({
  subagent_type: "fullstack-agent",
  prompt: "$ARGUMENTS",
  description: "6 阶段全栈开发"
})
```

---

## 工具集

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context`
- 多模型调用：Codex（后端）+ Gemini（前端）
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`
- 浏览器验证：Chrome DevTools MCP

**详细说明**：参考 [fullstack-agent.md](../../agents/ccg/fullstack-agent.md)

> 仅列关键工具，完整清单见代理文件

---

## 执行流程（6 阶段）

fullstack-agent 将执行以下 6 阶段工作流：

1. **研究与分析** — Prompt 增强 + 上下文检索 + 需求评分
2. **方案构思** — 多模型并行分析 + 方案对比
3. **详细规划** — 多模型协作规划 + 用户确认
4. **实施** — 代码开发 + Chrome DevTools 验证
5. **审查与修复** — 多模型并行审查 + 问题修复
6. **验收** — 最终评估 + 用户确认

---

## 关键规则

1. **委托给 fullstack-agent** — 主代理只需调用 Task 工具
2. **代码主权** — 外部模型零写入权限，所有修改由 Claude 执行
3. **止损机制** — 当前阶段输出通过验证前，不进入下一阶段
4. **阶段顺序不可跳过** — 严格执行 6 阶段工作流

---

## 完成后推荐

工作流完成后，可能需要的后续操作：

- `/ccg:commit` — 提交代码变更
- `/ccg:push` — 推送到远程仓库
- `mcp__github__create_pull_request` — 创建 Pull Request
