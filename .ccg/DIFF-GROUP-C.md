# C 组对比报告：12 个轻度增强命令文件

> 生成时间：2026-02-12
> 上游目录：`D:/Program Files/nvm/node_global/node_modules/ccg-workflow/templates/commands/`
> 本地目录：`C:/Users/Administrator/.claude/commands/ccg/`

---

## 一、共性差异汇总表

以下差异模式在多数（或全部）文件中均出现，后续各文件单独表仅列出特有差异。

| # | 差异类别 | 上游内容 | 本地内容 | 涉及文件数 | 同步建议 |
|---|---------|---------|---------|-----------|---------|
| C1 | **路径硬编码** | `~/.claude/bin/codeagent-wrapper` | `C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe` | 10/12（除 rollback、init） | 本地定制化，保留本地版本；上游模板使用 `~` 波浪号更具可移植性 |
| C2 | **路径硬编码（提示词）** | `~/.claude/.ccg/prompts/...` | `C:/Users/Administrator/.claude/.ccg/prompts/...` | 10/12（除 rollback、init） | 同 C1 |
| C3 | **路径硬编码（agent）** | `~/.claude/agents/ccg/...` | `C:/Users/Administrator/.claude/agents/ccg/...` | 1/12（feat） | 同 C1 |
| C4 | **`{{LITE_MODE_FLAG}}` 缺失** | 调用语法中包含 `{{LITE_MODE_FLAG}}` 占位符 | 已移除，不包含此占位符 | 10/12（除 rollback、init） | **建议同步**：上游支持 Lite 模式切换，本地丢失此能力 |
| C5 | **`{{GEMINI_MODEL_FLAG}}` 缺失** | 调用语法中包含 `{{GEMINI_MODEL_FLAG}}` 占位符 + 模型参数说明段 | 已移除占位符和整个参数说明段 | 8/12（execute、feat、test、plan、analyze、optimize；backend 和 rollback 本就不涉及） | **建议同步**：上游支持 `--gemini-model gemini-3-pro-preview` 参数，本地丢失 Gemini 模型选择能力 |
| C6 | **`{{WORKDIR}}` / 多工作区检测缺失** | 包含完整 `{{WORKDIR}}` 说明段：多工作区检测 + `AskUserQuestion` 询问 | 已移除整段，改用 `$PWD` 硬编码 | 8/12（execute、feat、test、backend、plan、analyze、optimize、worktree 原本无此段） | **建议同步**：上游支持 `/add-dir` 多工作区场景，本地丢失此能力 |
| C7 | **`resume` 语法缺失** | 调用语法中明确展示 `resume <SESSION_ID>` 的复用会话语法 | 部分文件保留了 resume 语法，但缺少上游的一些参数模板 | 变化不一 | 逐文件检查 |
| C8 | **`AskUserQuestion` → `mcp______zhi`** | 超时等待、用户确认等场景使用 `AskUserQuestion` | 替换为 `mcp______zhi`（三术 zhi） | 10/12（除 rollback、init） | 本地增强，保留本地版本 |
| C9 | **新增「网络搜索规范」段** | 无此段落 | 新增完整 GrokSearch 优先规范（5步流程 + 降级策略） | 8/12（execute、feat、test、backend、plan、analyze、optimize、以及 clean-branches 无此段） | 本地增强，保留本地版本 |
| C10 | **新增「知识存储」段** | 无此段落 | 工作流结束时调用 `mcp______ji` 存储关键决策/经验 | 8/12（execute、feat、test、backend、plan、analyze、optimize、rollback） | 本地增强，保留本地版本 |
| C11 | **新增「执行初始化」段** | 无此段落 | 工作流开始时调用 `mcp______ji` 回忆历史经验 | 7/12（execute、feat、test、backend、plan、analyze、optimize） | 本地增强，保留本地版本 |
| C12 | **Prompt 增强工具替换** | 上游使用 `/ccg:enhance 的逻辑执行` 或内联描述 | 本地改为 `优先调用 mcp______enhance（不可用时降级到 mcp__ace-tool__enhance_prompt）` | 7/12（feat、test、backend、plan、analyze、optimize、enhance 本身） | 本地增强，保留本地版本 |
| C13 | **上下文检索工具替换** | 上游使用 `{{MCP_SEARCH_TOOL}}` 占位符 | 本地改为 `mcp__ace-tool__search_context`（降级：`mcp______sou` → Glob + Grep） | 6/12（execute、feat、plan、analyze、backend、optimize） | 本地具体化了工具名，保留本地版本；但上游的占位符设计更灵活 |
| C14 | **沟通守则工具替换** | `尽量使用 AskUserQuestion 工具` | `优先使用三术 (mcp______zhi) 工具` | 5/12（feat、backend、optimize、以及 execute 和 plan 的等待超时场景） | 本地增强，保留本地版本 |
| C15 | **description 字段变更** | 部分文件 description 略有不同 | enhance.md 的 description 从"内置 Prompt 增强"改为"使用 ace-tool 增强 Prompt 后通过三术(zhi)确认执行" | 1/12（enhance） | 本地描述更准确，保留 |

