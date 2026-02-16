# 双模型编排标准模板

> **📌 状态枚举/门禁语义真值源声明**
>
> 本文档中使用的状态枚举（`SUCCESS | DEGRADED | FAILED`）、事件枚举（`init | running | success | degraded | failed`）、降级分级（`ACCEPTABLE | UNACCEPTABLE`）和门禁语义，均以 `skills/collab/SKILL.md` 为唯一真值源。
> 本文档定义门禁的具体实现逻辑（执行门禁、质量门禁），但枚举值和语义解释以 `skills/collab/SKILL.md` 为准。如发现不一致，以 `skills/collab/SKILL.md` 为准。

本文档定义了 CCG 命令中 Codex/Gemini 双模型编排的标准化模式，供所有代理复用。

---

## 推荐方式：collab Skill

**推荐使用 `/collab` Skill 封装双模型调用**，无需手动实现以下模板。

### 调用示例

```
/collab backend=both role=analyzer task="分析用户认证模块的架构设计"
```

### collab Skill 自动处理

- 占位符渲染和命令执行
- 状态机管理（INIT → RUNNING → SUCCESS/DEGRADED/FAILED）
- SESSION_ID 提取和会话复用
- 门禁校验（使用 `||` 逻辑）
- 超时处理和降级策略
- 进度汇报（通过 zhi 展示双模型状态）

### 会话复用

```
/collab backend=both role=architect task="基于分析生成计划" resume=<CODEX_SESSION>
```

### Skill 文档

详见 `~/.claude/skills/collab/SKILL.md`

---

## 底层实现（collab Skill 内部使用）

以下内容描述 collab Skill 的底层实现机制，通常无需直接使用。

---

## 1. 状态机定义

双模型编排任务的生命周期状态：

```
INIT → RUNNING → SUCCESS
              ↓
         DEGRADED → SUCCESS
              ↓
          FAILED
```

### 状态说明

| 状态 | 含义 | 触发条件 | 后续动作 |
|------|------|----------|----------|
| `INIT` | 初始化 | 任务启动 | 启动 Codex/Gemini 进程 |
| `RUNNING` | 运行中 | 进程已启动 | 轮询输出，提取 SESSION_ID |
| `SUCCESS` | 成功 | 双模型均完成 | 整合结果，进入下一阶段 |
| `DEGRADED` | 降级 | 单模型失败/超时 | 使用另一模型结果继续 |
| `FAILED` | 失败 | 双模型均失败或均无有效 SESSION_ID | 报告错误，终止任务 |

### 状态转换规则

```javascript
// 伪代码示例
if (codexSuccess && geminiSuccess) {
  state = 'SUCCESS';
} else if (codexSuccess || geminiSuccess) {
  state = 'DEGRADED';
  logWarning('单模型降级运行');
} else {
  state = 'FAILED';
  throw new Error('双模型均失败');
}
```

---

## 2. SESSION_ID 提取模板

### 正则匹配模式

```javascript
// SESSION_ID 格式：UUID v4（带连字符）
const SESSION_ID_PATTERN = /SESSION_ID:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;

// 提取函数
function extractSessionId(output) {
  const match = output.match(SESSION_ID_PATTERN);
  return match ? match[1] : null;
}
```

### 使用示例

```bash
# Bash 命令输出捕获
codex_output=$({{CCG_BIN}} codex research "..." 2>&1)
codex_session=$(echo "$codex_output" | grep -oP 'SESSION_ID:\s*\K[a-f0-9-]+')

gemini_output=$({{CCG_BIN}} gemini research "..." 2>&1)
gemini_session=$(echo "$gemini_output" | grep -oP 'SESSION_ID:\s*\K[a-f0-9-]+')
```

### 错误处理

```javascript
if (!codexSession && !geminiSession) {
  throw new Error('双模型均未返回 SESSION_ID');
}

if (!codexSession) {
  logWarning('Codex 未返回 SESSION_ID，使用 Gemini 结果');
}

if (!geminiSession) {
  logWarning('Gemini 未返回 SESSION_ID，使用 Codex 结果');
}
```

