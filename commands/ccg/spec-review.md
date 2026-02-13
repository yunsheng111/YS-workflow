---
description: "Multi-model compliance review before archiving"
---
<!-- CCG:SPEC:REVIEW:START -->
**Core Philosophy**
- Critical 问题是硬门禁——必须修复才能归档，不可降级或跳过。
- 双模型交叉审查确保审查覆盖度：单一模型可能遗漏的问题通过交叉验证捕获。
- 审查完成即归档，约束经验沉淀为团队知识资产。

**Guardrails**
- 必须使用 `spec-review-agent` 子代理执行，主代理仅协调。
- Critical 问题必须修复才能归档，不可绕过。
- 问题分级必须清晰：Critical（必修） / Warning（建议修） / Info（可选修）。
- 审查结果必须使用 `mcp______zhi` 展示并确认。
- 归档后调用 `mcp______ji` 存储约束经验，沉淀为可复用知识。
- 前置条件：`spec-impl` 已完成实施。
- 与其他命令的关系：如有 Critical 问题，需回到 `spec-impl` 修复后重新审查。

**Steps**

# /ccg:spec-review

双模型交叉审查实施结果，Critical 问题必须修复，通过后归档。

## 使用方法

```bash
/ccg:spec-review [计划路径]
```

## 上下文

- 计划路径：$ARGUMENTS（默认读取最新 `.claude/spec/plans/` 文件）
- 审查实施结果是否符合约束集
- Critical 问题必须修复才能归档

## 你的角色

你是**协调者**，负责调用子代理完成合规审查和归档。

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

### 步骤 1：调用审查代理

**使用 `spec-review-agent` 子代理执行审查**：

```
Task({
  subagent_type: "spec-review-agent",
  prompt: "审查实施结果是否符合计划和约束集。\n\n计划路径：$ARGUMENTS\n工作目录：{{WORKDIR}}\n约束目录：.claude/spec/constraints/\n审查目录：.claude/spec/reviews/\n\n请执行：\n1. 对照计划检查完成情况\n2. 对照约束集验证合规性\n3. 多模型交叉审查\n4. 分类问题（Critical/Warning/Info）",
  description: "合规审查"
})
```

### 步骤 2：确认结果（使用三术 zhi）

子代理完成后，调用 `mcp______zhi` 工具展示审查结果：
- `message`:
  ```
  ## 📋 合规审查完成

  ### 审查结果
  - Critical：<N> 个（必须修复）
  - Warning：<N> 个
  - Info：<N> 个

  ### 合规状态
  <通过 / 需修复>

  ### 审查文件
  `.claude/spec/reviews/<name>.md`
  ```
- `is_markdown`: true
- `predefined_options`: ["修复 Critical 问题", "归档完成", "查看详细审查", "完成"]

根据用户选择：
- 「修复 Critical 问题」→ 列出 Critical 问题清单，提示用户执行 `/ccg:spec-impl` 进行修复
- 「归档完成」→ 将相关文件移入 `.claude/spec/archive/`
- 「查看详细审查」→ 展示完整审查报告
- 「完成」→ 终止当前回复

---

## 关键规则

1. **必须使用 Task 工具**调用 `spec-review-agent` 子代理
2. Critical 问题必须修复才能归档
3. 审查结果必须使用 zhi 确认
4. 归档后调用 `mcp______ji` 存储项目约束经验

**Exit Criteria**
- [ ] 双模型交叉审查已完成
- [ ] 问题已分级：Critical / Warning / Info
- [ ] Critical 问题已全部修复（或无 Critical 问题）
- [ ] 审查报告已写入 `.claude/spec/reviews/`
- [ ] 审查结果已通过 zhi 展示给用户
- [ ] 归档完成后约束经验已通过 ji 记录
<!-- CCG:SPEC:REVIEW:END -->
