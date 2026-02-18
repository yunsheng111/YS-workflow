# GitHub MCP 工具完整参考文档

> **版本**：v1.0.0 | **更新日期**：2026-02-19
>
> 本文档是 `CLAUDE.md` 第 10 节"GitHub MCP 工具使用指南"的详细展开。
> 按需查阅，禁止在对话开始时预加载。

---

## 1. 概览

### 1.1 定位

GitHub MCP 集成了 **25 个工具**，覆盖文件操作、Pull Request、Issue 管理、仓库/分支管理、搜索和提交历史等全部常用 GitHub 操作。

### 1.2 优先级原则

| 优先级 | 工具 | 适用条件 |
|--------|------|----------|
| **首选** | GitHub MCP 工具（`mcp__github__*`） | 所有 GitHub 操作 |
| **降级** | `gh` CLI | MCP 工具调用失败时 |
| **禁用** | 手动拼接 GitHub REST API | 不得使用 |

### 1.3 前置条件

- GitHub Personal Access Token 已在 MCP 服务器配置中正确设置
- Token 需具备所需权限范围（`repo`、`read:org`、`workflow` 等，按实际场景配置）
- MCP GitHub 服务器已启动并可连接

---

## 2. 工具分类速查表

### 2.1 文件操作（3 个）

| 工具全名 | 用途 | 关键参数 |
|----------|------|----------|
| `mcp__github__create_or_update_file` | 创建或更新仓库中的单个文件 | `owner`、`repo`、`path`、`content`、`message`、`branch`、`sha`（更新时必填） |
| `mcp__github__push_files` | 一次推送多个文件变更 | `owner`、`repo`、`branch`、`files`（数组：`path` + `content`）、`message` |
| `mcp__github__get_file_contents` | 获取仓库中文件或目录的内容 | `owner`、`repo`、`path`、`branch`（可选） |

**使用要点**：
- `create_or_update_file` 适合单文件操作；批量操作优先使用 `push_files`
- 更新已有文件时必须提供当前文件的 `sha`，否则会返回冲突错误
- `get_file_contents` 返回 Base64 编码内容，对于目录则返回文件列表

### 2.2 Pull Request（5 个）

| 工具全名 | 用途 | 关键参数 |
|----------|------|----------|
| `mcp__github__create_pull_request` | 创建 Pull Request | `owner`、`repo`、`title`、`body`、`head`、`base`、`draft`（可选） |
| `mcp__github__get_pull_request` | 获取 PR 详情 | `owner`、`repo`、`pull_number` |
| `mcp__github__list_pull_requests` | 列出仓库的 PR 列表 | `owner`、`repo`、`state`（open/closed/all）、`head`、`base`、`sort`、`direction` |
| `mcp__github__merge_pull_request` | 合并 PR | `owner`、`repo`、`pull_number`、`commit_title`、`commit_message`、`merge_method`（merge/squash/rebase） |
| `mcp__github__update_pull_request_branch` | 更新 PR 分支（与 base 同步） | `owner`、`repo`、`pull_number`、`expected_head_sha`（可选） |

**使用要点**：
- 创建 PR 时 `head` 为源分支，`base` 为目标分支
- `merge_method` 建议根据项目约定选择，默认 `merge`
- 合并前应先通过 `get_pull_request_status` 检查 CI 状态

### 2.3 PR 审查（5 个）

| 工具全名 | 用途 | 关键参数 |
|----------|------|----------|
| `mcp__github__create_pull_request_review` | 提交 PR 审查意见 | `owner`、`repo`、`pull_number`、`body`、`event`（APPROVE/REQUEST_CHANGES/COMMENT）、`comments`（行级评论数组） |
| `mcp__github__get_pull_request_files` | 获取 PR 变更文件列表 | `owner`、`repo`、`pull_number` |
| `mcp__github__get_pull_request_status` | 获取 PR 的 CI 检查状态 | `owner`、`repo`、`pull_number` |
| `mcp__github__get_pull_request_comments` | 获取 PR 评论列表 | `owner`、`repo`、`pull_number` |
| `mcp__github__get_pull_request_reviews` | 获取 PR 审查记录列表 | `owner`、`repo`、`pull_number` |

**使用要点**：
- `create_pull_request_review` 的 `comments` 数组中每项包含 `path`、`position`（或 `line`）、`body`
- 先调用 `get_pull_request_files` 了解变更范围，再决定审查策略
- `get_pull_request_status` 返回所有 CI check 的状态汇总

