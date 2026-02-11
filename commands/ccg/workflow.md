---
description: '多模型协作开发工作流（研究→构思→计划→执行→审查与修复→验收），智能路由前端→Gemini、后端→Codex'
---

# Workflow - 多模型协作开发

使用质量把关、MCP 服务和多模型协作执行结构化开发工作流。

## 使用方法

```bash
/workflow <任务描述>
```

## 上下文

- 要开发的任务：$ARGUMENTS
- 带质量把关的结构化 6 阶段工作流
- 多模型协作：Codex（后端）+ Gemini（前端）+ Claude（编排）
- MCP 服务集成（ace-tool）以增强功能

## 你的角色

你是**编排者**，协调多模型协作系统（研究 → 构思 → 计划 → 执行 → 审查与修复 → 验收），用中文协助用户，面向专业程序员，交互应简洁专业，避免不必要解释。

**协作模型**：
- **ace-tool MCP** – 代码检索 + Prompt 增强
- **Codex** – 后端逻辑、算法、调试（**后端权威，可信赖**）
- **Gemini** – 前端 UI/UX、视觉设计（**前端高手，后端意见仅供参考**）
- **Claude (自己)** – 编排、计划、执行、交付

---

## 核心协议

- **语言协议**：与工具/模型交互用**英语**，与用户交互用**中文**
- **代码主权**：外部模型对文件系统**零写入权限**，所有修改由 Claude 执行
- **Enhance 接管**：本命令自带 enhance 流程（阶段 1），全局入口协议的步骤 1-2 由此接管
- **止损机制**：当前阶段评分 <7 或用户未批准时，强制停止，不进入下一阶段
- **阶段回退**：阶段 4 实施失败时，可回退到阶段 3 重新规划（需用户确认）

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

## 多模型调用规范

**调用语法**（并行用 `run_in_background: true`，串行用 `false`）：

```
# 新会话调用
Bash({
  command: "C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe --backend <codex|gemini> - \"$PWD\" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
需求：<增强后的需求（如未增强则用 $ARGUMENTS）>
上下文：<前序阶段收集的项目上下文、分析结果等>
</TASK>
OUTPUT: 期望输出格式
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "简短描述"
})

# 复用会话调用
Bash({
  command: "C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe --backend <codex|gemini> resume <SESSION_ID> - \"$PWD\" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
需求：<增强后的需求（如未增强则用 $ARGUMENTS）>
上下文：<前序阶段收集的项目上下文、分析结果等>
</TASK>
OUTPUT: 期望输出格式
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "简短描述"
})
```

**角色提示词**：

| 阶段 | Codex | Gemini |
|------|-------|--------|
| 分析 | `C:/Users/Administrator/.claude/.ccg/prompts/codex/analyzer.md` | `C:/Users/Administrator/.claude/.ccg/prompts/gemini/analyzer.md` |
| 规划 | `C:/Users/Administrator/.claude/.ccg/prompts/codex/architect.md` | `C:/Users/Administrator/.claude/.ccg/prompts/gemini/architect.md` |
| 审查 | `C:/Users/Administrator/.claude/.ccg/prompts/codex/reviewer.md` | `C:/Users/Administrator/.claude/.ccg/prompts/gemini/reviewer.md` |

**会话复用**：每次调用返回 `SESSION_ID: xxx`，后续阶段用 `--resume xxx` 复用上下文。

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

## 沟通守则

1. 响应以模式标签 `[模式：X]` 开始，初始为 `[模式：研究]`。
2. 核心工作流严格按 `研究 → 构思 → 计划 → 执行 → 审查与修复 → 验收` 顺序流转。
3. **每个阶段完成后必须使用三术 (`mcp______zhi`) 请求用户确认**。
4. 评分低于 7 分或用户未批准时强制停止。
5. 在需要询问用户时，优先使用三术(zhi)工具进行交互。

---

## 执行工作流

**任务描述**：$ARGUMENTS

**工作流初始化**：
1. 调用 `mcp______ji` 回忆项目历史工作流模式、架构决策和开发规范
2. 如有历史经验，在后续阶段中参考使用

### 🔍 阶段 1：研究与分析

`[模式：研究]` - 理解需求并收集上下文：

1. **Prompt 增强**：优先调用 `mcp______enhance`（不可用时降级到 `mcp__ace-tool__enhance_prompt`；都不可用时使用 `mcp______zhi` 确认原始需求），**用增强结果替代原始 $ARGUMENTS，后续调用 Codex/Gemini 时传入增强后的需求**
2. **上下文检索**：调用 `mcp__ace-tool__search_context`（降级：`mcp______sou` → Glob + Grep）
3. **需求完整性评分**（0-10 分）：
   - 目标明确性（0-3）、预期结果（0-3）、边界范围（0-2）、约束条件（0-2）
   - ≥7 分：继续 | <7 分：⛔ 停止，提出补充问题

**阶段确认（使用三术 zhi）**：

