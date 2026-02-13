# MCP 工具与 Skills 完整参考文档

> 生成时间：2026-02-07
> 适用范围：Claude Code 全局环境（`C:/Users/Administrator/.claude`）
> 用途：供代理（Agents）和命令（Commands）进行工具路由决策

---

## 概览

| 类别 | 数量 |
|------|------|
| MCP 服务器 | 5 |
| MCP 工具总计 | 71 |
| 用户可调用 Skills | 8 |
| MCP 工具版 Skills | 9 |
| CCG 命令 | 22 |
| 子代理 | 20 |

---

## 一、MCP 服务器详细清单

### 1. ace-tool（Augment Code Engine）— 2 个工具

代码检索与 Prompt 增强引擎，代码搜索的首选工具。

| 工具名 | 用途 | 关键参数 | 适用场景 |
|--------|------|----------|----------|
| `mcp__ace-tool__search_context` | 语义代码检索，返回与查询相关的代码片段 | `project_root_path`, `query` | 查找函数、类、模块、理解架构、编辑前检索上下文 |
| `mcp__ace-tool__enhance_prompt` | 结合代码库和对话历史增强用户需求 | `prompt`, `conversation_history`, `project_root_path` | 用户消息含 `-enhance` 标记时，或明确要求增强 Prompt |

**优先级**：`search_context` 是代码搜索的**首选工具**，优先于 Grep/Glob/Bash。

---

### 2. 三术 — 15 个工具

集成交互确认、记忆管理、代码搜索、UI/UX 知识库、框架文档、图标选择、技能执行等功能。

#### 2.1 核心交互工具

| 工具名 | 用途 | 关键参数 | 适用场景 |
|--------|------|----------|----------|
| `mcp______zhi` | 智能交互确认（Markdown 展示 + 预定义选项） | `message`, `is_markdown`, `predefined_options`, `project_root_path` | 关键决策点确认、方案展示、进度报告 |
| `mcp______ji` | 全局记忆管理（规范/偏好/模式/上下文） | `action`(记忆/回忆/整理/列表/删除/配置), `project_path`, `content`, `category` | 存储开发规范、用户偏好、最佳实践 |
| `mcp______enhance` | Prompt 增强（三术版） | （同 ace-tool enhance_prompt） | 全局提示词要求的 enhance 流程 |

#### 2.2 搜索与文档工具

| 工具名 | 用途 | 关键参数 | 适用场景 |
|--------|------|----------|----------|
| `mcp______sou` | 代码上下文搜索（语义检索） | `project_root_path`, `query` | `search_context` 不可用时的降级方案 |
| `mcp______context7` | 框架/库文档查询 | `library`(owner/repo 格式), `topic`, `version`, `page` | 查询 React/Vue/Next.js/Spring 等框架的最新 API |

#### 2.3 UI/UX 知识库工具

| 工具名 | 用途 | 关键参数 | 适用场景 |
|--------|------|----------|----------|
| `mcp______uiux_search` | UI/UX 知识库检索 | `query`, `domain`, `mode`(search/beautify), `lang` | 检索 UI/UX 设计最佳实践 |
| `mcp______uiux_stack` | 技术栈相关 UI/UX 指南 | `query`, `stack`(必填), `lang` | 获取特定技术栈的 UI/UX 规范 |
| `mcp______uiux_design_system` | 生成完整设计系统建议 | `query`, `project_name`, `page`, `persist`, `format` | 为项目创建设计令牌、组件规范 |
| `mcp______uiux_suggest` | 判断是否建议使用 UI/UX 技能 | `text` | 分析用户输入是否需要调用 UI/UX 相关技能 |

#### 2.4 资源工具

| 工具名 | 用途 | 关键参数 | 适用场景 |
|--------|------|----------|----------|
| `mcp______tu` | 图标搜索与选择（可视化界面） | `query`, `style`(line/fill/flat/all), `save_path`, `project_root` | 搜索、预览、保存 Iconfont 图标 |

#### 2.5 技能执行工具（MCP 工具版 Skills）

