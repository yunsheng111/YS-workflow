---
description: '多模型协作执行 - 根据计划获取原型 → Claude 重构实施 → 多模型审计交付'
---

# Execute - 多模型协作执行

$ARGUMENTS

---

## 核心协议

- **语言协议**：与工具/模型交互用**英语**，与用户交互用**中文**
- **代码主权**：外部模型对文件系统**零写入权限**，所有修改由 Claude 执行
- **脏原型重构**：将 Codex/Gemini 的 Unified Diff 视为"脏原型"，必须重构为生产级代码
- **止损机制**：当前阶段输出通过验证前，不进入下一阶段
- **前置条件**：仅在用户对 `/ccg:plan` 输出明确回复 "Y" 后执行（如缺失，必须先二次确认）

---

## 多模型调用规范

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `LITE_MODE` | 设为 `true` 跳过外部模型调用，使用模拟响应 | `false` |
| `GEMINI_MODEL` | Gemini 模型版本 | `gemini-2.5-pro` |

**LITE_MODE 检查**：调用外部模型前，检查 `LITE_MODE` 环境变量。若为 `true`，跳过 Codex/Gemini 调用，使用占位符响应继续流程。

**调用语法**（并行用 `run_in_background: true`）：

```
# 复用会话调用（推荐）- 原型生成（Implementation Prototype）
Bash({
  command: "{{CCG_BIN}} {{LITE_MODE_FLAG}}--backend <codex|gemini> {{GEMINI_MODEL_FLAG}}resume <SESSION_ID> - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
需求：<任务描述>
上下文：<计划内容 + 目标文件>
</TASK>
OUTPUT: Unified Diff Patch ONLY. Strictly prohibit any actual modifications.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "简短描述"
})

# 新会话调用 - 原型生成（Implementation Prototype）
Bash({
  command: "{{CCG_BIN}} {{LITE_MODE_FLAG}}--backend <codex|gemini> {{GEMINI_MODEL_FLAG}}- \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
需求：<任务描述>
上下文：<计划内容 + 目标文件>
</TASK>
OUTPUT: Unified Diff Patch ONLY. Strictly prohibit any actual modifications.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "简短描述"
})
```

**Gemini 模型指定**：调用 Gemini 时，wrapper 自动读取 `GEMINI_MODEL` 环境变量（默认 `gemini-2.5-pro`）。

**审计调用语法**（Code Review / Audit）：

```
Bash({
  command: "{{CCG_BIN}} {{LITE_MODE_FLAG}}--backend <codex|gemini> {{GEMINI_MODEL_FLAG}}resume <SESSION_ID> - \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
Scope: Audit the final code changes.
Inputs:
- The applied patch (git diff / final unified diff)
- The touched files (relevant excerpts if needed)
Constraints:
- Do NOT modify any files.
- Do NOT output tool commands that assume filesystem access.
</TASK>
OUTPUT:
1) A prioritized list of issues (severity, file, rationale)
2) Concrete fixes; if code changes are needed, include a Unified Diff Patch in a fenced code block.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "简短描述"
})
```

**角色提示词**：

| 阶段 | Codex | Gemini |
|------|-------|--------|
| 实施 | `~/.claude/.ccg/prompts/codex/architect.md` | `~/.claude/.ccg/prompts/gemini/frontend.md` |
| 审查 | `~/.claude/.ccg/prompts/codex/reviewer.md` | `~/.claude/.ccg/prompts/gemini/reviewer.md` |

**会话复用**：如果 `/ccg:plan` 提供了 SESSION_ID，使用 `resume <SESSION_ID>` 复用上下文。

**等待后台任务**（最大超时 600000ms = 10 分钟）：

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**重要**：
- 必须指定 `timeout: 600000`，否则默认只有 30 秒会导致提前超时
- 若 10 分钟后仍未完成，继续用 `TaskOutput` 轮询，**绝对不要 Kill 进程**
- 若因等待时间过长跳过了等待，**必须调用 `mcp______zhi` 询问用户选择继续等待还是 Kill Task**

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

**执行任务**：$ARGUMENTS

**执行方式**：委托给 execute-agent 代理执行

调用 Task 工具启动 execute-agent 代理：

```
Task({
  subagent_type: "execute-agent",
  prompt: "$ARGUMENTS",
  description: "严格按计划执行实施任务"
})
```

**参数说明**：
- `subagent_type`: 固定为 "execute-agent"
- `prompt`: 传递计划文件路径或任务描述
- `description`: 简短描述任务内容

**代理职责**：
- execute-agent 代理内部封装完整的执行逻辑
- 包含原型生成、编码实施、审计交付等所有阶段
- 支持调用 Codex/Gemini 进行原型生成和审计
- 自动处理占位符渲染（{{CCG_BIN}}、{{WORKDIR}} 等）

**执行流程**：
1. 主代理调用 Task 工具启动 execute-agent
2. execute-agent 读取计划并执行所有阶段
3. execute-agent 完成后返回执行结果
4. 主代理展示最终结果给用户

---

## 关键规则

1. **代码主权** – 所有文件修改由 Claude 执行，外部模型零写入权限
2. **脏原型重构** – Codex/Gemini 的输出视为草稿，必须重构
3. **信任规则** – 后端以 Codex 为准，前端以 Gemini 为准
4. **最小变更** – 仅修改必要的代码，不引入副作用
5. **强制审计** – 变更后必须进行多模型 Code Review

---

## 使用方法

```bash
# 执行计划文件
/ccg:execute .claude/plan/功能名.md

# 直接执行任务（适用于已在上下文中讨论过的计划）
/ccg:execute 根据之前的计划实施用户认证功能
```

---

## 与 /ccg:plan 的关系

1. `/ccg:plan` 生成计划 + SESSION_ID
2. 用户确认 "Y" 后
3. `/ccg:execute` 读取计划，复用 SESSION_ID，执行实施