---

## 二、各文件单独差异表

### 1. execute.md（上游 10244B → 本地 13214B, +29%）

**共性差异**：C1, C2, C4, C5, C6, C8, C9, C10, C11, C13

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|----------|-------------|-------------|---------|---------|
| 多模型调用规范 - 工作目录 | 完整 `{{WORKDIR}}` 段（多工作区检测 + AskUserQuestion） | 已移除整段 | **上游缺失于本地** | 建议从上游同步多工作区支持 |
| 多模型调用规范 - 模型参数 | `{{GEMINI_MODEL_FLAG}}` 说明段 | 已移除 | **上游缺失于本地** | 建议同步 |
| Phase 0 - 执行前确认 | 简单文字描述："若无法确认...必须二次询问" | 完整 `mcp______zhi` 调用模板（Markdown 展示 + predefined_options） | 本地增强 | 保留本地版本 |
| Phase 1 - 上下文检索 | 使用 `{{MCP_SEARCH_TOOL}}` 占位符 | 使用 `mcp__ace-tool__search_context` + 降级链 | 本地具体化 | 保留本地版本 |
| Phase 5.3 - 交付确认 | 简单 Markdown 报告格式 | 完整 `mcp______zhi` 交互 + predefined_options（运行测试/提交代码/查看变更/更新Issue/完成） | 本地大幅增强 | 保留本地版本 |
| Phase 5.3 - GitHub Issue 更新 | 无此内容 | 新增完整 GitHub Issue 更新流程（检测仓库 → update_issue → add_comment → 降级到 gh CLI） | **本地独有** | 保留本地版本 |
| 网络搜索规范 | 无 | 新增完整 GrokSearch 段 | **本地独有** | 保留 |
| 执行初始化 | 无 | 新增 `mcp______ji` 回忆历史经验 | **本地独有** | 保留 |
| 执行结束 | 无 | 新增 `mcp______ji` 存储关键决策 | **本地独有** | 保留 |

---

### 2. feat.md（上游 6630B → 本地 8470B, +28%）

**共性差异**：C1, C2, C3, C4, C5, C6, C8, C9, C10, C11, C12, C13, C14

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|----------|-------------|-------------|---------|---------|
| 2.0 Prompt 增强 | 内联描述"按 /ccg:enhance 的逻辑执行" | `优先调用 mcp______enhance`（降级到 ace-tool） | 本地具体化 | 保留本地版本 |
| 2.1 上下文检索 | `{{MCP_SEARCH_TOOL}}` 占位符 | `mcp__ace-tool__search_context` + 降级链 | 本地具体化 | 保留本地版本 |
| 2.1 GitHub Issue 获取 | 无此内容 | 新增完整 GitHub Issue 获取流程（`mcp__github__get_issue` + 降级到 `gh issue view`） | **本地独有** | 保留本地版本 |
| 2.5 交互确认 | 简单文字"询问用户" + 4 选项列表 | 完整 `mcp______zhi` 调用模板 + Markdown 展示 + predefined_options | 本地增强 | 保留本地版本 |
| 功能开发初始化 | 无 | 新增 `mcp______ji` 回忆历史经验 | **本地独有** | 保留 |
| 功能开发结束 | 无 | 新增 `mcp______ji` 存储经验 | **本地独有** | 保留 |
| 网络搜索规范 | 无 | 新增完整 GrokSearch 段 | **本地独有** | 保留 |
| 沟通守则 | `AskUserQuestion` | `mcp______zhi` | 工具替换 | 保留本地版本 |