| 工具名 | 用途 | 关键参数 |
|--------|------|----------|
| `mcp______skill_run` | 通用技能执行器 | `skill_name`, `query`, `action`, `args` |
| `mcp______skill_ci-cd-generator` | CI/CD 流水线生成 | `query`, `action` |
| `mcp______skill_database-designer` | 数据库模式设计 | `query`, `action` |
| `mcp______skill_documentation-writer` | 文档生成 | `query`, `action` |
| `mcp______skill_find-skills` | 技能发现与安装 | `query` |
| `mcp______skill_frontend-design` | 前端界面设计与代码生成 | `query`, `action` |
| `mcp______skill_git-workflow` | Git 操作自动化 | `query`, `action` |
| `mcp______skill_prototype-prompt-generator` | UI/UX 原型 Prompt 生成 | `query`, `action` |
| `mcp______skill_ui-ux-pro-max` | UI/UX 设计智能 | `query`, `action` |

---

### 3. Grok_Search_Mcp — 5 个工具

基于 Grok 模型的网络搜索与内容抓取服务。

| 工具名 | 用途 | 关键参数 | 适用场景 |
|--------|------|----------|----------|
| `mcp__Grok_Search_Mcp__web_search` | 网络搜索（返回 JSON 结果列表） | `query`, `platform`, `min_results`, `max_results` | 搜索技术方案、最佳实践、已知问题 |
| `mcp__Grok_Search_Mcp__web_fetch` | 网页抓取（返回 Markdown 格式内容） | `url` | 获取网页完整内容用于分析 |
| `mcp__Grok_Search_Mcp__get_config_info` | 获取当前配置与连接测试 | 无 | 调试搜索功能、检查 API 配置 |
| `mcp__Grok_Search_Mcp__switch_model` | 切换 Grok 模型 | `model` | 切换搜索使用的 AI 模型 |
| `mcp__Grok_Search_Mcp__toggle_builtin_tools` | 切换内置 WebSearch/WebFetch 的启用/禁用 | `action`(on/off/status) | 确保内置搜索工具已禁用（使用 Grok 替代） |

**优先级**：`web_search` 优先于内置 WebSearch，`web_fetch` 优先于内置 WebFetch。

---

### 4. Chrome_DevTools_MCP — 24 个工具

浏览器自动化、UI 测试与性能分析。

#### 4.1 页面管理

| 工具名 | 用途 | 关键参数 |
|--------|------|----------|
| `list_pages` | 列出浏览器中所有打开的页面 | 无 |
| `new_page` | 创建新页面 | `url`, `background`, `timeout` |
| `select_page` | 选择页面为当前操作目标 | `pageId`, `bringToFront` |
| `close_page` | 关闭指定页面 | `pageId` |
| `navigate_page` | 导航（URL/前进/后退/刷新） | `url`, `type`(url/back/forward/reload) |
| `resize_page` | 调整页面尺寸 | `width`, `height` |

#### 4.2 元素交互

| 工具名 | 用途 | 关键参数 |
|--------|------|----------|
| `click` | 点击元素（支持双击） | `uid`, `dblClick` |
| `hover` | 悬停在元素上 | `uid` |
| `drag` | 拖拽元素到另一个元素 | `from_uid`, `to_uid` |
| `fill` | 填充输入框/选择 select 选项 | `uid`, `value` |
| `fill_form` | 批量填充多个表单元素 | `elements`[{uid, value}] |
| `press_key` | 按键/组合键操作 | `key`（如 "Enter", "Control+A"） |
| `upload_file` | 通过文件输入上传文件 | `uid`, `filePath` |
| `handle_dialog` | 处理浏览器弹窗 | `action`(accept/dismiss), `promptText` |

#### 4.3 页面检查

| 工具名 | 用途 | 关键参数 |
|--------|------|----------|
| `take_screenshot` | 截图（元素/视口/全页面） | `uid`, `fullPage`, `format`, `filePath` |
| `take_snapshot` | a11y 树文本快照（优先于截图） | `verbose`, `filePath` |
| `evaluate_script` | 在页面中执行 JavaScript | `function`, `args` |
| `emulate` | 模拟设备/网络/地理位置/暗色模式 | `viewport`, `networkConditions`, `colorScheme`, `geolocation`, `cpuThrottlingRate`, `userAgent` |

#### 4.4 网络与控制台

