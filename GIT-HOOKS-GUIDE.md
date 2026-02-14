# Git Hooks 智能提交自动化方案

## 概述

本方案实现了三层强制执行架构，确保所有 Git 提交通过 `/ccg:commit` 命令执行：

1. **Layer 1: CLAUDE.md 提示词规则** — 硬门禁，Claude Code 遵循规则自动路由到 `/ccg:commit`
2. **Layer 2: PreToolUse Hook 安全网** — deny bare git commit，防止 Layer 1 被绕过
3. **Layer 3: commit-agent 10 阶段工作流** — 完整的提交流程（安全检查、拆分建议、规范化提交信息）

此外，Git Native Hook (`prepare-commit-msg`) 在普通终端执行 `git commit` 时触发，提供自动生成提交信息的能力。

---

## 快速开始

### 1. 安装 Hook

```bash
npm run install-hooks
```

或者手动安装：

```bash
node hooks/install-git-hooks.cjs install
```

**输出示例**：
```
📦 安装 Git Hook...
✅ 复制 hook: .git/hooks/prepare-commit-msg
✅ 设置可执行权限
✅ Git Hook 安装成功！

📌 下次执行 git commit 时会自动生成 Conventional Commit 格式的提交信息
```

### 2. 验证安装

```bash
npm run verify-hooks
```

**输出示例**：
```
✅ Git Hook 已正确安装
```

### 3. 正常使用 Git Commit

#### 在普通终端中：

```bash
git add <files>
git commit
```

此时会自动生成提交信息，并打开编辑器让您审核和修改：

```
✨ feat(hooks): 新增 Git hooks 自动化提交
变更详情:
- 新增: ccg-commit-msg-generator.cjs, ccg-commit-interceptor.cjs, install-git-hooks.cjs
- 修改: settings.json, package.json

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

# 请输入提交信息。以 '#' 开头的行将被忽略。
```

您可以修改此信息后保存并退出编辑器，即可完成提交。

#### 在 Claude Code 中：

```bash
git commit
```

Claude Code 的 PreToolUse hook 会自动拦截此命令，生成提交信息，并修改为：

```bash
git commit -F .git/COMMIT_EDITMSG
```

执行结果与普通终端相同。

---

## 工作原理

### 架构图

```
┌─────────────────────────────────────────────────────┐
│                  三层强制执行架构                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Layer 1: CLAUDE.md 提示词规则                       │
│  ├─ "git commit 必须通过 /ccg:commit"               │
│  └─ Claude Code 遵循规则 -> 自动路由到 /ccg:commit   │
│           │                                         │
│           v                                         │
│  Layer 2: PreToolUse Hook 安全网                     │
│  ├─ deny bare git commit + reason                   │
│  ├─ 白名单: -F（commit-agent）/ --no-verify         │
│  └─ 防止 Layer 1 规则被绕过                          │
│           │                                         │
│           v                                         │
│  Layer 3: commit-agent 10 阶段工作流                 │
│  ├─ 三术 MCP + .gitignore + 安全检查                 │
│  ├─ git commit -F .git/COMMIT_EDITMSG               │
│  └─ (白名单绕过 Layer 2)                             │
│           │                                         │
│           v                                         │
│  Git Native Hook: prepare-commit-msg                │
│  ├─ 检测 $CLAUDE_PROJECT_DIR -> 跳过                 │
│  └─ (Layer 3 已处理)                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 用途 | 说明 |
|------|------|------|
| `hooks/ccg-commit-msg-generator.cjs` | 提交信息生成引擎 | 分析 staged 改动，推断 type、scope、生成 subject 和 body |
| `hooks/ccg-commit-interceptor.cjs` | Claude Code 拦截器 | PreToolUse hook 安全网，deny bare git commit 并引导使用 /ccg:commit |
| `hooks/install-git-hooks.cjs` | 安装工具 | 安装/卸载/验证 Git hook |
| `prepare-commit-msg` | Git hook 入口 | 在 .git/hooks 中执行，调用提交信息生成引擎 |
| `.ccg/commit-config.json` | 配置文件 | 提交规范配置、emoji 映射、scope 映射等 |
| `settings.json` | Claude Code 配置 | 注册 PreToolUse hook |

---

## 配置说明

### `.ccg/commit-config.json`

```json
{
  "emoji": true,                    // 是否启用 emoji 前缀
  "language": "zh-CN",              // 提交信息语言（简体中文）
  "format": "conventional",         // 提交格式（Conventional Commits）
  "coAuthoredBy": "Claude Opus 4.6 <noreply@anthropic.com>",  // Co-Authored-By footer
  "scopeMap": {
    "hooks/": "hooks",              // 文件路径 → scope 映射
    "commands/": "ccg",
    "src/components/": "ui",
    // ...
  },
  "typeEmojis": {
    "feat": "✨",                   // type → emoji 映射
    "fix": "🐛",
    "docs": "📝",
    // ...
  },
  "excludePatterns": [".env", "*.key"],  // 排除的文件模式
  "rules": {
    "maxSubjectLength": 50,
    "requireBody": false,
    "requireFooter": true,
    "requiredFooter": "Co-Authored-By"
  }
}
```

### Type 和 Emoji 映射

| Type | Emoji | 说明 |
|------|-------|------|
| feat | ✨ | 新增功能 |
| fix | 🐛 | 缺陷修复 |
| docs | 📝 | 文档更新 |
| style | 🎨 | 代码格式（不影响功能） |
| refactor | ♻️ | 重构代码 |
| perf | ⚡ | 性能优化 |
| test | ✅ | 测试相关 |
| chore | 🔧 | 构建/工具/配置 |
| ci | 👷 | CI/CD 相关 |
| revert | ⏪ | 回滚变更 |

---

## 提交信息生成规则

### 1. Type 推断

根据改动文件的扩展名和路径推断 type：

- `*.md`、`docs/` → `docs`
- `*.test.*`、`__tests__/` → `test`
- `*.css`、`*.scss` → `style`
- GitHub workflow、CI 配置 → `ci`
- `*.json`、`*.yaml` → `chore`
- 全是新增文件 → `feat`
- 修改文件为主 → `fix` / `refactor`

### 2. Scope 推断

根据文件路径匹配 scope，如：

- `hooks/ccg-commit-msg-generator.cjs` → scope: `hooks`
- `commands/ccg/commit.md` → scope: `ccg`
- `src/components/Button.tsx` → scope: `ui`

### 3. Subject 生成

简体中文，祈使语态，最多 50 个字：

```
新增 Git hooks 自动化提交
修复 commit 命令处理逻辑
更新文档 (3 个文件)
```

### 4. Body 生成

列出变更的文件：

```
变更详情:
- 新增: ccg-commit-msg-generator.cjs
- 修改: settings.json, package.json
- 删除: old-hook.js
```

### 5. Footer

必须包含 `Co-Authored-By`：

```
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## 常见使用场景