---

### 3. test.md（上游 5502B → 本地 7010B, +27%）

**共性差异**：C1, C2, C4, C5, C6, C8, C9, C10, C11, C12, C13

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|----------|-------------|-------------|---------|---------|
| 阶段 0 Prompt 增强 | 内联描述 `/ccg:enhance` 逻辑 | `优先调用 mcp______enhance` + 降级链 | 本地具体化 | 保留 |
| 阶段 1 测试分析 | 仅"检索目标代码" | 新增 `mcp______ji` 回忆 + `mcp__ace-tool__search_context` + 降级链 | 本地增强 | 保留 |
| 测试策略金字塔 | 简单金字塔图 | 金字塔图 + E2E 行注释"Chrome DevTools MCP 浏览器自动化" | 本地增强 | 保留 |
| Chrome DevTools E2E 测试门控 | 无此内容 | 新增完整 E2E 测试流程（可用性检测 → 测试流程 → 降级策略） | **本地独有** | 保留本地版本 |
| 知识存储 | 无 | 新增 `mcp______ji` 存储测试模式和覆盖率 | **本地独有** | 保留 |
| 网络搜索规范 | 无 | 新增完整 GrokSearch 段 | **本地独有** | 保留 |

**特殊差异**：本地 test.md 是唯一新增了 **Chrome DevTools E2E 测试门控** 的命令文件。

---

### 4. rollback.md（上游 2403B → 本地 3051B, +27%）

**共性差异**：C8, C10

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|----------|-------------|-------------|---------|---------|
| 阶段 5 最终确认 | "显示即将执行的命令，等待用户确认（除非 --yes）" | 完整 `mcp______zhi` 调用（展示方案 + predefined_options: ["确认执行", "切换模式", "取消回滚"]） | 本地增强 | 保留本地版本 |
| 阶段 7 记录回滚历史 | 无此阶段 | 新增完整阶段 7（调用 `mcp______ji` 存储回滚记录） | **本地独有** | 保留本地版本 |

**特殊差异**：rollback.md 无 codeagent-wrapper 调用，故不涉及 C1/C4/C5/C6 等差异。本地新增了完整的阶段 7 是此文件最显著的特有差异。

---

### 5. backend.md（上游 5261B → 本地 6189B, +18%）

**共性差异**：C1, C2, C4, C6, C8, C9, C10, C11, C12, C13, C14

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|----------|-------------|-------------|---------|---------|
| 阶段 0 Prompt 增强 | 内联描述 `/ccg:enhance` 逻辑 | `优先调用 mcp______enhance` + 降级链 | 本地具体化 | 保留 |
| 阶段 1 研究 | 仅代码检索 | 新增 `mcp______ji` 回忆 + `mcp__ace-tool__search_context` + 降级链 | 本地增强 | 保留 |
| 沟通守则 | `AskUserQuestion` | `mcp______zhi` | 工具替换 | 保留本地版本 |
| 知识存储 | 无 | 新增 `mcp______ji` 存储 API 设计规范和架构决策 | **本地独有** | 保留 |
| 网络搜索规范 | 无 | 新增完整 GrokSearch 段 | **本地独有** | 保留 |

**注意**：backend.md 仅使用 Codex（不涉及 Gemini），因此无 `{{GEMINI_MODEL_FLAG}}` 差异（C5 不适用）。

