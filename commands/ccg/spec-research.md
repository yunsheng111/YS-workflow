---
description: "Transform requirements into constraint sets via parallel exploration"
---
<!-- CCG:SPEC:RESEARCH:START -->
**Core Philosophy**
- 研究产出的是**约束集**，不是信息堆砌。每条约束缩小解决方案空间。
- 并行探索是强制的：通过多维度同时分析需求，发现硬约束、软约束、依赖和风险。
- 不做架构决策——只发现约束，为 `spec-plan` 阶段产出零决策计划提供基础。

**Guardrails**
- 仅写入 `.claude/spec/` 目录，不修改项目源代码。
- 必须使用 `spec-research-agent` 子代理执行，主代理仅协调。
- 约束集必须分类清晰：硬约束 / 软约束 / 依赖关系 / 风险。
- 研究完成后必须使用 `mcp______zhi` 展示约束摘要并确认。
- 前置条件：`spec-init` 已完成环境初始化。
- 与后续命令的关系：约束集和提案是 `spec-plan` 的输入。

**Steps**

# /ccg:spec-research

将需求转化为约束集（硬约束/软约束/依赖/风险），通过并行探索生成 OpenSpec 提案。

## 使用方法

```bash
/ccg:spec-research <需求描述>
```

## 上下文

- 需求描述：$ARGUMENTS
- 输出约束集到 `.claude/spec/constraints/`
- 生成提案到 `.claude/spec/proposals/`

## 你的角色

你是**协调者**，负责调用子代理完成约束集研究。

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`spec-research-agent`（`agents/ccg/spec-research-agent.md`）

**调用**：
```
Task({
  subagent_type: "spec-research-agent",
  prompt: "$ARGUMENTS",
  description: "约束集研究"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- Prompt 增强：`mcp______enhance` → `mcp__ace-tool__enhance_prompt` → Claude 自增强
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Grep/Glob
- 用户确认：`mcp______zhi` → `AskUserQuestion`
- 知识存储：`mcp______ji` → 本地文件
- 网络搜索：Grok Search MCP → `mcp______context7`
- 外部模型：Codex（后端）+ Gemini（前端）并行探索

**详细说明**：参考 [架构文档 - 工具调用优先级](./.doc/framework/ccg/ARCHITECTURE.md#工具调用优先级)

---

## 网络搜索规范（GrokSearch 优先）

**首次需要外部信息时执行以下步骤**：

1. 调用 `mcp__Grok_Search_Mcp__get_config_info` 做可用性检查
2. 调用 `mcp__Grok_Search_Mcp__toggle_builtin_tools`，`action: "off"`，确保禁用内置 WebSearch/WebFetch
3. 使用 `mcp__Grok_Search_Mcp__web_search` 进行搜索；需要全文时再调用 `mcp__Grok_Search_Mcp__web_fetch`
4. 若搜索失败或结果不足，执行降级步骤：
   - 调用 `get_config_info` 获取状态
   - 若状态异常，调用 `switch_model` 切换模型后重试一次
   - 仍失败则使用 `mcp______context7` 获取框架/库官方文档
   - 若仍不足，提示用户提供权威来源
5. 关键结论与来源需通过 `mcp______ji` 记录，便于后续复用与审计

---

## 执行工作流

### 步骤 1：调用研究代理

**使用 `spec-research-agent` 子代理执行约束研究**：

```
Task({
  subagent_type: "spec-research-agent",
  prompt: "将以下需求转化为约束集。\n\n需求：$ARGUMENTS\n工作目录：{{WORKDIR}}\n约束目录：.claude/spec/constraints/\n提案目录：.claude/spec/proposals/\n\n请执行：\n1. 增强需求（enhance）\n2. 检索项目上下文\n3. 识别硬约束、软约束、依赖关系、风险\n4. 生成约束集文件和提案",
  description: "约束集研究"
})
```

### 步骤 2：确认结果（使用三术 zhi）

子代理完成后，调用 `mcp______zhi` 工具展示约束集摘要：
- `message`:
  ```
  ## 🔍 约束集研究完成

  ### 约束摘要
  - 硬约束：<N> 条
  - 软约束：<N> 条
  - 依赖关系：<N> 条
  - 风险项：<N> 条

  ### 生成文件
  - 约束集：`.claude/spec/constraints/<name>.md`
  - 提案：`.claude/spec/proposals/<name>.md`

  ### 下一步
  运行 `/ccg:spec-plan` 将提案转化为零决策计划
  ```
- `is_markdown`: true
- `predefined_options`: ["进入 spec-plan", "查看约束详情", "修改约束", "完成"]

根据用户选择：
- 「进入 spec-plan」→ 提示用户执行 `/ccg:spec-plan`
- 「查看约束详情」→ 展示完整约束集
- 「修改约束」→ 进入约束修改流程
- 「完成」→ 终止当前回复

---

## 关键规则

1. **必须使用 Task 工具**调用 `spec-research-agent` 子代理
2. 仅写入 `.claude/spec/` 目录，不修改项目源代码
3. 约束集完成后必须使用 zhi 确认

**Exit Criteria**
- [ ] 需求已增强并确认
- [ ] 硬约束、软约束、依赖关系、风险已分类识别
- [ ] 约束集文件已写入 `.claude/spec/constraints/`
- [ ] 提案文件已写入 `.claude/spec/proposals/`
- [ ] 约束摘要已通过 zhi 展示给用户
<!-- CCG:SPEC:RESEARCH:END -->
