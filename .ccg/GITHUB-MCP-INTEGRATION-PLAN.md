# GitHub MCP 完整集成计划

> **归档说明**：本文档为已完成的集成计划，仅供历史参考。所有 25 个 GitHub MCP 工具已 100% 集成，权威使用指南见 `CLAUDE.md` 第 9 节。

> 生成时间：2026-02-08
> 更新时间：2026-02-09
> 当前集成度：100%（25/25 工具）
> 目标集成度：100%（25/25 工具）

---

## 集成状态总览

| 类别 | 工具数 | 已集成 | 待集成 | 集成率 |
|------|--------|--------|--------|--------|
| 仓库操作 | 4 | 4 | 0 | 100% |
| 文件操作 | 4 | 4 | 0 | 100% |
| Issue 操作 | 6 | 6 | 0 | 100% |
| PR 操作 | 10 | 10 | 0 | 100% |
| 其他操作 | 1 | 1 | 0 | 100% |
| **总计** | **25** | **25** | **0** | **100%** |

---

## 阶段 1：核心工作流集成（已完成 ✅）

### 1.1 文件推送功能
- ✅ `push_files` - 集成到 `ccg:commit` 和 `commit-agent`
- ✅ `create_or_update_file` - 集成到 `ccg:commit` 和 `commit-agent`

### 1.2 PR 创建与审查
- ✅ `create_pull_request` - 集成到 `ccg:workflow` 和 `fullstack-agent`
- ✅ `create_pull_request_review` - 集成到 `ccg:review` 和 `review-agent`

---

## 阶段 2：PR 管理增强（已完成 ✅）

### 2.1 PR 详情查询
**工具**：`get_pull_request` ✅ 已集成

**集成位置**：
- `ccg:review` - 审查前获取 PR 详情
- `review-agent` - 工作流步骤 1 增加 PR 信息获取

**实施步骤**：
1. 更新 `commands/ccg/review.md`：
   - 在阶段 1 增加"获取 PR 详情"步骤
   - 使用 `mcp__github__get_pull_request` 获取 PR 标题、描述、变更文件列表
2. 更新 `agents/ccg/review-agent.md`：
   - 在工具集中添加 `mcp__github__get_pull_request`
   - 在工作流步骤 1 中集成 PR 详情获取

**使用示例**：
```
ToolSearch({ query: "select:mcp__github__get_pull_request" })
mcp__github__get_pull_request({
  owner: "username",
  repo: "repo-name",
  pull_number: 123
})
```

---

### 2.2 PR 变更文件列表
**工具**：`get_pull_request_files` ✅ 已集成

**集成位置**：
- `ccg:review` - 获取 PR 变更文件列表
- `review-agent` - 辅助上下文检索

**实施步骤**：
1. 更新 `commands/ccg/review.md`：
   - 在阶段 1 增加"获取 PR 变更文件"步骤
2. 更新 `agents/ccg/review-agent.md`：
   - 在工具集中添加 `mcp__github__get_pull_request_files`

---

### 2.3 PR CI/CD 状态检查
**工具**：`get_pull_request_status` ✅ 已集成

**集成位置**：
- `ccg:review` - 审查前检查 CI/CD 状态
- `review-agent` - 在审查报告中包含 CI 状态

**实施步骤**：
1. 更新 `commands/ccg/review.md`：
   - 在阶段 2 增加"检查 CI/CD 状态"步骤
   - 如果 CI 失败，在审查报告中标注
2. 更新 `agents/ccg/review-agent.md`：
   - 在工具集中添加 `mcp__github__get_pull_request_status`

---

### 2.4 PR 合并功能
**工具**：`merge_pull_request` ✅ 已集成

**集成位置**：
- `ccg:review` - 审查通过后提供合并选项
- `review-agent` - 阶段 5 增加"合并 PR"选项

**实施步骤**：
1. 更新 `commands/ccg/review.md`：
   - 在阶段 5 的三术确认选项中增加"合并 PR"
   - 仅在审查结果为 APPROVE 且无 Critical/Major 问题时显示
