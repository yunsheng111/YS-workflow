# CCG 架构升级报告

> 生成时间：2026-02-12
> 版本：v1.7.48 → v1.7.61

---

## 一、升级概述

### 执行的操作
1. 备份原架构至 `~/.claude.backup.20260212_010907`
2. 执行 `npm install -g ccg-workflow@latest`
3. 执行 `npx ccg init --skip-mcp` 安装新工作流
4. 配置 Agent Teams 环境变量

### 升级结果
- **命令数量**：22 → 26（+4 Agent Teams 系列）
- **代理数量**：20（未变）
- **自定义内容**：全部保留 ✅

---

## 二、新增功能

### Agent Teams 并行实施系列（4 个命令）

| 命令 | 功能 | 使用场景 |
|------|------|----------|
| `/ccg:team-research` | 需求研究 → 约束集 | 复杂需求分析，产出可验证成功判据 |
| `/ccg:team-plan` | 约束 → 零决策计划 | 拆分为文件范围隔离的独立子任务 |
| `/ccg:team-exec` | 并行实施 | spawn Builder teammates 并行写代码 |
| `/ccg:team-review` | 双模型审查 | Codex + Gemini 交叉验证 |

### 工作流特点
- **上下文隔离**：每步 `/clear`，通过文件传递状态
- **并行实施**：≥3 个子任务且文件范围无冲突时触发
- **成本可控**：Builder teammates 使用 Sonnet 模型

### 新增目录
- `~/.claude/bin/` - 包含 `codeagent-wrapper.exe`（9.1MB）
- `~/.claude/plans/` - 存放计划文件

---

## 三、配置变更

### config.toml 更新
```toml
[general]
version = "1.7.61"  # 原 1.7.48

[workflows]
installed = [
  # 原有 22 个 +
  "team-research",
  "team-plan",
  "team-exec",
  "team-review"
]

[mcp]
provider = "skip"  # 原 ace-tool
```

### settings.json 新增环境变量
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "CODEAGENT_POST_MESSAGE_DELAY": "1",
    "CODEX_TIMEOUT": "7200",
    "BASH_DEFAULT_TIMEOUT_MS": "600000",
    "BASH_MAX_TIMEOUT_MS": "3600000"
  }
}
```

---

## 四、保留的自定义内容

| 文件/目录 | 状态 |
|-----------|------|
| `CLAUDE.md` | 未修改 ✅ |
| `settings.json` | 仅新增 env（保留 hooks/permissions） ✅ |
| 22 个原有命令 | 未修改 ✅ |
| 20 个代理 | 未修改 ✅ |
| `.ccg/prompts/` | 未修改 ✅ |
| `.ccg/ARCHITECTURE.md` | 未修改 ✅ |
| `skills/` | 未修改 ✅ |

---

## 五、后续优化建议（按优先级）

### P0 - 必须做

#### 1. 兼容层抽象
**问题**：本地命令硬编码 `codeagent-wrapper.exe` 路径（17 处）
**建议**：改为变量，对齐上游 `{{WORKDIR}}`、`{{MCP_SEARCH_TOOL}}` 思路

```markdown
# 示例：在命令模板中使用变量
{{CODEAGENT_WRAPPER}} --backend codex - "{{WORKDIR}}"
```

#### 2. 工具可用性探测
**问题**：`zhi/enhance/search` 的 fallback 规则写了但检测不统一
**建议**：在命令开头统一做 runtime capability check

```markdown
# 示例：统一探测模板
1. 检测 mcp______enhance → 可用则使用
2. 检测 mcp__ace-tool__enhance_prompt → 降级使用
3. 都不可用 → 使用 mcp______zhi 确认原始需求
```

### P1 - 应该做

#### 3. 清理代理编排
**问题**：20 个代理中约 13 个未被命令直接调用
**建议**：
- 方案 A：让命令真正调用这些代理
- 方案 B：删减未用代理，保持"命令-代理"一一对应

#### 4. 更新 CLAUDE.md 任务路由表
**建议**：在第 2 节"任务路由决策"中添加 Agent Teams 系列

```markdown
### Agent Teams 并行开发（高复杂度 + 并行实施）

| 任务类型 | 判定标准 | CCG 命令 |
|----------|----------|----------|
| 需求研究 | 复杂需求、多约束 | `ccg:team-research` |
| 并行规划 | ≥3 个独立模块 | `ccg:team-plan` |
| 并行实施 | 文件范围无冲突 | `ccg:team-exec` |
| 交叉审查 | 并行产出验证 | `ccg:team-review` |
```

#### 5. 命令模板体检脚本
**建议**：创建自动检查脚本，每次更新后运行

```bash
# 检查项
- 缺失命令
- 无效 agent 引用
- 硬编码路径
- 占位符未替换
- 不可用工具名
```

### P2 - 可以做

#### 6. 统一术语
**问题**：本地仍以 "OpenSpec" 为主，上游已强调 OPSX 迁移
**建议**：写兼容说明，明确 OpenSpec/OPSX 关系

#### 7. 集成 ContextWeaver MCP
**问题**：当前仅配置 ace-tool（收费）
**建议**：添加 ContextWeaver 作为免费替代

---

## 六、使用指南

### Agent Teams 工作流

```bash
# 1. 需求研究（复杂项目推荐，简单项目可跳过）
/ccg:team-research 实现实时协作看板 API

# 2. /clear 后规划
/ccg:team-plan kanban-api

# 3. /clear 后并行实施
/ccg:team-exec

# 4. /clear 后审查
/ccg:team-review
```

### vs 传统工作流

| 场景 | 推荐工作流 |
|------|------------|
| 简单功能（1-2 文件） | `/ccg:feat` 或 `/ccg:workflow` |
| 中等复杂度（3-5 文件） | `/ccg:plan` + `/ccg:execute` |
| 高复杂度（≥3 独立模块） | Agent Teams 系列 |

---

## 七、备份恢复

### 完全恢复
```bash
rm -rf ~/.claude
cp -r ~/.claude.backup.20260212_010907 ~/.claude
```

### 选择性恢复
```bash
# 恢复特定文件
cp ~/.claude.backup.20260212_010907/CLAUDE.md ~/.claude/
cp ~/.claude.backup.20260212_010907/.ccg/config.toml ~/.claude/.ccg/
```

---

## 八、总结

本次升级成功完成以下目标：
1. ✅ 新增 4 个 Agent Teams 命令
2. ✅ 保留所有自定义内容（CLAUDE.md、命令、代理）
3. ✅ 配置 Agent Teams 环境变量
4. ✅ 安装 codeagent-wrapper.exe

后续建议按 P0 → P1 → P2 优先级逐步优化架构。
