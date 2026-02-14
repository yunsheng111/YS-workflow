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

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`commit-agent`

**调用**：
```
Task({
  subagent_type: "commit-agent",
  prompt: "执行智能 Git 提交工作流。用户参数：$ARGUMENTS\n\n【硬门禁】阶段 0（回忆偏好）和阶段 2（安全检查）未完成禁止进入后续阶段",
  description: "智能 Git 提交"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- Git 操作：Bash（git diff, git add, git commit, git push）
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`
- GitHub 集成：`mcp__github__list_commits`、`mcp__github__create_pull_request`

**详细说明**：参考 [commit-agent.md](../../agents/ccg/commit-agent.md)

---

## 执行流程（概述）

commit-agent 将执行以下 10 阶段工作流：

0. **准备与回忆** — 回忆提交规范偏好、检查临时文件
1. **仓库校验** — 验证 Git 状态、检测冲突
2. **文件清理检查** — 检测私密文件、临时文件（⚠️ 硬门禁）
3. **改动检测** — 获取暂存与未暂存改动
4. **拆分建议** — 评估是否需要拆分提交
5. **生成提交信息** — 利用三术记忆、判断版本号更新
6. **执行提交** — 创建提交、归档规范偏好
7. **版本管理**（可选）— 更新 VERSION.md
8. **GitHub 推送**（可选）— 推送到远程、验证成功
9. **归档与清理** — 存储提交记录、清理临时文件

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

---

## 关键规则

1. **仅使用 Git** — 不调用包管理器
2. **尊重钩子** — 默认执行，`--no-verify` 可跳过
3. **不改源码** — 只读写 `.git/COMMIT_EDITMSG`
4. **原子提交** — 一次提交只做一件事
5. **硬门禁** — 阶段 0 和阶段 2 未完成禁止进入后续阶段
