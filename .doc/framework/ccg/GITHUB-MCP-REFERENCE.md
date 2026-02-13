# GitHub MCP 工具完整参考文档

> **归档说明**：本文档为历史参考文件。GitHub MCP 工具的权威使用指南已迁移至 `CLAUDE.md` 第 9 节。本文件中的 `ToolSearch` 加载步骤已过时（GitHub MCP 工具现可直接调用）。

> 生成时间：2026-02-09
> 集成状态：100%（25/25 工具）
> 适用范围：Claude Code CCG 工作流

---

## 总览

GitHub MCP 提供 25 个工具，覆盖仓库管理、文件操作、PR 管理、Issue 管理、代码搜索等场景。所有工具均为 **deferred tools**，使用前必须通过 `ToolSearch` 加载。

### 按类别统计

| 类别 | 工具数 | 工具列表 |
|------|--------|----------|
| 文件操作 | 4 | `push_files`、`create_or_update_file`、`get_file_contents`、`search_code` |
| PR 操作 | 10 | `create_pull_request`、`create_pull_request_review`、`get_pull_request`、`get_pull_request_files`、`get_pull_request_status`、`get_pull_request_comments`、`get_pull_request_reviews`、`merge_pull_request`、`update_pull_request_branch`、`list_pull_requests` |
| Issue 操作 | 6 | `create_issue`、`get_issue`、`update_issue`、`add_issue_comment`、`list_issues`、`search_issues` |
| 仓库操作 | 4 | `create_repository`、`create_branch`、`fork_repository`、`search_repositories` |
| 其他 | 1 | `search_users`、`list_commits` |

### 通用降级方案

所有 GitHub MCP 工具不可用时，均可降级为 `gh` CLI 命令。

---

## 一、文件操作（4 个工具）

### 1. `mcp__github__push_files`

**功能描述**：批量推送多个文件到 GitHub 仓库，一次提交包含多个文件变更。

**集成位置**：
- 命令：`ccg:commit`
- 代理：`commit-agent`

**使用场景**：
- 提交完成后，用户选择推送到 GitHub
- 多文件同时变更需要一次性推送

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__push_files" })

mcp__github__push_files({
  owner: "username",
  repo: "repo-name",
  branch: "main",
  files: [
    { path: "src/index.js", content: "// 文件内容..." },
    { path: "src/utils.js", content: "// 工具函数..." }
  ],
  message: "feat: 添加新功能模块"
})
```

**降级方案**：`git push origin <branch>`

---

### 2. `mcp__github__create_or_update_file`

**功能描述**：创建或更新 GitHub 仓库中的单个文件。适用于单文件操作场景。

**集成位置**：
- 命令：`ccg:commit`
- 代理：`commit-agent`

**使用场景**：
- 推送单个文件到 GitHub（如 README、配置文件）
- 直接在 GitHub 上创建新文件

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__create_or_update_file" })

mcp__github__create_or_update_file({
  owner: "username",
  repo: "repo-name",
  path: "README.md",
  content: "# 项目标题\n\n项目描述...",
  message: "docs: 更新 README",
  branch: "main",
  sha: "原文件的 SHA（更新时必填）"
})
```

**降级方案**：`git add <file> && git commit -m "msg" && git push`

---

### 3. `mcp__github__get_file_contents`

**功能描述**：获取 GitHub 仓库中指定文件的内容。可跨仓库读取文件，无需本地 clone。

**集成位置**：
- 代理：`review-agent`

**使用场景**：
- PR 审查时获取 GitHub 上特定文件内容
- 跨仓库读取参考代码（如开源项目的实现）
- 不想 clone 整个仓库时直接读取文件

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__get_file_contents" })

mcp__github__get_file_contents({
  owner: "facebook",
  repo: "react",
  path: "packages/react/src/React.js",
  branch: "main"
})
```

**降级方案**：`gh api repos/{owner}/{repo}/contents/{path}`

---

### 4. `mcp__github__search_code`

**功能描述**：在 GitHub 全平台搜索代码。支持按语言、仓库、文件路径等条件过滤。

**集成位置**：
- 代理：`analyze-agent`

**使用场景**：
- 技术分析时搜索开源项目中的实现示例
- 查找特定 API 的使用方式
- 技术选型时对比不同库的代码风格

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__search_code" })

mcp__github__search_code({
  q: "useAuth hook language:typescript",
  page: 1,
  per_page: 10
})
```

**降级方案**：`gh search code "useAuth hook" --language=typescript`

---

## 二、PR 操作（10 个工具）

### 5. `mcp__github__create_pull_request`

