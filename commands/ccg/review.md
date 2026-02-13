---
description: '多视角代码审查：从安全性、性能、可维护性三个维度对代码变更进行系统化审查'
---

# Review - 多视角代码审查

多视角代码审查，从安全性、性能、可维护性三个维度对代码变更进行系统化审查。无参数时自动审查当前 git 变更。

## 使用方法

```bash
/review [代码或描述]
```

- **无参数**：自动审查 `git diff HEAD`
- **有参数**：审查指定代码或描述

## 你的角色

你是**代码审查协调者**，负责将用户的审查需求委托给 `review-agent` 代理执行。

---

## 执行工作流

### 步骤 1：委托给 review-agent

调用 Task 工具启动 review-agent 代理，传入用户需求。

```
Task({
  subagent_type: "review-agent",
  prompt: "$ARGUMENTS",
  description: "多视角代码审查"
})
```

review-agent 将自动执行以下流程：
1. 获取变更内容（git diff 或 PR 详情）
2. 检索上下文（变更文件的上下游依赖）
3. 多维度审查（安全性、性能、可维护性、正确性、前端视觉/A11y）
4. 问题分类（Critical / Warning / Info）
5. 输出审查报告
6. 可选：创建 GitHub PR Review
7. 可选：合并 PR

### 步骤 2：等待代理完成

review-agent 完成后会返回完整的代码审查报告，包含：
- 变更概述
- 审查结果摘要（Critical / Warning / Info 数量）
- 分类问题列表（含文件路径、行号、问题描述、修复建议）
- 改进建议
- 总结（整体评价与是否建议合并）

---

## 适用场景

| 场景 | 示例 |
|------|------|
| 本地审查 | `/review`（无参数，审查当前 git diff） |
| PR 审查 | `/review PR #123` |
| 代码片段审查 | `/review <代码片段>` |
| 安全审计 | `/review 审查认证模块的安全性` |

## 关键规则

1. **无参数 = 审查 git diff** – 自动获取当前变更
2. **多维度审查** – 安全性、性能、可维护性、正确性
3. **问题分级** – Critical 必须修复，Warning 建议修复，Info 可选修复

## 知识存储

审查完成后，调用 `mcp______ji` 存储审查模式和代码规范偏好，供后续会话复用。

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
审查以下代码变更：
<git diff 内容>
</TASK>
OUTPUT: 按 Critical/Warning/Info 分类列出问题
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
| Codex | `~/.claude/.ccg/prompts/codex/reviewer.md` |
| Gemini | `~/.claude/.ccg/prompts/gemini/reviewer.md` |

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

### 🔍 阶段 1：获取待审查代码

`[模式：研究]`

1. 调用 `mcp______ji` 回忆项目代码规范和审查标准

**无参数时**：执行 `git diff HEAD` 和 `git status --short`

**有参数时**：使用指定的代码/描述

**如果是 PR 审查**（用户提供 PR 编号或 URL）：
- 检测仓库信息（`git remote get-url origin`）
- 解析 owner 和 repo
- 调用 `mcp__github__get_pull_request` 获取 PR 详情：
  ```
  mcp__github__get_pull_request({
    owner: "<owner>",
    repo: "<repo>",
    pull_number: <pr-number>
  })
  ```
- 获取 PR 标题、描述、作者、状态、变更文件列表
- 使用 `mcp__github__get_pull_request_files` 获取详细的文件变更
- **可选**：使用 `mcp__github__update_pull_request_branch` 更新 PR 分支到最新（通过 `mcp______zhi` 询问用户是否更新）
- 降级方案：GitHub MCP 不可用时使用 `gh pr view <pr-number> --json title,body,files`

**如果用户要求列出 PR**（无具体 PR 编号）：
- 调用 `mcp__github__list_pull_requests` 获取 PR 列表：
  ```
  mcp__github__list_pull_requests({
    owner: "<owner>",
    repo: "<repo>"
  })
  ```
