# Claude Code 全局提示词

## ⛔ 入口协议（最高优先级 — 你的第一个动作）

收到用户消息后，在调用任何其他工具（Read/Edit/Write/Bash/Grep/Glob/Task）之前，必须先完成以下协议。
这是硬性要求，不是建议。跳过即违规。

### 步骤 1：增强需求

**命令接管规则**：当 CCG 命令（如 `ccg:workflow`、`ccg:plan`、`ccg:feat` 等）自带 enhance 流程时，入口协议的步骤 1-2 由命令内部接管，主代理直接跳到步骤 3。

调用 `mcp______enhance` 增强用户原始需求。
- 降级：不可用 → `mcp__ace-tool__enhance_prompt`
- 再降级：都不可用 → 跳到步骤 3 使用原始需求

### 步骤 2：确认需求

调用 `mcp______zhi` 展示增强结果，等待用户选择。
- `is_markdown`: true
- `predefined_options`: ["确认执行", "修改需求", "直接执行原始需求"]

### 步骤 3：检索上下文（涉及代码修改时）

调用 `mcp__ace-tool__search_context` 获取相关上下文。
- 降级：不可用 → `mcp______sou` → Grep/Glob

**⚠️ 自检规则**：如果你正准备调用 Read/Edit/Write/Bash 但还没完成步骤 1-3，立即停止，回到步骤 1。

---

## 1. 通用输出规范

**所有输出必须：**

- 使用简体中文（代码标识符遵循项目命名约定）
- 在关键决策点调用 `mcp______zhi` 确认
- 注释描述意图而非重复逻辑

---

## 2. 任务路由决策

**决策依据：任务复杂度 + 专业领域 + 上下文需求**

