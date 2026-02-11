---
description: '多模型调试：Codex 后端诊断 + Gemini 前端诊断，交叉验证定位问题'
---

# Debug - 多模型调试

双模型并行诊断，交叉验证快速定位问题根因。

## 使用方法

```bash
/debug <问题描述>
```

## 你的角色

你是**调试协调者**，编排多模型诊断流程：
- **Codex** – 后端诊断（**后端问题权威**）
- **Gemini** – 前端诊断（**前端问题权威**）
- **Claude (自己)** – 综合诊断、执行修复

---

## 多模型调用规范

**调用语法**（并行用 `run_in_background: true`）：

```
Bash({
  command: "C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe --backend <codex|gemini> - \"$PWD\" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
需求：<增强后的需求（如未增强则用 $ARGUMENTS）>
上下文：<错误日志、堆栈信息、复现步骤等>
</TASK>
OUTPUT: 诊断假设（按可能性排序）
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "简短描述"
})
```

**角色提示词**：

| 模型 | 提示词 |
|------|--------|
| Codex | `C:/Users/Administrator/.claude/.ccg/prompts/codex/debugger.md` |
| Gemini | `C:/Users/Administrator/.claude/.ccg/prompts/gemini/debugger.md` |

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

## 执行工作流

**问题描述**：$ARGUMENTS

### 🔍 阶段 0：Prompt 增强（可选）

`[模式：准备]` - 优先调用 `mcp______enhance`（不可用时降级到 `mcp__ace-tool__enhance_prompt`），**用增强结果替代原始 $ARGUMENTS，后续调用 Codex/Gemini 时传入增强后的需求**

### 🔍 阶段 1：上下文收集

`[模式：研究]`

1. 调用 `mcp______ji` 回忆项目历史缺陷模式和已知问题
2. 调用 `mcp__ace-tool__search_context` 检索相关代码（降级：`mcp______sou` → Glob + Grep）
2. 收集错误日志、堆栈信息、复现步骤
3. 识别问题类型：[后端/前端/全栈]

### 🔬 阶段 2：并行诊断

`[模式：诊断]`

**⚠️ 必须发起两个并行 Bash 调用**（参照上方调用规范）：

1. **Codex 后端诊断**：`Bash({ command: "...--backend codex...", run_in_background: true })`
   - ROLE_FILE: `C:/Users/Administrator/.claude/.ccg/prompts/codex/debugger.md`
   - OUTPUT：诊断假设（按可能性排序），每个假设包含原因、证据、修复建议

2. **Gemini 前端诊断**：`Bash({ command: "...--backend gemini...", run_in_background: true })`
   - ROLE_FILE: `C:/Users/Administrator/.claude/.ccg/prompts/gemini/debugger.md`
   - OUTPUT：诊断假设（按可能性排序），每个假设包含原因、证据、修复建议

用 `TaskOutput` 等待两个模型的诊断结果。**必须等所有模型返回后才能进入下一阶段**。

**务必遵循上方 `多模型调用规范` 的 `重要` 指示**

### 🔀 阶段 3：假设整合

`[模式：验证]`

1. 交叉验证双方诊断结果
2. 筛选 **Top 1-2 最可能原因**
3. 设计验证策略

### ⛔ 阶段 4：用户确认（使用三术 zhi）

`[模式：确认]`

调用 `mcp______zhi` 工具展示诊断结果并获取确认：
- `message`:
  ```
  ## 🔍 诊断结果

  ### Codex 分析（后端视角）
  <诊断摘要>

  ### Gemini 分析（前端视角）
  <诊断摘要>

  ### 综合诊断
  **最可能原因**：<具体诊断>
  **验证方案**：<如何确认>
  **修复方案**：<具体修复步骤>

  请选择操作：
  ```
- `is_markdown`: true
- `predefined_options`: ["确认修复", "先验证再修复", "查看详细分析", "取消"]

根据用户选择：
- 「确认修复」→ 进入阶段 5 执行修复
- 「先验证再修复」→ 执行验证方案，确认后再修复
- 「查看详细分析」→ 展示 Codex/Gemini 的完整诊断输出
- 「取消」→ 终止当前回复

**⚠️ 必须等待用户确认后才能进入阶段 5**

### 🔧 阶段 5：修复与验证

`[模式：执行]`

用户确认后：
1. 根据诊断实施修复
2. 运行测试验证修复

### 📝 阶段 6：创建 GitHub Issue（可选）

`[模式：GitHub]`

修复完成后，询问用户是否创建 GitHub Issue 记录此缺陷：

**三术(zhi)确认**：

调用 `mcp______zhi` 工具：
- `message`:
  ```
  ## 🐛 缺陷已修复

  是否创建 GitHub Issue 记录此缺陷？
  ```
- `is_markdown`: true
- `predefined_options`: ["创建 Bug Issue", "仅本地修复", "查看修复摘要"]

根据用户选择：
- 「创建 Bug Issue」→ 执行 GitHub Issue 创建流程
- 「仅本地修复」→ 完成工作流
- 「查看修复摘要」→ 展示诊断和修复摘要

**GitHub Issue 创建流程**：

1. **检测仓库信息**：
   ```bash
   git remote get-url origin
   # 解析 owner 和 repo
   ```

2. **创建 Issue**：
   ```
   mcp__github__create_issue({
     owner: "<owner>",
     repo: "<repo>",
     title: "Bug: <缺陷摘要>",
     body: "## 问题描述\n<错误现象>\n\n## 根因分析\n<诊断结论>\n\n## 修复方案\n<修复内容>\n\n## 复现步骤\n<复现步骤>",
     labels: ["bug"]
   })
   ```

3. **降级方案**：
   - GitHub MCP 不可用 → 使用 `gh issue create --title "<title>" --body "<body>" --label "bug"`

---

## 关键规则

1. **用户确认** – 修复前必须获得确认
2. **信任规则** – 后端问题以 Codex 为准，前端问题以 Gemini 为准
3. 外部模型对文件系统**零写入权限**

## 知识存储

修复完成后，调用 `mcp______ji` 存储缺陷模式和修复方案，更新项目已知问题库。
