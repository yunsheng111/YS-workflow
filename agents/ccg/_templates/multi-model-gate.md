# 双模型调用门禁模板 v1.0.0

> 本模板供所有标记为 `template: multi-model` 的代理在双模型调用阶段引用。
> 引用方式：在代理文档的双模型阶段写 `引用 _templates/multi-model-gate.md`，然后执行以下全部步骤。

## ⛔ 硬门禁（最高优先级）

**本阶段必须通过 collab Skill 调用 Codex 和/或 Gemini 外部模型。**

### 禁止行为

- **禁止**由本代理（Claude）自行分析替代双模型调用
- **禁止**编造 SESSION_ID 或伪造模型输出
- **禁止**跳过 collab Skill 文档的读取步骤
- **禁止**跳过进度汇报步骤

### 进入下一阶段前的自检

以下条件必须全部满足，否则禁止进入下一阶段：

1. ✅ 已读取 collab Skill 文档（`~/.claude/skills/collab/SKILL.md`）
2. ✅ 已读取 executor.md 和 renderer.md
3. ✅ 至少执行了 1 次 Bash 命令调用 codeagent-wrapper
4. ✅ 从 Bash 输出中提取到了真实的 SESSION_ID（UUID 格式）
5. ✅ 获得了外部模型的实际输出文本
6. ✅ 按 reporter.md 规范通过 zhi 向用户汇报了进度

## 执行步骤

### 步骤 0：读取 collab Skill 文档（强制）

```markdown
必须先读取以下文件，理解完整的双模型调用流程：
1. Read("~/.claude/skills/collab/SKILL.md") — 参数、状态机、降级策略
2. Read("~/.claude/skills/collab/executor.md") — 并行调用执行流程
3. Read("~/.claude/skills/collab/renderer.md") — 占位符渲染规则
4. Read("~/.claude/skills/collab/reporter.md") — 进度汇报规范

然后严格按照文档中的执行流程操作。

**[Ledger Event]** 上报 `docs_read` 事件（包含读取的文档列表）
```

### 步骤 1：初始化

```markdown
1. 读取 `.ccg/config.toml` 获取 CCG_BIN 路径（默认：`~/.claude/bin/codeagent-wrapper.exe`）
2. 检查环境变量：LITE_MODE、GEMINI_MODEL
3. 若 LITE_MODE=true，跳过外部模型调用，使用占位符响应（标注为 LITE 模式）
```

### 步骤 2：渲染并执行 Codex 命令

```markdown
1. 按 renderer.md 渲染命令模板，替换所有占位符
2. 验证无残留占位符（{{...}}）
3. 使用 Bash 工具执行（run_in_background: true）
4. 记录返回的 task_id
```

### 步骤 3：渲染并执行 Gemini 命令

```markdown
1. 按 renderer.md 渲染命令模板，替换所有占位符
2. 验证无残留占位符（{{...}}）
3. 使用 Bash 工具执行（run_in_background: true）
4. 记录返回的 task_id
```

### 步骤 4：等待结果 + 进度汇报

```markdown
1. 使用 TaskOutput 轮询两个进程：
   TaskOutput({ task_id: "<codex_task_id>", block: true, timeout: 600000 })
   TaskOutput({ task_id: "<gemini_task_id>", block: true, timeout: 600000 })
2. 每次轮询后，按 reporter.md 格式通过 mcp______zhi 推送进度状态
3. 从输出中提取 SESSION_ID（正则：SESSION_ID:\s*([a-f0-9-]+)）
4. 超时后继续轮询，不要 Kill 进程
5. 模型返回后立即通过 zhi 推送输出摘要
```

### 步骤 5：门禁校验

```markdown
**执行门禁（OR 逻辑）** — 输入仅为 status + sessions：
- LITE_MODE=true（豁免）
- codex_session 存在（Codex 成功）
- gemini_session 存在（Gemini 成功）

**状态判定**：
- codex_session && gemini_session => status = SUCCESS
- codex_session || gemini_session => status = DEGRADED
  - 标注 degraded_level（ACCEPTABLE / UNACCEPTABLE）
  - 标注 missing_dimensions（["backend"] 或 ["frontend"]）
- 无任何 SESSION_ID => status = FAILED（**禁止标记为 DEGRADED**）

**关键规则：无 SESSION_ID 的 DEGRADED 是被禁止的**
- 即使模型有文字输出，若无有效 SESSION_ID，状态必须为 FAILED
- 无 SESSION_ID -> FAILED，这是不可违反的硬规则

**DEGRADED 产出前置动作**（status=DEGRADED 时必须执行）：
1. 标注缺失维度（missing_dimensions）
2. 评估风险影响（缺失维度对当前任务的影响程度）
3. 将缺失维度相关约束转为风险约束
4. 通过 mcp______zhi 向用户展示降级详情并确认是否继续
5. 仅在用户确认后才能进入下一阶段

若门禁失败（双模型均未返回 SESSION_ID => FAILED）：
1. 重试 1 次（Level 1 降级）
2. 重试失败 → 使用单模型结果（Level 2 降级）
3. 单模型也失败 → 通过 mcp______zhi 报告失败（Level 3 降级）

降级时必须通过 zhi 通知用户，说明降级原因和影响。
```

## 适用代理

以下代理必须在双模型调用阶段引用本模板：

| 代理 | 双模型阶段 |
|------|-----------|
| `analyze-agent` | 阶段 3 |
| `fullstack-agent` | 阶段 2/3/5 |
| `planner` | 阶段 0.3/0.5 |
| `execute-agent` | 阶段 3/5 |
| `fullstack-light-agent` | 全栈场景 |
| `team-plan-agent` | 阶段 2 |
| `team-review-agent` | 阶段 2 |
| `team-research-agent` | 阶段 2 |
| `spec-research-agent` | 阶段 2 |
| `spec-plan-agent` | 阶段 2 |
| `spec-review-agent` | 阶段 2 |
| `spec-impl-agent` | 阶段 3 |

## 运行时安全网

Layer 3 保障：`hooks/ccg-dual-model-validator.cjs` 在 Write 工具写入研究产出目录时验证 SESSION_ID 存在性。即使代理绕过了本模板的提示词约束，hook 也会拦截缺少 SESSION_ID 的报告写入。
