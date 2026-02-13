# Team Research: Claude Code CLI 功能全景与 Team 协作深度调研

## 增强后的需求

调研 Claude Code CLI（Anthropic 官方命令行代理编码工具）的最新功能全景，重点深入 Team 协作相关能力，产出完整功能文档。

- **全量功能扫描**：核心功能模块分类梳理
- **重点深入**：Agent Teams、Subagents、会话管理、权限控制等团队协作能力
- **信息来源**：官方文档 (code.claude.com)、Anthropic 博客、GitHub 仓库、npm 包

---

## 一、Claude Code CLI 概览

Claude Code 是 Anthropic 推出的**代理式编码工具**，可在终端中直接阅读代码库、编辑文件、运行命令并与开发工具集成。当前版本 **v2.1.39**，由 **Claude Opus 4.6** 模型驱动。

### 运行环境

| 环境 | 说明 |
|------|------|
| **Terminal CLI** | 完整功能的命令行工具，`claude` 命令启动 |
| **VS Code 扩展** | 内联 diff、@-mentions、计划审查、对话历史 |
| **JetBrains 插件** | IntelliJ/PyCharm/WebStorm 等 IDE 集成 |
| **Desktop App** | 独立桌面应用，可视化 diff 审查、多会话并行 |
| **Web** | 浏览器端运行，无需本地环境，支持 iOS App |
| **Slack** | `@Claude` 直接在团队聊天中触发任务 |

### 安装方式

```bash
# macOS / Linux / WSL
curl -fsSL https://claude.ai/install.sh | bash

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex

# Homebrew (macOS)
brew install --cask claude-code

# WinGet (Windows)
winget install Anthropic.ClaudeCode
```

---

## 二、核心功能模块

### 2.1 交互式 REPL

启动 `claude` 进入交互会话，使用自然语言描述任务，Claude 自动规划、编写代码、执行验证。

**内置命令**：
- `/help` - 帮助
- `/compact` - 压缩上下文
- `/init` - 初始化 CLAUDE.md
- `/memory` - 管理记忆文件
- `/permissions` - 查看/管理权限
- `/hooks` - 管理钩子
- `/agents` - 管理子代理
- `/statusline` - 配置状态行
- `/add-dir` - 添加工作目录
- `/resume` - 恢复历史会话

### 2.2 Agent SDK（程序化运行）

CLI 通过 `-p` 标志支持非交互式程序化调用（原 headless 模式），同时提供 Python 和 TypeScript SDK 包。

```bash
# 基础用法
claude -p "What does the auth module do?"

# 结构化 JSON 输出
claude -p "Summarize this project" --output-format json

# 流式输出
claude -p "Explain recursion" --output-format stream-json --verbose

# JSON Schema 约束输出
claude -p "Extract function names" --output-format json --json-schema '{...}'

# 自动授权工具
claude -p "Run tests and fix failures" --allowedTools "Bash,Read,Edit"

# 继续最近会话
claude -p "Focus on DB queries" --continue

# 恢复特定会话
claude -p "Continue review" --resume "$session_id"

# 自定义系统提示
claude -p --append-system-prompt "You are a security engineer"
```

### 2.3 会话管理

| 功能 | 命令 | 说明 |
|------|------|------|
| 继续最近会话 | `claude --continue` / `claude -p --continue` | 恢复最近一次对话上下文 |
| 恢复指定会话 | `claude --resume <session_id>` | 通过 ID 恢复特定会话 |
| 交互式恢复 | `/resume` | 在 REPL 中选择历史会话 |
| 后台任务 | Web/Desktop 端支持 | 启动后可在移动端查看 |
| 会话传送 | `--teleport` | 在不同机器间迁移会话 |

### 2.4 记忆系统（Memory）

Claude Code 拥有两类持久化记忆：

#### Auto Memory（自动记忆）
Claude 自动保存项目模式、调试洞察、架构笔记和用户偏好。存储在 `~/.claude/projects/<project>/memory/` 目录。`MEMORY.md` 前 200 行在每次会话启动时加载。

```bash
# 强制开启
export CLAUDE_CODE_DISABLE_AUTO_MEMORY=0
# 强制关闭
export CLAUDE_CODE_DISABLE_AUTO_MEMORY=1
```

#### CLAUDE.md 文件（手动记忆）

