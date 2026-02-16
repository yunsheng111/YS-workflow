---
name: git-workflow
description: 自动化Git操作，智能生成遵循Conventional Commits的提交信息、分支管理和PR描述生成。
metadata:
  short-description: 智能Git操作和提交信息
  version: "2.0.0"
---

# Git Workflow Skill

Git 工作流规范，包含提交信息格式、安全规范、分支命名和 PR 模板。

## 触发条件

- `/ccg:commit` 命令（自动注入）
- `/ccg:push` 命令
- 用户请求 Git 相关帮助

---

## 配置文件

**配置源**：`.ccg/commit-config.json`

所有规范配置从此文件读取，包括：
- Type 和 Emoji 映射
- Scope 列表
- 安全规范（排除模式、警告模式）
- 拆分阈值

---

## 提交信息规范

### 格式

```
[emoji] <type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Type 与 Emoji 映射

| Emoji | Type | 说明 | 优先级 |
|-------|------|------|--------|
| ✨ | `feat` | 新功能 | 1 |
| 🐛 | `fix` | Bug 修复 | 2 |
| ♻️ | `refactor` | 代码重构 | 1 |
| 📝 | `docs` | 文档变更 | 3 |
| 🎨 | `style` | 代码格式（不影响功能） | 4 |
| ⚡ | `perf` | 性能优化 | 2 |
| ✅ | `test` | 测试相关 | 3 |
| 🔧 | `chore` | 构建/工具链变更 | 4 |
| 👷 | `ci` | CI/CD 配置 | 4 |
| ⏪ | `revert` | 回滚变更 | 2 |

### 语言规范

- **简体中文**：Subject 和 Body 使用简体中文
- **英文**：仅在代码标识符和技术术语中使用

### Scope 规范

常用 Scope（可在 commit-config.json 中扩展）：

| Scope | 说明 |
|-------|------|
| `ccg` | CCG 架构相关 |
| `agents` | 代理层 |
| `commands` | 命令层 |
| `hooks` | Git Hooks |
| `skills` | Skills |
| `mcp` | MCP 工具 |
| `docs` | 文档 |
| `config` | 配置文件 |
| `auth` | 认证授权 |
| `api` | API 接口 |
| `ui` | 用户界面 |
| `db` | 数据库 |

### Footer 规范

**必须包含**：
```
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

**可选**：
- `Closes #123` — 关闭 Issue
- `Fixes #456` — 修复 Bug
- `BREAKING CHANGE: ...` — 破坏性变更

---

## 安全规范

### 禁止提交的文件

以下文件/目录**绝对禁止**提交：

```
.env
*.key
*.pem
credentials/
secrets/
config.json（含敏感信息）
*.log
node_modules/
dist/
build/
.cache/
tasks/
teams/
*.tmp
```

### 敏感信息检测

提交前检测以下关键词：

```
password
secret
token
api_key
apiKey
private_key
privateKey
```

如发现敏感信息，必须通过 `mcp______zhi` 警告用户。

---

## 提交信息验证