### 2.4 Issue 管理（6 个）

| 工具全名 | 用途 | 关键参数 |
|----------|------|----------|
| `mcp__github__create_issue` | 创建 Issue | `owner`、`repo`、`title`、`body`、`assignees`（可选）、`labels`（可选）、`milestone`（可选） |
| `mcp__github__get_issue` | 获取 Issue 详情 | `owner`、`repo`、`issue_number` |
| `mcp__github__list_issues` | 列出仓库的 Issue 列表 | `owner`、`repo`、`state`（open/closed/all）、`labels`、`sort`、`direction`、`since`、`page`、`per_page` |
| `mcp__github__update_issue` | 更新 Issue（标题、正文、状态等） | `owner`、`repo`、`issue_number`、`title`、`body`、`state`（open/closed）、`labels`、`assignees`、`milestone` |
| `mcp__github__add_issue_comment` | 添加 Issue 评论 | `owner`、`repo`、`issue_number`、`body` |
| `mcp__github__search_issues` | 搜索 Issue 和 PR | `q`（GitHub 搜索语法）、`sort`、`order`、`page`、`per_page` |

**使用要点**：
- `search_issues` 使用 GitHub 搜索语法，如 `repo:owner/repo is:issue is:open label:bug`
- `update_issue` 可通过设置 `state: "closed"` 来关闭 Issue
- 创建 Issue 时推荐同时设置 `labels` 便于后续筛选

### 2.5 仓库/分支管理（4 个）

| 工具全名 | 用途 | 关键参数 |
|----------|------|----------|
| `mcp__github__create_repository` | 创建新仓库 | `name`、`description`（可选）、`private`（布尔值）、`auto_init`（是否初始化 README） |
| `mcp__github__create_branch` | 创建分支 | `owner`、`repo`、`branch`（新分支名）、`from_branch`（可选，源分支，默认仓库默认分支） |
| `mcp__github__fork_repository` | Fork 仓库 | `owner`、`repo`、`organization`（可选，Fork 到指定组织） |
| `mcp__github__search_repositories` | 搜索仓库 | `q`（搜索语法）、`sort`（stars/forks/updated）、`order`、`page`、`per_page` |

**使用要点**：
- `create_branch` 的 `from_branch` 不指定时从仓库默认分支创建
- `create_repository` 返回新仓库的完整信息，包括 clone URL
- `search_repositories` 支持 GitHub 高级搜索语法，如 `language:typescript stars:>100`

### 2.6 搜索（2 个）

| 工具全名 | 用途 | 关键参数 |
|----------|------|----------|
| `mcp__github__search_code` | 搜索代码内容 | `q`（搜索语法）、`sort`（indexed）、`order`、`page`、`per_page` |
| `mcp__github__search_users` | 搜索用户/组织 | `q`（搜索语法）、`sort`（followers/repositories/joined）、`order`、`page`、`per_page` |

**使用要点**：
- `search_code` 的查询语法：`q: "className repo:owner/repo extension:ts"`
- 代码搜索结果包含匹配的文件路径和代码片段，但不包含完整文件内容
- 需要完整内容时，先搜索定位文件路径，再用 `get_file_contents` 获取

### 2.7 提交历史（1 个）

| 工具全名 | 用途 | 关键参数 |
|----------|------|----------|
| `mcp__github__list_commits` | 列出仓库提交历史 | `owner`、`repo`、`sha`（分支名或 SHA）、`path`（可选，按路径过滤）、`page`、`per_page` |

**使用要点**：
- 通过 `path` 参数可查看特定文件的变更历史
- 返回提交作者、时间、消息等完整信息
- 结合 `sha` 参数可查看特定分支的提交记录

### 2.8 工具总数确认

| 分类 | 数量 | 工具列表 |
|------|------|----------|
| 文件操作 | 3 | `create_or_update_file`、`push_files`、`get_file_contents` |
| Pull Request | 5 | `create_pull_request`、`get_pull_request`、`list_pull_requests`、`merge_pull_request`、`update_pull_request_branch` |
| PR 审查 | 5 | `create_pull_request_review`、`get_pull_request_files`、`get_pull_request_status`、`get_pull_request_comments`、`get_pull_request_reviews` |
| Issue 管理 | 6 | `create_issue`、`get_issue`、`list_issues`、`update_issue`、`add_issue_comment`、`search_issues` |
| 仓库/分支 | 4 | `create_repository`、`create_branch`、`fork_repository`、`search_repositories` |
| 搜索 | 2 | `search_code`、`search_users` |
| 提交历史 | 1 | `list_commits` |
| **合计** | **26** | - |