| 工具名 | 用途 | 关键参数 |
|--------|------|----------|
| `list_network_requests` | 列出所有网络请求 | `resourceTypes`, `pageSize` |
| `get_network_request` | 获取单个请求的详细信息 | `reqid` |
| `list_console_messages` | 列出控制台消息 | `types`(log/error/warn...) |
| `get_console_message` | 获取单条控制台消息 | `msgid` |
| `wait_for` | 等待页面上出现指定文本 | `text`, `timeout` |

#### 4.5 性能分析

| 工具名 | 用途 | 关键参数 |
|--------|------|----------|
| `performance_start_trace` | 开始性能追踪录制 | `reload`, `autoStop`, `filePath` |
| `performance_stop_trace` | 停止性能追踪 | - |
| `performance_analyze_insight` | 分析性能洞察详情 | `insightSetId`, `insightName` |

#### 4.6 Chrome DevTools 按角色分配矩阵

| 代理角色 | 核心职责 | 分配的工具 |
|----------|----------|------------|
| **execute-agent** (Developer) | 实施后即时验证 | `list_pages`, `navigate_page`, `evaluate_script`, `take_screenshot`, `list_console_messages` |
| **debug-agent** (Developer) | 运行时错误诊断 | `list_console_messages`, `get_console_message`, `list_network_requests`, `get_network_request`, `evaluate_script` |
| **test-agent** (Tester) | E2E 用户交互模拟 | `new_page`, `navigate_page`, `close_page`, `resize_page`, `click`, `fill`, `fill_form`, `press_key`, `hover`, `drag`, `upload_file`, `wait_for`, `handle_dialog`, `take_snapshot`, `evaluate_script` |
| **review-agent** (Reviewer) | 视觉/A11y 质量门控 | `take_screenshot`, `take_snapshot`, `list_console_messages`, `performance_start_trace`, `performance_stop_trace`, `performance_analyze_insight` |
| **ui-ux-designer** (Reviewer) | 设计还原度与 A11y + 动态交互审查 | `take_snapshot`, `take_screenshot`, `resize_page`, `emulate`, `evaluate_script`, **`click`**, **`hover`** |
| **frontend-agent** | UI 渲染验证 | 全部工具（已有） |
| **fullstack-agent** | 前端性能验证 | 全部工具（已有） |
| **optimize-agent** | 性能剖析 | 全部工具（已有） |

**使用原则**：
- `take_snapshot` 优先用于理解页面结构和 A11y；`take_screenshot` 用于视觉回归
- 交互操作后必须检查 `list_console_messages` 确保无运行时错误
- 开启新页面测试后用 `close_page` 清理
- **`evaluate_script` 安全约束**：仅允许只读查询（如 `getComputedStyle`、`querySelector`、`document.title`），禁止修改 DOM/样式/存储、禁止发起网络请求、禁止访问敏感 API（`localStorage.clear()`、`document.cookie` 写入等）
- **视觉审查目标**：验证"布局完整性"（无错位、无资源加载失败、无白屏），而非像素级回归
- **A11y 快照重点关注**：`role="button"` 缺少 `aria-label`、交互元素缺少键盘支持、焦点陷阱（Focus Trap）未生效

### Chrome DevTools 降级策略（统一定义）

| 级别 | 触发条件 | 行为 | 证据产出 |
|------|----------|------|----------|
| **L1（部分受限）** | DevTools 可连接但部分工具失败 | 继续执行，使用可用工具 | 截图 + 控制台错误 + 基础性能指标 |
| **L2（完全不可用）** | DevTools 无法连接 | 跳过自动化验证，通过 `mcp______zhi` 生成手动验证清单 | 手动验证清单（含关键页面/交互路径） |
| **L3（高风险阻断）** | 高风险 UI 变更（布局重构、核心交互修改）且无 DevTools | 暂停执行，通过 `mcp______zhi` 要求用户确认后继续 | 阻断提示 + 风险说明 |

各命令和代理文件中的降级策略均引用此统一定义。

---

### 5. GitHub MCP — 25 个工具

GitHub 平台完整 CRUD 操作。

#### 5.1 仓库操作

| 工具名 | 用途 | 关键参数 |
|--------|------|----------|
| `create_repository` | 创建新仓库 | `name`, `description`, `private` |
| `search_repositories` | 搜索仓库 | `query`, `page`, `perPage` |
| `fork_repository` | Fork 仓库 | owner, repo |
| `create_branch` | 创建分支 | owner, repo, branch |

