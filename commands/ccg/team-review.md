---
description: 'Agent Teams 审查 - 双模型交叉审查并行实施的产出，分级处理 Critical/Warning/Info'
---
<!-- CCG:TEAM:REVIEW:START -->
**Core Philosophy**
- 双模型交叉验证捕获单模型审查遗漏的盲区。
- Critical 问题必须修复后才能结束。
- 审查范围严格限于 team-exec 的变更，不扩大范围。

**Guardrails**
- **MANDATORY**: Codex 和 Gemini 必须都完成审查后才能综合。
- 审查范围限于 `git diff` 的变更，不做范围蔓延。
- Lead 可以直接修复 Critical 问题（审查阶段允许写代码）。

---

## Level 2: 命令层执行

**执行方式**：主代理直接执行 + 外部模型协作

**工作流**：7 个阶段（收集变更产物 → 多模型审查 → 综合发现 → 输出审查报告 → 决策门 → 归档审查结果 → 上下文检查点）

---

## Level 3: 工具层执行

**主代理调用的工具**：
- Git 操作：Bash（git diff）
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Grep/Glob
- 计划读取：Read 工具
- 用户确认：`mcp______zhi` → `AskUserQuestion`
- 知识存储：`mcp______ji` → 本地文件
- 代码修复：Read/Edit/Write 工具（修复 Critical 问题时）
- 外部模型：Codex + Gemini（双模型交叉审查）

