---
description: '智能 Git 推送：审查检测、智能提交拆分、规范验证、远程配置'
---

# Push - 智能 Git 推送

安全推送代码到远程仓库，包含审查检测、智能提交拆分、规范验证和远程仓库配置。

## 使用方法

```bash
/ccg:push
```

---

## 执行方式

**执行方式**：Task 调用代理

**代理**：`push-agent`

**调用**：
```
Task({
  subagent_type: "push-agent",
  prompt: "执行智能 Git 推送流程：审查检测 → 提交拆分 → 规范验证 → 远程配置 → 推送",
  description: "智能 Git 推送"
})
```

---

## 工具集

**代理调用的工具**：
- 用户确认：`mcp______zhi`
- 记忆查询：`mcp______ji`
- 代码检索：`mcp__ace-tool__search_context`
- GitHub 操作：`mcp__github__create_repository`
- Git 操作：Bash（`git status`、`git log`、`git push`、`git worktree`）
- 提交命令：Skill `/ccg:commit`

**详细说明**：参考 [push-agent.md](../../agents/ccg/push-agent.md)

---

## 执行流程（5 阶段）

1. **审查状态检测** — 检查改动是否已通过审查
2. **本地提交检测与智能拆分** — 检测未提交改动，智能分组并拆分提交
3. **提交规范审查** — 验证提交信息是否符合 Conventional Commits 规范
4. **远程仓库检测** — 检查远程仓库配置，未配置则引导用户设置
5. **执行推送** — 推送到远程仓库，失败时提供诊断和修复建议

---

## 关键规则

1. **审查前置** — 推送前必须完成审查（可选跳过，但需用户确认）
2. **智能拆分** — 自动识别不同功能的改动，建议拆分为多个提交
3. **规范强制** — 所有提交必须符合 Conventional Commits 规范
4. **用户确认** — 每个阶段都通过 `mcp______zhi` 确认
5. **Worktree 隔离** — 支持多 worktree 场景，避免提交混淆

---

## 智能拆分算法

**分组规则**（优先级从高到低）：

1. **显式模块标识**：文件路径包含模块名（如 `auth/login`、`auth/register`）
2. **功能关联性**：使用 `mcp__ace-tool__search_context` 分析文件间依赖
3. **文件类型**：配置文件单独分组，测试文件跟随源文件
4. **Git 历史**：参考历史提交记录

**特殊处理**：
- 改动文件 > 20 个，建议用户先手动整理
- 无法明确分组，提示用户手动指定

---

## 示例场景

### 场景 1：多功能改动

```bash
# 改动文件
src/auth/login.ts          (新增 120 行)
src/auth/register.ts       (新增 150 行)
tests/auth/login.spec.ts   (新增 80 行)
tests/auth/register.spec.ts (新增 90 行)
.env.example               (修改 5 行)
```

**执行流程**：
1. 智能分组为 3 个提交（登录、注册、配置）
2. 用户确认拆分方案
3. 调用 `/ccg:commit` 3 次，每次提交一个分组
4. 验证 3 个提交都符合规范
5. 推送 3 个提交到远程

### 场景 2：无远程仓库

```bash
# 当前状态
git remote -v  # 无输出
```

**执行流程**：
1. 检测到无远程仓库
2. 通过 `mcp______zhi` 询问用户：
   - 提供远程仓库地址
   - 或使用 `mcp__github__create_repository` 新建仓库
3. 配置远程仓库
4. 推送到远程

---

## 降级策略

| 工具不可用 | 降级方案 |
|-----------|---------|
| `mcp__ace-tool__search_context` | 使用 `mcp______sou` → Grep/Glob |
| `mcp______ji` | 读取 `.ccg/commit-config.json` |
| `mcp__github__create_repository` | 提示用户手动创建仓库 |
| `/ccg:commit` | 使用 `git commit` 直接提交 |

---

## 完成后推荐

推送完成后，可能需要的后续操作：

- `/ccg:workflow` — 继续开发新功能
- `mcp__github__create_pull_request` — 创建 Pull Request

---

## 注意事项

1. **推送前必须完成审查**：默认检查审查报告，可选跳过但需用户确认
2. **多 worktree 支持**：自动检测当前 worktree，避免提交混淆
3. **提交拆分建议**：仅为建议，用户可选择合并或手动调整
4. **规范验证**：不符合规范的提交将被拒绝推送
5. **错误恢复**：推送失败时提供清晰的错误提示和修复建议
