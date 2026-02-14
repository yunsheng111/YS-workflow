---
description: 'Agent Teams 规划 - Lead 调用 Codex/Gemini 并行分析，产出零决策并行实施计划'
---
<!-- CCG:TEAM:PLAN:START -->
**Core Philosophy**
- 产出的计划必须让 Builder teammates 能无决策机械执行。
- 每个子任务的文件范围必须隔离，确保并行不冲突。
- 多模型协作是强制的：Codex（后端权威）+ Gemini（前端权威）。

**Guardrails**
- 多模型分析是 **mandatory**：必须同时调用 Codex 和 Gemini。
- 不写产品代码，只做分析和规划。
- 计划文件必须包含 Codex/Gemini 的实际分析摘要。
- 使用 `mcp______zhi`（`is_markdown: true`）解决任何歧义。

---

## Level 2: 命令层执行

**执行方式**：主代理直接执行 + 外部模型协作

**工作流**：7 个阶段（上下文收集 → 多模型并行分析 → 综合分析 + 任务拆分 → 写入计划文件 → 归档计划 → 用户确认 → 上下文检查点）

---

## Level 3: 工具层执行

**主代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Grep/Glob
- 用户确认：`mcp______zhi` → `AskUserQuestion`
- 知识存储：`mcp______ji` → 本地文件
- 外部模型：Codex（后端权威）+ Gemini（前端权威）并行分析

