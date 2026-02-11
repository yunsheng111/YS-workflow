---
description: "Execute changes via multi-model collaboration with spec compliance"
---

# /ccg:spec-impl

按零决策计划执行实施，多模型协作确保合规性。

## 使用方法

```bash
/ccg:spec-impl [计划路径]
```

## 上下文

- 计划路径：$ARGUMENTS（默认读取最新 `.claude/spec/plans/` 文件）
- 严格遵循计划步骤，不允许偏离
- 执行完成后记录变更到 `.claude/spec/reviews/`

## 你的角色

你是**协调者**，负责调用子代理按计划执行实施。

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

### 步骤 1：确认执行（使用三术 zhi）

调用 `mcp______zhi` 工具确认执行计划：
- `message`:
  ```
  ## ⚡ 即将按计划执行实施

  ### 计划文件
  <计划路径>

  ### 计划摘要
  <关键步骤列表>

  确认开始执行？
  ```
- `is_markdown`: true
- `predefined_options`: ["确认执行", "查看计划详情", "取消"]

根据用户选择：
- 「确认执行」→ 进入步骤 2
- 「查看计划详情」→ 展示完整计划内容后再次确认
- 「取消」→ 终止执行

### 步骤 2：调用实施代理

用户确认后，**使用 `spec-impl-agent` 子代理执行实施**：

```
Task({
  subagent_type: "spec-impl-agent",
  prompt: "按照零决策计划执行实施。\n\n计划路径：$ARGUMENTS\n工作目录：$PWD\n\n请执行：\n1. 读取计划并逐步实施\n2. 每步完成后记录进度\n3. 遇到阻碍时报告而非自行决策",
  description: "按计划实施"
})
```

### 步骤 3：确认结果（使用三术 zhi）

子代理完成后，调用 `mcp______zhi` 工具展示实施结果：
- `message`:
  ```
  ## ✅ 实施完成

  ### 执行摘要
  - 已完成步骤：<N>/<总数>
  - 变更文件：<N> 个

  ### 变更清单
  | 文件 | 操作 | 说明 |
  |------|------|------|
  | ... | ... | ... |

  ### 下一步
  运行 `/ccg:spec-review` 进行合规审查
  ```
- `is_markdown`: true
- `predefined_options`: ["进入 spec-review", "查看变更详情", "回滚变更", "完成"]

---

## 关键规则

1. **必须使用 Task 工具**调用 `spec-impl-agent` 子代理
2. 严格按计划执行，不允许偏离
3. 执行前后均需使用 zhi 确认