---

### 6. plan.md（上游 8553B → 本地 9960B, +16%）

**共性差异**：C1, C2, C4, C5, C6, C8, C9, C10, C11, C12, C13

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|----------|-------------|-------------|---------|---------|
| Phase 1.1 Prompt 增强 | 内联描述 `/ccg:enhance` 逻辑 | 完整 `mcp______enhance` 调用代码块（含参数示例） | 本地具体化 | 保留 |
| Phase 1.2 上下文检索 | `{{MCP_SEARCH_TOOL}}` 占位符 + 代码块 | `mcp__ace-tool__search_context` + 降级链 | 本地具体化 | 保留 |
| Phase 2 结束 - 计划交付 | 加粗文本提示 + 执行命令模板 | 替换为完整 `mcp______zhi` 交互（predefined_options: ["查看完整计划", "执行计划", "修改计划", "稍后处理"]） | 本地大幅增强 | 保留本地版本 |
| 规划初始化 | 无 | 新增 `mcp______ji` 回忆历史规划经验 | **本地独有** | 保留 |
| 规划结束 | 无 | 新增 `mcp______ji` 存储关键决策 | **本地独有** | 保留 |
| 网络搜索规范 | 无 | 新增完整 GrokSearch 段 | **本地独有** | 保留 |

---

### 7. enhance.md（上游 1755B → 本地 1997B, +14%）

**共性差异**：C12, C15

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|----------|-------------|-------------|---------|---------|
| description | `内置 Prompt 增强，将模糊需求转化为结构化任务描述` | `使用 ace-tool 增强 Prompt 后通过三术(zhi)确认执行` | 本地修改 | 保留本地版本 |
| Your Role | `You are the **Prompt Enhancer** - 将模糊的用户输入转化为清晰、可执行的任务描述。` | `You are the **Prompt Enhancer** that optimizes user prompts for better AI task execution.` | 本地修改（改为英文） | 两者等价 |
| 工作流结构 | 4 步：分析 → 增强 → 展示对比 → 执行 | 3 步：增强（mcp______enhance/ace-tool）→ 三术(zhi)确认 → 执行 | **完全重构** | 保留本地版本 |
| Step 1/第一步 | 手动分析（意图/缺失/假设/线索） | 调用 `mcp______enhance` 工具（降级到 `mcp__ace-tool__enhance_prompt`） | 工具替换 | 保留本地版本 |
| Step 2/第二步 | 手动生成增强版 Prompt（5项结构化内容） | 调用 `mcp______zhi` 展示增强前后对比 + predefined_options | 工具替换 | 保留本地版本 |
| Step 3/展示对比 | 简单文本格式（原始 vs 增强 + Y/n） | 集成在 `mcp______zhi` 的 Markdown 展示中 | 本地集成化 | 保留 |
| 增强原则 | 完整 4 条原则（补全不改变/具体不泛化/简洁不冗长/可执行不描述） | 无此段（被工具调用替代） | **上游缺失于本地** | **建议从上游同步增强原则段落**，可作为工具调用的补充说明 |
| 注意事项 | 2 条（语言检测 + 触发方式） | 4 条（降级策略 + 用户可控 + 编码规范 + 语言检测 + 触发方式） | 本地增强 | 保留本地版本 |

**特殊差异**：enhance.md 是 12 个文件中**重构幅度最大**的文件，上游的手动 4 步流程被完全替换为工具驱动的 3 步流程。上游的"增强原则"段落有参考价值，建议保留。

---

### 8. clean-branches.md（上游 2346B → 本地 2683B, +14%）

**共性差异**：C8

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|----------|-------------|-------------|---------|---------|
| 阶段 3 报告预览 | 仅展示 Markdown 预览格式 | 新增 `mcp______zhi` 调用（展示清理列表 + predefined_options: ["确认清理", "调整范围", "取消"]） | 本地增强 | 保留本地版本 |