| 记忆类型 | 路径 | 作用域 | 共享范围 |
|----------|------|--------|----------|
| **组织策略** | `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS) | 全组织 | 所有用户 |
| **项目记忆** | `./CLAUDE.md` 或 `./.claude/CLAUDE.md` | 当前项目 | 团队（版本控制） |
| **项目规则** | `./.claude/rules/*.md` | 当前项目 | 团队（版本控制） |
| **用户记忆** | `~/.claude/CLAUDE.md` | 全部项目 | 仅自己 |
| **本地项目** | `./CLAUDE.local.md` | 当前项目 | 仅自己（自动 gitignore） |

**高级特性**：
- `@path/to/import` 导入语法，支持递归导入（最大深度 5 层）
- `.claude/rules/` 模块化规则文件，支持 `paths` 字段做路径范围限定
- 子目录中的 CLAUDE.md 按需加载（访问子目录文件时才加载）
- 符号链接支持跨项目共享规则

### 2.5 Skills（技能扩展）

Skills 通过 `SKILL.md` 文件扩展 Claude 的能力，可作为自定义 Slash 命令 (`/skill-name`) 调用。

**自定义命令已合并到 Skills 系统**：`.claude/commands/` 和 `.claude/skills/` 均可创建 `/slash-command`，Skills 优先。

```
my-skill/
├── SKILL.md           # 主入口（必需）
├── template.md        # 模板文件
├── examples/          # 示例
└── scripts/           # 可执行脚本
```

**Frontmatter 配置**：

| 字段 | 说明 |
|------|------|
| `name` | 技能名称（即 `/command` 名） |
| `description` | Claude 用于判断何时自动调用 |
| `disable-model-invocation` | `true` = 仅用户手动调用 |
| `user-invocable` | `false` = 仅 Claude 自动调用 |
| `allowed-tools` | 限制可用工具 |
| `model` | 指定使用的模型 |
| `context` | `fork` = 在子代理中运行 |
| `hooks` | 技能生命周期钩子 |

**作用域层级**（高 → 低）：Enterprise > Personal (`~/.claude/skills/`) > Project (`.claude/skills/`) > Plugin

**字符串替换变量**：`$ARGUMENTS`、`$ARGUMENTS[N]`、`$N`、`${CLAUDE_SESSION_ID}`

### 2.6 Hooks（钩子系统）

Hooks 在 Claude Code 生命周期特定节点执行用户定义的 shell 命令，提供确定性控制。

**支持的事件**：

| 事件 | 触发时机 |
|------|----------|
| `SessionStart` | 会话开始或恢复时 |
| `UserPromptSubmit` | 用户提交提示后、Claude 处理前 |
| `PreToolUse` | 工具调用执行前（可阻止） |
| `PermissionRequest` | 权限对话框出现时 |
| `PostToolUse` | 工具调用成功后 |
| `PostToolUseFailure` | 工具调用失败后 |
| `Notification` | 通知发送时 |
| `SubagentStart` | 子代理启动时 |
| `SubagentStop` | 子代理完成时 |
| `Stop` | Claude 完成响应时 |
| `TeammateIdle` | Agent Team 成员即将空闲时 |
| `TaskCompleted` | 任务标记完成时 |
| `PreCompact` | 上下文压缩前 |
| `SessionEnd` | 会话终止时 |

**钩子类型**：
- `command` - 执行 shell 命令
- `prompt` - 单轮 Claude 模型评估
- `agent` - 多轮验证（带工具访问）

**退出码约定**：
- `0` = 放行
- `2` = 阻止（stderr 作为反馈传给 Claude）
- 其他 = 放行（stderr 仅记录日志）

### 2.7 权限系统（Permissions）

#### 分层权限

| 工具类型 | 示例 | 需要审批 |
|----------|------|----------|
| 只读 | 文件读取、Grep | 否 |
| Bash 命令 | Shell 执行 | 是（可永久允许） |
| 文件修改 | Edit/Write | 是（会话内有效） |

#### 权限模式

| 模式 | 说明 |
|------|------|
| `default` | 首次使用时提示 |
| `acceptEdits` | 自动接受文件编辑 |
| `plan` | 只分析不修改 |
| `delegate` | 仅协调工具（Agent Teams 队长专用） |
| `dontAsk` | 非预授权工具自动拒绝 |
| `bypassPermissions` | 跳过所有权限提示（仅限隔离环境） |

#### 权限规则语法

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git commit *)",
      "Read(./.env)"
    ],
    "deny": [
      "Bash(git push *)"
    ]
  }
}
```

支持通配符 `*`、MCP 工具匹配 (`mcp__server__tool`)、Task 子代理控制 (`Task(AgentName)`)。

#### 组织托管设置（Managed Settings）

管理员可部署 `managed-settings.json` 强制全组织策略：

| 设置 | 说明 |
|------|------|
| `disableBypassPermissionsMode` | 禁止 bypassPermissions 模式 |
| `allowManagedPermissionRulesOnly` | 仅允许组织级权限规则 |
| `allowManagedHooksOnly` | 仅允许组织级钩子 |
| `strictKnownMarketplaces` | 控制插件市场来源 |

### 2.8 MCP（Model Context Protocol）集成

MCP 是开源标准协议，用于连接 AI 工具与外部数据源。Claude Code 通过 MCP 服务器连接数百种工具：Google Drive、Jira、Slack、数据库、自定义 API 等。

### 2.9 Plugins（插件系统）

Plugins 将 Skills、Subagents、Hooks 和 MCP Servers 打包为可分发的扩展。支持社区插件市场安装。

### 2.10 沙箱（Sandboxing）

原生沙箱提供 OS 级文件系统和网络隔离，与权限系统互补形成纵深防御。

### 2.11 CI/CD 集成

- **GitHub Actions**：自动化 PR 审查、Issue 分拣
- **GitLab CI/CD**：流水线集成
- **Slack**：`@Claude` 触发任务

### 2.12 多平台支持

- 终端 CLI（macOS/Linux/WSL/Windows）
- VS Code / Cursor 扩展
- JetBrains 插件
- Desktop App（macOS/Windows）
- Web 端 + iOS App
- Chrome DevTools 集成

---

## 三、Team 协作功能深度调研

### 3.1 Agent Teams（代理团队）— 实验性功能

> **状态**：实验性功能，默认禁用。需设置 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 启用。

Agent Teams 允许协调**多个独立的 Claude Code 实例**协同工作。

#### 核心架构

| 组件 | 作用 |
|------|------|
| **Team Lead（队长）** | 主会话，负责创建团队、生成队员、协调任务 |
| **Teammates（队员）** | 独立 Claude Code 实例，执行分配的任务 |
| **Task List（任务列表）** | 共享任务列表，支持认领与完成标记 |
| **Mailbox（邮箱）** | 代理间消息系统 |

**存储路径**：
- 团队配置：`~/.claude/teams/{team-name}/config.json`
- 任务列表：`~/.claude/tasks/{team-name}/`

#### Agent Teams vs Subagents 对比

| 特性 | Subagents | Agent Teams |
|------|-----------|-------------|
| **上下文** | 独立窗口，结果汇总回调用者 | 完全独立上下文窗口 |
| **通信** | 只向主代理汇报 | 队员之间可直接互发消息 |
| **协调** | 主代理管理所有工作 | 共享任务列表 + 自我协调 |
| **最适合** | 只关心结果的聚焦型任务 | 需要讨论、协作的复杂工作 |
| **Token 成本** | 较低（结果摘要回主上下文） | 较高（每个队员独立实例） |

**结论**：快速专注 → Subagents；互相分享、挑战、独立协调 → Agent Teams

#### 最佳使用场景

1. **研究与评审**：多队员同时调查问题不同方面，分享并挑战结论
2. **新模块/功能开发**：每人负责一块，互不干扰
3. **多假设并行调试**：同时验证不同假说，加速收敛
4. **跨层协调**：前端、后端、测试分别由不同队员负责

#### 显示模式

| 模式 | 说明 | 要求 |
|------|------|------|
| **In-process**（默认） | 所有队员输出在主终端内，Shift+Up/Down 切换 | 任意终端 |
| **Split panes** | 每个队员独占一个面板 | tmux 或 iTerm2 |

```json
// settings.json 配置
{ "teammateMode": "in-process" }
```

```bash
# 单次会话指定
claude --teammate-mode in-process
```

#### 队长控制能力

| 操作 | 说明 |
|------|------|
| **指定队员和模型** | "Create a team with 4 teammates. Use Sonnet for each." |
| **计划审批** | 要求队员提交计划，队长审批后再执行 |
| **Delegate Mode** | 队长仅使用协调工具，禁止直接改代码（Shift+Tab 切换） |
| **直接对话队员** | Shift+Up/Down 选人并输入消息 |
| **任务分配与认领** | 队长显式指派 或 队员完成后自领取下一个 |
| **关闭队员** | "Ask the researcher teammate to shut down"（可拒绝） |
| **清理团队** | "Clean up the team"（必须由队长执行） |

#### 质量门控钩子

| 钩子 | 作用 |
|------|------|
| `TeammateIdle` | 队员即将空闲时触发，退出码 2 可反馈并阻止空闲 |
| `TaskCompleted` | 任务标记完成时触发，退出码 2 可阻止完成 |

#### 通信机制

- 每个队员启动时加载：项目上下文（CLAUDE.md、MCP、Skills）+ 队长给的 spawn prompt
- **不继承**队长历史对话
- 消息传递：自动投递 + 空闲通知
- 支持：点对点消息 / 广播（谨慎使用）

#### 使用示例

```
# 并行代码审查
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage

# 多假设调试
Create a team to debug the memory leak. Spawn teammates:
- One investigating the event listener theory
- One checking the cache invalidation theory
- Have them share findings and challenge each other

# 跨模块重构
Create a team with 4 teammates to refactor these modules in parallel.
Use Sonnet for each teammate.
```

### 3.2 Subagents（子代理）

子代理是在独立上下文窗口中运行的专业 AI 助手。

#### 内置子代理

| 代理 | 模型 | 工具 | 用途 |
|------|------|------|------|
| **Explore** | Haiku（快速） | 只读 | 代码搜索、代码库探索 |
| **Plan** | 继承主会话 | 只读 | Plan Mode 下的代码库研究 |
| **general-purpose** | 继承主会话 | 全部 | 复杂多步任务 |
| **Bash** | 继承 | - | 独立上下文中运行终端命令 |
| **Claude Code Guide** | Haiku | - | 回答 Claude Code 使用问题 |

#### 自定义子代理

通过 Markdown + YAML Frontmatter 定义：

```bash
# 交互式创建
/agents

# CLI 参数定义（临时会话）
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer",
    "prompt": "You are a senior code reviewer...",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

**作用域层级**（高 → 低）：
1. `--agents` CLI 参数（当前会话）
2. `.claude/agents/`（当前项目，可版本控制共享）
3. `~/.claude/agents/`（个人全局）
4. Plugin agents/（插件安装）

**Frontmatter 可配置项**：系统提示、工具限制、权限模式、模型选择、预加载技能、持久记忆、生命周期钩子。

### 3.3 Team / Enterprise 计划管理控制

Anthropic 为 Team 和 Enterprise 客户提供 Claude Code 企业级管理能力（2025年8月发布）：

#### 管理控制

| 功能 | 说明 |
|------|------|
| **自助席位管理** | 管理面板中购买、分配和配置用户 |
| **粒度支出控制** | 组织级和用户级消费上限 |
| **使用分析** | Claude Code 代码接受行数、接受率、使用模式等指标 |
| **托管策略设置** | 全组织部署和强制工具权限、文件访问和 MCP 配置 |

#### Premium 席位

- 包含 Claude（对话）+ Claude Code（编码代理）
- 标准 API 费率的额外用量选项
- 管理员可按需为用户分配标准或 Premium 席位

#### Compliance API

- 程序化访问 Claude 使用数据和客户内容
- 支持持续监控、自动策略执行
- 选择性删除数据保留能力

### 3.4 团队协作工作流

#### 共享项目配置

通过版本控制共享以下文件实现团队一致性：

```
project-root/
├── CLAUDE.md                    # 团队共享的项目指令
├── .claude/
│   ├── CLAUDE.md                # 项目级指令（备选路径）
│   ├── settings.json            # 项目级设置（权限、钩子）
│   ├── rules/                   # 模块化规则
│   │   ├── code-style.md
│   │   ├── testing.md
│   │   └── security.md
│   ├── skills/                  # 团队共享技能
│   │   ├── review/SKILL.md
│   │   └── deploy/SKILL.md
│   └── agents/                  # 团队共享子代理
│       └── code-reviewer.md
├── CLAUDE.local.md              # 个人偏好（自动 gitignore）
```

#### Git 集成

```bash
# 智能提交
claude "commit my changes with a descriptive message"

# CI/CD 自动化
claude -p "review these changed files for security issues"
```

#### Slack 集成

在团队聊天中 `@Claude` 即可触发任务，返回 Pull Request。

### 3.5 权限与安全的团队层面

#### 组织托管设置部署

管理员通过 MDM/Group Policy/Ansible 部署 `managed-settings.json`：

| 平台 | 路径 |
|------|------|
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux/WSL | `/etc/claude-code/managed-settings.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-settings.json` |

可强制：
- 禁用 bypassPermissions 模式
- 仅允许组织级权限规则
- 仅允许组织级钩子
- 限制插件市场来源

#### 组织级 CLAUDE.md

在 Managed policy 路径部署统一的 CLAUDE.md，全组织开发者自动加载。

---

## 四、约束集

### 硬约束
- [HC-1] Agent Teams 为**实验性功能**，默认禁用，需手动启用环境变量 — 来源：官方文档
- [HC-2] Agent Teams 每个队员是独立 Claude Code 实例，Token 成本**线性增加** — 来源：官方文档
- [HC-3] Agent Teams 队员**不继承**队长历史对话上下文 — 来源：官方文档
- [HC-4] Agent Teams 清理操作**必须由队长执行**，队员清理可能导致资源不一致 — 来源：官方文档
- [HC-5] Split panes 模式**依赖 tmux 或 iTerm2** — 来源：官方文档
- [HC-6] 权限规则评估顺序为 **deny → ask → allow**，deny 始终优先 — 来源：官方文档
- [HC-7] Auto Memory 仅加载 MEMORY.md **前 200 行** — 来源：官方文档
- [HC-8] Subagents **不能嵌套生成**其他 Subagents — 来源：官方文档
- [HC-9] CLAUDE.md 导入最大递归深度 **5 层** — 来源：官方文档

### 软约束
- [SC-1] Agent Teams 适合**队员可独立作业**的场景，顺序任务建议使用单会话 — 来源：官方文档
- [SC-2] 日常简单任务建议用 Subagents 而非 Agent Teams 以节省 Token — 来源：官方文档
- [SC-3] 建议 SKILL.md 保持在 **500 行以内**，详细内容移到支撑文件 — 来源：官方文档
- [SC-4] CLAUDE.md 中的指令应**具体明确**而非模糊笼统 — 来源：官方文档

### 依赖关系
- [DEP-1] Agent Teams → 环境变量 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- [DEP-2] Split panes 模式 → tmux 或 iTerm2 安装
- [DEP-3] 组织托管设置 → MDM/GPO 部署基础设施
- [DEP-4] Compliance API → Enterprise 计划

### 风险
- [RISK-1] Agent Teams 实验性质可能有会话恢复、任务协调、关闭行为等局限 — 缓解：生产环境谨慎使用
- [RISK-2] 多队员 Token 消耗高 — 缓解：仅在高价值并行场景使用
- [RISK-3] 权限规则中 Bash 通配符约束**可被绕过** — 缓解：结合 PreToolUse hooks 和 deny 规则

---

## 五、成功判据

- [OK-1] 文档覆盖 Claude Code CLI **12 个以上**核心功能模块
- [OK-2] Agent Teams 功能有完整的架构说明、对比表、使用场景、配置方法
- [OK-3] 团队协作能力涵盖 Agent Teams + Subagents + 权限管理 + 共享配置 + Enterprise 控制
- [OK-4] 所有信息来源可追溯至官方文档或 Anthropic 博客

---

## 六、信息来源

| 来源 | URL |
|------|-----|
| Claude Code 概览 | https://code.claude.com/docs/en/overview |
| Agent Teams 文档 | https://code.claude.com/docs/en/agent-teams |
| Subagents 文档 | https://code.claude.com/docs/en/sub-agents |
| Skills 文档 | https://code.claude.com/docs/en/skills |
| Memory 文档 | https://code.claude.com/docs/en/memory |
| Permissions 文档 | https://code.claude.com/docs/en/permissions |
| Hooks 文档 | https://code.claude.com/docs/en/hooks-guide |
| Headless/SDK 文档 | https://code.claude.com/docs/en/headless |
| CLI 参考 | https://code.claude.com/docs/en/cli-reference |
| Team/Enterprise 公告 | https://www.anthropic.com/news/claude-code-on-team-and-enterprise |
| Opus 4.6 + Agent Teams 公告 | https://www.anthropic.com/news/claude-opus-4-6 |
| 并行 C 编译器案例 | https://www.anthropic.com/engineering/building-c-compiler |
| 沙箱工程博客 | https://www.anthropic.com/engineering/claude-code-sandboxing |
| npm 包 | https://www.npmjs.com/package/@anthropic-ai/claude-code |
| GitHub CHANGELOG | https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md |