- 通过 `mcp______zhi` 展示 PR 列表供用户选择
- 降级方案：GitHub MCP 不可用时使用 `gh pr list`

调用 `mcp__ace-tool__search_context` 获取相关上下文（降级：`mcp______sou` → Glob + Grep）。

### 🔬 阶段 2：并行审查

`[模式：审查]`

**如果是 PR 审查，先检查 CI/CD 状态**：
- 调用 `mcp__github__get_pull_request_status` 获取 CI/CD 状态：
  ```
  mcp__github__get_pull_request_status({
    owner: "<owner>",
    repo: "<repo>",
    pull_number: <pr-number>
  })
  ```
- 如果 CI 失败，在审查报告中标注"⚠️ CI/CD 检查失败，建议先修复构建问题"
- 降级方案：GitHub MCP 不可用时使用 `gh pr checks <pr-number>`

**获取 PR 提交历史**（可选）：
- 使用 `mcp__github__list_commits` 获取 PR 分支的提交历史：
  ```
  mcp__github__list_commits({
    owner: "<owner>",
    repo: "<repo>",
    sha: "<pr-head-branch>"
  })
  ```
- 用于理解变更演进过程和提交粒度
- 降级方案：GitHub MCP 不可用时使用 `git log --oneline <base>..HEAD`

**⚠️ 必须发起两个并行 Bash 调用**（参照上方调用规范）：

1. **Codex 后端审查**：`Bash({ command: "...--backend codex...", run_in_background: true })`
   - ROLE_FILE: `~/.claude/.ccg/prompts/codex/reviewer.md`
   - 需求：审查代码变更（git diff 内容）
   - OUTPUT：按 Critical/Warning/Info 分类列出安全性、性能、错误处理问题

2. **Gemini 前端审查**：`Bash({ command: "...--backend gemini...", run_in_background: true })`
   - ROLE_FILE: `~/.claude/.ccg/prompts/gemini/reviewer.md`
   - 需求：审查代码变更（git diff 内容）
   - OUTPUT：按 Critical/Warning/Info 分类列出可访问性、响应式、设计一致性问题

用 `TaskOutput` 等待两个模型的审查结果。**必须等所有模型返回后才能进入下一阶段**。

**务必遵循上方 `多模型调用规范` 的 `重要` 指示**

### 🔀 阶段 3：综合反馈

`[模式：综合]`

1. 收集双方审查结果
2. 按严重程度分类：Critical / Warning / Info
3. 去重合并 + 交叉验证

### 📊 阶段 4：呈现审查结果（使用三术 zhi）

`[模式：总结]`

调用 `mcp______zhi` 工具展示审查报告：
- `message`:
  ```
  ## 📋 代码审查报告

  ### 审查范围
  - 变更文件：<数量> | 代码行数：+X / -Y

  ### 关键问题 (Critical)
  > 必须修复才能合并
  <问题列表，若无则显示"无">

  ### 警告问题 (Warning)
  <问题列表，若无则显示"无">

  ### 信息提示 (Info)
  <问题列表，若无则显示"无">

  ### 总体评价
  - 代码质量：[优秀/良好/需改进]
  - 是否可合并：[是/否/需修复后]

  请选择下一步操作：
  ```
- `is_markdown`: true
- `predefined_options`: ["自动修复问题", "查看详细分析", "导出报告", "创建 Issue", "完成审查"]

根据用户选择：
- 「自动修复问题」→ 根据审查意见自动修复 Critical/Warning 问题
- 「查看详细分析」→ 展示 Codex/Gemini 的完整审查输出
- 「导出报告」→ 将报告保存至 `.claude/review-report.md`
- 「创建 Issue」→ 为 Critical/Warning 问题创建 GitHub Issue（执行 Issue 创建流程）
- 「完成审查」→ 进入阶段 5（GitHub PR 审查）

**GitHub Issue 创建流程**（用户选择「创建 Issue」时执行）：