**功能描述**：创建 Pull Request。将当前分支的变更提交为 PR，支持指定标题、描述、目标分支。

**集成位置**：
- 命令：`ccg:workflow`
- 代理：`fullstack-agent`

**使用场景**：
- 工作流阶段 6（质量审查）完成后创建 PR
- 功能开发完成后提交合并请求

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__create_pull_request" })

mcp__github__create_pull_request({
  owner: "username",
  repo: "repo-name",
  title: "feat: 添加用户认证功能",
  head: "feature/auth",
  base: "main",
  body: "## 变更摘要\n- 实现 JWT 认证\n- 添加登录/注册接口\n\n## 测试\n- [x] 单元测试通过\n- [x] E2E 测试通过"
})
```

**降级方案**：`gh pr create --title "title" --body "body" --base main --head feature/auth`

---

### 6. `mcp__github__create_pull_request_review`

**功能描述**：对 PR 提交审查意见。支持 APPROVE（批准）、REQUEST_CHANGES（要求修改）、COMMENT（评论）三种类型。

**集成位置**：
- 命令：`ccg:review`
- 代理：`review-agent`

**使用场景**：
- 代码审查完成后提交 GitHub PR Review
- 自动化审查流程中提交审查结果

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__create_pull_request_review" })

mcp__github__create_pull_request_review({
  owner: "username",
  repo: "repo-name",
  pull_number: 42,
  event: "APPROVE",
  body: "代码质量良好，架构清晰，已通过审查。",
  comments: [
    {
      path: "src/auth.ts",
      position: 15,
      body: "建议：这里可以使用 bcrypt 替代 md5"
    }
  ]
})
```

**降级方案**：`gh pr review 42 --approve --body "审查意见"`

---

### 7. `mcp__github__get_pull_request`

**功能描述**：获取 PR 的详细信息，包括标题、描述、状态、分支、作者等。

**集成位置**：
- 命令：`ccg:review`
- 代理：`review-agent`

**使用场景**：
- 审查前获取 PR 的完整上下文
- 检查 PR 当前状态（open/closed/merged）

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__get_pull_request" })

mcp__github__get_pull_request({
  owner: "username",
  repo: "repo-name",
  pull_number: 42
})
```

**降级方案**：`gh pr view 42`

---

### 8. `mcp__github__get_pull_request_files`

**功能描述**：获取 PR 中变更的文件列表，包括每个文件的增删行数和变更状态。

**集成位置**：
- 命令：`ccg:review`
- 代理：`review-agent`

**使用场景**：
- 审查前快速了解 PR 影响范围
- 确定哪些文件需要重点审查

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__get_pull_request_files" })

mcp__github__get_pull_request_files({
  owner: "username",
  repo: "repo-name",
  pull_number: 42
})
```

**降级方案**：`gh pr diff 42 --stat`

---

### 9. `mcp__github__get_pull_request_status`

**功能描述**：获取 PR 的 CI/CD 检查状态，包括所有 status check 和 check run 的结果。

**集成位置**：
- 命令：`ccg:review`
- 代理：`review-agent`

**使用场景**：
- 合并前检查 CI/CD 是否通过
- 诊断 PR 构建失败的原因

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__get_pull_request_status" })

mcp__github__get_pull_request_status({
  owner: "username",
  repo: "repo-name",
  pull_number: 42
})
```

**降级方案**：`gh pr checks 42`

---

### 10. `mcp__github__get_pull_request_comments`

**功能描述**：获取 PR 中的所有评论，包括 review comments 和 inline comments。

**集成位置**：
- 命令：`ccg:review`
- 代理：`review-agent`

**使用场景**：
- 审查时阅读已有的评论和讨论
- 了解 PR 的审查历史和反馈

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__get_pull_request_comments" })

mcp__github__get_pull_request_comments({
  owner: "username",
  repo: "repo-name",
  pull_number: 42
})
```

**降级方案**：`gh api repos/{owner}/{repo}/pulls/42/comments`

---

### 11. `mcp__github__get_pull_request_reviews`

**功能描述**：获取 PR 的所有审查记录，包括每次审查的类型（APPROVE/REQUEST_CHANGES/COMMENT）和内容。

**集成位置**：
- 命令：`ccg:review`
- 代理：`review-agent`

**使用场景**：
- 查看 PR 的审查进度（谁已审查、谁还未审查）
- 合并前确认所有必要的审查已通过

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__get_pull_request_reviews" })

