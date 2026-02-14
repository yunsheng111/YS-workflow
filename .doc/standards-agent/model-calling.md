---
version: v1.0.0
---

# 多模型调用规范

## 占位符

| 占位符 | 替换值 | 来源 |
|--------|--------|------|
| `{{CCG_BIN}}` | codeagent-wrapper 路径 | `.ccg/config.toml`，默认 `~/.claude/bin/codeagent-wrapper.exe` |
| `{{WORKDIR}}` | 当前工作目录绝对路径 | 运行时 `process.cwd()` |
| `{{LITE_MODE_FLAG}}` | `--lite ` 或空字符串 | 环境变量 `LITE_MODE=true` 时生成（注意尾随空格） |
| `{{GEMINI_MODEL_FLAG}}` | `--gemini-model <model> ` 或空字符串 | 环境变量 `GEMINI_MODEL` 非空时生成（注意尾随空格） |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `LITE_MODE` | `true` 时跳过外部模型调用，使用模拟响应 | `false` |
| `GEMINI_MODEL` | Gemini 模型版本 | `gemini-2.5-pro` |

**LITE_MODE 检查**：调用外部模型前必须检查。若为 `true`，跳过 Codex/Gemini 调用，使用占位符响应继续流程。

## 调用语法

### 新会话

```bash
{{CCG_BIN}} {{LITE_MODE_FLAG}}--backend <codex|gemini> {{GEMINI_MODEL_FLAG}}- "{{WORKDIR}}" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
需求：<增强后的需求>
上下文：<检索到的项目上下文>
</TASK>
OUTPUT: <期望输出格式>
EOF
```

### 复用会话

```bash
{{CCG_BIN}} {{LITE_MODE_FLAG}}--backend <codex|gemini> {{GEMINI_MODEL_FLAG}}resume <SESSION_ID> - "{{WORKDIR}}" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
需求：<增强后的需求>
上下文：<检索到的项目上下文>
</TASK>
OUTPUT: <期望输出格式>
EOF
```

### 并行调用

使用 `run_in_background: true` + `timeout: 3600000`。

### TaskOutput 等待

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

- 必须指定 `timeout: 600000`（10 分钟）
- 超时后继续轮询，**绝对不要 Kill 进程**
- 等待过长时调用 `mcp______zhi` 询问用户是否继续等待

## 角色提示词路径

| 阶段 | Codex | Gemini |
|------|-------|--------|
| 分析 | `~/.claude/.ccg/prompts/codex/analyzer.md` | `~/.claude/.ccg/prompts/gemini/analyzer.md` |
| 规划 | `~/.claude/.ccg/prompts/codex/architect.md` | `~/.claude/.ccg/prompts/gemini/architect.md` |
| 审查 | `~/.claude/.ccg/prompts/codex/reviewer.md` | `~/.claude/.ccg/prompts/gemini/reviewer.md` |
| 前端 | — | `~/.claude/.ccg/prompts/gemini/frontend.md` |

## 会话复用

每次调用返回 `SESSION_ID: xxx`。后续阶段用 `resume xxx` 复用上下文，保持分析连贯性。

## 信任规则

- 后端（API、数据库、性能、安全）：**Codex 为准**
- 前端（UI、交互、可访问性、设计）：**Gemini 为准**
- 外部模型对文件系统**零写入权限**，所有修改由 Claude 执行

## 占位符生命周期

占位符在 **运行时动态渲染**，由 `.ccg/runtime/command-renderer.cjs` 负责：

1. **读取配置**：从 `.ccg/config.toml` 获取 `CCG_BIN` 路径
2. **构建变量映射**：读取环境变量（`LITE_MODE`、`GEMINI_MODEL`）+ 运行时值（`process.cwd()`）
3. **替换占位符**：将模板中所有 `{{...}}` 替换为实际值
4. **残留检测**：渲染后若仍存在 `{{...}}`，抛出错误并拒绝执行
5. **执行命令**：仅在验证通过后执行 Bash 命令

## 强制调用规则

对于标记为 `template: multi-model` 的代理：

### MANDATORY 要求

1. **LITE_MODE 检查**：
   - 调用外部模型前必须检查 `LITE_MODE` 环境变量
   - 若 `LITE_MODE=true`，跳过外部模型调用

2. **门禁校验**：
   - 使用 `||` 而非 `&&`：`(!codexCalled || !geminiCalled || !codexSession || !geminiSession)`
   - 三个触发时机：调用前、收敛后、阶段切换前

3. **超时处理**：
   - 区分"等待超时"（继续轮询）与"任务失败"（触发降级）
   - 超时后不重启任务，避免重复调用

4. **降级策略**（3 级）：
   - **Level 1: 重试** - 首次失败后重试 1 次
   - **Level 2: 单模型模式** - 两次失败后使用单模型（Codex 优先）
   - **Level 3: 主代理模式** - 都不可用时由 Claude 独立完成

5. **复用模板**：
   - 引用 `.doc/standards-agent/dual-model-orchestration.md` 中的模板
   - 不要重复实现状态机和 SESSION_ID 提取逻辑

### 适用代理

以下代理必须遵循强制调用规则：
- `fullstack-agent`（阶段 2/3/5）
- `analyze-agent`（阶段 3）
- `planner`（阶段 0.3/0.5）
- `execute-agent`（阶段 3/5）
- `team-plan-agent`（阶段 2）
- `team-review-agent`（阶段 2）
- `spec-research-agent`（阶段 2）
- `spec-plan-agent`（阶段 2）
- `spec-review-agent`（阶段 2）
- `spec-impl-agent`（阶段 3）
- `fullstack-light-agent`（全栈场景）