1. **检测仓库信息**：`git remote get-url origin`，解析 owner 和 repo
2. **为每个 Critical/Warning 问题创建 Issue**：
   ```
   mcp__github__create_issue({
     owner: "<owner>",
     repo: "<repo>",
     title: "<问题标题>",
     body: "## 审查发现\n- **严重程度**：<Critical/Warning>\n- **文件**：<file:line>\n- **问题**：<描述>\n- **建议修复**：<方案>",
     labels: ["bug", "code-review"]
   })
   ```
3. **降级方案**：GitHub MCP 不可用时使用 `gh issue create`

### 🚀 阶段 5：GitHub PR 审查（可选）

`[模式：GitHub]`

审查完成后，询问用户是否创建 GitHub PR Review：

**三术(zhi)确认**：

调用 `mcp______zhi` 工具：
- `message`:
  ```
  ## ✅ 审查完成

  是否将审查结果提交到 GitHub PR？
  ```
- `is_markdown`: true
- `predefined_options`: ["创建 PR Review", "仅本地审查", "查看 PR 信息"]

根据用户选择：
- 「创建 PR Review」→ 执行 GitHub PR Review 流程
- 「仅本地审查」→ 完成工作流
- 「查看 PR 信息」→ 获取 PR 详情

**GitHub PR Review 流程**：

1. **检测仓库信息**：
   ```bash
   git remote get-url origin
   # 解析 owner 和 repo
   ```

2. **获取 PR 编号**：
   - 从当前分支名推断（如 `pr-123`）
   - 或询问用户输入 PR 编号

3. **创建 PR Review**：
   ```
   mcp__github__create_pull_request_review({
     owner: "<owner>",
     repo: "<repo>",
     pull_number: <pr-number>,
     event: "<APPROVE|REQUEST_CHANGES|COMMENT>",
     body: "<审查报告摘要>",
     comments: [
       {
         path: "<file-path>",
         line: <line-number>,
         body: "<具体问题描述>"
       }
     ]
   })
   ```

   **event 选择规则**：
   - 有 Critical 问题 → `REQUEST_CHANGES`
   - 无 Critical，有 Warning → `COMMENT`
   - 无 Critical/Warning → `APPROVE`

4. **降级方案**：
   - GitHub MCP 不可用 → 使用 `gh pr review <pr-number> --approve/--request-changes --body "<message>"`
   - PR 编号未知 → 提示用户手动创建审查

### 🎯 阶段 6：GitHub PR 合并（可选）

`[模式：合并]`

如果审查结果为 APPROVE 且无 Critical/Warning 问题，询问用户是否合并 PR：

**三术(zhi)确认**：

调用 `mcp______zhi` 工具：
- `message`:
  ```
  ## ✅ 审查通过

  代码质量良好，无关键问题。是否合并此 PR？
  ```
- `is_markdown`: true
- `predefined_options`: ["合并 PR (squash)", "合并 PR (merge)", "合并 PR (rebase)", "暂不合并"]

根据用户选择：
- 「合并 PR (squash)」→ 使用 squash 方式合并
- 「合并 PR (merge)」→ 使用 merge 方式合并
- 「合并 PR (rebase)」→ 使用 rebase 方式合并
- 「暂不合并」→ 完成工作流

**GitHub PR 合并流程**：

1. **合并 Pull Request**：
   ```
   mcp__github__merge_pull_request({
     owner: "<owner>",
     repo: "<repo>",
     pull_number: <pr-number>,
     merge_method: "squash"  // 或 merge, rebase
   })
   ```

2. **降级方案**：
   - GitHub MCP 不可用 → 使用 `gh pr merge <pr-number> --squash/--merge/--rebase`
   - 合并失败 → 提示用户检查权限和分支状态

---

## 关键规则

1. **无参数 = 审查 git diff** – 自动获取当前变更
2. **双模型交叉验证** – 后端问题以 Codex 为准，前端问题以 Gemini 为准
3. 外部模型对文件系统**零写入权限**

## 知识存储

审查完成后，调用 `mcp______ji` 存储审查模式和代码规范偏好，供后续会话复用。