> **说明**：CLAUDE.md 第 10 节提到"25 个工具"，实际在分类列举中共 26 个。数量差异可能源于部分工具在不同版本中增减，以实际可用工具为准。

---

## 3. CCG 命令集成场景

### 3.1 集成映射详表

| CCG 命令 | 关联 GitHub 操作 | 调用时机 | 典型场景 |
|----------|------------------|----------|----------|
| `ccg:commit` | `mcp__github__push_files` | 提交完成后，用户确认推送时 | 本地 commit 后将变更推送到远程仓库 |
| `ccg:workflow` | `mcp__github__create_branch` + `mcp__github__create_pull_request` | 阶段 3 创建功能分支；阶段 7（验收后）创建 PR | 完整开发工作流：分支创建 -> 开发 -> PR 提交 |
| `ccg:review` | `mcp__github__get_pull_request` + `mcp__github__get_pull_request_files` + `mcp__github__create_pull_request_review` + `mcp__github__merge_pull_request` | 审查流程全过程 | 获取 PR 详情 -> 查看变更文件 -> 提交审查 -> 可选合并 |
| `ccg:debug` | `mcp__github__create_issue` | 缺陷定位修复后，记录缺陷信息 | 调试修复后创建 Issue 记录根因和修复方案 |
| `ccg:feat` | `mcp__github__get_issue` | 从 Issue 获取功能需求详情 | 基于 Issue 编号拉取需求描述，驱动功能开发 |
| `ccg:execute` | `mcp__github__update_issue` + `mcp__github__add_issue_comment` | 执行完成后更新 Issue 状态 | 关闭 Issue 并添加完成说明评论 |
| `ccg:init` | `mcp__github__create_repository` | 项目初始化时创建远程仓库 | 新项目首次初始化，创建 GitHub 仓库 |
| `ccg:analyze` | `mcp__github__search_code` + `mcp__github__search_repositories` | 需求分析阶段查找参考实现 | 搜索相似项目或代码模式作为架构参考 |

### 3.2 各命令详细集成说明

#### ccg:commit -- 提交与推送

**调用链路**：
```
commit-agent 完成本地 commit
  -> 用户确认推送
  -> mcp__github__push_files（推送变更到远程）
```

**注意**：
- `push_files` 是通过 GitHub API 推送，不依赖本地 Git 配置
- 常规场景下优先使用 `git push`（通过 Bash），`push_files` 适用于需要跳过本地 Git 的场景
- 推送前必须通过 `mcp______zhi` 获得用户确认

#### ccg:workflow -- 完整开发工作流

**阶段 3（规划完成后）**：
```
mcp__github__create_branch({
  owner: "<owner>",
  repo: "<repo>",
  branch: "feat/<feature-name>",
  from_branch: "main"
})
```

**阶段 7（验收通过后）**：
```
mcp__github__create_pull_request({
  owner: "<owner>",
  repo: "<repo>",
  title: "feat: <功能描述>",
  body: "## 变更说明\n...\n## 测试覆盖\n...",
  head: "feat/<feature-name>",
  base: "main"
})
```

#### ccg:review -- PR 审查

**完整审查流程**：
```
// 步骤 1：获取 PR 详情
mcp__github__get_pull_request({ owner, repo, pull_number })

// 步骤 2：获取变更文件
mcp__github__get_pull_request_files({ owner, repo, pull_number })

// 步骤 3：检查 CI 状态
mcp__github__get_pull_request_status({ owner, repo, pull_number })

// 步骤 4：获取已有审查记录（避免重复审查）
mcp__github__get_pull_request_reviews({ owner, repo, pull_number })

// 步骤 5：提交审查意见
mcp__github__create_pull_request_review({
  owner, repo, pull_number,
  body: "## 审查总结\n...",
  event: "APPROVE",  // 或 "REQUEST_CHANGES" / "COMMENT"
  comments: [
    { path: "src/foo.ts", line: 42, body: "建议：此处可优化为..." }
  ]
})

// 步骤 6（可选）：合并 PR
mcp__github__merge_pull_request({
  owner, repo, pull_number,
  merge_method: "squash",
  commit_title: "feat: <功能描述> (#<pr_number>)"
})
```

#### ccg:debug -- 缺陷记录

