---
description: '智能 Git 提交：分析改动生成 Conventional Commit 信息，支持拆分建议'
---

# Commit - 智能 Git 提交

分析当前改动，生成 Conventional Commits 风格的提交信息。

## 使用方法

```bash
/commit [options]
```

## 选项

| 选项 | 说明 |
|------|------|
| `--no-verify` | 跳过 Git 钩子 |
| `--all` | 暂存所有改动 |
| `--amend` | 修补上次提交 |
| `--signoff` | 附加签名 |
| `--emoji` | 包含 emoji 前缀 |
| `--scope <scope>` | 指定作用域 |
| `--type <type>` | 指定提交类型 |

## 你的角色

你是**Git 提交协调者**，负责将用户的提交需求委托给 `commit-agent` 代理执行。

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`commit-agent`（`agents/ccg/commit-agent.md`）

**调用**：
```
Task({
  subagent_type: "commit-agent",
  prompt: "执行智能 Git 提交工作流。用户参数：$ARGUMENTS\n\n【不可跳过的前置步骤】\n1. 阶段0：调用 mcp______ji(回忆, preference) + mcp______ji(回忆, context)\n2. 阶段2：读取 .gitignore，检查暂存区安全性\n若任一步未执行或失败，禁止执行 git add/git commit",
  description: "智能 Git 提交"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- Git 操作：Bash（git diff, git add, git commit）
- 用户确认：`mcp______zhi` → `AskUserQuestion`
- 知识存储：`mcp______ji` → 本地文件
- GitHub 集成：GitHub MCP 工具（push_files）

**详细说明**：参考 [架构文档 - 工具调用优先级](./.doc/framework/ccg/ARCHITECTURE.md#工具调用优先级)

---

## 执行工作流

### 步骤 1：委托给 commit-agent

调用 Task 工具启动 commit-agent 代理，传入用户需求。

```
Task({
  subagent_type: "commit-agent",
  prompt: "执行智能 Git 提交工作流。用户参数：$ARGUMENTS\n\n【不可跳过的前置步骤】\n1. 阶段0：调用 mcp______ji(回忆, preference) + mcp______ji(回忆, context)\n2. 阶段2：读取 .gitignore，检查暂存区安全性\n若任一步未执行或失败，禁止执行 git add/git commit",
  description: "智能 Git 提交"
})
```

commit-agent 将自动执行以下流程：
0. 准备与回忆（回忆提交规范偏好、检查临时文件）
1. 仓库校验（验证 Git 状态、检测冲突）
2. 文件清理检查（检测私密文件、临时文件）
3. 改动检测（获取暂存与未暂存改动）
4. 拆分建议（评估是否需要拆分提交）
5. 生成提交信息（利用三术记忆、判断版本号更新）
6. 执行提交（创建提交、归档规范偏好）
7. 版本管理（可选：更新 VERSION.md）
8. GitHub 推送（可选：推送到远程、验证成功）
9. 归档与清理（存储提交记录、清理临时文件）

### 步骤 2：等待代理完成

commit-agent 完成后会返回提交结果，包含：
- 变更分析（文件数、新增/删除行数、改动类型、影响范围）
- 建议的提交信息
- 拆分建议（如需要）
- 提交哈希

---

## 适用场景

| 场景 | 示例 |
|------|------|
| 基本提交 | `/commit` |
| 暂存所有并提交 | `/commit --all` |
| 带 emoji 提交 | `/commit --emoji` |
| 指定类型和作用域 | `/commit --scope ui --type feat --emoji` |
| 修补上次提交 | `/commit --amend --signoff` |

## Type 与 Emoji 映射

| Emoji | Type | 说明 |
|-------|------|------|
| ✨ | `feat` | 新增功能 |
| 🐛 | `fix` | 缺陷修复 |
| 📝 | `docs` | 文档更新 |
| 🎨 | `style` | 代码格式 |
| ♻️ | `refactor` | 重构 |
| ⚡️ | `perf` | 性能优化 |
| ✅ | `test` | 测试相关 |
| 🔧 | `chore` | 构建/工具 |
| 👷 | `ci` | CI/CD |
| ⏪️ | `revert` | 回滚 |

---

## 关键规则

1. **仅使用 Git** – 不调用包管理器
2. **尊重钩子** – 默认执行，`--no-verify` 可跳过
3. **不改源码** – 只读写 `.git/COMMIT_EDITMSG`
4. **原子提交** – 一次提交只做一件事

---

## 详细工作流

### 🎯 阶段 0：准备与回忆

`[模式：准备]`

1. **回忆提交规范偏好**：
   ```
   mcp______ji({
     action: "回忆",
     category: "preference",
     project_path: "<项目路径>"
   })
   ```
   - 获取项目的提交规范（格式、语言、emoji、scope 约定）
   - 获取安全规范（禁止提交的文件类型）

2. **回忆最近提交历史**：
   ```
   mcp______ji({
     action: "回忆",
     category: "context",
     project_path: "<项目路径>"
   })
   ```
   - 了解最近的提交模式和版本号

3. **检查临时文件**：
   - 执行 `git status` 查看未跟踪文件
   - 识别临时文件模式（tasks/、teams/、*.tmp、.cache/）

### 🔍 阶段 1：仓库校验

`[模式：检查]`

1. 验证 Git 仓库状态
2. 检测 rebase/merge 冲突
3. 读取当前分支/HEAD 状态

### 🔒 阶段 2：文件清理检查

`[模式：安全检查]`

1. **检测私密文件**：
   - 检查暂存区是否包含：`.env`、`*.key`、`*.pem`、`credentials/`、`secrets/`、`config.json`（本地配置）
   - 检查是否包含 API keys、密钥、密码等敏感信息

2. **检测临时文件**：
   - 检查是否包含：`tasks/`、`teams/`、`*.tmp`、`.cache/`、`node_modules/`、`dist/`、`build/`
   - 检查是否包含构建产物、日志文件

3. **检测 .doc/ 目录文件**（重要）：
   - 检查暂存区是否包含 `.doc/` 目录下的文档文件（`.md`、`.txt`、`.js`）
   - 允许提交：`.doc/**/.gitkeep` 文件（保持目录结构）
   - 禁止提交：`.doc/` 下的所有其他文件
   - 如发现 `.doc/` 文件，自动执行 `git reset HEAD .doc/**/*.md .doc/**/*.txt .doc/**/*.js`

4. **警告用户**：
   - 如发现问题文件，通过 `mcp______zhi` 展示警告
   - 提供选项：["移除问题文件", "忽略警告继续", "取消提交"]
   - 根据用户选择执行 `git reset HEAD <file>` 或继续

### 📋 阶段 3：改动检测

`[模式：分析]`

1. 获取已暂存与未暂存改动
2. 若暂存区为空：
   - `--all` → 执行 `git add -A`（仅在通过安全检查后）
   - 否则提示选择

### ✂️ 阶段 4：拆分建议

`[模式：建议]`

按以下维度聚类：
- 关注点（源代码 vs 文档/测试）
- 文件模式（不同目录/包）
- 改动类型（新增 vs 删除）

若检测到多组独立变更（>300 行 / 跨多个顶级目录），建议拆分。

### ✍️ 阶段 5：生成提交信息（增强版）

`[模式：生成]`

**格式**：`[emoji] <type>(<scope>): <subject>`

- 首行 ≤ 72 字符
- 祈使语气
- 消息体：动机、实现要点、影响范围

**智能判断**：
1. **利用三术记忆**：
   - 从阶段 0 获取的提交规范偏好
   - 自动应用项目的 type 优先级、emoji 使用、scope 约定

2. **版本号判断**：
   - 如果是 `feat`/`refactor`/`fix` 类型，判断是否需要更新版本号
   - 检查 VERSION.md 是否存在
   - 根据改动规模建议版本号变更（major/minor/patch）

**语言**：优先使用三术记忆的偏好，否则根据最近 50 次提交判断

**三术(zhi)确认**：

调用 `mcp______zhi` 工具展示提交信息并获取确认：
- `message`:
  ```
  ## 📝 提交信息预览

  ### 变更摘要
  - 修改文件数：<N>
  - 新增行数：<+N>
  - 删除行数：<-N>

  ### 提交信息
  ```
  <生成的提交信息>
  ```

  ### 变更文件
  <文件列表>

  请确认提交信息：
  ```
- `is_markdown`: true
- `predefined_options`: ["确认提交", "修改信息", "查看详细 diff", "取消"]

根据用户选择：
- 「确认提交」→ 进入阶段 6 执行提交
- 「修改信息」→ 使用用户修改后的提交信息
- 「查看详细 diff」→ 执行 `git diff --staged` 展示完整变更
- 「取消」→ 终止当前回复

### ✅ 阶段 6：执行提交

`[模式：执行]`

```bash
git commit [-S] [--no-verify] [-s] -F .git/COMMIT_EDITMSG
```

提交成功后，调用 `mcp______ji` 归档提交规范偏好：
- `action`: "记忆"
- `category`: "pattern"
- `content`: "commit-convention|type:<type>|scope:<scope>|语言:<中文/英文>|emoji:<是/否>"
- 供后续提交参考项目偏好风格。

### 📋 阶段 7：版本管理（可选）

`[模式：版本更新]`

如果是重要提交（`feat`/`refactor`/`fix`），询问用户是否更新 VERSION.md：

**三术(zhi)确认**：

调用 `mcp______zhi` 工具：
- `message`:
  ```
  ## 📝 版本管理

  检测到重要提交（<type>），建议更新版本号。

  当前版本：v<current-version>
  建议版本：v<suggested-version>

  是否更新 VERSION.md？
  ```
- `is_markdown`: true
- `predefined_options`: ["更新版本号", "跳过版本更新", "手动指定版本"]

根据用户选择：
- 「更新版本号」→ 自动生成 VERSION.md 变更，创建第二个提交
- 「跳过版本更新」→ 进入阶段 8
- 「手动指定版本」→ 让用户输入版本号，然后更新

**版本号规则**：
- `feat` → minor 版本 +1（如 v1.0.0 → v1.1.0）
- `fix` → patch 版本 +1（如 v1.0.0 → v1.0.1）
- `refactor` → 根据改动规模判断（minor 或 patch）
- Breaking Change → major 版本 +1（如 v1.0.0 → v2.0.0）

**VERSION.md 更新内容**：
```markdown
## v<new-version> (<date>)

