---
description: "Initialize OpenSpec environment with multi-model MCP validation"
---

# Spec Init - OpenSpec 环境初始化

初始化 OpenSpec 约束驱动开发环境，验证工具可用性，创建约束目录结构。

## 使用方法

```bash
/ccg:spec-init [项目摘要]
```

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`spec-init-agent`（`agents/ccg/spec-init-agent.md`）

**调用**：
```
Task({
  subagent_type: "spec-init-agent",
  prompt: "$ARGUMENTS",
  description: "初始化 OpenSpec 环境"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- MCP 验证：`mcp______enhance`、`mcp______zhi`、`mcp______ji`、`mcp__ace-tool__search_context`
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Glob/Grep
- 用户确认：`mcp______zhi`
- 外部模型：Codex + Gemini（可用性检查）

**详细说明**：参考 [spec-init-agent.md](../../agents/ccg/spec-init-agent.md)

---

## 执行流程

1. **调用初始化代理** — Task 调用 `spec-init-agent`
2. **确认结果** — 通过 zhi 展示初始化结果

---

## 关键规则

1. **必须使用 Task 工具**调用 `spec-init-agent` 子代理
2. 不修改项目源代码，仅操作 `.doc/spec/` 目录
3. 初始化完成后必须使用 zhi 确认

**Exit Criteria**
- [ ] MCP 工具可用性已验证并记录
- [ ] `.doc/spec/` 目录结构已创建
- [ ] 项目技术栈已识别
- [ ] 初始化报告已通过 zhi 展示给用户
