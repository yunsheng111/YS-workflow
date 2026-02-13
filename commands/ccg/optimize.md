---
description: '性能分析与优化：覆盖数据库、算法、前端渲染与资源加载，按性价比排序输出优化方案'
---

# Optimize - 性能分析与优化

性能分析与优化，覆盖数据库查询、算法复杂度、前端渲染与资源加载四大领域，按性价比排序输出优化方案。

## 使用方法

```bash
/optimize <优化目标>
```

## 你的角色

你是**性能工程师**，负责将用户的性能优化需求委托给 `optimize-agent` 代理执行。

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`optimize-agent`（`agents/ccg/optimize-agent.md`）

**调用**：
```
Task({
  subagent_type: "optimize-agent",
  prompt: "$ARGUMENTS",
  description: "性能分析与优化"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Grep/Glob
- 用户确认：`mcp______zhi` → `AskUserQuestion`
- 知识存储：`mcp______ji` → 本地文件
- 性能分析：Chrome DevTools MCP（Lighthouse）

**详细说明**：参考 [架构文档 - 工具调用优先级](./.doc/framework/ccg/ARCHITECTURE.md#工具调用优先级)

---

## 执行工作流

**优化目标**：$ARGUMENTS

### 步骤 1：委托给 optimize-agent

调用 Task 工具启动 optimize-agent 代理，传入用户需求。

```
Task({
  subagent_type: "optimize-agent",
  prompt: "$ARGUMENTS",
  description: "性能分析与优化"
})
```

optimize-agent 将自动执行以下流程：
1. 识别性能瓶颈（收集性能指标、运行 Lighthouse 审计）
2. 分析热路径（数据库查询计划、算法复杂度、渲染瓶颈）
3. 提出优化方案（按性价比排序）
4. 确认优化方案
5. 实施优化并验证效果

### 步骤 2：等待代理完成

optimize-agent 完成后会返回完整的性能优化报告，包含：
- 性能现状（当前值 vs 目标值）
- 瓶颈分析（位置、类型、影响、证据）
- 优化方案（按性价比排序，含预期收益、实施成本、风险）
- 优化结果（优化前后对比）

---

## 适用场景

| 场景 | 示例 |
|------|------|
| 数据库优化 | "查询慢，需要优化索引" |
| 算法优化 | "排序算法复杂度过高" |
| 前端渲染 | "页面渲染卡顿" |
| 资源加载 | "首屏加载时间过长" |

## 关键规则

1. **先测量后优化** – 没有数据不盲目优化
2. **性价比优先** – 高影响 + 低难度优先
3. **不破坏功能** – 优化不能引入 bug

## 知识存储

优化完成后，调用 `mcp______ji` 存储优化结果和性能基线，更新项目性能档案。

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `LITE_MODE` | 设为 `true` 跳过外部模型调用，使用模拟响应 | `false` |
| `GEMINI_MODEL` | Gemini 模型版本 | `gemini-2.5-pro` |

**LITE_MODE 检查**：调用外部模型前，检查 `LITE_MODE` 环境变量。若为 `true`，跳过 Codex/Gemini 调用，使用占位符响应继续流程。

**调用语法**（并行用 `run_in_background: true`）：

```
Bash({
  command: "{{CCG_BIN}} {{LITE_MODE_FLAG}}--backend <codex|gemini> {{GEMINI_MODEL_FLAG}}- \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
需求：<增强后的需求（如未增强则用 $ARGUMENTS）>
上下文：<目标代码、现有性能指标等>
</TASK>
OUTPUT: 性能瓶颈列表、优化方案、预期收益
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "简短描述"
})
```

**Gemini 模型指定**：调用 Gemini 时，wrapper 自动读取 `GEMINI_MODEL` 环境变量（默认 `gemini-2.5-pro`）。

**角色提示词**：

| 模型 | 提示词 |
|------|--------|
| Codex | `~/.claude/.ccg/prompts/codex/optimizer.md` |
| Gemini | `~/.claude/.ccg/prompts/gemini/optimizer.md` |

**并行调用**：使用 `run_in_background: true` 启动，用 `TaskOutput` 等待结果。**必须等所有模型返回后才能进入下一阶段**。

**等待后台任务**（使用最大超时 600000ms = 10 分钟）：

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**重要**：
- 必须指定 `timeout: 600000`，否则默认只有 30 秒会导致提前超时。
如果 10 分钟后仍未完成，继续用 `TaskOutput` 轮询，**绝对不要 Kill 进程**。
- 若因等待时间过长跳过了等待 TaskOutput 结果，则**必须调用 `mcp______zhi` 工具询问用户选择继续等待还是 Kill Task。禁止直接 Kill Task。**

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

## 沟通守则

1. 在需要询问用户时，优先使用三术 (`mcp______zhi`) 工具进行交互，举例场景：请求用户确认/选择/批准

---

## 执行工作流

**优化目标**：$ARGUMENTS

### 🔍 阶段 0：Prompt 增强（可选）

`[模式：准备]` - 优先调用 `mcp______enhance`（不可用时降级到 `mcp__ace-tool__enhance_prompt`；都不可用时执行 **Claude 自增强**：分析意图/缺失信息/隐含假设，按 6 原则补全为结构化需求（目标/范围/技术约束/验收标准），通过 `mcp______zhi` 确认并标注增强模式），**用增强结果替代原始 $ARGUMENTS，后续调用 Codex/Gemini 时传入增强后的需求**

### 🔍 阶段 1：性能基线

`[模式：研究]`

1. 调用 `mcp______ji` 回忆项目历史性能基线和已知瓶颈
2. 调用 `mcp__ace-tool__search_context` 检索目标代码（降级：`mcp______sou` → Glob + Grep）
2. 识别性能关键路径
3. 收集现有指标（如有）

### 🔬 阶段 2：并行性能分析

`[模式：分析]`

**⚠️ 必须发起两个并行 Bash 调用**（参照上方调用规范）：

1. **Codex 后端分析**：`Bash({ command: "...--backend codex...", run_in_background: true })`
   - ROLE_FILE: `~/.claude/.ccg/prompts/codex/optimizer.md`
   - 需求：分析后端性能问题（$ARGUMENTS）
   - OUTPUT：性能瓶颈列表、优化方案、预期收益

2. **Gemini 前端分析**：`Bash({ command: "...--backend gemini...", run_in_background: true })`
   - ROLE_FILE: `~/.claude/.ccg/prompts/gemini/optimizer.md`
   - 需求：分析前端性能问题（Core Web Vitals）
   - OUTPUT：性能瓶颈列表、优化方案、预期收益

用 `TaskOutput` 等待两个模型的完整结果。**必须等所有模型返回后才能进入下一阶段**。

**务必遵循上方 `多模型调用规范` 的 `重要` 指示**

### 🔀 阶段 3：优化整合

`[模式：计划]`

1. 收集双模型分析结果
2. **优先级排序**：按 `影响程度 × 实施难度⁻¹` 计算性价比
3. 请求用户确认优化方案

### ⚡ 阶段 4：实施优化

`[模式：执行]`

用户确认后按优先级实施，确保不破坏现有功能。

### ✅ 阶段 5：验证

`[模式：评审]`

运行测试验证功能，对比优化前后指标。

---

## 性能指标参考

| 类型 | 指标 | 良好 | 需优化 |
|------|------|------|--------|
| 后端 | API 响应 | <100ms | >500ms |
| 后端 | 数据库查询 | <50ms | >200ms |
| 前端 | LCP | <2.5s | >4s |
| 前端 | FID | <100ms | >300ms |
| 前端 | CLS | <0.1 | >0.25 |

## 常见优化模式

**后端**：N+1→批量加载、缺索引→复合索引、重复计算→缓存、同步→异步

**前端**：大 Bundle→代码分割、频繁重渲染→memo、大列表→虚拟滚动、未优化图片→WebP

---

## 关键规则

1. **先测量后优化** – 没有数据不盲目优化
2. **性价比优先** – 高影响 + 低难度优先
3. **不破坏功能** – 优化不能引入 bug
4. **信任规则** – 后端以 Codex 为准，前端以 Gemini 为准

## 知识存储

优化完成后，调用 `mcp______ji` 存储优化结果和性能基线，更新项目性能档案。