**详细说明**：参考 [架构文档 - 工具调用优先级](./.doc/framework/ccg/ARCHITECTURE.md#工具调用优先级)

---

**Steps**
1. **上下文收集**
   - 如果 `mcp__ace-tool__search_context` 可用，优先语义检索。
   - 降级：`mcp__ace-tool__search_context` 不可用 → 使用 `mcp______sou` 语义搜索。
   - 再降级：都不可用 → 用 Glob/Grep/Read 手动分析项目结构。
   - 整理出：技术栈、目录结构、关键文件、现有模式。

2. **多模型并行分析（PARALLEL）**
   - **CRITICAL**: 必须在一条消息中同时发起两个 Bash 调用，`run_in_background: true`。
   - **工作目录**：使用 `{{WORKDIR}}`（当前工作目录的绝对路径）。

   **FIRST Bash call (Codex)**:
   ```
   Bash({
     command: "{{CCG_BIN}} {{LITE_MODE_FLAG}}--backend codex - \"{{WORKDIR}}\" <<'EOF'\nROLE_FILE: ~/.claude/.ccg/prompts/codex/analyzer.md\n<TASK>\n需求：$ARGUMENTS\n上下文：<步骤1收集的项目结构和关键代码>\n</TASK>\nOUTPUT:\n1) 技术可行性评估\n2) 推荐架构方案（精确到文件和函数）\n3) 详细实施步骤\n4) 风险评估\nEOF",
     run_in_background: true,
     timeout: 3600000,
     description: "Codex 后端分析"
   })
   ```

   **SECOND Bash call (Gemini) - IN THE SAME MESSAGE**:
   ```
   Bash({
     command: "{{CCG_BIN}} {{LITE_MODE_FLAG}}--backend gemini {{GEMINI_MODEL_FLAG}}- \"{{WORKDIR}}\" <<'EOF'\nROLE_FILE: ~/.claude/.ccg/prompts/gemini/analyzer.md\n<TASK>\n需求：$ARGUMENTS\n上下文：<步骤1收集的项目结构和关键代码>\n</TASK>\nOUTPUT:\n1) UI/UX 方案\n2) 组件拆分建议（精确到文件和函数）\n3) 详细实施步骤\n4) 交互设计要点\nEOF",
     run_in_background: true,
     timeout: 3600000,
     description: "Gemini 前端分析"
   })
   ```

   **等待结果**:
   ```
   TaskOutput({ task_id: "<codex_task_id>", block: true, timeout: 600000 })
   TaskOutput({ task_id: "<gemini_task_id>", block: true, timeout: 600000 })
   ```

   - 必须指定 `timeout: 600000`，否则默认 30 秒会提前超时。
   - 若 10 分钟后仍未完成，继续轮询，**绝对不要 Kill 进程**。

3. **综合分析 + 任务拆分**
   - 后端方案以 Codex 为准，前端方案以 Gemini 为准。
   - 拆分为独立子任务，每个子任务：
     * 文件范围不重叠（**强制**）
     * 如果无法避免重叠 → 设为依赖关系
     * 有具体实施步骤和验收标准
   - **并行分组策略**：
     * **Layer 划分原则**：同一 Layer 内的任务必须文件范围零重叠、无数据依赖。
     * **分组优先级**：
       1. 基础设施任务（类型定义、配置、工具函数）→ Layer 1
       2. 独立模块任务（互不依赖的功能模块）→ Layer 1 或 Layer 2（取决于是否依赖基础设施）
       3. 集成任务（路由注册、入口文件修改、跨模块连接）→ 最后一个 Layer
     * **Builder 数量控制**：单 Layer 最多 5 个并行 Builder，超出则拆分为多个 Layer。
     * **粒度把控**：单个 Builder 任务控制在 3-8 个文件以内，过大则继续拆分。
   - **文件冲突检测机制**：
     * 拆分完成后，构建文件-任务映射表：
       ```
       文件冲突检测矩阵：
       | 文件路径 | 归属任务 |
       |----------|----------|
       | src/api/user.ts | Task 1 |
       | src/api/auth.ts | Task 2 |
       ```
     * 检测规则：
       1. 同一文件出现在多个任务中 → **冲突**
       2. 同一目录下的 index 文件（如 `index.ts`）被多任务引用 → **潜在冲突**
       3. 共享配置文件（如 `routes.ts`、`store.ts`）→ **潜在冲突**
     * 冲突解决策略：
       - 提取冲突文件到独立任务（如"Task 0: 共享基础设施"）
       - 或将冲突任务设为依赖关系（后执行的任务在前一个完成后修改）
       - 用 `mcp______zhi`（`is_markdown: true`, `predefined_options: ["确认分组方案", "调整分组", "重新拆分"]`）确认最终分组方案
   - 按依赖关系分 Layer：同 Layer 可并行，跨 Layer 串行。

4. **写入计划文件**
   - 路径：`.doc/agent-teams/plans/<task-name>.md`（英文短横线命名）
   - **计划文件格式规范**：
     * 文件名：全小写英文 + 短横线分隔，如 `user-auth-module.md`
     * 编码：UTF-8 无 BOM
     * 每个子任务必须包含完整的 5 个字段：类型、文件范围、依赖、实施步骤、验收标准
     * 文件范围必须使用项目根目录的相对路径
     * 实施步骤必须具体到"创建/修改哪个文件的哪个函数"，不允许模糊描述
   - 格式：

   ```markdown
   # Team Plan: <任务名>

   ## 概述
   <一句话描述>

   ## Codex 分析摘要
   <Codex 实际返回的关键内容>

   ## Gemini 分析摘要
   <Gemini 实际返回的关键内容>

   ## 技术方案
   <综合最优方案，含关键技术决策>

   ## 子任务列表

   ### Task 1: <名称>
   - **类型**: 前端/后端/全栈/基础设施
   - **文件范围**: <精确文件路径列表，每行一个>
   - **依赖**: 无 / Task N
   - **实施步骤**:
     1. <具体步骤：动作 + 文件 + 函数/组件>
     2. <具体步骤>
   - **验收标准**: <可观测的完成条件>

   ### Task 2: <名称>
   ...

   ## 文件冲突检查
   | 文件路径 | 归属任务 | 状态 |
   |----------|----------|------|
   | src/xxx.ts | Task 1 | ✅ 唯一 |
   | src/index.ts | Task 3 (依赖 Task 1) | ⚠️ 依赖解决 |

   结论：✅ 无冲突 / ⚠️ 已通过依赖关系解决

   ## 并行分组
   - Layer 1 (并行): Task 1, Task 2 — 基础设施 + 独立模块
   - Layer 2 (依赖 Layer 1): Task 3 — 集成任务
   - 预计 Builder 数量：N 个

   ## 与 team-exec 的衔接
   - 计划确认后运行：`/ccg:team-exec`
   - team-exec 将按 Layer 顺序 spawn Builder
   - 每个 Task 段落将完整注入对应 Builder 的 prompt
   ```

5. **归档计划**
   - 计划文件写入成功后，调用 `mcp______ji`（`action: "记录"`, `category: "team-plan"`, `content: "<任务名称>|子任务数:N|Layer数:M|Builder数:K|计划文件路径"`）归档本次规划的关键信息。

6. **用户确认**
   - 展示计划摘要（子任务数、并行分组、Builder 数量）。
   - 用 `mcp______zhi`（`is_markdown: true`, `predefined_options: ["确认计划，开始实施", "修改计划", "重新规划"]`）请求确认。
   - **与 team-exec 的衔接说明**：
     * 确认后提示：`计划已就绪，运行 /ccg:team-exec 开始并行实施`
     * 计划文件是 team-exec 的唯一输入，team-exec 不做任何决策。
     * team-exec 会按 `并行分组` 章节的 Layer 顺序 spawn Builder。
     * 每个 Builder 收到的 prompt 包含对应 Task 的完整内容（类型、文件范围、实施步骤、验收标准）。
     * 如果用户修改了计划，必须重新写入文件后再运行 team-exec。

7. **上下文检查点**
   - 报告当前上下文使用量。
   - 如果接近 80K：建议 `/clear` 后运行 `/ccg:team-exec`。

**Exit Criteria**
- [ ] Codex + Gemini 分析完成
- [ ] 子任务文件范围无冲突
- [ ] 计划文件已写入 `.doc/agent-teams/plans/`
- [ ] 用户已确认计划
<!-- CCG:TEAM:PLAN:END -->