#### 5.2 文件操作

| 工具名 | 用途 | 关键参数 |
|--------|------|----------|
| `get_file_contents` | 获取文件/目录内容 | `owner`, `repo`, `path`, `branch` |
| `create_or_update_file` | 创建或更新单个文件 | `owner`, `repo`, `path`, `content`, `message`, `branch`, `sha` |
| `push_files` | 单次提交推送多个文件 | `owner`, `repo`, `branch`, `files`, `message` |
| `search_code` | 搜索代码 | `query` |

#### 5.3 Issue 操作

| 工具名 | 用途 | 关键参数 |
|--------|------|----------|
| `create_issue` | 创建 Issue | `owner`, `repo`, `title`, `body`, `labels` |
| `get_issue` | 获取 Issue 详情 | owner, repo, issue_number |
| `list_issues` | 列出 Issues | owner, repo |
| `update_issue` | 更新 Issue | owner, repo, issue_number |
| `add_issue_comment` | 添加 Issue 评论 | owner, repo, issue_number, body |
| `search_issues` | 搜索 Issues | `query` |

#### 5.4 Pull Request 操作

| 工具名 | 用途 | 关键参数 |
|--------|------|----------|
| `create_pull_request` | 创建 PR | `owner`, `repo`, `title`, `head`, `base`, `body` |
| `get_pull_request` | 获取 PR 详情 | owner, repo, pull_number |
| `list_pull_requests` | 列出 PRs | owner, repo |
| `merge_pull_request` | 合并 PR | owner, repo, pull_number, `merge_method` |
| `get_pull_request_files` | 获取 PR 变更文件 | owner, repo, pull_number |
| `get_pull_request_status` | 获取 PR 状态（CI 检查） | owner, repo, pull_number |
| `get_pull_request_comments` | 获取 PR 评论 | owner, repo, pull_number |
| `get_pull_request_reviews` | 获取 PR 审查 | owner, repo, pull_number |
| `create_pull_request_review` | 创建 PR 审查 | owner, repo, pull_number, `event`, `body`, `comments` |
| `update_pull_request_branch` | 更新 PR 分支 | owner, repo, pull_number |

#### 5.5 用户搜索

| 工具名 | 用途 | 关键参数 |
|--------|------|----------|
| `search_users` | 搜索 GitHub 用户 | `query` |

#### 5.6 提交操作

| 工具名 | 用途 | 关键参数 |
|--------|------|----------|
| `list_commits` | 列出提交历史 | owner, repo |

---

## 二、Skills 详细清单

### 用户可调用 Skills（通过 `/skill-name` 触发）

| # | Skill 名称 | 用途 | 适用场景 | 关联 MCP 工具版 |
|---|-----------|------|----------|----------------|
| 1 | `ci-cd-generator` | GitHub Actions/GitLab CI/Azure/Jenkins 流水线生成 | 需要配置 CI/CD 时 | `mcp______skill_ci-cd-generator` |
| 2 | `database-designer` | 数据库模式设计（PostgreSQL/MySQL/SQLite/MongoDB） | ER 建模、索引优化、迁移脚本 | `mcp______skill_database-designer` |
| 3 | `documentation-writer` | 生成 README、API 文档、代码注释、架构文档 | 需要编写文档时 | `mcp______skill_documentation-writer` |
| 4 | `find-skills` | 发现和安装新技能 | 用户寻找扩展功能时 | `mcp______skill_find-skills` |
| 5 | `frontend-design` | 生产级前端界面设计与代码 | 构建网页、组件、Landing Page、Dashboard | `mcp______skill_frontend-design` |
| 6 | `git-workflow` | Git 操作自动化（Conventional Commits、分支管理、PR 描述） | 提交、分支、PR 操作 | `mcp______skill_git-workflow` |
| 7 | `prototype-prompt-generator` | UI/UX 原型设计 Prompt 生成 | 设计移动/Web 应用原型规格 | `mcp______skill_prototype-prompt-generator` |
| 8 | `ui-ux-pro-max` | UI/UX 设计智能（67 风格、96 调色板、13 技术栈） | UI 设计、组件实现、样式优化 | `mcp______skill_ui-ux-pro-max` |