2. 更新 `agents/ccg/review-agent.md`：
   - 在工具集中添加 `mcp__github__merge_pull_request`
   - 在工作流步骤 6 增加"合并 PR"流程

**使用示例**：
```
mcp__github__merge_pull_request({
  owner: "username",
  repo: "repo-name",
  pull_number: 123,
  merge_method: "squash"  // squash, merge, rebase
})
```

---

### 2.5 PR 评论与审查查询
**工具**：`get_pull_request_comments`、`get_pull_request_reviews` ✅ 已集成

**集成位置**：
- `ccg:review` - 审查前查看已有评论和审查
- `review-agent` - 避免重复审查已知问题

**实施步骤**：
1. 更新 `commands/ccg/review.md`：
   - 在阶段 1 增加"获取已有评论和审查"步骤
2. 更新 `agents/ccg/review-agent.md`：
   - 在工具集中添加这两个工具
   - 在工作流步骤 1 中集成

---

### 2.6 PR 分支更新
**工具**：`update_pull_request_branch` ✅ 已集成

**集成位置**：
- `ccg:review` - 审查前更新 PR 分支到最新
- `review-agent` - 确保审查的是最新代码

**实施步骤**：
1. 更新 `commands/ccg/review.md`：
   - 在阶段 1 增加"更新 PR 分支"选项
2. 更新 `agents/ccg/review-agent.md`：
   - 在工具集中添加 `mcp__github__update_pull_request_branch`

---

### 2.7 PR 列表查询
**工具**：`list_pull_requests` ✅ 已集成

**集成位置**：
- 新增命令 `ccg:pr-list` - 列出待审查的 PRs
- 全局提示词 - 添加 PR 管理场景

**实施步骤**：
1. 创建 `commands/ccg/pr-list.md`：
   - 列出仓库中的所有 PRs
   - 按状态筛选（open/closed/all）
   - 显示 PR 标题、作者、状态、CI 状态
2. 更新 `CLAUDE.md`：
   - 在第 9 节增加 PR 列表查询场景

---

## 阶段 3：Issue 管理集成（已完成 ✅）

### 3.1 Issue 创建
**工具**：`create_issue` ✅ 已集成

**集成位置**：
- `ccg:debug` - 发现 Bug 后创建 Issue
- `ccg:review` - 审查发现问题后创建 Issue
- `debug-agent` - 调试完成后创建 Issue 记录
- `review-agent` - 审查发现 Critical 问题时创建 Issue

**实施步骤**：
1. 更新 `commands/ccg/debug.md`：
   - 在最后阶段增加"创建 GitHub Issue"选项
   - 自动填充 Issue 标题、描述、标签（bug）
2. 更新 `commands/ccg/review.md`：
   - 在阶段 5 增加"为 Critical 问题创建 Issue"选项
3. 更新 `agents/ccg/debug-agent.md`：
   - 在工具集中添加 `mcp__github__create_issue`
4. 更新 `agents/ccg/review-agent.md`：
   - 在工具集中添加 `mcp__github__create_issue`

**使用示例**：
```
mcp__github__create_issue({
  owner: "username",
  repo: "repo-name",
  title: "Bug: 登录页面在 Safari 浏览器崩溃",
  body: "## 问题描述\n...\n## 复现步骤\n...",
  labels: ["bug", "high-priority"]
})
```

---

### 3.2 Issue 详情查询
**工具**：`get_issue` ✅ 已集成

**集成位置**：
- `ccg:feat` - 根据 Issue 编号获取需求详情
- `fullstack-light-agent` - 阶段 1 研究时获取 Issue 详情

**实施步骤**：
1. 更新 `commands/ccg/feat.md`：
   - 在阶段 1 增加"获取 Issue 详情"步骤
   - 支持用户输入 Issue 编号或 URL
2. 更新 `agents/ccg/fullstack-light-agent.md`：
   - 在工具集中添加 `mcp__github__get_issue`
   - 在工作流步骤 1 中集成

---

### 3.3 Issue 更新
**工具**：`update_issue` ✅ 已集成