**修复后创建 Issue**：
```
mcp__github__create_issue({
  owner: "<owner>",
  repo: "<repo>",
  title: "bug: <缺陷简要描述>",
  body: "## 问题描述\n...\n## 根因分析\n...\n## 修复方案\n...\n## 影响范围\n...",
  labels: ["bug", "fixed"]
})
```

#### ccg:feat -- 需求获取

**从 Issue 获取需求**：
```
// 获取 Issue 详情
const issue = mcp__github__get_issue({ owner, repo, issue_number })

// 提取需求信息：issue.title、issue.body、issue.labels
// 传递给 fullstack-light-agent 或其他代理进行开发
```

#### ccg:execute -- 完成通知

**执行完成后更新 Issue**：
```
// 关闭 Issue
mcp__github__update_issue({
  owner, repo, issue_number,
  state: "closed"
})

// 添加完成说明
mcp__github__add_issue_comment({
  owner, repo, issue_number,
  body: "## 已完成\n\n- 实施方案：...\n- 变更文件：...\n- 关联 PR：#<pr_number>"
})
```

#### ccg:init -- 仓库初始化

**创建远程仓库**：
```
mcp__github__create_repository({
  name: "<project-name>",
  description: "<项目描述>",
  private: true,
  auto_init: true
})
```

#### ccg:analyze -- 代码参考搜索

**跨仓库搜索参考实现**：
```
// 搜索特定代码模式
mcp__github__search_code({
  q: "useAuth hook language:typescript"
})

// 搜索相似项目
mcp__github__search_repositories({
  q: "admin dashboard react typescript stars:>50",
  sort: "stars"
})
```

---

## 4. 常用工作流示例

### 4.1 功能分支开发 + 创建 PR

**场景**：从 main 创建功能分支，开发完成后创建 PR。

```javascript
// 步骤 1：创建功能分支
mcp__github__create_branch({
  owner: "my-org",
  repo: "my-project",
  branch: "feat/user-profile",
  from_branch: "main"
})

// 步骤 2：本地开发（由代理执行代码变更）
// ... Edit/Write 工具操作 ...

// 步骤 3：提交并推送（通过 ccg:commit）
// commit-agent 处理本地 commit + git push

// 步骤 4：创建 PR
mcp__github__create_pull_request({
  owner: "my-org",
  repo: "my-project",
  title: "feat: 用户个人资料页面",
  body: "## 变更说明\n- 新增用户个人资料页面\n- 支持头像上传和基本信息编辑\n\n## 测试覆盖\n- 单元测试：ProfileForm 组件\n- 集成测试：头像上传流程\n\n关联 Issue: #42",
  head: "feat/user-profile",
  base: "main"
})
```

### 4.2 PR 审查 + 合并

**场景**：对已有 PR 进行代码审查，通过后合并。

```javascript
// 步骤 1：获取 PR 概览
const pr = mcp__github__get_pull_request({
  owner: "my-org",
  repo: "my-project",
  pull_number: 123
})

// 步骤 2：查看变更文件
const files = mcp__github__get_pull_request_files({
  owner: "my-org",
  repo: "my-project",
  pull_number: 123
})

// 步骤 3：检查 CI 状态
const status = mcp__github__get_pull_request_status({
  owner: "my-org",
  repo: "my-project",
  pull_number: 123
})
// 确认所有 check 通过

// 步骤 4：查看已有评论和审查记录
const reviews = mcp__github__get_pull_request_reviews({
  owner: "my-org",
  repo: "my-project",
  pull_number: 123
})

const comments = mcp__github__get_pull_request_comments({
  owner: "my-org",
  repo: "my-project",
  pull_number: 123
})

// 步骤 5：提交审查意见（通过 mcp______zhi 确认后）
mcp__github__create_pull_request_review({
  owner: "my-org",
  repo: "my-project",
  pull_number: 123,
  body: "代码质量良好，建议合并。",
  event: "APPROVE",
  comments: [
    {
      path: "src/utils/format.ts",
      line: 15,
      body: "建议：此处可使用 Intl.DateTimeFormat 替代手动格式化"
    }
  ]
})

// 步骤 6：合并 PR（通过 mcp______zhi 确认后）
mcp__github__merge_pull_request({
  owner: "my-org",
  repo: "my-project",
  pull_number: 123,
  merge_method: "squash",
  commit_title: "feat: 用户个人资料页面 (#123)"
})
```

### 4.3 Issue 驱动开发（全流程）

**场景**：从 Issue 获取需求 -> 开发 -> 提交 -> 关闭 Issue。