### <emoji> <type>：<subject>

**提交哈希**：<commit-hash>

**核心改进**：
- <改动点 1>
- <改动点 2>

**修改文件**：<N> 个（+<add> 行，-<del> 行）

**Co-Authored-By**: Claude Opus 4.6 <noreply@anthropic.com>
```

### 🚀 阶段 8：GitHub 推送（优化版）

`[模式：推送]`

提交成功后，询问用户是否推送到 GitHub：

**三术(zhi)确认**：

调用 `mcp______zhi` 工具：
- `message`:
  ```
  ## ✅ 提交成功

  提交哈希：<commit-hash>

  是否推送到 GitHub？
  ```
- `is_markdown`: true
- `predefined_options`: ["推送到 GitHub", "仅本地提交", "查看提交详情"]

根据用户选择：
- 「推送到 GitHub」→ 执行 GitHub 推送流程
- 「仅本地提交」→ 完成工作流
- 「查看提交详情」→ 执行 `git show HEAD`

**GitHub 推送流程（优化版）**：

1. **检测仓库信息**：
   ```bash
   git remote get-url origin
   # 解析 owner 和 repo（如：https://github.com/owner/repo.git）
   ```

2. **获取当前分支**：
   ```bash
   git branch --show-current
   ```

3. **推送提交**：
   ```bash
   git push origin <branch>
   ```
   - ✅ 使用标准 Git 推送（而非 GitHub MCP 的 push_files）
   - ✅ 支持推送多个提交（包括版本管理提交）

4. **验证推送成功**：
   ```
   mcp__github__list_commits({
     owner: "<owner>",
     repo: "<repo>",
     sha: "<branch>"
   })
   ```
   - 检查最新提交哈希是否匹配
   - 确认推送成功

5. **可选：创建 PR**：
   - 如果当前分支不是 main/master，询问是否创建 PR
   - 使用 `mcp__github__create_pull_request` 创建 PR
   - 自动生成 PR 标题和描述

6. **降级方案**：
   - GitHub MCP 不可用 → 仅使用 `git push`，跳过验证
   - 推送失败 → 提示用户检查权限和网络

### 🧹 阶段 9：归档与清理

`[模式：清理]`

1. **归档提交记录**：
   ```
   mcp______ji({
     action: "记忆",
     category: "context",
     content: "提交记录|哈希:<hash>|类型:<type>|范围:<scope>|版本:<version>|文件数:<N>"
   })
   ```

2. **清理临时文件**（如有）：
   - 删除 `.git/COMMIT_EDITMSG.bak`
   - 清理其他临时文件

3. **生成提交摘要**：
   - 通过 `mcp______zhi` 展示最终摘要
   - 包含：提交哈希、推送状态、版本号更新（如有）、下一步建议

---

## Type 与 Emoji 映射

| Emoji | Type | 说明 |
|-------|------|------|
| ✨ | `feat` | 新增功能 |
| 🐛 | `fix` | 缺陷修复 |
| 📝 | `docs` | 文档更新 |
| 🎨 | `style` | 代码格式 |
| ♻️ | `refactor` | 重构 |
| ⚡️ | `perf` | 性能优化 |
| ✅ | `test` | 测试相关 |
| 🔧 | `chore` | 构建/工具 |
| 👷 | `ci` | CI/CD |
| ⏪️ | `revert` | 回滚 |

---

## 示例

```bash
# 基本提交
/commit

# 暂存所有并提交
/commit --all

# 带 emoji 提交
/commit --emoji

# 指定类型和作用域
/commit --scope ui --type feat --emoji

# 修补上次提交
/commit --amend --signoff
```

## 关键规则

1. **仅使用 Git** – 不调用包管理器
2. **尊重钩子** – 默认执行，`--no-verify` 可跳过
3. **不改源码** – 只读写 `.git/COMMIT_EDITMSG`
4. **原子提交** – 一次提交只做一件事