**集成位置**：
- `ccg:execute` - 完成任务后更新 Issue 状态
- `execute-agent` - 实施完成后关闭 Issue

**实施步骤**：
1. 更新 `commands/ccg/execute.md`：
   - 在最后阶段增加"更新 Issue 状态"选项
   - 支持关闭 Issue 或更新标签
2. 更新 `agents/ccg/execute-agent.md`：
   - 在工具集中添加 `mcp__github__update_issue`

**使用示例**：
```
mcp__github__update_issue({
  owner: "username",
  repo: "repo-name",
  issue_number: 42,
  state: "closed",
  labels: ["fixed"]
})
```

---

### 3.4 Issue 评论
**工具**：`add_issue_comment` ✅ 已集成

**集成位置**：
- `ccg:review` - 审查后在 Issue 中添加评论
- `ccg:execute` - 实施进度更新到 Issue

**实施步骤**：
1. 更新 `commands/ccg/review.md`：
   - 在阶段 5 增加"在 Issue 中添加审查意见"选项
2. 更新 `commands/ccg/execute.md`：
   - 在实施过程中支持更新 Issue 进度

---

### 3.5 Issue 列表与搜索
**工具**：`list_issues`、`search_issues` ✅ 已集成

**集成位置**：
- 新增命令 `ccg:issue-list` - 列出待处理的 Issues
- 全局提示词 - 添加 Issue 管理场景

**实施步骤**：
1. 创建 `commands/ccg/issue-list.md`：
   - 列出仓库中的所有 Issues
   - 按状态筛选（open/closed/all）
   - 按标签筛选（bug/enhancement/documentation）
2. 更新 `CLAUDE.md`：
   - 在第 9 节增加 Issue 管理场景

---

## 阶段 4：仓库与分支管理（已完成 ✅）

### 4.1 创建仓库
**工具**：`create_repository` ✅ 已集成

**集成位置**：
- `ccg:init` - 初始化项目时创建 GitHub 仓库
- `init-architect` - 项目初始化流程

**实施步骤**：
1. 更新 `commands/ccg/init.md`（如果存在）：
   - 在初始化流程中增加"创建 GitHub 仓库"选项
   - 询问用户仓库名称、描述、是否私有
2. 更新 `agents/ccg/init-architect.md`：
   - 在工具集中添加 `mcp__github__create_repository`

**使用示例**：
```
mcp__github__create_repository({
  name: "my-new-project",
  description: "项目描述",
  private: false,
  auto_init: true
})
```

---

### 4.2 创建分支
**工具**：`create_branch` ✅ 已集成

**集成位置**：
- `ccg:feat` - 开始新功能时创建特性分支
- `ccg:workflow` - 工作流开始时创建分支
- `fullstack-light-agent` - 阶段 1 研究后创建分支

**实施步骤**：
1. 更新 `commands/ccg/feat.md`：
   - 在阶段 1 增加"创建特性分支"选项
   - 自动生成分支名（如 `feature/user-auth`）
2. 更新 `commands/ccg/workflow.md`：
   - 在阶段 1 增加"创建工作分支"选项
3. 更新 `agents/ccg/fullstack-light-agent.md`：
   - 在工具集中添加 `mcp__github__create_branch`

**使用示例**：
```
mcp__github__create_branch({
  owner: "username",
  repo: "repo-name",
  branch: "feature/user-authentication",
  from_branch: "main"
})
```

---

### 4.3 Fork 仓库
**工具**：`fork_repository` ✅ 已集成

**集成位置**：
- 新增命令 `ccg:fork` - Fork 开源项目
- 全局提示词 - 添加开源贡献场景

**实施步骤**：
1. 创建 `commands/ccg/fork.md`：
   - Fork 指定的 GitHub 仓库到用户账户
   - 支持输入仓库 URL 或 owner/repo
2. 更新 `CLAUDE.md`：
   - 在第 9 节增加 Fork 仓库场景

---

### 4.4 搜索仓库
**工具**：`search_repositories` ✅ 已集成