---

## 3. 门禁校验模板

### 校验逻辑

使用 `||` 逻辑确保至少一个模型成功：

```javascript
// 执行门禁（OR 逻辑）— 唯一真源定义
const passGate = (
  liteMode ||                          // Lite 模式豁免
  codexSession ||                      // Codex 返回有效 SESSION_ID
  geminiSession                        // Gemini 返回有效 SESSION_ID
);

if (!passGate) {
  // 双模型均无 SESSION_ID => FAILED（不是 DEGRADED）
  throw new Error('门禁失败：双模型均未返回有效 SESSION_ID');
}

// 质量门禁（代理层判断）
if (codexSession && geminiSession) {
  status = 'SUCCESS';
} else if (codexSession || geminiSession) {
  status = 'DEGRADED';
  degraded_level = determineDegradedLevel(role, missingModel);
  missing_dimensions = missingModel === 'codex' ? ['backend'] : ['frontend'];
  // DEGRADED 产出前置动作：标注缺失维度 + 风险影响 + 补偿分析，经 zhi 确认
} else {
  status = 'FAILED';
}
```

> **语义真源声明**：上述门禁逻辑是 CCG 框架中双模型门禁的实现定义。
> 状态枚举（`SUCCESS | DEGRADED | FAILED`）和门禁语义的唯一真值源为 `skills/collab/SKILL.md`。
> 其他文档（`model-calling.md`、代理文件等）中的门禁描述必须与本文档和 `skills/collab/SKILL.md` 一致。
> 如发现不一致，以 `skills/collab/SKILL.md` 为准。

### Bash 实现

```bash
# 执行门禁校验
if [[ "$LITE_MODE" == "true" ]] || \
   [[ -n "$codex_session" ]] || \
   [[ -n "$gemini_session" ]]; then
  echo "执行门禁通过"
else
  echo "门禁失败：双模型均未返回 SESSION_ID => FAILED"
  exit 1
fi

# 质量门禁
if [[ -n "$codex_session" ]] && [[ -n "$gemini_session" ]]; then
  status="SUCCESS"
elif [[ -n "$codex_session" ]] || [[ -n "$gemini_session" ]]; then
  status="DEGRADED"
  # 标注 missing_dimensions 和 degraded_level
else
  status="FAILED"
fi
```

### 场景覆盖

| 场景 | liteMode | codexSession | geminiSession | 结果 |
|------|----------|--------------|---------------|------|
| 正常双模型 | false | ✅ | ✅ | 通过 |
| Codex 降级 | false | ✅ | ❌ | 通过 |
| Gemini 降级 | false | ❌ | ✅ | 通过 |
| Lite 模式 | true | ❌ | ❌ | 通过 |
| 双模型失败 | false | ❌ | ❌ | 失败 |

---

## 4. 超时处理模板

### 超时策略

**原则**：超时不等于失败，继续轮询，不重启任务。

```javascript
const MAX_RETRIES = 3;
const POLL_INTERVAL = 5000; // 5 秒

async function pollWithRetry(checkFn, maxRetries = MAX_RETRIES) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await checkFn();

    if (result.success) {
      return result;
    }

    if (result.timeout) {
      logWarning(`轮询超时 (${i + 1}/${maxRetries})，继续等待...`);
      await sleep(POLL_INTERVAL);
      continue;
    }

    if (result.failed) {
      throw new Error('任务失败');
    }
  }

  throw new Error('超过最大重试次数');
}
```

### Bash 实现

