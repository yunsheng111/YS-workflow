---
description: '复杂缺陷定位：假设驱动调试，系统化定位根因并提出修复方案'
---

# Debug - 复杂缺陷定位

采用假设驱动调试方法论，系统化定位根因并提出修复方案。

## 使用方法

```bash
/debug <问题描述>
```

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`debug-agent`

**调用**：
```
Task({
  subagent_type: "debug-agent",
  prompt: "$ARGUMENTS",
  description: "复杂缺陷定位"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context`
- 用户确认：`mcp______zhi`
- 框架文档：`mcp______context7`
- 浏览器调试：Chrome DevTools MCP
- GitHub 集成：`mcp__github__create_issue`

**详细说明**：参考 [debug-agent.md](../../agents/ccg/debug-agent.md)

---

## 执行流程（概述）

debug-agent 将执行以下 7 阶段工作流：

1. **收集错误信息** — 日志、堆栈、复现步骤
2. **上下文检索** — 追踪调用链，检查最近变更
3. **生成假设列表** — 按可能性排序
4. **逐一验证假设** — 设计验证实验
5. **确定根因** — 确认唯一根因或多因素组合
6. **提出修复方案** — 评估影响范围和回归风险
7. **创建 GitHub Issue**（可选）— 记录缺陷

---

## 关键规则

1. **禁止跳过假设验证** — 必须逐一验证
2. **每个假设必须有验证方法和预期结果**
3. **修复方案必须评估影响范围和回归风险**
