# P0/P1/P2 修复报告

**日期**：2026-02-16
**任务**：修复 Agent Teams 工具诊断后的后续问题（P0/P1/P2）

---

## 修复概览

| 优先级 | 任务 | 状态 | 修改文件数 |
|--------|------|------|-----------|
| P0 | 修复 Hook 白名单绝对路径匹配问题 | ✅ 完成 | 1 |
| P1 | 审查 CCG 命令路由表一致性 | ✅ 完成 | 0（无需修改） |
| P2 | 记录 Claude Code 平台限制到架构文档 | ✅ 完成 | 1 |

**总计修改文件**：2 个
**新增代码行数**：59 行
**删除代码行数**：6 行

---

## P0：Hook 白名单绝对路径匹配修复

### 问题描述

`ccg-path-validator.cjs` 白名单正则使用 `^` 锚点（如 `/^agents[\/\\]/`），但 Hook 接收到的是绝对路径（如 `C:/Users/Administrator/.claude/agents/ccg/test.md`），导致 `^agents` 无法匹配。

**影响范围**：
- `agents/` 目录
- `.ccg/` 目录
- `hooks/` 目录
- `skills/` 目录
- `commands/` 目录（已在前次 debug 中临时修复为 `/[\/\\]commands[\/\\]/`）

### 修复方案

在 `isWhitelisted` 和 `validatePath` 函数中增加 `toRelativePath` 转换逻辑：

1. **新增 `toRelativePath` 函数**：
   - 检测路径中的 `/.claude/` 标记
   - 提取 `.claude/` 之后的相对路径部分
   - 处理 Windows 和 Unix 绝对路径

2. **修改 `isWhitelisted` 函数**：
   - 同时检查原始路径和相对路径
   - 确保绝对路径和相对路径都能匹配白名单

3. **修改 `validatePath` 函数**：
   - 同时检查原始路径和相对路径
   - 确保代理路径规则对绝对路径也生效

4. **恢复 `commands/` 正则一致性**：
   - 将 `/[\/\\]commands[\/\\]/` 改回 `/^commands[\/\\]/`
   - 保持与其他目录一致的 `^` 锚点风格

### 验证结果

**测试用例**：12 个（绝对路径 5 个 + 相对路径 5 个 + 非白名单 2 个）
**测试结果**：12 passed, 0 failed

**测试覆盖**：
- ✅ Windows 绝对路径（`C:\Users\...\agents\ccg\test.md`）
- ✅ 相对路径（`agents/ccg/test.md`）
- ✅ 白名单目录（`.ccg/`、`agents/`、`commands/`、`hooks/`、`skills/`）
- ✅ 非白名单目录（`.doc/workflow/`、`.doc/spec/`）

### 修改文件

**文件**：`hooks/ccg-path-validator.cjs`

**变更**：
- 新增 `toRelativePath` 函数（25 行）
- 修改 `isWhitelisted` 函数（3 行）
- 修改 `validatePath` 函数（2 行）
- 恢复 `commands/` 正则一致性（1 行）

---

## P1：CCG 命令路由表一致性审查

### 审查范围

26 个 CCG 命令的 Level 2 执行方式，对比 ARCHITECTURE.md 映射表与实际命令文件实现。

### 审查结果

**一致性检查**：26/26 通过 ✅

| 执行方式 | 命令数量 | 一致性 |
|----------|---------|--------|
| Task 调用子代理 | 18 | ✅ 全部一致 |
| 直接执行（主代理） | 4 | ✅ 全部一致 |
| 命令内执行（主代理 + 外部模型/Agent Teams） | 4 | ✅ 全部一致（已在前次 debug 中修复） |

**特殊说明**：
- `ccg:frontend` 使用动态路由（设计类 → `ui-ux-designer`，开发类 → `frontend-agent`），ARCHITECTURE.md 映射表简写为 `frontend-agent`，这是设计意图，不算不一致。
- 4 个 `team-*` 命令已在前次 debug 中修复为"命令内执行"模式，与 ARCHITECTURE.md 标注一致。

### 结论

无需额外修改。所有命令的路由标注与实际实现一致。

---

## P2：记录 Claude Code 平台限制到架构文档