### 场景 1：普通的 git commit（最常见）

```bash
git add src/components/Button.tsx
git commit
# 自动生成: ✨ feat(ui): 新增 Button 组件
# 编辑器打开，用户审核
# 保存并提交
```

### 场景 2：使用 -m 参数提交（被拦截）

```bash
git commit -m "custom message"
# Claude Code 内：PreToolUse hook 检测到 bare git commit → deny → 引导使用 /ccg:commit
# 普通终端：正常执行（PreToolUse hook 不生效）
```

### 场景 3：跳过所有 hook（包括自动生成）

```bash
git commit --no-verify
# Hook 不执行，打开编辑器让用户手写
```

### 场景 4：修补上次提交（被拦截）

```bash
git commit --amend
# Claude Code 内：PreToolUse hook 检测到 bare git commit → deny → 引导使用 /ccg:commit
# 普通终端：正常执行（PreToolUse hook 不生效）
```

### 场景 5：使用 `/ccg:commit` 命令（commit-agent）

```bash
/ccg:commit
# commit-agent 会：
# 1. 分析改动
# 2. 生成详细提交信息
# 3. 执行 git commit -F .git/COMMIT_EDITMSG
# 4. PreToolUse hook 检测到 -F 参数，不干介
# 5. Git hook 检测到 $CLAUDE_PROJECT_DIR，不干预
```

### 场景 6：在 Claude Code 中直接执行 git commit（被拦截）

```bash
# Claude Code Bash 工具执行
git commit

# PreToolUse hook 拦截，检测到 bare git commit（无白名单参数）
# 返回 deny + reason，引导使用 /ccg:commit
# Claude Code 显示拦截信息，用户需使用 /ccg:commit 重新发起
```

### 场景 7：Layer 1 生效（正常路径）

```bash
# 用户说"提交代码"
# Claude Code 遵循 CLAUDE.md 硬门禁规则
# 自动路由到 /ccg:commit
# commit-agent 10 阶段工作流执行
# 提交完成
```

### 场景 8：Layer 2 生效（异常路径）

```bash
# Claude Code 违反 CLAUDE.md 规则，直接执行 bare git commit
# PreToolUse hook 拦截 → deny + reason
# reason 包含 /ccg:commit 引导信息
# Claude Code 重新路由到 /ccg:commit
```

---

## 卸载 Hook

### 通过 npm script：

```bash
npm run uninstall-hooks
```

### 或手动卸载：

```bash
node hooks/install-git-hooks.cjs uninstall
```

**说明**：如果之前有备份，会自动恢复。

---

## 故障排查

### 问题 1：Hook 未执行

**检查步骤**：

1. 验证安装：`npm run verify-hooks`
2. 检查 `node` 是否在 PATH 中：`which node` / `node --version`
3. 检查文件权限：`ls -la .git/hooks/prepare-commit-msg`
4. 查看 Git 日志：`git commit -v`（显示更多信息）

