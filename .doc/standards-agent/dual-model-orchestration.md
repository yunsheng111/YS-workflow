# 双模型编排标准模板

本文档定义了 CCG 命令中 Codex/Gemini 双模型编排的标准化模式，供所有代理复用。

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
| `FAILED` | 失败 | 双模型均失败 | 报告错误，终止任务 |

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
// 门禁条件
const passGate = (
  liteMode ||                          // Lite 模式豁免
  (codexCalled && codexSession) ||     // Codex 成功
  (geminiCalled && geminiSession)      // Gemini 成功
);

if (!passGate) {
  throw new Error('门禁失败：双模型均未成功调用');
}
```

### Bash 实现

```bash
# 门禁校验
if [[ "$LITE_MODE" == "true" ]] || \
   [[ -n "$codex_session" ]] || \
   [[ -n "$gemini_session" ]]; then
  echo "✅ 门禁通过"
else
  echo "❌ 门禁失败：双模型均未返回 SESSION_ID"
  exit 1
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
