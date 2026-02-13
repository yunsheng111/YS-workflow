---
description: "Refine proposals into zero-decision executable plans"
---
<!-- CCG:SPEC:PLAN:START -->
**Core Philosophy**
- 计划必须"零决策"——每步可直接机械执行，无需人工判断或临时决策。
- 约束驱动规划：所有计划步骤必须可追溯到 `spec-research` 产出的约束集。
- 消除歧义是核心任务：通过多模型分析将所有模糊点转化为明确指令。

**Guardrails**
- 仅写入 `.claude/spec/` 目录，不修改项目源代码。
- 必须使用 `spec-plan-agent` 子代理执行，主代理仅协调。
- 计划中每个步骤必须包含精确的文件路径、操作类型和预期结果。
- 计划完成后必须使用 `mcp______zhi` 展示摘要并确认。
- 前置条件：`spec-research` 已产出约束集和提案。
- 与后续命令的关系：计划是 `spec-impl` 的直接输入，impl 阶段严格按计划执行。

**Steps**

# /ccg:spec-plan

将提案和约束集转化为零决策可执行计划，消除所有歧义点。

## 使用方法

```bash
/ccg:spec-plan [提案路径]
```

## 上下文

- 提案路径：$ARGUMENTS（默认读取最新 `.claude/spec/proposals/` 文件）
- 约束目录：`.claude/spec/constraints/`
- 输出计划到 `.claude/spec/plans/`

## 你的角色

你是**协调者**，负责调用子代理完成零决策规划。

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`spec-plan-agent`（`agents/ccg/spec-plan-agent.md`）

**调用**：
```
Task({
  subagent_type: "spec-plan-agent",
  prompt: "$ARGUMENTS",
  description: "零决策规划"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Grep/Glob
- 用户确认：`mcp______zhi` → `AskUserQuestion`
- 知识存储：`mcp______ji` → 本地文件
- 网络搜索：Grok Search MCP → `mcp______context7`
- 外部模型：Codex + Gemini（多模型分析消除歧义）

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

### 步骤 1：调用规划代理

**使用 `spec-plan-agent` 子代理执行规划**：

```
Task({
  subagent_type: "spec-plan-agent",
  prompt: "将提案转化为零决策可执行计划。\n\n提案路径：$ARGUMENTS\n工作目录：{{WORKDIR}}\n约束目录：.claude/spec/constraints/\n计划目录：.claude/spec/plans/\n\n请执行：\n1. 读取提案和约束集\n2. 多模型分析消除歧义\n3. 生成零决策计划（每步无需人工决策即可执行）",
  description: "零决策规划"
})
```

### 步骤 2：确认结果（使用三术 zhi）

子代理完成后，调用 `mcp______zhi` 工具展示计划摘要：
- `message`:
  ```
  ## 📋 零决策计划已生成

  ### 计划摘要
  - 总步骤数：<N>
  - 涉及文件：<N> 个
  - 歧义点已消除：<N> 个

  ### 计划文件
  `.claude/spec/plans/<name>.md`

  ### 下一步
  运行 `/ccg:spec-impl` 按计划执行实施
  ```
- `is_markdown`: true
- `predefined_options`: ["进入 spec-impl", "查看完整计划", "修改计划", "完成"]

根据用户选择：
- 「进入 spec-impl」→ 提示用户执行 `/ccg:spec-impl`
- 「查看完整计划」→ 展示完整计划内容
- 「修改计划」→ 进入计划修改流程
- 「完成」→ 终止当前回复

---

## 关键规则

1. **必须使用 Task 工具**调用 `spec-plan-agent` 子代理
2. 仅写入 `.claude/spec/` 目录，不修改项目源代码
3. 计划必须"零决策"——每步可直接执行，无需人工判断
4. 计划完成后必须使用 zhi 确认

**Exit Criteria**
- [ ] 提案和约束集已读取并分析
- [ ] 所有歧义点已通过多模型分析消除
- [ ] 零决策计划已生成（每步无需人工决策即可执行）
- [ ] 计划文件已写入 `.claude/spec/plans/`
- [ ] 计划摘要已通过 zhi 展示给用户
<!-- CCG:SPEC:PLAN:END -->