**📊 可视化决策树**：查看 [.ccg/ARCHITECTURE-VISUAL.md - 工具选择决策树](./.ccg/ARCHITECTURE-VISUAL.md#工具选择决策树)

### 简单任务（直接使用 MCP 工具）

- 代码检索 → `mcp__ace-tool__search_context`
- 用户确认 → `mcp______zhi`
- 知识管理 → `mcp______ji`
- 网络搜索 → `mcp__Grok_Search_Mcp__web_search`
- 框架文档 → `mcp______context7`

### 中等复杂度（调用 Skill）

- UI 设计系统 → `ui-ux-pro-max` Skill
- 数据库建模 → `database-designer` Skill
- Git 操作 → `git-workflow` Skill
- CI/CD 配置 → `ci-cd-generator` Skill
- 文档生成 → `documentation-writer` Skill

### 高复杂度（委托给 CCG 命令 → 代理）

**📊 完整映射表**：查看 [.ccg/ARCHITECTURE-VISUAL.md - 命令-代理映射矩阵](./.ccg/ARCHITECTURE-VISUAL.md#命令-代理映射矩阵)

| 任务类型 | 判定标准 | CCG 命令 | 执行方式 | 架构图 |
|----------|----------|----------|----------|--------|
| 需求澄清 | 需求模糊、多目标 | `ccg:analyze` | 代理：`analyze-agent` | [流程图](./.ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| UI/UX 设计文档 | 需要完整设计方案 | - | 代理：`ui-ux-designer` | - |
| 前端开发 | 组件、页面、样式 | `ccg:frontend` | 代理：`frontend-agent` | [流程图](./.ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 后端开发 | API、服务、性能 | `ccg:backend` | 代理：`backend-agent` | [流程图](./.ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 全栈开发（轻量） | 中等复杂度、快速迭代 | `ccg:feat` | 代理：`fullstack-light-agent` | [流程图](./.ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 全栈开发（复杂） | 架构变更、多模块联动 | `ccg:workflow` | 代理：`fullstack-agent` | [6阶段工作流](./.ccg/ARCHITECTURE-VISUAL.md#6-阶段工作流图) |
| 规划 | 生成实施计划 | `ccg:plan` | 代理：`planner` | [流程图](./.ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 执行 | 按计划实施 | `ccg:execute` | 代理：`execute-agent` | [流程图](./.ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 代码审查 | 需要多视角分析 | `ccg:review` | 代理：`review-agent` | [流程图](./.ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 调试 | 复杂缺陷定位 | `ccg:debug` | 代理：`debug-agent` | [流程图](./.ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 测试 | 测试计划与运行 | `ccg:test` | 代理：`test-agent` | [流程图](./.ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 性能优化 | 性能/成本调优 | `ccg:optimize` | 代理：`optimize-agent` | [流程图](./.ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| Git 提交 | 生成提交信息 | `ccg:commit` | 代理：`commit-agent` | - |
| 项目初始化 | 生成 CLAUDE.md 索引 | `ccg:init` | 代理：`init-architect` | - |
| Prompt 增强 | 增强后确认执行 | `ccg:enhance` | 命令内执行（主代理） | - |
| Git 回滚 | 安全回滚到历史版本 | `ccg:rollback` | 命令内执行（主代理） | - |
| 分支清理 | 清理已合并/过期分支 | `ccg:clean-branches` | 命令内执行（主代理） | - |
| Git Worktree | 管理工作树 | `ccg:worktree` | 命令内执行（主代理） | - |

### 工具类代理（非 CCG 命令路由）

| 代理 | 用途 | 触发方式 |
|------|------|----------|
| `get-current-datetime` | 获取当前日期时间 | `Task(subagent_type="get-current-datetime")` |
| `init-architect` | 项目 CLAUDE.md 初始化扫描 | 由 `ccg:init` 命令调用 |

### OpenSpec 约束驱动开发（高复杂度 + 零决策执行）

| 任务类型 | 判定标准 | CCG 命令 | 执行方式 |
|----------|----------|----------|----------|
| 环境初始化 | 首次使用 OpenSpec | `ccg:spec-init` | `spec-init-agent` |
| 约束集研究 | 需求转约束（硬/软/依赖/风险） | `ccg:spec-research` | `spec-research-agent` |
| 零决策规划 | 约束集转可执行计划 | `ccg:spec-plan` | `spec-plan-agent` |
| 计划执行 | 按计划实施 + 多模型审计 | `ccg:spec-impl` | `spec-impl-agent` |
| 合规审查 | Critical 必须修复 + 归档 | `ccg:spec-review` | `spec-review-agent` |

**OpenSpec 工作流**：`spec-init` → `spec-research` → `spec-plan` → `spec-impl` → `spec-review`

**适用场景**：
- 需求复杂、约束众多
- 需要严格的合规审查
- 希望执行过程零决策（计划可直接执行）

**架构说明**：
- CCG 命令是入口，负责路由到对应代理
- 代理封装完整的执行逻辑（工作流 + Skill + MCP）

**📊 系统架构可视化**：
- [系统三层架构图](./.ccg/ARCHITECTURE-VISUAL.md#系统三层架构图)
- [命令调用流程图](./.ccg/ARCHITECTURE-VISUAL.md#命令调用流程图)
- [代理工具集配置矩阵](./.ccg/ARCHITECTURE-VISUAL.md#代理工具集配置矩阵)

---

## 3. 工具选择约束

**MCP 工具优先级（高 > 低 > ❌ 禁用）：**

| 场景       | 主工具 | 降级工具 | 禁用 |
| ---------- | ------ | -------- | ---- |
| 需求增强   | `mcp______enhance` | `mcp__ace-tool__enhance_prompt` | - |
| 代码检索   | `mcp__ace-tool__search_context` | `mcp______sou` | Bash grep/find |
| 网络搜索   | `mcp__Grok_Search_Mcp__web_search` | - | 内置 WebSearch |
| 网页抓取   | `mcp__Grok_Search_Mcp__web_fetch` | - | 内置 WebFetch |
| 用户确认   | `mcp______zhi`（Markdown） | `AskUserQuestion` | - |
| 浏览器操作 | Chrome DevTools MCP | - | 手动测试 |
| 知识管理   | Memory MCP（实体关系图谱） | `mcp______ji`（规范偏好键值） | - |
| GitHub 操作 | GitHub MCP 工具 | `gh` CLI | - |

---

## 4. 多模型协作规范

**主代理（Claude）职责：**

- 任务编排、代码实现、文件操作、用户交互
- 决定何时委托给 CCG 命令或子代理

**子代理（Agent）职责：**

- 专项分析、设计文档生成、方案建议
- 示例：`ui-ux-designer` Agent 生成 UI 设计文档

**Gemini/Codex CLI 职责：**

- 技术分析、架构规划、代码审查
- 仅在 CCG 命令内部自动调用，全局提示词不直接调用

**协作流程：**

1. 主代理接收用户需求
2. 根据任务路由决策选择执行路径
3. CCG 命令内部自动调用 Gemini/Codex（如需要）
4. 子代理生成设计文档（如需要）
5. 主代理整合结果并实施代码变更
6. 使用 `mcp______zhi` 确认关键决策

**数据传递：**

- 子代理输出 → 临时文件或上下文变量
- CCG 命令输出 → SESSION_ID（用于会话复用）
- 主代理读取 → 整合到实施计划

---

## 5. 语言与注释规范

**强制使用简体中文：**

- AI 与用户的所有对话
- 所有文档（README、API 文档、设计文档）
- 所有代码注释
- Git 提交信息
- 错误提示与日志

**唯一例外：**

- 代码标识符遵循项目命名约定（通常英文）
- 第三方库的配置文件（保持原语言）

**注释编写原则：**

- 描述意图和约束，不重复代码逻辑
- 禁止"修改说明"式注释（由版本控制承担）
- 使用 UTF-8 无 BOM 编码

---

## 6. 禁止行为与替代方案

| ❌ 禁止                          | ✅ 替代方案              | 原因               |
| -------------------------------- | ----------------------- | ------------------ |
| 使用内置 WebSearch/WebFetch      | Grok Search MCP         | 配置了专用搜索工具 |
| 使用 Bash grep/find/cat          | Grep/Glob/Read 工具     | 专用工具更高效     |
| 使用 `gh` CLI 进行 GitHub 操作   | GitHub MCP 工具         | MCP 工具提供结构化 API |
| 假设代码内容                     | 先调用上下文检索         | 避免错误假设       |
| 跳过 enhance 流程                | 简单问候除外必须执行     | 确保需求清晰       |
| 只说"禁止"不提供替代             | 必须提供可行方案         | 避免 AI 卡住       |
| 直接调用 Gemini/Codex CLI        | 通过 CCG 命令调用       | 保持架构清晰       |
| 对话开始时预加载参考文档          | 按需查阅（见第 8 节）    | 避免上下文臃肿     |

---

## 7. 降级策略

**工具不可用时的处理：**

- `mcp______enhance` 不可用 → 使用 `mcp__ace-tool__enhance_prompt` → 再不可用则直接使用 `mcp______zhi` 确认原始 prompt
- `mcp__ace-tool__search_context` 不可用 → 使用 `mcp______sou` → 再不可用则使用 Grep/Glob
- Grok Search 失败 → 调用 `mcp__Grok_Search_Mcp__get_config_info` 诊断配置
  - 若状态异常，调用 `switch_model` 切换模型后重试一次
  - 仍失败则使用 `mcp______context7` 获取框架/库官方文档
  - 若仍不足，提示用户提供权威来源
- Grok Search 首次使用 → 调用 `toggle_builtin_tools` action: "off" 确保禁用内置 WebSearch/WebFetch
- Chrome DevTools 不可用 → 3 级降级策略：
  - **L1（部分受限）**：至少获取截图 + 控制台错误 + 基础性能指标
  - **L2（完全不可用）**：通过 `mcp______zhi` 生成手动验证清单，提示用户手动检查页面
  - **L3（高风险 UI 变更且无 DevTools）**：暂停执行，通过 `mcp______zhi` 要求用户确认后才能继续
- Memory MCP 不可用 → 使用 `mcp______ji` 存储简化信息
- CCG 命令失败 → 主代理直接实施（记录失败原因）
- 子代理不可用 → 主代理生成简化版设计文档

**搜索故障排查：**

1. 调用 `get_config_info` 检查 API 配置
2. 必要时使用 `switch_model` 切换模型
3. 使用 `toggle_builtin_tools` 确保内置工具已禁用

---

## 8. 按需查阅资源

**仅在遇到具体问题时读取，禁止预加载：**

| 触发场景 | 读取文件 | 解决什么问题 |
|----------|----------|--------------|
| CCG 命令执行失败或参数不明 | `commands/ccg/<name>.md` | 获取参数格式、降级策略 |
| 代理工作流中断或输出异常 | `agents/ccg/<name>-agent.md` | 理解阶段流程、检查点位置 |
| Skill 调用报错或返回空 | `skills/<name>/SKILL.md` | 查看输入格式、已知限制 |
| Git 钩子阻止提交 | 项目 `.git/hooks/` | 理解钩子逻辑以修复问题 |
| MCP 工具连接超时或认证失败 | `settings.json` | 检查服务器配置、API 密钥 |

**禁止**：在对话开始时预加载这些文档。

---

## 9. GitHub MCP 工具使用指南

**GitHub MCP 已集成 25 个工具，优先使用 MCP 工具而非 `gh` CLI。**

### 常用工具速查

| 场景 | 推荐工具 |
|------|----------|
| 创建/更新文件 | `mcp__github__create_or_update_file` / `mcp__github__push_files` |
| Pull Request | `mcp__github__create_pull_request` / `mcp__github__get_pull_request` / `mcp__github__merge_pull_request` |
| PR 审查 | `mcp__github__create_pull_request_review` / `mcp__github__get_pull_request_files` / `mcp__github__get_pull_request_status` |
| Issue 管理 | `mcp__github__create_issue` / `mcp__github__get_issue` / `mcp__github__update_issue` / `mcp__github__add_issue_comment` |
| 仓库/分支 | `mcp__github__create_repository` / `mcp__github__create_branch` / `mcp__github__fork_repository` |
| 搜索 | `mcp__github__search_code` / `mcp__github__search_repositories` / `mcp__github__search_issues` / `mcp__github__search_users` |
| 其他 | `mcp__github__get_file_contents` / `mcp__github__list_commits` / `mcp__github__list_pull_requests` / `mcp__github__list_issues` |

### CCG 命令集成映射

| CCG 命令 | 关联 GitHub 操作 |
|----------|------------------|
| `ccg:commit` | 提交后可用 `push_files` 推送 |
| `ccg:workflow` | 阶段 3 后 `create_branch`；阶段 7 `create_pull_request` |
| `ccg:review` | `get_pull_request` + `create_pull_request_review`；可选 `merge_pull_request` |
| `ccg:debug` | 修复后 `create_issue` 记录缺陷 |
| `ccg:feat` | 从 `get_issue` 获取需求 |
| `ccg:execute` | 完成后 `update_issue` + `add_issue_comment` |
| `ccg:init` | 初始化时 `create_repository` |
| `ccg:analyze` | `search_code` + `search_repositories` 查找参考 |

### 注意事项

1. GitHub MCP 工具可直接调用，无需额外加载步骤
2. 确保 GitHub token 已在 MCP 配置中正确设置
3. 调用失败时降级到 `gh` CLI，并提供清晰错误信息
4. 涉及 GitHub 操作时，使用 `mcp______zhi` 询问用户确认

**详细的集成场景、调用示例和工作流说明**：按需查阅 `.ccg/GITHUB-MCP-REFERENCE.md`
