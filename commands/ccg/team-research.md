---
description: 'Agent Teams 需求研究 - 并行探索代码库，产出约束集 + 可验证成功判据'
---
<!-- CCG:TEAM:RESEARCH:START -->
**Core Philosophy**
- Research 产出的是**约束集**，不是信息堆砌。每条约束缩小解决方案空间。
- 约束告诉后续阶段"不要考虑这个方向"，使 plan 阶段能产出零决策计划。
- 输出：约束集合 + 可验证的成功判据，写入 `.claude/team-plan/<任务名>-research.md`。

**Guardrails**
- **STOP! BEFORE ANY OTHER ACTION**: 必须先做 Prompt 增强。
- 按上下文边界（context boundaries）划分探索范围，不按角色划分。
- 多模型协作是 **mandatory**：Codex（后端边界）+ Gemini（前端边界）。
- 不做架构决策——只发现约束。
- 使用 `mcp______zhi` 解决任何歧义，绝不假设。

**Steps**
0. **MANDATORY: Prompt 增强**
   - **立即执行，不可跳过。**
   - 调用 `mcp______enhance` 增强 $ARGUMENTS（`prompt`: "$ARGUMENTS"，`project_root_path`: 当前项目根目录）。
   - 降级：`mcp______enhance` 不可用 → 使用 `mcp__ace-tool__enhance_prompt`。
   - 再降级：都不可用 → **Claude 自增强**：
     1. 分析 $ARGUMENTS 的意图、缺失信息、隐含假设
     2. 按 6 原则（明确性、完整性、结构化、可验证、保留意图、项目感知）补全为结构化需求
     3. 输出格式：`[目标]：… / [范围]：… / [技术约束]：… / [验收标准]：…`
     4. 通过 `mcp______zhi` 确认，标注增强模式为"自增强"和降级原因
   - 后续所有步骤使用增强后的需求。

1. **代码库评估**
   - 如果 `mcp__ace-tool__search_context` 可用，优先语义检索项目结构和相关代码。
   - 降级：`mcp__ace-tool__search_context` 不可用 → 使用 `mcp______sou` 语义搜索。
   - 再降级：都不可用 → 用 Glob/Grep/Read 扫描项目结构。
   - 判断项目规模：单目录 vs 多目录。
   - 识别技术栈、框架、现有模式。

2. **定义探索边界（按上下文划分）**
   - 识别自然的上下文边界（不是功能角色）：
     * 边界 1：用户域代码（models, services, UI）
     * 边界 2：认证与授权（middleware, session, tokens）
     * 边界 3：基础设施（configs, builds, deployments）
   - 每个边界应自包含，无需跨边界通信。
   - **并行探索策略**：
     * Codex 和 Gemini 分别负责不同的上下文边界，而非相同范围的重复扫描。
     * Codex 专注：后端服务、数据模型、API 层、中间件、数据库交互。
     * Gemini 专注：前端组件、页面路由、状态管理、样式系统、用户交互。
     * 共享边界（如 API 类型定义、共享工具函数）由双方同时探索，聚合时交叉验证。
     * 若项目为纯前端或纯后端，两个模型分别探索不同的上下文边界（如：核心业务 vs 基础设施），而非重复扫描同一范围。

3. **多模型并行探索（PARALLEL）**
   - **CRITICAL**: 必须在一条消息中同时发起两个 Bash 调用。
   - **工作目录**：使用 `{{WORKDIR}}`（当前工作目录的绝对路径）。

   **FIRST Bash call (Codex)**:
   ```
   Bash({
     command: "{{CCG_BIN}} {{LITE_MODE_FLAG}}--backend codex - \"{{WORKDIR}}\" <<'EOF'\nROLE_FILE: ~/.claude/.ccg/prompts/codex/analyzer.md\n<TASK>\n需求：<增强后的需求>\n探索范围：后端相关上下文边界\n</TASK>\nOUTPUT (JSON):\n{\n  \"module_name\": \"探索的上下文边界\",\n  \"existing_structures\": [\"发现的关键模式\"],\n  \"existing_conventions\": [\"使用中的规范\"],\n  \"constraints_discovered\": [\"限制解决方案空间的硬约束\"],\n  \"open_questions\": [\"需要用户确认的歧义\"],\n  \"dependencies\": [\"跨模块依赖\"],\n  \"risks\": [\"潜在阻碍\"],\n  \"success_criteria_hints\": [\"可观测的成功行为\"]\n}\nEOF",
     run_in_background: true,
     timeout: 3600000,
     description: "Codex 后端探索"
   })
   ```

   **SECOND Bash call (Gemini) - IN THE SAME MESSAGE**:
   ```
   Bash({
     command: "{{CCG_BIN}} {{LITE_MODE_FLAG}}--backend gemini {{GEMINI_MODEL_FLAG}}- \"{{WORKDIR}}\" <<'EOF'\nROLE_FILE: ~/.claude/.ccg/prompts/gemini/analyzer.md\n<TASK>\n需求：<增强后的需求>\n探索范围：前端相关上下文边界\n</TASK>\nOUTPUT (JSON):\n{\n  \"module_name\": \"探索的上下文边界\",\n  \"existing_structures\": [\"发现的关键模式\"],\n  \"existing_conventions\": [\"使用中的规范\"],\n  \"constraints_discovered\": [\"限制解决方案空间的硬约束\"],\n  \"open_questions\": [\"需要用户确认的歧义\"],\n  \"dependencies\": [\"跨模块依赖\"],\n  \"risks\": [\"潜在阻碍\"],\n  \"success_criteria_hints\": [\"可观测的成功行为\"]\n}\nEOF",
     run_in_background: true,
     timeout: 3600000,
     description: "Gemini 前端探索"
   })
   ```

   **等待结果**:
   ```
   TaskOutput({ task_id: "<codex_task_id>", block: true, timeout: 600000 })
   TaskOutput({ task_id: "<gemini_task_id>", block: true, timeout: 600000 })
   ```