mcp__github__get_pull_request_reviews({
  owner: "username",
  repo: "repo-name",
  pull_number: 42
})
```

**降级方案**：`gh api repos/{owner}/{repo}/pulls/42/reviews`

---

### 12. `mcp__github__merge_pull_request`

**功能描述**：合并 PR。支持 merge commit、squash merge、rebase merge 三种合并方式。

**集成位置**：
- 命令：`ccg:review`
- 代理：`review-agent`

**使用场景**：
- 审查通过后合并 PR
- 自动化合并流程

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__merge_pull_request" })

mcp__github__merge_pull_request({
  owner: "username",
  repo: "repo-name",
  pull_number: 42,
  commit_title: "feat: 添加用户认证功能 (#42)",
  merge_method: "squash"
})
```

**降级方案**：`gh pr merge 42 --squash`

---

### 13. `mcp__github__update_pull_request_branch`

**功能描述**：将 PR 的 head 分支更新到 base 分支的最新状态（相当于将 base 合并到 head）。

**集成位置**：
- 命令：`ccg:review`
- 代理：`review-agent`

**使用场景**：
- PR 落后于目标分支时更新
- 合并前确保 PR 与最新代码兼容

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__update_pull_request_branch" })

mcp__github__update_pull_request_branch({
  owner: "username",
  repo: "repo-name",
  pull_number: 42
})
```

**降级方案**：`git fetch origin main && git merge origin/main`

---

### 14. `mcp__github__list_pull_requests`

**功能描述**：列出仓库中的 PR 列表。支持按状态（open/closed/all）、分支等条件过滤。

**集成位置**：
- 命令：`ccg:review`
- 代理：`review-agent`

**使用场景**：
- 用户未指定 PR 编号时，列出可审查的 PR 供选择
- 查看仓库中当前活跃的 PR

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__list_pull_requests" })

mcp__github__list_pull_requests({
  owner: "username",
  repo: "repo-name",
  state: "open",
  sort: "updated",
  direction: "desc",
  per_page: 10
})
```

**降级方案**：`gh pr list --state open`

---

## 三、Issue 操作（6 个工具）

### 15. `mcp__github__create_issue`

**功能描述**：创建 GitHub Issue。支持标题、描述、标签、负责人等字段。

**集成位置**：
- 命令：`ccg:debug`、`ccg:review`
- 代理：`debug-agent`、`review-agent`

**使用场景**：
- 调试完成后创建 Bug Issue 记录缺陷
- 代码审查发现 Critical/Major 问题时创建 Issue 追踪
- 记录功能需求或技术债务

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__create_issue" })

mcp__github__create_issue({
  owner: "username",
  repo: "repo-name",
  title: "Bug: 登录页面在 Safari 浏览器崩溃",
  body: "## 问题描述\n用户在 Safari 17 上点击登录按钮后页面白屏。\n\n## 复现步骤\n1. 打开登录页面\n2. 输入用户名和密码\n3. 点击「登录」按钮\n\n## 预期行为\n跳转到首页\n\n## 实际行为\n页面白屏，控制台报 TypeError",
  labels: ["bug", "high-priority"],
  assignees: ["developer-name"]
})
```

**降级方案**：`gh issue create --title "title" --body "body" --label "bug"`

---

### 16. `mcp__github__get_issue`

**功能描述**：获取 Issue 的详细信息，包括标题、描述、标签、状态、评论等。

**集成位置**：
- 命令：`ccg:feat`
- 代理：`fullstack-light-agent`

**使用场景**：
- 功能开发时从 Issue 获取需求详情
- 用户提供 Issue 编号时自动拉取需求描述

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__get_issue" })

mcp__github__get_issue({
  owner: "username",
  repo: "repo-name",
  issue_number: 42
})
```

**降级方案**：`gh issue view 42`

---

### 17. `mcp__github__update_issue`

**功能描述**：更新 Issue 的状态、标签、标题、描述等字段。常用于关闭已修复的 Issue。

**集成位置**：
- 命令：`ccg:execute`
- 代理：`execute-agent`

**使用场景**：
- 任务执行完成后关闭关联的 Issue
- 更新 Issue 标签（如添加 `fixed` 标签）

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__update_issue" })

mcp__github__update_issue({
  owner: "username",
  repo: "repo-name",
  issue_number: 42,
  state: "closed",
  labels: ["fixed"],
  title: "Bug: 登录页面在 Safari 崩溃 [已修复]"
})
```

**降级方案**：`gh issue close 42`

---

### 18. `mcp__github__add_issue_comment`

**功能描述**：在 Issue 中添加评论。用于记录实施摘要、进度更新等。

**集成位置**：
- 命令：`ccg:execute`、`ccg:review`
- 代理：`execute-agent`、`review-agent`

**使用场景**：
- 任务完成后在 Issue 中添加实施摘要
- 审查时在相关 Issue 中记录发现的问题

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__add_issue_comment" })

mcp__github__add_issue_comment({
  owner: "username",
  repo: "repo-name",
  issue_number: 42,
  body: "## 实施完成\n\n### 变更摘要\n- 修复了 Safari 兼容性问题\n- 添加了 polyfill for structuredClone\n\n### 关联 PR\n- #43"
})
```