**特殊差异**：clean-branches.md 差异最小，仅一处 zhi 工具增强。无 codeagent-wrapper 调用，无网络搜索规范，无知识存储。

---

### 9. analyze.md（上游 5072B → 本地 5728B, +13%）

**共性差异**：C1, C2, C4, C5, C6, C8, C9, C10, C11, C12, C13

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|----------|-------------|-------------|---------|---------|
| 阶段 0 Prompt 增强 | 内联描述 `/ccg:enhance` 逻辑 | `优先调用 mcp______enhance` + 降级链 | 本地具体化 | 保留 |
| 阶段 1 上下文检索 | `{{MCP_SEARCH_TOOL}}` 占位符 | 新增 `mcp______ji` 回忆 + `mcp__ace-tool__search_context` + 降级链 | 本地增强 | 保留 |
| 知识存储 | 无 | 新增 `mcp______ji` 存储分析结论和推荐方案 | **本地独有** | 保留 |
| 网络搜索规范 | 无 | 新增完整 GrokSearch 段 | **本地独有** | 保留 |

**特殊差异**：无特殊差异，完全符合共性模式。

---

### 10. optimize.md（上游 5458B → 本地 6099B, +12%）

**共性差异**：C1, C2, C4, C5, C6, C8, C9, C10, C11, C12, C13, C14

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|----------|-------------|-------------|---------|---------|
| 阶段 0 Prompt 增强 | 内联描述 `/ccg:enhance` 逻辑 | `优先调用 mcp______enhance` + 降级链 | 本地具体化 | 保留 |
| 阶段 1 性能基线 | `{{MCP_SEARCH_TOOL}}` 占位符 | 新增 `mcp______ji` 回忆 + `mcp__ace-tool__search_context` + 降级链 | 本地增强 | 保留 |
| 沟通守则 | `AskUserQuestion` | `mcp______zhi` | 工具替换 | 保留本地版本 |
| 知识存储 | 无 | 新增 `mcp______ji` 存储优化结果和性能基线 | **本地独有** | 保留 |
| 网络搜索规范 | 无 | 新增完整 GrokSearch 段 | **本地独有** | 保留 |

**特殊差异**：无特殊差异，完全符合共性模式。

---

### 11. worktree.md（上游 2781B → 本地 3060B, +10%）

**共性差异**：C8

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|----------|-------------|-------------|---------|---------|
| Add 创建 Worktree 步骤 | 5 步流程：验证 → 计算路径 → 创建 → 复制环境 → IDE打开 | 6 步流程：验证 → 计算路径 → **zhi 确认** → 创建 → 复制环境 → IDE打开 | 本地增强（新增步骤 3） | 保留本地版本 |
| Migrate 迁移步骤 | 5 步流程：验证源 → 确保目标 → 显示改动 → 迁移 → 确认 | 5 步流程：验证源 → 确保目标 → **zhi 确认** → 迁移 → 确认 | 本地增强（步骤 3 改为 zhi） | 保留本地版本 |

**特殊差异**：无 codeagent-wrapper 调用，无网络搜索规范，无知识存储。差异仅限于 zhi 确认工具的集成。

---

### 12. init.md（上游 2555B → 本地 2648B, +4%）

**共性差异**：无明显共性差异

| 段落/章节 | 上游内容摘要 | 本地内容摘要 | 差异类型 | 同步建议 |
|----------|-------------|-------------|---------|---------|
| 步骤 2 init-architect 调用 | `工作目录：{{WORKDIR}}` | `工作目录：$PWD` | 路径替换 | 两者等价，保留本地版本 |

**特殊差异**：init.md 差异最小（仅 4%），只有一处 `{{WORKDIR}}` → `$PWD` 的替换。这是因为 init.md 不涉及 codeagent-wrapper 调用、网络搜索、知识存储等功能。

---

## 三、上游有而本地缺失的关键功能