**集成位置**：
- 全局搜索 - 查找相关开源项目作为参考
- `ccg:analyze` - 技术选型时搜索相关项目

**实施步骤**：
1. 更新 `commands/ccg/analyze.md`：
   - 在技术选型阶段增加"搜索相关开源项目"步骤
2. 更新 `CLAUDE.md`：
   - 在第 9 节增加仓库搜索场景

---

## 阶段 5：代码搜索与文件操作（已完成 ✅）

### 5.1 获取文件内容
**工具**：`get_file_contents` ✅ 已集成

**集成位置**：
- 跨仓库代码参考 - 读取其他仓库的文件
- `ccg:analyze` - 分析开源项目的实现

**实施步骤**：
1. 更新 `commands/ccg/analyze.md`：
   - 在技术分析阶段增加"读取参考项目文件"步骤
2. 更新 `CLAUDE.md`：
   - 在第 9 节增加跨仓库文件读取场景

---

### 5.2 搜索代码
**工具**：`search_code` ✅ 已集成

**集成位置**：
- 全局代码搜索 - 在 GitHub 上搜索代码示例
- `ccg:analyze` - 技术调研时搜索实现示例

**实施步骤**：
1. 更新 `commands/ccg/analyze.md`：
   - 在技术调研阶段增加"搜索代码示例"步骤
2. 更新 `CLAUDE.md`：
   - 在第 9 节增加代码搜索场景

---

## 阶段 6：其他功能（已完成 ✅）

### 6.1 搜索用户
**工具**：`search_users` ✅ 已集成

**集成位置**：
- 协作者管理 - 搜索 GitHub 用户
- 新增命令 `ccg:user-search`

**实施步骤**：
1. 创建 `commands/ccg/user-search.md`：
   - 搜索 GitHub 用户
   - 显示用户信息（头像、简介、仓库数）
2. 更新 `CLAUDE.md`：
   - 在第 9 节增加用户搜索场景

---

### 6.2 列出提交历史
**工具**：`list_commits` ✅ 已集成

**集成位置**：
- `ccg:review` - 查看提交历史
- `review-agent` - 理解变更上下文

**实施步骤**：
1. 更新 `commands/ccg/review.md`：
   - 在阶段 1 增加"获取提交历史"步骤
2. 更新 `agents/ccg/review-agent.md`：
   - 在工具集中添加 `mcp__github__list_commits`

---

## 实施优先级排序

### 🔴 高优先级（已完成 ✅）
1. ✅ 文件推送（已完成）
2. ✅ PR 创建与审查（已完成）
3. ✅ PR 详情查询（`get_pull_request`）
4. ✅ PR 变更文件列表（`get_pull_request_files`）
5. ✅ PR CI/CD 状态检查（`get_pull_request_status`）
6. ✅ PR 合并功能（`merge_pull_request`）

### 🟡 中优先级（已完成 ✅）
7. ✅ Issue 创建（`create_issue`）
8. ✅ Issue 详情查询（`get_issue`）
9. ✅ Issue 更新（`update_issue`）
10. ✅ PR 评论与审查查询（`get_pull_request_comments`、`get_pull_request_reviews`）
11. ✅ PR 分支更新（`update_pull_request_branch`）
12. ✅ PR 列表查询（`list_pull_requests`）
13. ✅ Issue 评论（`add_issue_comment`）
14. ✅ Issue 列表与搜索（`list_issues`、`search_issues`）

### 🟢 低优先级（已完成 ✅）
15. ✅ 创建仓库（`create_repository`）— 集成到 `init-architect`
16. ✅ 创建分支（`create_branch`）— 集成到 `ccg:workflow` 和 `fullstack-agent`
17. ✅ Fork 仓库（`fork_repository`）— 集成到 `CLAUDE.md` 第 9 节
18. ✅ 搜索仓库（`search_repositories`）— 集成到 `analyze-agent`
19. ✅ 获取文件内容（`get_file_contents`）— 集成到 `review-agent`
20. ✅ 搜索代码（`search_code`）— 集成到 `analyze-agent`
21. ✅ 搜索用户（`search_users`）— 集成到 `CLAUDE.md` 第 9 节
22. ✅ 列出提交历史（`list_commits`）— 集成到 `ccg:review`、`review-agent`、`commit-agent`