### 问题背景

前次 debug 发现 Agent Teams 工具在子代理中不可用，根因是 Claude Code 平台级限制：
- 子代理无法使用 `Task` 工具（防止无限嵌套）
- 子代理无法使用 `TeamCreate` / `SendMessage` / `TeamDelete`（Agent Teams 协调工具）

这是平台设计决策，无法通过配置绕过。但 ARCHITECTURE.md 未记录此限制，导致开发者可能误用。

### 修复方案

在 ARCHITECTURE.md 中新增"Claude Code 平台限制"章节，记录：

1. **关键约束**：
   - 子代理无法使用的工具清单
   - 平台级设计决策说明
   - 参考文档链接（官方文档、GitHub Issues）

2. **影响范围表**：
   - 需要 Agent Teams 工具 → 命令内执行
   - 需要 spawn 其他子代理 → 命令内执行或主代理编排
   - 纯分析/文件操作 → Task 调用子代理（正常）

3. **受影响的命令清单**：
   - `ccg:team-exec`
   - `ccg:team-research`
   - `ccg:team-plan`
   - `ccg:team-review`

4. **更新命令-代理映射表说明**：
   - 将"执行方式说明"从 3 类改为 3 类（Task 调用 18 个、直接执行 4 个、命令内执行 4 个）
   - 明确标注"命令内执行"的原因（平台限制）

### 修改文件

**文件**：`.doc/framework/ccg/ARCHITECTURE.md`

**变更**：
- 新增"Claude Code 平台限制"章节（30 行）
- 更新"执行方式说明"（3 行）

---

## 修复验证

### 验证清单

- [x] P0：Hook 白名单绝对路径匹配测试通过（12/12）
- [x] P0：`commands/` 正则恢复为 `^` 锚点风格
- [x] P1：26 个 CCG 命令路由一致性审查通过
- [x] P2：ARCHITECTURE.md 新增平台限制章节
- [x] P2：命令-代理映射表说明更新

### Git 变更统计

```
 .doc/framework/ccg/ARCHITECTURE.md | 30 +++++++++++++++++++++++++++---
 hooks/ccg-path-validator.cjs       | 35 ++++++++++++++++++++++++++++++++---
 2 files changed, 59 insertions(+), 6 deletions(-)
```

---

## 后续建议

### 短期（本周）

1. **测试 Agent Teams 工作流**：
   - 运行 `/ccg:team-research` 验证双模型调用
   - 运行 `/ccg:team-plan` 验证规划流程
   - 运行 `/ccg:team-exec` 验证 TeamCreate/SendMessage 可用
   - 运行 `/ccg:team-review` 验证审查流程

2. **验证 Hook 白名单修复**：
   - 修改 `agents/ccg/` 目录下的代理文件，确认不被拦截
   - 修改 `.ccg/` 目录下的配置文件，确认不被拦截
   - 修改 `hooks/` 目录下的 Hook 脚本，确认不被拦截

### 中期（本月）

1. **完善架构文档**：
   - 在 ARCHITECTURE-VISUAL.md 中补充平台限制的可视化说明
   - 在 CLAUDE.md 的"按需查阅"表中增加平台限制章节的引用

2. **优化 Hook 白名单逻辑**：
   - 考虑将 `toRelativePath` 逻辑提取为独立模块
   - 增加单元测试覆盖（当前仅手动测试）

### 长期（下季度）

1. **监控 Claude Code 平台更新**：
   - 关注官方文档和 GitHub Issues
   - 如果平台放开子代理工具限制，评估是否恢复 `team-*` 命令为 Task 调用模式

2. **评估其他命令的路由模式**：
   - 检查是否有其他命令也需要"命令内执行"模式
   - 统一路由模式的命名和文档描述

---

## 参考资料

- **诊断报告**：`.doc/workflow/wip/execution/20260216-agent-teams-tools-unavailable-debug.md`
- **官方文档**：https://docs.anthropic.com/en/docs/claude-code/sub-agents
- **GitHub Issues**：#4182、#19077
- **架构文档**：`.doc/framework/ccg/ARCHITECTURE.md`
- **Hook 脚本**：`hooks/ccg-path-validator.cjs`