调用 `mcp______zhi` 工具：
- `message`:
  ```
  ## 🔍 阶段 1 完成：研究与分析

  ### 需求完整性评分
  - 目标明确性：<X>/3
  - 预期结果：<X>/3
  - 边界范围：<X>/2
  - 约束条件：<X>/2
  - **总分：<X>/10**

  ### 检索到的上下文
  <关键文件/模块列表>

  是否进入下一阶段？
  ```
- `is_markdown`: true
- `predefined_options`: ["继续到构思阶段", "补充需求信息", "查看详细上下文", "终止"]

### 💡 阶段 2：方案构思

`[模式：构思]` - 多模型并行分析：

**并行调用**（`run_in_background: true`）：
- Codex：使用分析提示词，输出技术可行性、方案、风险
- Gemini：使用分析提示词，输出 UI 可行性、方案、体验

用 `TaskOutput` 等待结果。**📌 保存 SESSION_ID**（`CODEX_SESSION` 和 `GEMINI_SESSION`）。

**务必遵循上方 `多模型调用规范` 的 `重要` 指示**

综合两方分析，输出方案对比（至少 2 个方案）。

**阶段确认（使用三术 zhi）**：

调用 `mcp______zhi` 工具：
- `message`:
  ```
  ## 💡 阶段 2 完成：方案构思

  ### 方案对比
  | 方案 | 优势 | 劣势 | 推荐度 |
  |------|------|------|--------|
  | 方案 A | <优势> | <劣势> | ⭐⭐⭐ |
  | 方案 B | <优势> | <劣势> | ⭐⭐ |

  ### Codex 分析摘要
  <后端视角关键点>

  ### Gemini 分析摘要
  <前端视角关键点>

  请选择方案：
  ```
- `is_markdown`: true
- `predefined_options`: ["选择方案 A", "选择方案 B", "查看详细分析", "重新构思"]

### 📋 阶段 3：详细规划

`[模式：计划]` - 多模型协作规划：

**并行调用**（复用会话 `resume <SESSION_ID>`）：
- Codex：使用规划提示词 + `resume $CODEX_SESSION`，输出后端架构
- Gemini：使用规划提示词 + `resume $GEMINI_SESSION`，输出前端架构

用 `TaskOutput` 等待结果。

**务必遵循上方 `多模型调用规范` 的 `重要` 指示**

**Claude 综合规划**：采纳 Codex 后端规划 + Gemini 前端规划。

**阶段确认（使用三术 zhi）**：

调用 `mcp______zhi` 工具：
- `message`:
  ```
  ## 📋 阶段 3 完成：详细规划

  ### 计划摘要
  <关键步骤列表，3-5 条>

  ### 关键文件
  <将要修改的文件列表>

  ### 预计工作量
  <文件数/代码行数估算>

  是否批准此计划？
  ```
- `is_markdown`: true
- `predefined_options`: ["批准并开始实施", "修改计划", "查看完整计划", "终止"]

用户批准后存入 `.claude/plan/任务名.md`

**分支管理（可选）**：
计划批准后、实施前，检测当前分支：
1. 执行 `git branch --show-current` 获取当前分支名
2. 如果当前在 main/master 分支 → 调用 `mcp______zhi` 询问用户是否创建 feature 分支
3. 用户确认创建 → 检测仓库信息，使用 `mcp__github__create_branch` 创建远程分支，然后 `git checkout` 切换
   ```
   mcp__github__create_branch({
     owner: "<owner>",
     repo: "<repo>",
     branch: "feature/<task-name>"
   })
   ```
4. 降级方案：GitHub MCP 不可用时使用 `git checkout -b feature/<task-name>`

### ⚡ 阶段 4：实施

`[模式：执行]` - 代码开发：

- 严格按批准的计划实施
- 遵循项目现有代码规范
- 在关键里程碑请求反馈

**Chrome DevTools 验证门控**（涉及前端/UI 变更时）：
- 实施完成后，使用 Chrome DevTools MCP 进行自动化验证：
  1. `list_pages` / `navigate_page` 打开或刷新目标页面
  2. `list_console_messages` 检查控制台错误
  3. `evaluate_script` 验证关键 DOM 元素
  4. `take_screenshot` 截图留存证据
- **降级策略**：
  - L1（DevTools 部分受限）：至少获取截图 + 控制台状态，zhi 消息标注 `⚠️ 受限模式 (L1)`
  - L2（DevTools 不可用）：通过 `mcp______zhi` 提示用户手动验证，附带验证清单，标注 `⚠️ 手动模式 (L2)`
  - L3（高风险 UI 变更且无 DevTools）：暂停执行，zhi 消息标注 `🛑 暂停 (L3)`，要求确认后继续

**阶段确认（使用三术 zhi）**：