4. **聚合与综合**
   - 合并所有探索输出为统一约束集：
     * **硬约束（HC）**：技术限制、不可违反的模式。违反将导致功能不可用或系统错误。
     * **软约束（SC）**：惯例、偏好、风格指南。偏离不会阻断功能但影响一致性。
     * **依赖（DEP）**：影响实施顺序的跨模块关系。明确方向性（A → B 表示 A 必须先于 B）。
     * **风险（RISK）**：需要缓解的阻碍。每条风险必须附带缓解策略。
   - **约束集输出格式规范**：
     * 每条约束使用统一编号：`[类型-序号]`，如 `[HC-1]`、`[SC-3]`、`[DEP-2]`、`[RISK-1]`。
     * 每条约束必须包含：描述、来源（Codex/Gemini/用户/代码分析）、影响范围（涉及的文件或模块）。
     * 约束间如有冲突，标记 `CONFLICT` 并记录双方编号，在歧义消解阶段处理。
     * 约束集应按优先级排序：硬约束 > 依赖 > 风险 > 软约束。

5. **歧义消解**
   - 编译优先级排序的开放问题列表。
   - 用 `mcp______zhi` 系统性地呈现（`is_markdown: true`，使用 `predefined_options` 提供选项）：
     * 分组相关问题
     * 为每个问题提供上下文
     * 在适用时建议默认值
   - 将用户回答转化为额外约束。

6. **写入研究文件**
   - 路径：`.claude/team-plan/<任务名>-research.md`
   - 格式：

   ```markdown
   # Team Research: <任务名>

   ## 增强后的需求
   <结构化需求描述>

   ## 约束集

   ### 硬约束
   - [HC-1] <约束描述> — 来源：<Codex/Gemini/用户>
   - [HC-2] ...

   ### 软约束
   - [SC-1] <约束描述> — 来源：<Codex/Gemini/用户>
   - [SC-2] ...

   ### 依赖关系
   - [DEP-1] <模块A> → <模块B>：<原因>

   ### 风险
   - [RISK-1] <风险描述> — 缓解：<策略>

   ## 成功判据

   每条判据必须满足：可观测、可自动化验证、无主观评价。

   | 编号 | 类型 | 判据描述 | 验证方式 | 关联约束 |
   |------|------|----------|----------|----------|
   | OK-1 | 功能 | <预期行为> | <命令/断言/手动步骤> | HC-1, SC-2 |
   | OK-2 | 性能 | <指标阈值> | <测量方法> | RISK-1 |
   | OK-3 | 回归 | 现有测试全部通过 | <测试命令> | - |

   **判据类型**：
   - **功能**：系统行为符合预期（API 返回、UI 渲染、数据流转）
   - **性能**：响应时间、吞吐量、资源消耗等可量化指标
   - **兼容**：浏览器兼容、API 向后兼容、数据迁移兼容
   - **安全**：无新增漏洞、权限控制正确、数据加密符合要求
   - **回归**：现有功能未被破坏（现有测试全部通过）

   ## 开放问题（已解决）
   - Q1: <问题> → A: <用户回答> → 约束：[HC/SC-N]
   ```

7. **归档研究成果**
   - 使用 `mcp______ji` 归档本次研究的关键约束和成功判据：
     * 存储约束集摘要（硬约束 + 关键依赖）
     * 存储成功判据列表
     * 存储任务名和研究文件路径
   - 归档格式：`key: "team-research:<任务名>"`，`value: "<约束集摘要 + 成功判据>"`

8. **上下文检查点**
   - 报告当前上下文使用量。
   - 提示：`研究完成，运行 /clear 后执行 /ccg:team-plan <任务名> 开始规划`

**与 team-plan 的衔接**

研究文件 `<任务名>-research.md` 是 team-plan 阶段的唯一输入。衔接要求：
- **文件命名**：研究文件 `<任务名>-research.md` 与计划文件 `<任务名>.md` 共用同一 `<任务名>`。
- **约束传递**：team-plan 必须读取研究文件中的全部约束，不得遗漏。每条硬约束必须在计划的子任务中体现为具体的实施约束或验收标准。
- **成功判据映射**：研究阶段的 `OK-*` 判据在 team-plan 中转化为子任务的验收标准。team-plan 阶段不应新增判据，只能细化。
- **依赖关系继承**：`DEP-*` 依赖直接影响 team-plan 的并行分组（Layer 划分）。
- **风险传递**：`RISK-*` 风险在 team-plan 中需要有对应的缓解措施体现在实施步骤中。

**Exit Criteria**
- [ ] Codex + Gemini 探索完成
- [ ] 所有歧义已通过用户确认解决
- [ ] 约束集 + 成功判据已写入研究文件
- [ ] 零开放问题残留
<!-- CCG:TEAM:RESEARCH:END -->