### CCG 命令 Skills（通过 `/ccg:name` 触发）

| # | 命令 | 用途 | 执行代理 |
|---|------|------|----------|
| 1 | `ccg:workflow` | 6 阶段结构化全栈开发 | fullstack-agent |
| 2 | `ccg:plan` | 多模型协作规划 | planner |
| 3 | `ccg:execute` | 按计划执行（多模型原型+Claude实施） | execute-agent |
| 4 | `ccg:frontend` | 前端专项开发 | frontend-agent |
| 5 | `ccg:backend` | 后端专项开发 | backend-agent |
| 6 | `ccg:feat` | 智能功能开发（自动识别前/后/全栈） | fullstack-light-agent |
| 7 | `ccg:analyze` | 多模型技术分析 | analyze-agent |
| 8 | `ccg:debug` | 多模型调试 | debug-agent |
| 9 | `ccg:optimize` | 多模型性能优化 | optimize-agent |
| 10 | `ccg:test` | 多模型测试生成 | test-agent |
| 11 | `ccg:review` | 多模型代码审查 | review-agent |
| 12 | `ccg:commit` | 智能 Git 提交 | commit-agent |
| 13 | `ccg:enhance` | Prompt 增强后确认执行 | - |
| 14 | `ccg:init` | 初始化项目 AI 上下文（CLAUDE.md） | init-architect |
| 15 | `ccg:rollback` | 交互式 Git 回滚 | - |
| 16 | `ccg:clean-branches` | 清理 Git 分支 | - |
| 17 | `ccg:worktree` | Git Worktree 管理 | - |
| 18 | `ccg:spec-init` | OpenSpec 环境初始化 | spec-init-agent |
| 19 | `ccg:spec-research` | 需求转约束集 | spec-research-agent |
| 20 | `ccg:spec-plan` | 约束集转零决策计划 | spec-plan-agent |
| 21 | `ccg:spec-impl` | 按计划执行+多模型审计 | spec-impl-agent |
| 22 | `ccg:spec-review` | 合规审查+归档 | spec-review-agent |

---

## 三、代理工具使用矩阵

### 20 个子代理及其工具/技能配置

| 代理 | MCP 工具 | Skills | 核心职责 |
|------|----------|--------|----------|
| **analyze-agent** | ace-tool, enhance, zhi, ji, uiux_suggest, Grok search | - | 多模型技术可行性分析 |
| **frontend-agent** | ace-tool, zhi, ji, context7, uiux_search, uiux_stack, uiux_design_system, tu, Chrome DevTools | ui-ux-pro-max, frontend-design | 组件/页面/样式开发 |
| **backend-agent** | ace-tool, zhi, ji, context7, Grok search | database-designer | API/服务/数据库开发 |
| **fullstack-light-agent** | ace-tool, zhi, ji, context7, uiux_search, tu, Grok search | ui-ux-pro-max, database-designer | 中等复杂度单模块全栈 |
| **fullstack-agent** | ace-tool, zhi, ji, context7, uiux_search, uiux_design_system, tu, Grok search, Chrome DevTools | ui-ux-pro-max, database-designer, ci-cd-generator | 复杂多模块全栈（6 阶段） |
| **execute-agent** | ace-tool, zhi, ji, Grok search, Chrome DevTools | - | 严格按计划执行 + 浏览器验证 |
| **optimize-agent** | ace-tool, zhi, ji, context7, Grok search, Chrome DevTools | - | 性能分析与优化 |
| **review-agent** | ace-tool, zhi, ji, context7, Grok search, Chrome DevTools | - | 多维度代码审查 + 视觉/A11y 审查 |
| **debug-agent** | ace-tool, zhi, ji, context7, Grok search, Chrome DevTools | - | 假设驱动缺陷定位 |
| **test-agent** | ace-tool, zhi, ji, context7, Grok search, Chrome DevTools | - | 测试用例生成 + E2E 浏览器测试 |
| **commit-agent** | zhi, ji | git-workflow | Conventional Commits 生成 |
| **planner** | ace-tool, zhi, ji, Grok search | - | WBS 任务分解 |
| **ui-ux-designer** | ace-tool, zhi, ji, uiux_search, uiux_stack, uiux_design_system, tu, Grok search, Chrome DevTools | - | UI/UX 设计文档生成 + A11y 验证 + 动态交互审查 |
| **init-architect** | - | - | 项目 CLAUDE.md 初始化 |
| **get-current-datetime** | - | - | 获取当前日期时间 |
| **spec-init-agent** | ace-tool, zhi, ji | - | OpenSpec 环境初始化 |
| **spec-research-agent** | ace-tool, enhance, zhi, ji, Grok search | - | 需求转约束集 |
| **spec-plan-agent** | ace-tool, zhi, ji, Grok search | - | 约束集转可执行计划 |
| **spec-impl-agent** | ace-tool, zhi, ji, Grok search | - | 计划执行+审计 |
| **spec-review-agent** | ace-tool, zhi, ji, Grok search | - | 合规审查 |