调用 `mcp______zhi` 工具：
- `message`:
  ```
  ## ⚡ 阶段 4 完成：实施

  ### 变更摘要
  | 文件 | 操作 | 说明 |
  |------|------|------|
  | <path> | <修改/新增/删除> | <描述> |

  ### 实施进度
  - 已完成步骤：<N>/<总数>
  - 代码行数：+<新增> / -<删除>

  是否进入审查阶段？
  ```
- `is_markdown`: true
- `predefined_options`: ["继续到审查阶段", "查看变更详情", "回滚变更", "终止"]

### 🔬 阶段 5：审查与修复

`[模式：审查]` - 多模型并行审查 + 问题修复：

**并行调用**：
- Codex：使用审查提示词，关注安全、性能、错误处理
- Gemini：使用审查提示词，关注可访问性、设计一致性

用 `TaskOutput` 等待结果。整合审查意见。

**阶段确认（使用三术 zhi）**：

调用 `mcp______zhi` 工具：
- `message`:
  ```
  ## 🔬 阶段 5 完成：审查与修复

  ### 审查结果
  - Codex 发现问题：<N> 个（Critical: <N>, Major: <N>, Minor: <N>）
  - Gemini 发现问题：<N> 个（Critical: <N>, Major: <N>, Minor: <N>）

  ### 问题清单
  <按严重程度排列的问题列表>

  请选择处理方式：
  ```
- `is_markdown`: true
- `predefined_options`: ["修复全部问题", "仅修复 Critical/Major", "跳过修复进入验收", "查看详细审查"]

用户确认后执行修复。

**务必遵循上方 `多模型调用规范` 的 `重要` 指示**

### ✅ 阶段 6：验收

`[模式：验收]` - 最终评估：

- 对照计划检查完成情况
- 运行测试验证功能
- **前端验证**（Chrome DevTools MCP 可用时）：
  - 使用 `take_screenshot` 截图对比变更前后
  - 使用 `take_snapshot` 验证 A11y 树结构
  - 使用 `performance_start_trace` + `performance_stop_trace` 检查性能指标
  - 降级处理同阶段 4 门控策略
- 报告问题与建议

**最终确认（使用三术 zhi）**：

调用 `mcp______zhi` 工具：
- `message`:
  ```
  ## ✅ 阶段 6 完成：验收

  ### 完成情况
  - 计划步骤：<已完成>/<总数>
  - 测试结果：<通过/失败>

  ### 变更总结
  | 文件 | 操作 | 说明 |
  |------|------|------|
  | <path> | <操作> | <描述> |

  ### 遗留问题
  <问题列表，若无则显示"无">

  ### 后续建议
  <建议列表>

  工作流已完成，请确认：
  ```
- `is_markdown`: true
- `predefined_options`: ["确认完成", "提交代码", "查看完整报告", "创建 GitHub PR"]

根据用户选择：
- 「确认完成」→ 工作流结束，调用 `mcp______ji` 存储经验
- 「提交代码」→ 调用 `ccg:commit` 命令
- 「查看完整报告」→ 展示完整的工作流报告
- 「创建 GitHub PR」→ 进入阶段 7

### 🚀 阶段 7：GitHub PR 创建（可选）

`[模式：GitHub]`

用户在阶段 6 选择「创建 GitHub PR」后直接进入此流程，无需二次确认。

**GitHub PR 创建流程**：

1. **检测仓库信息**：
   ```bash
   git remote get-url origin
   # 解析 owner 和 repo
   ```

2. **获取分支信息**：
   ```bash
   git branch --show-current  # head 分支
   git rev-parse --abbrev-ref origin/HEAD  # 返回 origin/main，截取后半部分作为 base
   # 若报错：先执行 git remote set-head origin --auto
   ```

3. **生成 PR 标题和描述**：
   - 标题：基于提交历史生成（≤70 字符）
   - 描述：包含变更摘要、测试计划、关键文件列表

4. **创建 Pull Request**：
   ```
   mcp__github__create_pull_request({
     owner: "<owner>",
     repo: "<repo>",
     title: "<PR 标题>",
     head: "<当前分支>",
     base: "<目标分支，通常是 main 或 master>",
     body: "## 变更摘要\n<变更列表>\n\n## 测试计划\n<测试清单>\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)"
   })
   ```

5. **降级方案**：
   - GitHub MCP 不可用 → 使用 `gh pr create --title "<title>" --body "<body>"`
   - 创建失败 → 提示用户检查权限和分支状态

**工作流结束**：
调用 `mcp______ji` 存储本次工作流的关键决策、架构变更和实施经验，供后续会话复用。

---

## 关键规则

1. 阶段顺序不可跳过（除非用户明确指令）
2. 外部模型对文件系统**零写入权限**，所有修改由 Claude 执行
3. 评分 <7 或用户未批准时**强制停止**
4. 阶段 4 失败可回退到阶段 3 重新规划（需用户确认）
5. 阶段 5 审查发现的 Critical 问题必须在进入阶段 6 前修复
6. 「确认完成」= 工作流终止，不自动跳转 PR 创建