```bash
# 超时轮询
MAX_RETRIES=3
POLL_INTERVAL=5

for i in $(seq 1 $MAX_RETRIES); do
  # 检查任务状态
  status=$(check_task_status "$session_id")

  if [[ "$status" == "SUCCESS" ]]; then
    echo "✅ 任务完成"
    break
  elif [[ "$status" == "TIMEOUT" ]]; then
    echo "⏳ 轮询超时 ($i/$MAX_RETRIES)，继续等待..."
    sleep $POLL_INTERVAL
  elif [[ "$status" == "FAILED" ]]; then
    echo "❌ 任务失败"
    exit 1
  fi
done

if [[ "$i" -eq "$MAX_RETRIES" ]] && [[ "$status" != "SUCCESS" ]]; then
  echo "❌ 超过最大重试次数"
  exit 1
fi
```

### 超时与失败的区别

| 情况 | 判定 | 处理 |
|------|------|------|
| 进程未响应 | 超时 | 继续轮询（最多 3 次） |
| 进程返回错误码 | 失败 | 立即终止 |
| 进程崩溃 | 失败 | 立即终止 |
| 网络中断 | 超时 | 继续轮询 |
| SESSION_ID 无效 | 失败 | 立即终止 |

### 降级处理

```javascript
// 单模型超时降级
if (codexTimeout && geminiSuccess) {
  logWarning('Codex 超时，使用 Gemini 结果');
  return geminiResult;
}

if (geminiTimeout && codexSuccess) {
  logWarning('Gemini 超时，使用 Codex 结果');
  return codexResult;
}

if (codexTimeout && geminiTimeout) {
  throw new Error('双模型均超时');
}
```

---

## 使用指南

### 集成步骤

1. **引用本模板**：在代理文档中引用本文件
2. **实现状态机**：根据状态机定义实现任务流程
3. **提取 SESSION_ID**：使用正则模板提取会话 ID
4. **门禁校验**：在关键节点执行门禁校验
5. **超时处理**：使用轮询模板处理超时

### 示例代码

```bash
#!/bin/bash
# 双模型编排示例

# 1. 启动双模型（状态：INIT → RUNNING）
codex_output=$({{CCG_BIN}} codex research "分析架构" 2>&1)
gemini_output=$({{CCG_BIN}} gemini research "分析架构" 2>&1)

# 2. 提取 SESSION_ID
codex_session=$(echo "$codex_output" | grep -oP 'SESSION_ID:\s*\K[a-f0-9-]+')
gemini_session=$(echo "$gemini_output" | grep -oP 'SESSION_ID:\s*\K[a-f0-9-]+')

# 3. 门禁校验
if [[ "$LITE_MODE" != "true" ]] && \
   [[ -z "$codex_session" ]] && \
   [[ -z "$gemini_session" ]]; then
  echo "❌ 门禁失败：双模型均未返回 SESSION_ID"
  exit 1
fi

# 4. 超时轮询（状态：RUNNING → SUCCESS/DEGRADED/FAILED）
for i in {1..3}; do
  codex_status=$(check_status "$codex_session")
  gemini_status=$(check_status "$gemini_session")

  if [[ "$codex_status" == "SUCCESS" ]] || [[ "$gemini_status" == "SUCCESS" ]]; then
    echo "✅ 至少一个模型成功"
    break
  fi

  sleep 5
done

# 5. 整合结果
if [[ "$codex_status" == "SUCCESS" ]] && [[ "$gemini_status" == "SUCCESS" ]]; then
  echo "✅ 双模型成功"
elif [[ "$codex_status" == "SUCCESS" ]] || [[ "$gemini_status" == "SUCCESS" ]]; then
  echo "⚠️ 单模型降级"
else
  echo "❌ 双模型失败"
  exit 1
fi
```

---

## 注意事项

1. **SESSION_ID 必须持久化**：用于后续阶段复用
2. **门禁校验不可跳过**：确保至少一个模型成功
3. **超时不等于失败**：继续轮询，不重启任务
4. **降级运行可接受**：单模型成功即可继续
5. **错误日志必须详细**：记录失败原因和上下文

---

## 相关文档

- [CCG 架构文档](../framework/ccg/ARCHITECTURE.md)
- [命令规范模板](./command-template.md)
- [代理规范模板](./agent-template.md)
