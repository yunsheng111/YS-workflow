---
description: '多模型技术分析（并行执行）：Codex 后端视角 + Gemini 前端视角，交叉验证后综合见解'
---

# Analyze - 多模型技术分析

双模型并行分析，交叉验证得出综合技术见解。**仅分析，不修改代码。**

## 使用方法

```bash
/analyze <分析问题或任务>
```

---

## Level 1: 主代理智能路由（必须先完成）

> **⛔ 门禁：以下步骤必须在调用 Task(analyze-agent) 之前全部完成。未完成则禁止进入 Level 2。**

本命令走**路径 B**（命令 + 自然语言）。

### 步骤 1：增强需求

调用 `mcp______enhance` 增强用户原始需求 `$ARGUMENTS`。
- 降级链：`mcp__ace-tool__enhance_prompt` → Claude 自增强

### 步骤 2：判断是否需要额外命令

基于增强后的需求，判断 `/ccg:analyze` 是否足够：
- 足够 → 展示"将执行 /ccg:analyze，无需额外命令"
- 需要额外命令 → 说明理由，推荐补充命令及执行顺序

### 步骤 3：用户确认

使用 `mcp______zhi` 展示方案，等待用户确认：
- 无需额外命令时选项：`["确认执行", "补充其他命令", "修改需求", "取消"]`
- 需要额外命令时选项：`["执行全部命令", "仅执行指定命令", "调整方案", "取消"]`

### 步骤 4：上下文检索（确认后）

确认后、进入 Level 2 前，调用 `mcp__ace-tool__search_context` 获取相关上下文（降级：`mcp______sou` → Grep/Glob）。

---

## Level 2: 命令层执行

> **前置条件**：Level 1 的步骤 1-3 已全部完成，用户已确认执行。

**执行方式**：Task 调用代理

**代理**：`analyze-agent`

**调用**：
```
Task({
  subagent_type: "analyze-agent",
  prompt: "<增强后的需求，而非原始 $ARGUMENTS>",
  description: "多模型技术分析"
})
```

**注意**：传入代理的 prompt 必须是增强后的需求，不是原始用户输入。

---

## Level 3: 工具层执行

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context`
- 外部模型：Codex（后端）+ Gemini（前端）— **通过 Bash 调用 codeagent-wrapper，禁止跳过**
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`

**详细说明**：参考 [analyze-agent.md](../../agents/ccg/analyze-agent.md)

---

## 执行流程（概述）

analyze-agent 将执行以下 5 阶段工作流：

1. **增强需求** — 结构化技术问题
2. **检索上下文** — 获取相关代码和配置
3. **并行分析** — **必须通过 Bash 调用 codeagent-wrapper 启动 Codex + Gemini，禁止主代理自行分析替代**
4. **交叉验证** — 识别一致观点、分歧点、互补见解
5. **可行性评估** — 输出方案对比和推荐

---

## 关键规则

1. **仅分析，不修改代码**
2. **禁止基于假设分析** — 必须先检索实际代码
3. **方案对比至少 2 个**
4. **后端以 Codex 为准，前端以 Gemini 为准**
5. **阶段 3 必须实际调用双模型** — 通过 Bash 执行 codeagent-wrapper 命令，禁止 agent 自行分析替代。若未产生真实 SESSION_ID，视为执行失败