**降级方案**：`gh issue comment 42 --body "评论内容"`

---

### 19. `mcp__github__list_issues`

**功能描述**：列出仓库中的 Issue 列表。支持按状态、标签、负责人等条件过滤。

**集成位置**：
- 全局提示词：`CLAUDE.md` 第 9 节

**使用场景**：
- 查看仓库中所有待处理的 Issue
- 按标签筛选特定类型的 Issue（如 bug、feature）
- 项目管理和任务分配

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__list_issues" })

mcp__github__list_issues({
  owner: "username",
  repo: "repo-name",
  state: "open",
  labels: "bug",
  sort: "created",
  direction: "desc",
  per_page: 20
})
```

**降级方案**：`gh issue list --state open --label "bug"`

---

### 20. `mcp__github__search_issues`

**功能描述**：在 GitHub 全平台搜索 Issues 和 PR。支持复杂的查询语法。

**集成位置**：
- 全局提示词：`CLAUDE.md` 第 9 节

**使用场景**：
- 按关键字搜索相关 Issue
- 跨仓库搜索已知问题或解决方案
- 查找重复 Issue

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__search_issues" })

mcp__github__search_issues({
  q: "safari crash is:issue is:open repo:username/repo-name",
  sort: "updated",
  order: "desc",
  per_page: 10
})
```

**降级方案**：`gh search issues "safari crash" --repo username/repo-name`

---

## 四、仓库操作（4 个工具）

### 21. `mcp__github__create_repository`

**功能描述**：创建新的 GitHub 仓库。支持设置名称、描述、可见性、自动初始化等。

**集成位置**：
- 代理：`init-architect`

**使用场景**：
- 项目初始化时创建 GitHub 仓库
- 脚手架生成后自动创建远程仓库

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__create_repository" })

mcp__github__create_repository({
  name: "my-new-project",
  description: "基于 React + TypeScript 的全栈项目",
  private: false,
  autoInit: true
})
```

**降级方案**：`gh repo create my-new-project --public --description "描述"`

---

### 22. `mcp__github__create_branch`

**功能描述**：在 GitHub 仓库中创建新分支。基于指定的源分支创建。

**集成位置**：
- 命令：`ccg:workflow`
- 代理：`fullstack-agent`

**使用场景**：
- 工作流开始前，检测到在 main/master 分支时，询问用户是否创建 feature 分支
- 功能开发前创建特性分支

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__create_branch" })

mcp__github__create_branch({
  owner: "username",
  repo: "repo-name",
  branch: "feature/user-authentication",
  from_branch: "main"
})
```

**降级方案**：`git checkout -b feature/user-authentication && git push -u origin feature/user-authentication`

---

### 23. `mcp__github__fork_repository`

**功能描述**：Fork 一个 GitHub 仓库到自己的账户下。用于开源贡献场景。

**集成位置**：
- 全局提示词：`CLAUDE.md` 第 9 节

**使用场景**：
- 参与开源项目贡献前 Fork 仓库
- 基于已有项目创建自己的修改版本

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__fork_repository" })

mcp__github__fork_repository({
  owner: "facebook",
  repo: "react"
})
```

**降级方案**：`gh repo fork facebook/react`

---

### 24. `mcp__github__search_repositories`

**功能描述**：在 GitHub 上搜索仓库。支持按语言、Star 数、更新时间等条件过滤。

**集成位置**：
- 代理：`analyze-agent`

**使用场景**：
- 技术选型时搜索相关开源项目
- 寻找参考实现和最佳实践
- 竞品分析

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__search_repositories" })

mcp__github__search_repositories({
  query: "react authentication stars:>1000 language:typescript",
  page: 1,
  perPage: 10
})
```

**降级方案**：`gh search repos "react authentication" --language typescript --stars ">1000"`

---

## 五、其他工具（2 个）

### 25. `mcp__github__list_commits`

**功能描述**：获取仓库或分支的提交历史。可查看提交消息、作者、时间等信息。

**集成位置**：
- 命令：`ccg:review`
- 代理：`review-agent`、`commit-agent`