---

## 四、工具路由决策指南

### 按场景选择工具

| 场景 | 首选工具 | 降级方案 | 禁用 |
|------|----------|----------|------|
| **代码搜索** | `mcp__ace-tool__search_context` | `mcp______sou` | ~~Bash grep/find~~ |
| **网络搜索** | `mcp__Grok_Search_Mcp__web_search` | - | ~~内置 WebSearch~~ |
| **网页抓取** | `mcp__Grok_Search_Mcp__web_fetch` | - | ~~内置 WebFetch~~ |
| **用户确认** | `mcp______zhi`（Markdown 展示） | `AskUserQuestion` | - |
| **浏览器调试** | Chrome DevTools MCP | L1: 截图+控制台 → L2: 手动验证清单 → L3: 阻断高风险变更 | - |
| **知识管理** | `mcp______ji`（键值偏好） | Memory MCP（实体关系） | - |
| **框架文档** | `mcp______context7` | Grok 搜索 | - |
| **UI/UX 设计** | `mcp______uiux_*` 系列 + `ui-ux-pro-max` | `frontend-design` Skill | - |
| **数据库建模** | `database-designer` Skill | - | - |
| **CI/CD 配置** | `ci-cd-generator` Skill | - | - |
| **文档生成** | `documentation-writer` Skill | - | - |
| **Git 操作** | `git-workflow` Skill | Bash git 命令 | - |
| **GitHub 操作** | GitHub MCP 工具 | `gh` CLI | - |

### 按任务复杂度选择执行路径

```
简单任务（单步操作）
├── 代码检索 → mcp__ace-tool__search_context
├── 用户确认 → mcp______zhi
├── 知识管理 → mcp______ji
├── 网络搜索 → mcp__Grok_Search_Mcp__web_search
└── 框架文档 → mcp______context7

中等复杂度（调用 Skill）
├── UI 设计系统 → ui-ux-pro-max Skill
├── 数据库建模 → database-designer Skill
├── Git 操作 → git-workflow Skill
├── CI/CD 配置 → ci-cd-generator Skill
└── 文档生成 → documentation-writer Skill

高复杂度（CCG 命令 → 代理）
├── 需求模糊 → ccg:analyze → analyze-agent
├── 前端开发 → ccg:frontend → frontend-agent
├── 后端开发 → ccg:backend → backend-agent
├── 轻量全栈 → ccg:feat → fullstack-light-agent
├── 复杂全栈 → ccg:workflow → fullstack-agent
├── 规划 → ccg:plan → planner
├── 执行 → ccg:execute → execute-agent
├── 代码审查 → ccg:review → review-agent
├── 调试 → ccg:debug → debug-agent
├── 测试 → ccg:test → test-agent
├── 性能优化 → ccg:optimize → optimize-agent
└── Git 提交 → ccg:commit → commit-agent

OpenSpec 约束驱动（高复杂度 + 零决策）
└── spec-init → spec-research → spec-plan → spec-impl → spec-review
```

---

## 五、搜索故障排查

当搜索功能异常时：

1. 调用 `mcp__Grok_Search_Mcp__get_config_info` 检查 API 配置和连接状态
2. 必要时使用 `mcp__Grok_Search_Mcp__switch_model` 切换模型
3. 使用 `mcp__Grok_Search_Mcp__toggle_builtin_tools` 确保内置工具状态正确
4. 当 `mcp__ace-tool__search_context` 不可用时，降级使用 `mcp______sou`