```javascript
// 步骤 1：获取 Issue 需求
const issue = mcp__github__get_issue({
  owner: "my-org",
  repo: "my-project",
  issue_number: 42
})
// 提取 issue.title、issue.body 作为需求输入

// 步骤 2：创建功能分支
mcp__github__create_branch({
  owner: "my-org",
  repo: "my-project",
  branch: "feat/issue-42-dark-mode",
  from_branch: "main"
})

// 步骤 3：本地开发 + 测试（代理执行）
// ... 代码实现 ...

// 步骤 4：提交推送（通过 ccg:commit）

// 步骤 5：创建 PR
mcp__github__create_pull_request({
  owner: "my-org",
  repo: "my-project",
  title: "feat: 暗黑模式支持",
  body: "## 变更说明\n实现暗黑模式主题切换\n\nCloses #42",
  head: "feat/issue-42-dark-mode",
  base: "main"
})

// 步骤 6：PR 审查通过并合并后，关闭 Issue
mcp__github__update_issue({
  owner: "my-org",
  repo: "my-project",
  issue_number: 42,
  state: "closed"
})

// 步骤 7：添加完成评论
mcp__github__add_issue_comment({
  owner: "my-org",
  repo: "my-project",
  issue_number: 42,
  body: "已通过 PR #56 完成实现。变更包括：\n- 主题切换组件\n- CSS 变量暗黑色板\n- localStorage 偏好持久化"
})
```

### 4.4 代码搜索 + 跨仓库参考

**场景**：在分析阶段搜索相似实现和开源参考。

```javascript
// 搜索本仓库中的特定代码模式
mcp__github__search_code({
  q: "useAuth repo:my-org/my-project language:typescript"
})

// 搜索开源社区的参考实现
mcp__github__search_code({
  q: "OAuth2 PKCE flow language:typescript"
})

// 搜索高星仓库作为架构参考
mcp__github__search_repositories({
  q: "next.js admin template typescript stars:>500",
  sort: "stars",
  order: "desc"
})

// 搜索特定用户/组织
mcp__github__search_users({
  q: "type:org language:typescript followers:>100"
})

// 查看参考仓库的文件结构
mcp__github__get_file_contents({
  owner: "reference-org",
  repo: "reference-project",
  path: "src"
})

// 查看参考仓库的近期提交
mcp__github__list_commits({
  owner: "reference-org",
  repo: "reference-project",
  per_page: 10
})
```

---

## 5. 注意事项

### 5.1 Token 配置

**配置位置**：MCP 服务器配置文件（通常在 Claude Desktop 的 `settings.json` 中）

**必需权限**：

| 权限范围 | 用途 | 涉及工具 |
|----------|------|----------|
| `repo` | 仓库读写、PR、Issue | 几乎所有工具 |
| `read:org` | 读取组织信息 | `fork_repository`（Fork 到组织） |
| `workflow` | 触发/管理 Actions | `get_pull_request_status` 中的 CI 状态 |
| `delete_repo` | 删除仓库（谨慎授予） | 无直接工具，但某些管理操作可能需要 |

**安全建议**：
- 使用 Fine-grained Personal Access Token（细粒度 Token），限定仓库范围
- 定期轮换 Token
- 禁止将 Token 硬编码在代码或文档中

### 5.2 降级到 `gh` CLI 的条件

以下情况应降级使用 `gh` CLI（通过 Bash 工具执行）：

| 降级条件 | 说明 | 示例命令 |
|----------|------|----------|
| MCP 服务器连接失败 | GitHub MCP 服务未启动或网络异常 | `gh pr create --title "..." --body "..."` |
| MCP 工具调用超时 | 单次调用超过 30 秒未响应 | `gh issue view 42` |
| MCP 工具返回认证错误 | Token 过期或权限不足 | 先执行 `gh auth status` 诊断 |
| MCP 不支持的操作 | 需要的 GitHub 功能超出 25 个工具范围 | `gh api repos/{owner}/{repo}/...` |

**降级流程**：
1. 首次失败 -> 重试 1 次
2. 二次失败 -> 切换到 `gh` CLI
3. 记录失败原因，通过 `mcp______zhi` 通知用户

### 5.3 使用 `mcp______zhi` 确认的时机

以下 GitHub 操作必须通过 `mcp______zhi` 获得用户确认后才能执行：