**详细说明**：参考 [架构文档 - 工具调用优先级](./.doc/framework/ccg/ARCHITECTURE.md#工具调用优先级)

---

**Steps**
1. **收集变更产物**
   - 运行 `git diff` 获取变更摘要。
   - 如果有 `.claude/team-plan/` 下的计划文件，读取约束和成功判据作为审查基准。
   - 如需检索相关上下文（如原始实现代码），优先使用 `mcp__ace-tool__search_context`，降级到 `mcp______sou`。
   - 列出所有被修改的文件。
   - **与 team-exec 产出的对接**：
     * 读取 team-exec 输出的变更摘要表（Builder/子任务/状态/修改文件）。
     * 对照计划文件的子任务列表，确认所有子任务已实施（或明确标记为失败）。
     * 失败的子任务：记录失败原因，对应文件不纳入审查范围。
     * 将 team-exec 的每个 Builder 产出与其对应的文件范围约束对比，检查是否有越界修改（修改了文件范围之外的文件）。越界修改自动标记为 Critical。

2. **多模型审查（PARALLEL）**
   - **CRITICAL**: 必须在一条消息中同时发起两个 Bash 调用。
   - **工作目录**：使用 `{{WORKDIR}}`（当前工作目录的绝对路径）。

   **FIRST Bash call (Codex)**:
   ```
   Bash({
     command: "{{CCG_BIN}} {{LITE_MODE_FLAG}}--backend codex - \"{{WORKDIR}}\" <<'EOF'\nROLE_FILE: ~/.claude/.ccg/prompts/codex/reviewer.md\n<TASK>\n审查以下变更：\n<git diff 输出或变更文件列表>\n</TASK>\nOUTPUT (JSON):\n{\n  \"findings\": [\n    {\n      \"severity\": \"Critical|Warning|Info\",\n      \"dimension\": \"logic|security|performance|error_handling\",\n      \"file\": \"path/to/file\",\n      \"line\": 42,\n      \"description\": \"问题描述\",\n      \"fix_suggestion\": \"修复建议\"\n    }\n  ],\n  \"passed_checks\": [\"已验证的检查项\"],\n  \"summary\": \"总体评估\"\n}\nEOF",
     run_in_background: true,
     timeout: 3600000,
     description: "Codex 后端审查"
   })
   ```

   **SECOND Bash call (Gemini) - IN THE SAME MESSAGE**:
   ```
   Bash({
     command: "{{CCG_BIN}} {{LITE_MODE_FLAG}}--backend gemini {{GEMINI_MODEL_FLAG}}- \"{{WORKDIR}}\" <<'EOF'\nROLE_FILE: ~/.claude/.ccg/prompts/gemini/reviewer.md\n<TASK>\n审查以下变更：\n<git diff 输出或变更文件列表>\n</TASK>\nOUTPUT (JSON):\n{\n  \"findings\": [\n    {\n      \"severity\": \"Critical|Warning|Info\",\n      \"dimension\": \"patterns|maintainability|accessibility|ux|frontend_security\",\n      \"file\": \"path/to/file\",\n      \"line\": 42,\n      \"description\": \"问题描述\",\n      \"fix_suggestion\": \"修复建议\"\n    }\n  ],\n  \"passed_checks\": [\"已验证的检查项\"],\n  \"summary\": \"总体评估\"\n}\nEOF",
     run_in_background: true,
     timeout: 3600000,
     description: "Gemini 前端审查"
   })
   ```

   **等待结果**:
   ```
   TaskOutput({ task_id: "<codex_task_id>", block: true, timeout: 600000 })
   TaskOutput({ task_id: "<gemini_task_id>", block: true, timeout: 600000 })
   ```

   **双模型交叉验证流程**：
   1. 等待两个模型均返回结果后才进入综合阶段（任一超时则记录并继续）。
   2. 对比两个模型的发现列表：
      - **共识发现**：两个模型都报告的问题，可信度高，直接采纳。
      - **独有发现**：仅一个模型报告的问题，需要 Lead 二次确认：
        * Codex 独有的后端问题（logic/security/performance）→ 信任 Codex，直接采纳。
        * Gemini 独有的前端问题（patterns/accessibility/ux）→ 信任 Gemini，直接采纳。
        * 非专长领域的独有发现（如 Gemini 发现后端逻辑问题）→ Lead 读取相关代码验证后决定。
   3. 对比两个模型的 `passed_checks` 列表，如果一方标记通过但另一方发现该维度有问题，以发现问题的一方为准。

3. **综合发现**
   - 合并两个模型的发现。
   - 去重重叠问题（同一文件同一行的相似描述视为重叠，保留更详细的那条）。
   - 按严重性分级：

   **分级处理规则详细定义**：

   | 级别 | 判定标准 | 处理方式 | 典型示例 |
   |------|----------|----------|----------|
   | **Critical** | 影响系统安全、数据完整性或核心功能正确性 | 必须修复，阻塞审查通过 | SQL 注入、XSS、逻辑错误导致数据丢失、未处理的空指针、竞态条件 |
   | **Warning** | 偏离项目规范、影响可维护性或可能导致未来问题 | 建议修复，不阻塞但记录 | 命名不一致、缺少错误处理、代码重复、违反项目模式约定 |
   | **Info** | 改进建议、优化空间、风格偏好 | 可选修复，记录供参考 | 更优的算法选择、注释改进建议、微小性能优化 |

   **升降级规则**：
   - 两个模型对同一问题给出不同严重性时，取较高级别。
   - 如果 Warning 问题在多处重复出现（>=3 处），升级为 Critical（系统性问题）。
   - 如果 Critical 问题有可靠的现有防护（如框架自动转义），可降级为 Warning（需说明理由）。

4. **输出审查报告**
   - 路径：`.claude/team-plan/<任务名>-review.md`
   - 同时在终端输出摘要。
   - 格式：

   ```markdown
   # Team Review: <任务名>

   ## 审查概况

   | 指标 | 值 |
   |------|-----|
   | 审查文件数 | N |
   | 变更行数 | +X / -Y |
   | Codex 发现数 | A |
   | Gemini 发现数 | B |
   | 共识发现数 | C |
   | 最终发现数（去重后） | D |

   ## 发现详情

   ### Critical (X issues) - 必须修复

   | # | 维度 | 文件:行 | 描述 | 来源 | 修复建议 |
   |---|------|---------|------|------|----------|
   | 1 | 安全 | file.ts:42 | 描述 | Codex+Gemini | 建议 |
   | 2 | 逻辑 | api.ts:15 | 描述 | Codex | 建议 |

   ### Warning (Y issues) - 建议修复

   | # | 维度 | 文件:行 | 描述 | 来源 | 修复建议 |
   |---|------|---------|------|------|----------|
   | 1 | 模式 | utils.ts:88 | 描述 | Gemini | 建议 |

   ### Info (Z issues) - 可选

   | # | 维度 | 文件:行 | 描述 | 来源 |
   |---|------|---------|------|------|
   | 1 | 维护 | helper.ts:20 | 描述 | Codex |

   ## 已通过检查
   - 无 XSS 漏洞
   - 错误处理完整
   - 类型安全无违规

   ## 约束合规检查
   （对照 research 阶段的约束集逐条检查）

   | 约束编号 | 约束描述 | 合规状态 | 备注 |
   |----------|----------|----------|------|
   | HC-1 | <描述> | PASS/FAIL | <说明> |
   | SC-1 | <描述> | PASS/FAIL | <说明> |

   ## 成功判据验证
   （对照 research 阶段的成功判据逐条验证）

   | 判据编号 | 判据描述 | 验证状态 | 验证方式 |
   |----------|----------|----------|----------|
   | OK-1 | <描述> | PASS/FAIL | <实际验证命令或结果> |
   | OK-2 | <描述> | PASS/FAIL | <实际验证命令或结果> |
   ```

5. **决策门**
   - **Critical > 0**:
     * 展示发现，用 `mcp______zhi` 询问（`is_markdown: true`，`predefined_options: ["立即修复", "跳过"]`）
     * 选择修复 → Lead 直接修复（后端问题参考 Codex 建议，前端参考 Gemini 建议）
     * 修复后重新运行受影响的审查维度
     * 重复直到 Critical = 0
   - **Critical = 0**:
     * 报告通过，建议提交代码

6. **归档审查结果**
   - 使用 `mcp______ji` 归档本次审查的关键数据：
     * 存储审查摘要（发现数、Critical/Warning/Info 分布）
     * 存储约束合规状态和成功判据验证结果
     * 存储审查报告文件路径
   - 归档格式：`key: "team-review:<任务名>"`，`value: "<审查摘要 + 合规状态>"`

7. **上下文检查点**
   - 报告当前上下文使用量。
   - 审查通过后提示：`审查完成，建议运行 /ccg:commit 提交代码`

**Exit Criteria**
- [ ] Codex + Gemini 审查完成
- [ ] 所有发现已综合分级
- [ ] Critical = 0（已修复或用户确认跳过）
- [ ] 审查报告已写入 `.claude/team-plan/<任务名>-review.md`
- [ ] 约束合规检查全部 PASS（或已说明理由）
- [ ] 成功判据验证全部 PASS（或已说明理由）
<!-- CCG:TEAM:REVIEW:END -->