| # | 缺失功能 | 影响范围 | 严重程度 | 建议 |
|---|---------|---------|---------|------|
| M1 | `{{LITE_MODE_FLAG}}` 占位符 | 所有 codeagent-wrapper 调用（10个文件） | **中** | 同步回本地，支持 Lite 模式切换 |
| M2 | `{{GEMINI_MODEL_FLAG}}` + 模型参数说明 | 8 个涉及 Gemini 的文件 | **中** | 同步回本地，支持 Gemini 模型选择 |
| M3 | `{{WORKDIR}}` 多工作区检测 | 8 个文件 | **中** | 同步回本地，支持 `/add-dir` 多工作区 |
| M4 | enhance.md 的"增强原则"段 | enhance.md | **低** | 建议保留作为补充说明 |

---

## 四、本地有而上游缺失的增强功能

| # | 增强功能 | 影响范围 | 价值评估 | 建议 |
|---|---------|---------|---------|------|
| E1 | GrokSearch 网络搜索规范 | 8 个文件 | **高** - 提供结构化搜索降级链 | 保留，可考虑提 PR 给上游 |
| E2 | `mcp______ji` 知识存储/回忆 | 8 个文件 | **高** - 跨会话知识复用 | 保留 |
| E3 | `mcp______zhi` 交互确认 | 10 个文件 | **高** - 更丰富的用户交互 | 保留 |
| E4 | `mcp______enhance` 增强工具 | 7 个文件 | **中** - 工具化 prompt 增强 | 保留 |
| E5 | `mcp__ace-tool__search_context` | 6 个文件 | **中** - 具体化上下文检索 | 保留 |
| E6 | Chrome DevTools E2E 测试门控 | test.md | **中** - 浏览器自动化测试 | 保留 |
| E7 | GitHub MCP Issue 操作 | execute.md, feat.md | **中** - Issue 自动化管理 | 保留 |
| E8 | 回滚历史记录 | rollback.md | **低** - 回滚审计追踪 | 保留 |

---

## 五、同步优先级建议

### 高优先级（建议立即同步）

1. **M1 `{{LITE_MODE_FLAG}}`**：恢复 Lite 模式支持，在所有 codeagent-wrapper 调用中添加占位符
2. **M2 `{{GEMINI_MODEL_FLAG}}`**：恢复 Gemini 模型选择能力，在涉及 Gemini 的调用中添加占位符 + 参数说明段

### 中优先级（建议近期同步）

3. **M3 `{{WORKDIR}}`**：恢复多工作区检测支持，添加完整的工作目录说明段

### 低优先级（可选）

4. **M4 增强原则**：在 enhance.md 中保留上游的"增强原则"段作为补充
5. **路径可移植性**：考虑将本地硬编码路径改为变量化方案（但这涉及 ccg-workflow 安装器的改造）

---

## 六、文件差异程度排序

| 排名 | 文件 | 增幅 | 特有差异数 | 复杂度 |
|-----|------|------|----------|-------|
| 1 | execute.md | +29% | 3（GitHub Issue流程、Phase 0 zhi确认、Phase 5.3 zhi交付） | **高** |
| 2 | feat.md | +28% | 2（GitHub Issue获取、2.5 zhi确认） | **高** |
| 3 | test.md | +27% | 1（Chrome DevTools E2E 门控） | **中高** |
| 4 | rollback.md | +27% | 1（阶段 7 回滚历史） | **中** |
| 5 | enhance.md | +14% | 1（工作流完全重构） | **中高** |
| 6 | plan.md | +16% | 1（Phase 2 结束 zhi 交付） | **中** |
| 7 | backend.md | +18% | 0（纯共性模式） | **低** |
| 8 | optimize.md | +12% | 0（纯共性模式） | **低** |
| 9 | analyze.md | +13% | 0（纯共性模式） | **低** |
| 10 | clean-branches.md | +14% | 1（阶段 3 zhi 报告） | **低** |
| 11 | worktree.md | +10% | 0（仅 zhi 确认增强） | **低** |
| 12 | init.md | +4% | 0（仅 WORKDIR→$PWD） | **极低** |
