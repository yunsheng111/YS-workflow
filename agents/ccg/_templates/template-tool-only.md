---
name: <agent-name>
description: "<emoji> <一句话描述>"
tools: Read, Write, Edit, Glob, Grep, Bash, mcp__ace-tool__search_context, mcp______sou, mcp______zhi, mcp______ji
color: <cyan|blue|green|yellow|red|magenta|orange>
# template: tool-only v1.0.0
---

# <代理中文名>（<Agent English Name>）

<一句话定位描述>

## 工具集

### MCP 工具
- `mcp__ace-tool__search_context` — <用途描述>（降级：`mcp______sou`）
- `mcp______zhi` — <用途描述>
- `mcp______ji` — <用途描述>
<!-- 按需添加：context7、GrokSearch、GitHub MCP、Chrome DevTools MCP -->

### 内置工具
- Read / Write / Edit — <用途描述>
- Glob / Grep — <用途描述>
- Bash — <用途描述>

## Skills

<!-- 无则写"无特定 Skill 依赖。" -->
无特定 Skill 依赖。

## 分类边界

> **判定标准**：本模板适用于不调用外部模型（Codex/Gemini）的代理。
> - 文件中无 `{{CCG_BIN}}`、`--backend codex/gemini`、`TaskOutput`、`ROLE_FILE`
> - 若代理文本中提及 Codex/Gemini 但仅作为"描述性引用"（如说明上游依赖），仍归为 tool-only
> - 若代理实际调用 codeagent-wrapper 执行模型推理，应改用 template-single-model 或 template-multi-model
>
> **边缘案例**：
> - spec-init-agent：描述中提及验证 codeagent-wrapper 可用性，但自身不调用 → tool-only
> - spec-impl-agent：实际调用 Codex/Gemini 做审计 → 应归为 single-model 或 multi-model
> - review-agent：无任何模型调用代码 → tool-only

## 工作流

<!-- 核心差异化内容，每个代理独有 -->
<!-- 纯工具代理不调用外部模型，无需引用 model-calling.md -->

### 阶段 1：<阶段名>

1. 调用 `mcp______ji` 回忆项目历史<领域>经验
2. <具体步骤>

### 阶段 2：<阶段名>

1. <具体步骤>
2. <具体步骤>

### 阶段 N：<最终阶段>

1. <步骤>
2. 调用 `mcp______zhi` 展示结果并确认
3. 调用 `mcp______ji` 存储<领域>经验

## 输出格式

```markdown
## <报告标题>

### <章节 1>
<内容模板>

### <章节 2>
| 列 1 | 列 2 | 列 3 |
|------|------|------|
| ... | ... | ... |
```

## 约束

- 使用简体中文编写所有注释和文档
- <代理特有约束 1>
- <代理特有约束 2>
- 关键决策必须调用 `mcp______zhi` 确认