---

## 实施检查清单

### 每个工具集成需完成的步骤：
- [x] 确定集成位置（命令/代理）
- [x] 更新命令文档（`commands/ccg/*.md`）
- [x] 更新代理文档（`agents/ccg/*-agent.md`）
- [x] 更新全局提示词（`CLAUDE.md` 第 9 节）
- [x] 更新 MCP 工具文档（`MCP-TOOLS-AND-SKILLS.md`）
- [x] 添加使用示例和降级方案
- [ ] 测试验证功能可用性

---

## 预期成果

### 集成完成后：
- **集成度**：100%（25/25 工具）
- **覆盖场景**：
  - ✅ 代码提交与推送
  - ✅ PR 创建与审查
  - ✅ PR 管理（详情、状态、合并）
  - ✅ Issue 管理（创建、更新、查询）
  - ✅ 仓库与分支管理
  - ✅ 代码搜索与参考
- **用户体验**：
  - 无需手动使用 `gh` CLI
  - 工作流自动化程度提升
  - GitHub 操作集成到 CCG 命令中

---

## 下一步行动

1. ✅ **已完成**：阶段 1（核心工作流）- 4 个工具
2. ✅ **已完成**：阶段 2（PR 管理增强）- 10 个工具
3. ✅ **已完成**：阶段 3（Issue 管理）- 6 个工具
4. ✅ **已完成**：阶段 4（仓库与分支管理）- 4 个工具
5. ✅ **已完成**：阶段 5（代码搜索与文件操作）- 2 个工具（含 `get_file_contents`、`search_code`）
6. ✅ **已完成**：阶段 6（其他功能）- 2 个工具（含 `search_users`、`list_commits`）

**当前集成度**：100%（25/25 工具已集成到命令/代理工作流中）

**集成完成摘要**：

| 工具 | 集成位置 |
|------|----------|
| `push_files` | `ccg:commit`、`commit-agent` |
| `create_or_update_file` | `ccg:commit`、`commit-agent` |
| `create_pull_request` | `ccg:workflow`、`fullstack-agent` |
| `create_pull_request_review` | `ccg:review`、`review-agent` |
| `get_pull_request` | `ccg:review`、`review-agent` |
| `get_pull_request_files` | `ccg:review`、`review-agent` |
| `get_pull_request_status` | `ccg:review`、`review-agent` |
| `get_pull_request_comments` | `ccg:review`、`review-agent` |
| `get_pull_request_reviews` | `ccg:review`、`review-agent` |
| `merge_pull_request` | `ccg:review`、`review-agent` |
| `update_pull_request_branch` | `ccg:review`、`review-agent` |
| `list_pull_requests` | `ccg:review`、`review-agent` |
| `create_issue` | `ccg:debug`、`ccg:review`、`debug-agent`、`review-agent` |
| `get_issue` | `ccg:feat`、`fullstack-light-agent` |
| `update_issue` | `ccg:execute`、`execute-agent` |
| `add_issue_comment` | `ccg:execute`、`ccg:review`、`execute-agent`、`review-agent` |
| `list_issues` | `CLAUDE.md` 第 9 节 |
| `search_issues` | `CLAUDE.md` 第 9 节 |
| `create_repository` | `init-architect` |
| `create_branch` | `ccg:workflow`、`fullstack-agent` |
| `fork_repository` | `CLAUDE.md` 第 9 节 |
| `search_repositories` | `analyze-agent` |
| `get_file_contents` | `review-agent` |
| `search_code` | `analyze-agent` |
| `search_users` | `CLAUDE.md` 第 9 节 |
| `list_commits` | `ccg:review`、`review-agent`、`commit-agent` |

**注意**：所有 25 个 GitHub MCP 工具在系统层面均已可用（deferred tools），
并已集成到对应的 CCG 命令/代理工作流中。
