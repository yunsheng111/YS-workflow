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

---

## 执行工作流

### 🔍 阶段 1：仓库校验

`[模式：检查]`

1. 验证 Git 仓库状态
2. 检测 rebase/merge 冲突
3. 读取当前分支/HEAD 状态

### 📋 阶段 2：改动检测

`[模式：分析]`

1. 获取已暂存与未暂存改动
2. 若暂存区为空：
   - `--all` → 执行 `git add -A`
   - 否则提示选择

### ✂️ 阶段 3：拆分建议

`[模式：建议]`

按以下维度聚类：
- 关注点（源代码 vs 文档/测试）
- 文件模式（不同目录/包）
- 改动类型（新增 vs 删除）

若检测到多组独立变更（>300 行 / 跨多个顶级目录），建议拆分。

### ✍️ 阶段 4：生成提交信息（使用三术 zhi 确认）

`[模式：生成]`

**格式**：`[emoji] <type>(<scope>): <subject>`

- 首行 ≤ 72 字符
- 祈使语气
- 消息体：动机、实现要点、影响范围

**语言**：根据最近 50 次提交判断中文/英文

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
- 「确认提交」→ 进入阶段 5 执行提交
- 「修改信息」→ 使用用户修改后的提交信息
- 「查看详细 diff」→ 执行 `git diff --staged` 展示完整变更
- 「取消」→ 终止当前回复

### ✅ 阶段 5：执行提交

`[模式：执行]`

```bash
git commit [-S] [--no-verify] [-s] -F .git/COMMIT_EDITMSG
```

### 🚀 阶段 6：GitHub 推送（可选）

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

**GitHub 推送流程**：

1. **检测仓库信息**：
   ```bash
   git remote get-url origin
   # 解析 owner 和 repo
   ```

2. **获取当前分支**：
   ```bash
   git branch --show-current
   ```

3. **推送文件到 GitHub**：
   ```
   mcp__github__push_files({
     owner: "<owner>",
     repo: "<repo>",
     branch: "<current-branch>",
     files: [<变更文件列表>],
     message: "<提交信息>"
   })
   ```

4. **降级方案**：
   - GitHub MCP 不可用 → 使用 `git push origin <branch>`
   - 推送失败 → 提示用户检查权限和网络

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
