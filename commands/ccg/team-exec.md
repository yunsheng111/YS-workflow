---
description: 'Agent Teams 并行实施 - 读取计划文件，spawn Builder teammates 并行写代码'
---

# Team Exec - Agent Teams 并行实施

读取计划文件，spawn Builder teammates 并行写代码。

## 使用方法

```bash
/ccg:team-exec
```

---

## Level 2: 命令层执行

**执行方式**：主代理直接执行 + Agent Teams 并行协作

**工作流**：5 个阶段（前置检查 → 解析计划 → 创建 Team + spawn Builders → 监控进度 → 汇总 + 清理）

**前置条件**：
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 已启用
- `.doc/agent-teams/plans/` 下有计划文件

---

## Level 3: 工具层执行

**主代理调用的工具**：
- 计划读取：Read 工具
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`
- Agent Teams：TeamCreate + Task（spawn Builder）+ SendMessage
- Git 操作：Bash（git diff, git checkout）

**Builder teammates 调用的工具**：
- 代码修改：Read/Edit/Write 工具
- 代码验证：Bash（lint, typecheck）

**详细说明**：参考 [team-exec-agent.md](../../agents/ccg/team-exec-agent.md)

---

## 执行流程

1. **前置检查** — 验证 Agent Teams 可用性和计划文件存在
2. **解析计划** — 提取子任务、文件范围、依赖关系
3. **spawn Builders** — 按 Layer 分组并行 spawn
4. **监控进度** — 维护状态表，处理失败重试
5. **汇总 + 清理** — 输出变更摘要，释放 Team 资源

---

## 关键规则

1. **Lead 不写代码** — 只做协调和汇总
2. **Builder 文件范围严格隔离** — 只能修改分配的文件
3. **Layer 依赖处理** — Layer 2+ 等待依赖 Layer 完成后再 spawn
4. **失败不阻塞** — 单个 Builder 失败不影响其他 Builder

**Exit Criteria**
- [ ] 所有 Builder 任务完成（或明确失败并记录原因）
- [ ] 变更摘要已输出
- [ ] Team 已清理