### 问题 2：提交信息不符合预期

**检查步骤**：

1. 查看配置：`cat .ccg/commit-config.json`
2. 修改配置中的 `scopeMap` 或 `typeEmojis`
3. 重新执行 `git commit`

### 问题 3：PreToolUse hook 未在 Claude Code 中工作

**检查步骤**：

1. 重新加载 Claude Code 配置：关闭并重新打开项目
2. 验证 `settings.json` 中的 `PreToolUse` 配置正确
3. 检查脚本路径是否正确（使用绝对路径）

### 问题 4：与 `/ccg:commit` 冲突

**说明**：不会有冲突。

- `/ccg:commit` 使用 `git commit -F .git/COMMIT_EDITMSG`
- Git hook 和 PreToolUse hook 都会检测到 `-F` 参数并跳过
- 最终由 `/ccg:commit` 生成的提交信息优先

---

## 技术细节

### 避免冲突的设计

三层强制执行架构（CLAUDE.md 规则、PreToolUse hook、commit-agent）的协调方式：

```
commit-agent（/ccg:commit）执行流程：
  ├─ 阶段 5：生成提交信息 → 写入 .git/COMMIT_EDITMSG
  ├─ 阶段 6：执行 git commit -F .git/COMMIT_EDITMSG
  │          │
  │          ├─ PreToolUse hook 收到 -F 参数 → 白名单命中 → allow
  │          │
  │          └─ Git prepare-commit-msg hook 收到 $CLAUDE_PROJECT_DIR → 跳过
  │
  └─ 最终：commit-agent 生成的提交信息被使用

Claude Code 内 bare git commit（违反规则）：
  ├─ Layer 1：CLAUDE.md 硬门禁 → 应自动路由到 /ccg:commit
  │
  └─ Layer 2（安全网）：PreToolUse hook → deny + reason → 引导 /ccg:commit

用户手动 git commit（普通终端）：
  └─ Git prepare-commit-msg hook → 生成提交信息 → 编辑器
```

### Hook 优先级

1. **commit-agent**（`/ccg:commit` 命令）：最高优先级，唯一合法的 Claude Code 内提交路径
   - 10 阶段工作流：安全检查、拆分建议、规范化提交信息
   - 使用 `git commit -F .git/COMMIT_EDITMSG`（白名单绕过 Layer 2）

2. **PreToolUse hook**（Claude Code 内安全网）：deny 非法路径
   - 拦截所有 bare git commit 命令
   - 返回 deny + reason，引导使用 `/ccg:commit`
   - 白名单：`-F`（commit-agent）、`--no-verify`（用户跳过）

3. **Git prepare-commit-msg hook**（普通终端）：自动生成提交信息
   - 在 Git 打开编辑器前执行
   - 检测 `$CLAUDE_PROJECT_DIR` 时跳过（避免与 commit-agent 冲突）

---

## 配置自定义

### 修改 emoji 映射

编辑 `.ccg/commit-config.json`：

```json
{
  "typeEmojis": {
    "feat": "🚀",  // 改为火箭
    "fix": "🔨",   // 改为锤子
  }
}
```

### 添加新的 scope 映射

```json
{
  "scopeMap": {
    "src/mobile/": "mobile",
    "src/web/": "web"
  }
}
```

### 修改提交人签名

```json
{
  "coAuthoredBy": "Your Name <your.email@example.com>"
}
```

---

## npm Scripts 总结

```bash
npm run install-hooks      # 安装 Git hook
npm run uninstall-hooks    # 卸载 Git hook
npm run verify-hooks       # 验证 hook 安装状态
```

---

## 测试

运行单元测试验证所有配置：

```bash
node hooks/ccg-commit-msg-generator.spec.cjs
```

**输出示例**：
```
🧪 运行 15 个测试...

✅ 配置文件存在
✅ 生成器脚本存在
✅ 拦截器脚本存在
✅ 安装脚本存在
✅ settings.json 包含 PreToolUse hook
...

📊 结果: 15 通过, 0 失败
```

---

## 后续优化方向

Phase 2 可考虑的增强：

- [ ] 支持 `commit-msg` hook 进行格式校验（拒绝不符合规范的信息）
- [ ] 支持 `.commitlintrc` 标准配置文件
- [ ] 集成 AI 模型生成更智能的提交信息（通过 Claude Code API）
- [ ] 添加 `git log` 分析学习项目历史提交风格
- [ ] 支持多语言提交信息（根据项目设置切换语言）
- [ ] 集成 GitHub API 自动关联相关 Issue

---

## 支持

如遇问题，请：

1. 运行 `npm run verify-hooks` 检查 hook 状态
2. 查看故障排查部分
3. 检查 `.ccg/commit-config.json` 配置是否正确
4. 查看相关脚本的源码（有详细注释）

祝您使用愉快！🚀
