---
description: "Initialize OpenSpec environment with multi-model MCP validation"
---
<!-- CCG:SPEC:INIT:START -->
**Core Philosophy**
- 环境初始化是 OpenSpec 工作流的入口，必须确保所有工具链就绪后才能进入后续阶段。
- 验证优先于创建：先确认 MCP 工具和多模型可用性，再建立目录结构。
- 初始化结果必须可审计，为后续约束研究提供可靠的环境基线。

**Guardrails**
- 不修改项目源代码，仅操作 `.doc/spec/` 目录。
- 必须验证 MCP 工具（enhance、zhi、ji、搜索）和多模型（Codex/Gemini）可用性。
- 工具不可用时记录降级状态，不阻塞初始化流程：
  - `mcp______enhance` 不可用 → 降级到 `mcp__ace-tool__enhance_prompt` → 再不可用则标记为"自增强模式"（后续命令将使用 Claude 自增强）
  - `mcp__ace-tool__search_context` 不可用 → 降级到 `mcp______sou` → 再不可用则标记为"手动检索模式"
  - 其他 MCP 工具不可用 → 记录状态，提示用户后续命令可能受限
- 初始化完成后必须使用 `mcp______zhi` 确认结果。
- 与后续命令的关系：初始化是 `spec-research` 的前置条件。

**Steps**

# /ccg:spec-init

初始化 OpenSpec 约束驱动开发环境，验证工具可用性，创建约束目录结构。

## 使用方法

```bash
/ccg:spec-init [项目摘要]
```

## 上下文

- 项目摘要：$ARGUMENTS
- 初始化 `.doc/spec/` 目录结构
- 验证 MCP 工具和多模型可用性

## 你的角色

你是**协调者**，负责调用子代理完成 OpenSpec 环境初始化。

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
- MCP 验证：`mcp______enhance`、`mcp______zhi`、`mcp______ji`、`mcp__ace-tool__search_context`、Grok Search MCP
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Glob/Grep
- 用户确认：`mcp______zhi` → `AskUserQuestion`
- 知识存储：`mcp______ji` → 本地文件
- 外部模型：Codex + Gemini（可用性检查）

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

### 步骤 1：调用初始化代理

**使用 `spec-init-agent` 子代理执行初始化**：

```
Task({
  subagent_type: "spec-init-agent",
  prompt: "初始化 OpenSpec 环境。\n\n项目摘要：$ARGUMENTS\n工作目录：{{WORKDIR}}\n\n请执行：\n1. 验证 MCP 工具可用性\n2. 扫描项目结构和技术栈\n3. 创建 .doc/spec/ 目录结构\n4. 生成初始化报告",
  description: "初始化 OpenSpec 环境"
})
```

### 步骤 2：确认结果（使用三术 zhi）

子代理完成后，调用 `mcp______zhi` 工具展示初始化结果：
- `message`:
  ```
  ## ✅ OpenSpec 环境初始化完成

  ### 工具可用性
  <工具状态表>

  ### 项目信息
  - 项目类型：<前端/后端/全栈>
  - 技术栈：<识别到的技术栈>

  ### 目录结构
  已创建 `.doc/spec/` 及子目录

  ### 下一步
  运行 `/ccg:spec-research <需求描述>` 开始约束集研究
  ```
- `is_markdown`: true
- `predefined_options`: ["进入 spec-research", "查看详细报告", "完成"]

根据用户选择：
- 「进入 spec-research」→ 提示用户执行 `/ccg:spec-research`
- 「查看详细报告」→ 展示完整初始化报告
- 「完成」→ 终止当前回复

---

## 关键规则

1. **必须使用 Task 工具**调用 `spec-init-agent` 子代理
2. 不修改项目源代码，仅操作 `.doc/spec/` 目录
3. 初始化完成后必须使用 zhi 确认

**Exit Criteria**
- [ ] MCP 工具可用性已验证并记录
- [ ] 多模型（Codex/Gemini）可用性已检查
- [ ] `.doc/spec/` 目录结构已创建
- [ ] 项目技术栈已识别
- [ ] 初始化报告已通过 zhi 展示给用户
<!-- CCG:SPEC:INIT:END -->
