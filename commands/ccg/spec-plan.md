---
description: "Refine proposals into zero-decision executable plans"
---

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
  prompt: "将提案转化为零决策可执行计划。\n\n提案路径：$ARGUMENTS\n工作目录：$PWD\n约束目录：.claude/spec/constraints/\n计划目录：.claude/spec/plans/\n\n请执行：\n1. 读取提案和约束集\n2. 多模型分析消除歧义\n3. 生成零决策计划（每步无需人工决策即可执行）",
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