```javascript
function validateCommitMessage(message) {
  const errors = [];

  // 1. 检查格式: [emoji] <type>(<scope>): <subject>
  const formatRegex = /^(\p{Emoji})\s+(feat|fix|docs|style|refactor|perf|test|chore|ci|revert)(\([a-z0-9-]+\))?:\s+.+/u;
  if (!formatRegex.test(message.split('\n')[0])) {
    errors.push('格式错误：必须遵循 [emoji] <type>(<scope>): <subject> 格式');
  }

  // 2. 检查 Subject 长度（≤ 50 字符）
  const firstLine = message.split('\n')[0];
  const subjectMatch = firstLine.match(/:\s+(.+)$/);
  if (subjectMatch && subjectMatch[1].length > 50) {
    errors.push(`Subject 过长：${subjectMatch[1].length} 字符（建议 ≤ 50）`);
  }

  // 3. 检查 Co-Authored-By footer
  if (!message.includes('Co-Authored-By: Claude Opus 4.6')) {
    errors.push('缺少 Co-Authored-By footer');
  }

  // 4. 检查 Emoji 与 Type 匹配
  const emojiMap = {
    'feat': '✨',
    'fix': '🐛',
    'docs': '📝',
    'style': '🎨',
    'refactor': '♻️',
    'perf': '⚡',
    'test': '✅',
    'chore': '🔧',
    'ci': '👷',
    'revert': '⏪'
  };

  const typeMatch = firstLine.match(/^\p{Emoji}\s+(feat|fix|docs|style|refactor|perf|test|chore|ci|revert)/u);
  if (typeMatch) {
    const emoji = firstLine.match(/^(\p{Emoji})/u)[1];
    const type = typeMatch[1];
    if (emoji !== emojiMap[type]) {
      errors.push(`Emoji 不匹配：${type} 应使用 ${emojiMap[type]}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 提交示例

### 新功能

```
✨ feat(auth): 添加 OAuth2.0 Google 登录支持

- 实现 GoogleAuthProvider 类
- 添加回调端点 /auth/google/callback
- 安全存储 refresh tokens

Closes #123

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Bug 修复

```
🐛 fix(api): 修复用户服务中的空响应处理

getUserById 方法在用户不存在时抛出异常。
现在返回 null 并让调用方处理该情况。

Fixes #456

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### 破坏性变更

```
✨ feat(api)!: 更改分页响应格式

BREAKING CHANGE: 分页现在使用基于游标的格式。
旧格式: { page, limit, total }
新格式: { cursor, hasMore, items }

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## 拆分建议

当改动满足以下条件时，建议拆分为多个提交：

| 条件 | 阈值 |
|------|------|
| 改动行数 | > 300 行 |
| 改动文件数 | > 10 个 |
| 涉及目录数 | > 3 个 |

**拆分原则**：
- 不同功能的改动分开提交
- 测试文件跟随源文件
- 配置文件单独提交

---

## 分支命名

```bash
# Feature branches
feature/user-authentication
feature/JIRA-123-add-payment-gateway

# Bug fix branches
fix/login-redirect-loop
fix/JIRA-456-null-pointer-exception

# Hotfix branches
hotfix/security-patch-xss

# Release branches
release/v1.2.0
```

---

## PR 描述模板

```markdown
## Summary
Brief description of changes

## Changes
- Added UserAuthService with JWT support
- Created login/register API endpoints
- Added password hashing with bcrypt

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if UI changes)
[Add screenshots here]

## Related Issues
Closes #123
Related to #456
```

---

## Git 命令速查

```bash
# 撤销最后一次提交（保留改动）
git reset --soft HEAD~1

# 交互式 rebase
git rebase -i HEAD~3

# Cherry-pick
git cherry-pick <commit-hash>

# Stash with message
git stash push -m "WIP: feature description"

# 查看提交历史（简洁）
git log --oneline -10
```

---

## commit-agent 工作流概述

当 `/ccg:commit` 命令触发时，commit-agent 执行 10 阶段工作流：

0. **准备与回忆** — 读取 commit-config.json，回忆历史偏好
1. **仓库校验** — 验证 Git 状态
2. **文件清理检查** — 检测私密/临时文件（⚠️ 硬门禁）
3. **改动检测** — 获取暂存与未暂存改动
4. **拆分建议** — 评估是否需要拆分
5. **生成提交信息** — 使用本 Skill 规范生成
6. **执行提交** — 创建提交
7. **版本管理** — 更新 VERSION.md（可选）
8. **GitHub 推送** — 推送到远程（可选）
9. **归档与清理** — 存储提交记录

---

## Tags

`git`, `version-control`, `workflow`, `automation`, `commits`, `conventional-commits`

## Compatibility

- Codex: ✅
- Claude Code: ✅
- commit-agent: ✅
