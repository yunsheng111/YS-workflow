---
description: 'Agent Teams 并行实施 - 读取计划文件，spawn Builder teammates 并行写代码'
---
<!-- CCG:TEAM:EXEC:START -->
**Core Philosophy**
- 实施是纯机械执行——所有决策已在 team-plan 阶段完成。
- Lead 不写代码，只做协调和汇总。
- Builder teammates 并行实施，文件范围严格隔离。

**Guardrails**
- **前置条件**：`.doc/agent-teams/plans/` 下必须有计划文件。没有则终止，提示先运行 `/ccg:team-plan`。
- **Agent Teams 必须启用**：需要 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`。
- Lead 绝不直接修改产品代码。
- 每个 Builder 只能修改分配给它的文件。

---

## Level 2: 命令层执行

**执行方式**：主代理直接执行 + Agent Teams 并行协作

**工作流**：5 个阶段（前置检查 → 解析计划 → 创建 Team + spawn Builders → 监控进度 → 汇总 + 清理）

---

## Level 3: 工具层执行

**主代理调用的工具**：
- 计划读取：Read 工具
- 用户确认：`mcp______zhi` → `AskUserQuestion`
- 知识存储：`mcp______ji` → 本地文件
- Agent Teams：TeamCreate + Task（spawn Builder teammates）+ SendMessage
- Git 操作：Bash（git diff, git checkout）

**Builder teammates 调用的工具**：
- 代码修改：Read/Edit/Write 工具
- 代码验证：Bash（lint, typecheck）

**详细说明**：参考 [架构文档 - 工具调用优先级](./.doc/framework/ccg/ARCHITECTURE.md#工具调用优先级)

---

**Steps**
1. **前置检查**
   - 检测 Agent Teams 是否可用。
   - 若不可用，输出启用指引后终止：
     ```
     ⚠️ Agent Teams 未启用。请先配置：
     在 settings.json 中添加：
     { "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
     ```
   - 读取 `.doc/agent-teams/plans/` 下最新的计划文件。
   - 若无计划文件，提示：`请先运行 /ccg:team-plan <任务描述> 生成计划`，终止。

2. **解析计划**
   - 解析子任务列表、文件范围、依赖关系、并行分组。
   - 向用户展示摘要并确认：
     ```
     📋 即将并行实施：
     - 子任务：N 个
     - 并行分组：Layer 1 (X 个并行) → Layer 2 (Y 个)
     - Builder 数量：N 个（Sonnet）
     确认开始？
     ```

3. **创建 Team + spawn Builders**
   - 创建 Agent Team。
   - 按 Layer 分组 spawn Builder teammates（Sonnet）。
   - 每个 Builder 的 spawn prompt 必须包含：

   ```
   你是 Builder，负责实施一个子任务。严格按照以下指令执行。

   ## 你的任务
   <从计划文件中提取该 Builder 负责的子任务全部内容，包括实施步骤>

   ## 工作目录
   {{WORKDIR}}

   ## 文件范围约束（⛔ 硬性规则）
   你只能创建或修改以下文件：
   <文件列表>
   严禁修改任何其他文件。违反此规则等于任务失败。

   ## 实施要求
   1. 严格按照实施步骤执行
   2. 代码必须符合项目现有规范和模式
   3. 完成后运行相关的 lint/typecheck 验证（如果项目有配置）
   4. 代码应自解释，非必要不加注释

   ## 验收标准
   <从计划中提取>

   完成所有步骤后，标记任务为 completed。
   ```

   - **Layer 依赖处理**：
     * Layer 1 的所有 Builder 立即并行 spawn。
     * Layer 2+ 的 Builder **不提前 spawn**——等待其依赖的 Layer 全部完成后再 spawn。
     * 依赖判定：计划文件中 `依赖: Task N` 字段指定的任务必须状态为 `done`。
     * 跨 Layer 数据传递：如果 Layer 2 任务需要 Layer 1 的产出（如生成的类型定义、API 接口），Lead 在 spawn Layer 2 Builder 时将相关文件路径注入 prompt。
     * 若某个 Layer 1 任务失败且 Layer 2 任务依赖它：暂停该 Layer 2 任务，尝试重试 Layer 1（见步骤 4 重试机制），重试仍失败则标记整条依赖链为 `blocked`。
   - spawn 完成后，进入 **delegate 模式**，只协调不写码。

4. **监控进度**
   - 等待所有 Builder 完成。
   - **进度追踪**：每个 Builder spawn 后，维护状态表：
     ```
     Builder 状态表（Lead 内部维护）：
     | Builder | 子任务 | Layer | 状态 | 最后活动 |
     |---------|--------|-------|------|----------|
     | B1 | Task 1 | L1 | running | spawn +0s |
     ```
     * 收到 Builder 消息时更新状态
     * Builder 标记任务 completed 时更新为 `done`
   - 如果某个 Builder 遇到问题并发消息求助：
     * 分析问题，给出指导建议
     * 不要自己写代码替它完成
   - **Builder 失败重试机制**：
     * Builder 报告失败或长时间无响应时，记录失败原因
     * **自动重试条件**：失败非由文件冲突或需求歧义引起
     * **重试流程**：
       1. 向失败 Builder 发送 shutdown_request
       2. 分析失败原因，调整 spawn prompt（补充上下文或简化步骤）
       3. 重新 spawn 新 Builder，携带修正后的指令
       4. 最多重试 1 次，仍失败则标记为 `failed` 并记录详因
     * **不重试的情况**：文件范围冲突、需求本身有歧义、依赖的上游任务未完成
     * 单个 Builder 失败不影响其他 Builder 继续执行

5. **汇总 + 清理**
   - 所有 Builder 完成后，汇总报告：

   ```markdown
   ## ✅ Team 并行实施完成

   ### 变更摘要
   | Builder | 子任务 | 状态 | 修改文件 |
   |---------|--------|------|----------|
   | Builder 1 | <名称> | ✅/❌ | file1, file2 |
   | Builder 2 | <名称> | ✅/❌ | file3, file4 |
   | ...     | ...    | ...  | ...      |

   ### 失败任务详情（如有）
   | Builder | 失败原因 | 重试次数 | 最终状态 |
   |---------|----------|----------|----------|
   | Builder N | <原因> | 0/1 | failed/blocked |

   ### 后续建议
   1. 运行完整测试验证集成：`npm test` / `pnpm test`
   2. 检查各模块间的集成是否正常
   3. 提交代码：运行 `/ccg:commit` 命令进行规范提交
   ```

   - **归档实施记录**：
     调用 `mcp______ji`（`action: "记录"`, `category: "team-exec"`, `content: "<任务名称>|子任务数:N|成功:X|失败:Y|变更文件列表"`）归档本次并行实施的执行摘要。

   - **清理流程**：
     1. 向所有 Builder 发送 shutdown_request
     2. 等待所有 Builder 确认关闭
     3. 确认 Team 资源已释放
   - **清理失败回滚策略**：
     * 如果某个 Builder 无法正常关闭（shutdown_request 超时或被拒绝）：
       1. 记录该 Builder 的 ID 和状态
       2. 再次发送 shutdown_request，附带明确的终止原因
       3. 仍无响应则跳过，向用户报告残留 Builder 信息
     * 如果 Builder 实施的代码产生集成问题：
       1. 运行 `git diff --stat` 列出所有变更文件
       2. 用 `mcp______zhi`（`is_markdown: true`, `predefined_options: ["回滚全部变更", "仅回滚失败任务", "保留现状手动修复"]`）询问用户选择回滚策略
       3. 选择回滚 → 执行 `git checkout -- <文件列表>` 还原指定文件
       4. 回滚后重新输出变更摘要，标注哪些已回滚

**Exit Criteria**
- [ ] 所有 Builder 任务完成（或明确失败并记录原因）
- [ ] 变更摘要已输出
- [ ] Team 已清理
<!-- CCG:TEAM:EXEC:END -->
