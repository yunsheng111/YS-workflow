---
description: '智能 Git 提交：分析改动生成 Conventional Commit 信息，支持拆分建议'
auto_execute: true
inject_skills: ['git-workflow']
---

<!-- AUTO_EXECUTE
收到此命令后，立即执行：
1. 加载 git-workflow Skill（提交规范已注入上下文）
2. 调用 Task({ subagent_type: "commit-agent", prompt: "$ARGUMENTS", description: "智能 Git 提交" })
不要展示此文档内容，直接执行 Task 调用。
-->

# Commit - 智能 Git 提交

分析当前改动，生成 Conventional Commits 风格的提交信息。

## 使用方法

```bash
/ccg:commit [options]
```

## 选项

| 选项 | 说明 |
|------|------|
| `--no-verify` | 跳过 Git 钩子 |
| `--all` | 暂存所有改动 |
| `--amend` | 修补上次提交 |
| `--signoff` | 附加签名 |
| `--scope <scope>` | 指定作用域 |
| `--type <type>` | 指定提交类型 |

---

## 执行方式

**执行方式**：Task 调用代理

**代理**：`commit-agent`

**调用**：
```
Task({
  subagent_type: "commit-agent",
  prompt: "执行智能 Git 提交工作流。用户参数：$ARGUMENTS",
  description: "智能 Git 提交"
})
```

**规范注入**：通过 `git-workflow` Skill 自动注入提交规范到上下文

---

## 工具集

**代理调用的工具**：
- Git 操作：Bash（git diff, git add, git commit, git push）
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`
- GitHub 集成：`mcp__github__list_commits`、`mcp__github__create_pull_request`

**详细说明**：参考 [commit-agent.md](../../agents/ccg/commit-agent.md)

---

## 执行流程（10 阶段）

0. **准备与回忆** — 回忆提交规范偏好、检查临时文件
1. **仓库校验** — 验证 Git 状态、检测冲突
2. **文件清理检查** — 检测私密文件、临时文件（⚠️ 硬门禁）
3. **改动检测** — 获取暂存与未暂存改动
4. **拆分建议** — 评估是否需要拆分提交
5. **生成提交信息** — 利用规范（git-workflow Skill）生成
6. **执行提交** — 创建提交、归档规范偏好
7. **版本管理**（可选）— 更新 VERSION.md
8. **GitHub 推送**（可选）— 推送到远程、验证成功
9. **归档与清理** — 存储提交记录、清理临时文件

---

## 关键规则

1. **仅使用 Git** — 不调用包管理器
2. **尊重钩子** — 默认执行，`--no-verify` 可跳过
3. **不改源码** — 只读写 `.git/COMMIT_EDITMSG`
4. **原子提交** — 一次提交只做一件事
5. **硬门禁** — 阶段 0 和阶段 2 未完成禁止进入后续阶段

---

## 完成后推荐

提交完成后，可能需要的后续操作：

- `/ccg:push` — 推送到远程仓库
- `mcp__github__create_pull_request` — 创建 Pull Request