| 操作类型 | 需要确认 | 原因 |
|----------|----------|------|
| **创建仓库** | 是 | 不可逆操作 |
| **创建分支** | 是 | 影响仓库结构 |
| **创建 PR** | 是 | 对外可见操作 |
| **合并 PR** | 是 | 不可逆（影响主分支） |
| **关闭 Issue** | 是 | 变更状态 |
| **推送文件** | 是 | 修改远程仓库内容 |
| **提交审查（APPROVE/REQUEST_CHANGES）** | 是 | 正式审查行为 |
| 获取 PR/Issue 详情 | 否 | 只读操作 |
| 搜索代码/仓库 | 否 | 只读操作 |
| 列出提交历史 | 否 | 只读操作 |
| 获取文件内容 | 否 | 只读操作 |
| 提交评论（COMMENT 类型审查） | 视情况 | 非正式审查可简化确认 |

### 5.4 常见错误排查

| 错误信息 | 可能原因 | 解决方案 |
|----------|----------|----------|
| `401 Unauthorized` | Token 无效或过期 | 检查 MCP 配置中的 Token，必要时重新生成 |
| `403 Forbidden` | Token 权限不足 | 扩展 Token 权限范围（如添加 `repo` scope） |
| `404 Not Found` | 仓库不存在或无访问权限 | 确认 `owner`/`repo` 拼写正确；检查仓库是否为 private |
| `409 Conflict` | 文件 SHA 不匹配（`create_or_update_file`） | 重新获取文件的最新 `sha` 后再更新 |
| `422 Unprocessable Entity` | 参数格式错误（如分支名包含非法字符） | 检查参数格式，参考 GitHub API 文档 |
| `422 Validation Failed` | PR 分支不存在或已合并 | 确认 `head` 分支已推送到远程 |
| `merge conflict` | PR 存在合并冲突 | 先调用 `update_pull_request_branch` 同步，或手动解决冲突 |
| MCP 连接超时 | MCP 服务器未启动 | 检查 MCP 服务器状态，必要时重启 |

### 5.5 最佳实践

1. **批量文件操作优先使用 `push_files`**：减少 API 调用次数，避免触发 Rate Limit
2. **创建 PR 前检查分支状态**：确认本地变更已推送到远程分支
3. **合并前检查 CI**：调用 `get_pull_request_status` 确认所有 check 通过
4. **Issue 关联 PR**：在 PR body 中使用 `Closes #<issue_number>` 语法自动关联
5. **审查时提供行级评论**：比整体评论更精准，便于开发者定位问题
6. **搜索时善用 GitHub 语法**：利用 `language:`、`stars:`、`repo:` 等限定符提高搜索精度

---

## 附录 A：工具全名速查索引

按字母排序，便于快速定位：

| 序号 | 工具全名 | 分类 |
|------|----------|------|
| 1 | `mcp__github__add_issue_comment` | Issue |
| 2 | `mcp__github__create_branch` | 仓库/分支 |
| 3 | `mcp__github__create_issue` | Issue |
| 4 | `mcp__github__create_or_update_file` | 文件操作 |
| 5 | `mcp__github__create_pull_request` | Pull Request |
| 6 | `mcp__github__create_pull_request_review` | PR 审查 |
| 7 | `mcp__github__create_repository` | 仓库/分支 |
| 8 | `mcp__github__fork_repository` | 仓库/分支 |
| 9 | `mcp__github__get_file_contents` | 文件操作 |
| 10 | `mcp__github__get_issue` | Issue |
| 11 | `mcp__github__get_pull_request` | Pull Request |
| 12 | `mcp__github__get_pull_request_comments` | PR 审查 |
| 13 | `mcp__github__get_pull_request_files` | PR 审查 |
| 14 | `mcp__github__get_pull_request_reviews` | PR 审查 |
| 15 | `mcp__github__get_pull_request_status` | PR 审查 |
| 16 | `mcp__github__list_commits` | 提交历史 |
| 17 | `mcp__github__list_issues` | Issue |
| 18 | `mcp__github__list_pull_requests` | Pull Request |
| 19 | `mcp__github__merge_pull_request` | Pull Request |
| 20 | `mcp__github__push_files` | 文件操作 |
| 21 | `mcp__github__search_code` | 搜索 |
| 22 | `mcp__github__search_issues` | Issue |
| 23 | `mcp__github__search_repositories` | 仓库/分支 |
| 24 | `mcp__github__search_users` | 搜索 |
| 25 | `mcp__github__update_issue` | Issue |
| 26 | `mcp__github__update_pull_request_branch` | Pull Request |
