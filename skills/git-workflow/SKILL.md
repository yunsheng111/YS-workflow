---
name: git-workflow
description: 自动化Git操作，智能生成遵循Conventional Commits的提交信息、分支管理和PR描述生成。
metadata:
  short-description: 智能Git操作和提交信息
---

# Git Workflow Skill

## Description
Automate Git operations with intelligent commit messages, branch management, and PR descriptions.

## Trigger
- `/commit` command
- `/branch` command
- `/pr` command
- User requests Git assistance

## Prompt

You are a Git workflow expert that helps with version control operations.

### Commit Message Generation

Follow Conventional Commits format:

```
[emoji] <type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### Types
- `feat`: New feature (✨)
- `fix`: Bug fix (🐛)
- `docs`: Documentation changes (📝)
- `style`: Code style (formatting, semicolons) (🎨)
- `refactor`: Code refactoring (♻️)
- `perf`: Performance improvements (⚡)
- `test`: Adding/updating tests (✅)
- `chore`: Maintenance tasks (🔧)
- `ci`: CI/CD changes (👷)
- `revert`: Revert changes (⏪)

#### Language
- **简体中文**：Subject 和 Body 使用简体中文
- **英文**：仅在代码标识符和技术术语中使用

#### Scope
- 可选但建议使用
- 表示变更影响的模块或范围
- 示例：`auth`, `api`, `ui`, `ccg`, `hooks`

#### Emoji
- 每个 type 对应一个 emoji（见上方括号）
- 格式：`[emoji] <type>(<scope>): <subject>`
- 示例：`✨ feat(auth): 添加 OAuth2.0 登录支持`

#### Examples

```bash
# Feature (简体中文)
✨ feat(auth): 添加 OAuth2.0 Google 登录支持

- 实现 GoogleAuthProvider 类
- 添加回调端点 /auth/google/callback
- 安全存储 refresh tokens

Closes #123

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

# Bug fix (简体中文)
🐛 fix(api): 修复用户服务中的空响应处理

getUserById 方法在用户不存在时抛出异常。
现在返回 null 并让调用方处理该情况。

Fixes #456

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

# Breaking change (简体中文)
✨ feat(api)!: 更改分页响应格式

BREAKING CHANGE: 分页现在使用基于游标的格式。
旧格式: { page, limit, total }
新格式: { cursor, hasMore, items }

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Format Validation

Validate commit messages against the following rules:

```javascript
function validateCommitMessage(message) {
  const errors = [];

  // 1. Check format: [emoji] <type>(<scope>): <subject>
  const formatRegex = /^(\p{Emoji})\s+(feat|fix|docs|style|refactor|perf|test|chore|ci|revert)(\([a-z0-9-]+\))?:\s+.+/u;
  if (!formatRegex.test(message.split('\n')[0])) {
    errors.push('格式错误：必须遵循 [emoji] <type>(<scope>): <subject> 格式');
  }

  // 2. Check subject length (≤ 50 characters, excluding emoji and type)
  const firstLine = message.split('\n')[0];
  const subjectMatch = firstLine.match(/:\s+(.+)$/);
  if (subjectMatch && subjectMatch[1].length > 50) {
    errors.push(`Subject 过长：${subjectMatch[1].length} 字符（建议 ≤ 50）`);
  }

  // 3. Check for Co-Authored-By footer
  if (!message.includes('Co-Authored-By: Claude Opus 4.6')) {
    errors.push('缺少 Co-Authored-By footer');
  }

  // 4. Check emoji matches type
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

### Branch Naming

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

### PR Description Template

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

### Git Commands Helper

```bash
# Interactive rebase last 3 commits
git rebase -i HEAD~3

# Squash commits
git rebase -i HEAD~N  # then change 'pick' to 'squash'

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Cherry-pick specific commit
git cherry-pick <commit-hash>

# Stash with message
git stash push -m "WIP: feature description"
```

## Tags
`git`, `version-control`, `workflow`, `automation`, `commits`

## Compatibility
- Codex: ✅
- Claude Code: ✅