**使用场景**：
- PR 审查时查看提交历史，理解变更演进
- 提交后验证推送是否成功
- 了解分支的开发历史

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__list_commits" })

mcp__github__list_commits({
  owner: "username",
  repo: "repo-name",
  sha: "feature/auth",
  per_page: 20
})
```

**降级方案**：`gh api repos/{owner}/{repo}/commits?sha=feature/auth`

---

### 26. `mcp__github__search_users`

**功能描述**：搜索 GitHub 用户。支持按用户名、位置、组织等条件过滤。

**集成位置**：
- 全局提示词：`CLAUDE.md` 第 9 节

**使用场景**：
- 搜索协作者或贡献者信息
- 查找特定领域的开发者
- 组织内用户管理

**调用示例**：
```javascript
ToolSearch({ query: "select:mcp__github__search_users" })

mcp__github__search_users({
  q: "fullstack language:typescript location:china",
  per_page: 10
})
```

**降级方案**：`gh api search/users?q=fullstack+language:typescript`

---

## 附录 A：集成位置速查表

| 工具 | CCG 命令 | CCG 代理 | CLAUDE.md |
|------|----------|----------|-----------|
| `push_files` | `ccg:commit` | `commit-agent` | 第 9 节 |
| `create_or_update_file` | `ccg:commit` | `commit-agent` | 第 9 节 |
| `get_file_contents` | — | `review-agent` | 第 9 节 |
| `search_code` | — | `analyze-agent` | 第 9 节 |
| `create_pull_request` | `ccg:workflow` | `fullstack-agent` | 第 9 节 |
| `create_pull_request_review` | `ccg:review` | `review-agent` | 第 9 节 |
| `get_pull_request` | `ccg:review` | `review-agent` | — |
| `get_pull_request_files` | `ccg:review` | `review-agent` | — |
| `get_pull_request_status` | `ccg:review` | `review-agent` | — |
| `get_pull_request_comments` | `ccg:review` | `review-agent` | — |
| `get_pull_request_reviews` | `ccg:review` | `review-agent` | — |
| `merge_pull_request` | `ccg:review` | `review-agent` | 第 9 节 |
| `update_pull_request_branch` | `ccg:review` | `review-agent` | 第 9 节 |
| `list_pull_requests` | `ccg:review` | `review-agent` | 第 9 节 |
| `create_issue` | `ccg:debug`、`ccg:review` | `debug-agent`、`review-agent` | 第 9 节 |
| `get_issue` | `ccg:feat` | `fullstack-light-agent` | 第 9 节 |
| `update_issue` | `ccg:execute` | `execute-agent` | 第 9 节 |
| `add_issue_comment` | `ccg:execute`、`ccg:review` | `execute-agent`、`review-agent` | 第 9 节 |
| `list_issues` | — | — | 第 9 节 |
| `search_issues` | — | — | 第 9 节 |
| `create_repository` | — | `init-architect` | 第 9 节 |
| `create_branch` | `ccg:workflow` | `fullstack-agent` | 第 9 节 |
| `fork_repository` | — | — | 第 9 节 |
| `search_repositories` | — | `analyze-agent` | 第 9 节 |
| `search_users` | — | — | 第 9 节 |
| `list_commits` | `ccg:review` | `review-agent`、`commit-agent` | 第 9 节 |

---

## 附录 B：工作流触发关系图

```
ccg:commit ──→ push_files / create_or_update_file / list_commits
ccg:review ──→ get_pull_request / get_pull_request_files / get_pull_request_status
              / get_pull_request_comments / get_pull_request_reviews
              / create_pull_request_review / merge_pull_request
              / update_pull_request_branch / list_pull_requests
              / create_issue / add_issue_comment / list_commits
ccg:workflow → create_pull_request / create_branch
ccg:debug ───→ create_issue
ccg:feat ────→ get_issue
ccg:execute ─→ update_issue / add_issue_comment
ccg:init ────→ create_repository（通过 init-architect 代理）
ccg:analyze ─→ search_code / search_repositories（通过 analyze-agent 代理）
```

---

## 附录 C：使用前必读

1. **加载工具**：所有工具都是 deferred tools，调用前必须先 `ToolSearch({ query: "select:mcp__github__<tool_name>" })`
2. **认证**：GitHub token 在 MCP 配置中设置，无需手动传入
3. **降级**：MCP 工具不可用时，统一降级为 `gh` CLI
4. **确认**：涉及写入操作（create/update/merge/push）时，通过 `mcp______zhi` 询问用户确认
5. **编码**：所有提交信息和 Issue/PR 内容使用 UTF-8 编码，中文描述
