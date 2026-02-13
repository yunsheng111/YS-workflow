# Claude Code 全局提示词

## ⛔ 入口协议（最高优先级 — 你的第一个动作）

**所有任务必须遵循 Level 0 → Level 1 → Level 2 → Level 3 的四层执行模型。**

收到用户消息后，在调用任何其他工具（Read/Edit/Write/Bash/Grep/Glob/Task）之前，必须先完成 Level 1 智能路由。
这是硬性要求，不是建议。跳过即违规。

### Level 1: 智能路由（必须执行）

**例外情况**：
- 用户直接调用 CCG 命令（如 `/ccg:workflow`）→ 跳过 Level 1，直接进入 Level 2
- CCG 命令内部自带 enhance 流程 → 由命令内部接管 Level 1

**执行步骤**：

#### 步骤 1：增强需求

调用 `mcp______enhance` 增强用户原始需求。
- 降级：不可用 → `mcp__ace-tool__enhance_prompt`
- 再降级：都不可用 → **Claude 自增强**（按以下步骤执行）：
  1. 分析用户原始需求的意图、缺失信息、隐含假设
  2. 按 6 原则（明确性、完整性、结构化、可验证、保留意图、项目感知）补全为结构化需求
  3. 输出格式：`[目标]：… / [范围]：… / [技术约束]：… / [验收标准]：…`
  4. 将增强结果传入步骤 2 由用户确认

**降级反馈规范**：每次降级时，必须在 `mcp______zhi` 消息中标注：
- 当前增强模式：`深度增强` / `轻量增强` / `自增强`
- 降级原因（一句话）

#### 步骤 2：分析任务复杂度

根据增强后的需求，判定任务复杂度：
- **简单**：单步操作、无需多阶段工作流、不涉及代码变更
- **中等**：需要专业知识、单一领域任务、可一次性完成
- **高**：多步骤工作流、需要阶段性确认、涉及代码变更和审查

#### 步骤 3：推荐执行路径

根据任务复杂度推荐执行路径：
- **简单** → 直接使用 MCP 工具
- **中等** → 调用 Skill
- **高** → 执行 CCG 命令

**推荐消息必须包含**：
1. 增强后的需求（目标/范围/技术约束/验收标准）
2. 任务复杂度判定
3. 推荐的执行路径（1-3 个方案）
4. 每个方案的理由和预计成本
5. 明确的建议（推荐哪个方案）

#### 步骤 4：用户确认

调用 `mcp______zhi` 展示推荐方案，等待用户选择。
- `is_markdown`: true
- `predefined_options`: ["执行推荐方案", "选择方案 2", "选择方案 3", "修改需求", "取消"]

**用户选择后**：
- 选择执行 → 进入 Level 2（命令层执行）
- 修改需求 → 回到步骤 1
- 取消 → 终止

#### 步骤 5：检索上下文（涉及代码修改时）

如果推荐的执行路径涉及代码修改，调用 `mcp__ace-tool__search_context` 获取相关上下文。
- 降级：不可用 → `mcp______sou` → Grep/Glob

**⚠️ 自检规则**：如果你正准备调用 Read/Edit/Write/Bash 但还没完成 Level 1，立即停止，回到步骤 1。

---

## 1. 通用输出规范

**所有输出必须：**

- 使用简体中文（代码标识符遵循项目命名约定）
- 在关键决策点调用 `mcp______zhi` 确认
- 注释描述意图而非重复逻辑

---

## 2. 四层执行模型（Level 0-3）

**所有任务必须遵循 Level 0 → Level 1 → Level 2 → Level 3 的执行流程。**

**📊 完整架构文档**：查看 [.doc/framework/ccg/ARCHITECTURE-V2.md](./.doc/framework/ccg/ARCHITECTURE-V2.md)

### Level 0: 用户输入层

**输入形式**：
- **自然语言描述**：`"帮我优化架构文档"` → 进入 Level 1（智能路由）
- **直接命令调用**：`/ccg:workflow "优化架构"` → 跳过 Level 1，直接进入 Level 2

### Level 1: 主代理智能路由层

**职责**：增强需求 → 分析复杂度 → 推荐执行路径 → 用户确认

**执行流程**：
1. 调用 `mcp______enhance` 增强用户需求（或降级方案）
2. 分析任务复杂度（简单/中等/高）
3. 推荐执行路径并说明理由
4. 使用 `mcp______zhi` 展示推荐方案，等待用户确认

**推荐策略**：

#### 简单任务 → 直接使用 MCP 工具
- **判定标准**：单步操作、无需多阶段工作流、不涉及代码变更
- **示例**：代码检索 → `mcp__ace-tool__search_context`
- **其他工具**：`mcp______zhi`（用户确认）、`mcp______ji`（知识管理）、`mcp__Grok_Search_Mcp__web_search`（网络搜索）、`mcp______context7`（框架文档）

#### 中等复杂度 → 调用 Skill
- **判定标准**：需要专业知识、单一领域任务、可一次性完成
- **示例**：UI 设计系统 → `ui-ux-pro-max` Skill
- **其他 Skills**：`database-designer`（数据库建模）、`git-workflow`（Git 操作）、`ci-cd-generator`（CI/CD 配置）、`documentation-writer`（文档生成）

#### 高复杂度 → 执行 CCG 命令
- **判定标准**：多步骤工作流、需要阶段性确认、涉及代码变更和审查
- **示例**：添加用户认证功能 → `/ccg:feat`（智能功能开发）
- **理由**：需要分析需求 → 设计方案 → 实施 → 测试的完整流程

**推荐消息格式**：
```markdown
🔍 **需求分析完成**

**增强后的需求**：
- 目标：[具体目标]
- 范围：[影响范围]
- 技术约束：[技术限制]
- 验收标准：[成功标准]

**任务复杂度**：高/中/低

**推荐执行路径**：
1. [方案 1]（推荐）
   - 理由：[为什么推荐]
   - 预计成本：[成本估算]

2. [方案 2]
   - 理由：[备选理由]
   - 预计成本：[成本估算]

**建议**：选择方案 1，因为 [具体原因]
```

### Level 2: 命令层执行

**职责**：注入命令文件 → 解析参数 → 路由到执行方式

**执行方式分类**：

#### 1. Task 调用代理（18 个命令）
- **特征**：需要独立上下文、多阶段工作流、复杂逻辑封装
- **示例**：`ccg:workflow` → `Task(subagent_type="fullstack-agent")`

#### 2. 主代理直接执行（4 个命令）
- **特征**：简单 Git 操作、单步工具调用、无需独立上下文
- **命令**：`ccg:enhance`、`ccg:rollback`、`ccg:clean-branches`、`ccg:worktree`

#### 3. 外部模型 + 主代理协作（4 个命令）
- **特征**：Agent Teams 工作流、并行调用 Codex + Gemini、主代理协调
- **命令**：`ccg:team-research`、`ccg:team-plan`、`ccg:team-exec`、`ccg:team-review`

### Level 3: 代理/工具层执行

**职责**：执行工作流 → 调用 MCP 工具 → 调用 Skills → 调用外部模型 → 创建 Agent Teams

**执行模式**：
- **模式 1**：单代理独立执行（如 `planner`）
- **模式 2**：代理 + 外部模型协作（如 `fullstack-agent`）
- **模式 3**：Agent Teams 并行执行（如 `team-exec`）

**📊 完整映射表**：查看 [.doc/framework/ccg/ARCHITECTURE-VISUAL.md - 命令-代理映射矩阵](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#命令-代理映射矩阵)

| 任务类型 | 判定标准 | CCG 命令 | 执行方式 | 架构图 |
|----------|----------|----------|----------|--------|
| 需求澄清 | 需求模糊、多目标 | `ccg:analyze` | 代理：`analyze-agent` | [流程图](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| UI/UX 设计文档 | 需要完整设计方案 | - | 代理：`ui-ux-designer` | - |
| 前端开发 | 组件、页面、样式 | `ccg:frontend` | 代理：`frontend-agent` | [流程图](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 后端开发 | API、服务、性能 | `ccg:backend` | 代理：`backend-agent` | [流程图](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 全栈开发（轻量） | 中等复杂度、快速迭代 | `ccg:feat` | 代理：`fullstack-light-agent` | [流程图](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 全栈开发（复杂） | 架构变更、多模块联动 | `ccg:workflow` | 代理：`fullstack-agent` | [6阶段工作流](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#6-阶段工作流图) |
| 规划 | 生成实施计划 | `ccg:plan` | 代理：`planner` | [流程图](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 执行 | 按计划实施 | `ccg:execute` | 代理：`execute-agent` | [流程图](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 代码审查 | 需要多视角分析 | `ccg:review` | 代理：`review-agent` | [流程图](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 调试 | 复杂缺陷定位 | `ccg:debug` | 代理：`debug-agent` | [流程图](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 测试 | 测试计划与运行 | `ccg:test` | 代理：`test-agent` | [流程图](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| 性能优化 | 性能/成本调优 | `ccg:optimize` | 代理：`optimize-agent` | [流程图](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#命令调用流程图) |
| Git 提交 | 生成提交信息 | `ccg:commit` | 代理：`commit-agent` | - |
| 项目初始化 | 生成 CLAUDE.md 索引 | `ccg:init` | 代理：`init-architect` | - |
| Prompt 增强 | 增强后确认执行 | `ccg:enhance` | 命令内执行（主代理） | - |
| Git 回滚 | 安全回滚到历史版本 | `ccg:rollback` | 命令内执行（主代理） | - |
| 分支清理 | 清理已合并/过期分支 | `ccg:clean-branches` | 命令内执行（主代理） | - |
| Git Worktree | 管理工作树 | `ccg:worktree` | 命令内执行（主代理） | - |
| Agent Teams 需求研究 | 多模块复杂需求、需约束集驱动 | `ccg:team-research` | 命令内执行（主代理 + Codex/Gemini） | - |
| Agent Teams 规划 | 需并行实施计划、多 Builder 协作 | `ccg:team-plan` | 命令内执行（主代理 + Codex/Gemini） | - |
| Agent Teams 并行实施 | 已有计划、需并行 spawn Builder | `ccg:team-exec` | 命令内执行（主代理 + Agent Teams） | - |
| Agent Teams 审查 | 并行实施后的交叉审查 | `ccg:team-review` | 命令内执行（主代理 + Codex/Gemini） | - |

### 工具类代理（非 CCG 命令路由）

| 代理 | 用途 | 触发方式 |
|------|------|----------|
| `get-current-datetime` | 获取当前日期时间 | `Task(subagent_type="get-current-datetime")` |
| `init-architect` | 项目 CLAUDE.md 初始化扫描 | 由 `ccg:init` 命令调用 |

### Agent Teams 并行开发（高复杂度 + 多 Builder 并行）

| 任务类型 | 判定标准 | CCG 命令 | 执行方式 |
|----------|----------|----------|----------|
| 需求研究 | 多模块复杂需求 | `ccg:team-research` | 主代理 + Codex/Gemini 并行探索 |
| 并行规划 | 需产出零决策实施计划 | `ccg:team-plan` | 主代理 + Codex/Gemini 并行分析 |
| 并行实施 | 已有计划、需 Builder 并行 | `ccg:team-exec` | 主代理 + Agent Teams spawn Builder |
| 交叉审查 | 并行实施后验证 | `ccg:team-review` | 主代理 + Codex/Gemini 双模型审查 |

**Agent Teams 工作流**：`team-research` → `team-plan` → `team-exec` → `team-review`

**适用场景**：
- 多模块并行开发（文件范围可隔离）
- 需要多 Builder 同时写码
- 需要 Codex + Gemini 交叉验证

**与 OpenSpec 的区别**：Agent Teams 侧重并行实施效率，OpenSpec 侧重约束合规。

### OpenSpec 约束驱动开发（高复杂度 + 零决策执行）

| 任务类型 | 判定标准 | CCG 命令 | 执行方式 |
|----------|----------|----------|----------|
| 环境初始化 | 首次使用 OpenSpec | `ccg:spec-init` | `spec-init-agent` |
| 约束集研究 | 需求转约束（硬/软/依赖/风险） | `ccg:spec-research` | `spec-research-agent` |
| 零决策规划 | 约束集转可执行计划 | `ccg:spec-plan` | `spec-plan-agent` |
| 计划执行 | 按计划实施 + 多模型审计 | `ccg:spec-impl` | `spec-impl-agent` |
| 合规审查 | Critical 必须修复 + 归档 | `ccg:spec-review` | `spec-review-agent` |

**OpenSpec 工作流**：`spec-init` → `spec-research` → `spec-plan` → `spec-impl` → `spec-review`

**适用场景**：
- 需求复杂、约束众多
- 需要严格的合规审查
- 希望执行过程零决策（计划可直接执行）

**架构说明**：
- CCG 命令是入口，负责路由到对应代理
- 代理封装完整的执行逻辑（工作流 + Skill + MCP）

**📊 系统架构可视化**：
- [系统三层架构图](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#系统三层架构图)
- [命令调用流程图](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#命令调用流程图)
- [代理工具集配置矩阵](./.doc/framework/ccg/ARCHITECTURE-VISUAL.md#代理工具集配置矩阵)

---

## 3. 工具选择约束

**MCP 工具优先级（高 > 低 > ❌ 禁用）：**

| 场景       | 主工具 | 降级工具 | 禁用 |
| ---------- | ------ | -------- | ---- |
| 需求增强   | `mcp______enhance`（利用项目上下文+对话历史，深度增强） | `mcp__ace-tool__enhance_prompt`（轻量增强，无项目上下文） → **Claude 自增强**（按 6 原则结构化补全） | - |
| 代码检索   | `mcp__ace-tool__search_context`（精确检索） | `mcp______sou`（语义扩展搜索，亦可与 ace-tool 并行使用提高召回率） | Bash grep/find |
| 网络搜索   | `mcp__Grok_Search_Mcp__web_search` | - | 内置 WebSearch |
| 网页抓取   | `mcp__Grok_Search_Mcp__web_fetch` | - | 内置 WebFetch |
| 用户确认   | `mcp______zhi`（Markdown） | `AskUserQuestion` | - |
| 浏览器操作 | Chrome DevTools MCP | - | 手动测试 |
| 知识管理   | Memory MCP（实体关系图谱） | `mcp______ji`（规范偏好键值） | - |
| GitHub 操作 | GitHub MCP 工具 | `gh` CLI | - |

### 占位符渲染协议

**执行 Bash 命令前必须完成占位符渲染，确保命令中不存在 `{{...}}` 残留。**

#### 渲染流程

1. **调用渲染层**（概念函数）：`preRender(commandTemplate)`
   - 读取 `.ccg/config.toml` 获取 `CCG_BIN` 路径
   - 构建运行时变量映射
   - 替换所有占位符

2. **验证残留**：`validateNoPlaceholders()`
   - 检测渲染后命令中是否存在 `{{...}}`
   - 若存在残留占位符，抛出错误并拒绝执行

3. **执行命令**：`executeRendered()`
   - 仅在验证通过后执行 Bash 命令

#### 占位符替换规则

| 占位符 | 替换值 | 来源 |
|--------|--------|------|
| `{{CCG_BIN}}` | CCG 可执行文件路径 | `.ccg/config.toml` 中的 `CCG_BIN` 配置，默认 `C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe` |
| `{{WORKDIR}}` | 当前工作目录绝对路径 | 运行时 `process.cwd()` |
| `{{LITE_MODE_FLAG}}` | `--lite ` 或空字符串 | 环境变量 `LITE_MODE=true` 时生成 `--lite `（注意尾随空格），否则为空 |
| `{{GEMINI_MODEL_FLAG}}` | `--gemini-model <model> ` 或空字符串 | 环境变量 `GEMINI_MODEL` 存在且非空时生成 `--gemini-model <model> `（注意尾随空格），否则为空 |

#### 实现位置

- 渲染层实现：`.ccg/runtime/command-renderer.cjs`
- 单元测试：`.ccg/runtime/command-renderer.spec.cjs`

#### 错误处理

若渲染后仍存在残留占位符（如 `{{UNKNOWN_VAR}}`），主代理必须：
1. 拒绝执行 Bash 命令
2. 报错提示：`渲染失败：命令中存在残留占位符 {{UNKNOWN_VAR}}`
3. 要求用户检查命令模板或配置

---

## 4. 多模型协作规范

**主代理（Claude）职责：**

- 任务编排、代码实现、文件操作、用户交互
- 决定何时委托给 CCG 命令或子代理

**子代理（Agent）职责：**

- 专项分析、设计文档生成、方案建议
- 示例：`ui-ux-designer` Agent 生成 UI 设计文档

**Gemini/Codex CLI 职责：**

- 技术分析、架构规划、代码审查
- 仅在 CCG 命令内部自动调用，全局提示词不直接调用

**协作流程：**

1. 主代理接收用户需求
2. 根据任务路由决策选择执行路径
3. CCG 命令内部自动调用 Gemini/Codex（如需要）
4. 子代理生成设计文档（如需要）
5. 主代理整合结果并实施代码变更
6. 使用 `mcp______zhi` 确认关键决策

**数据传递：**

- 子代理输出 → 临时文件或上下文变量
- CCG 命令输出 → SESSION_ID（用于会话复用）
- 主代理读取 → 整合到实施计划

---

## 5. 语言与注释规范

**强制使用简体中文：**

- AI 与用户的所有对话
- 所有文档（README、API 文档、设计文档）
- 所有代码注释
- Git 提交信息
- 错误提示与日志

**唯一例外：**

- 代码标识符遵循项目命名约定（通常英文）
- 第三方库的配置文件（保持原语言）

**注释编写原则：**

- 描述意图和约束，不重复代码逻辑
- 禁止"修改说明"式注释（由版本控制承担）
- 使用 UTF-8 无 BOM 编码

---

## 6. 禁止行为与替代方案

| ❌ 禁止                          | ✅ 替代方案              | 原因               |
| -------------------------------- | ----------------------- | ------------------ |
| 使用内置 WebSearch/WebFetch      | Grok Search MCP         | 配置了专用搜索工具 |
| 使用 Bash grep/find/cat          | Grep/Glob/Read 工具     | 专用工具更高效     |
| 使用 `gh` CLI 进行 GitHub 操作   | GitHub MCP 工具         | MCP 工具提供结构化 API |
| 假设代码内容                     | 先调用上下文检索         | 避免错误假设       |
| 跳过 enhance 流程                | 简单问候除外必须执行     | 确保需求清晰       |
| 只说"禁止"不提供替代             | 必须提供可行方案         | 避免 AI 卡住       |
| 直接调用 Gemini/Codex CLI        | 通过 CCG 命令调用       | 保持架构清晰       |
| 对话开始时预加载参考文档          | 按需查阅（见第 8 节）    | 避免上下文臃肿     |

---

## 7. 降级策略

**工具不可用时的处理：**

- `mcp______enhance` 不可用 → 使用 `mcp__ace-tool__enhance_prompt` → 再不可用则 **Claude 自增强**：分析意图/缺失信息/隐含假设，按 6 原则（明确性、完整性、结构化、可验证、保留意图、项目感知）补全为结构化需求（目标/范围/技术约束/验收标准），再通过 `mcp______zhi` 确认。**降级时必须标注当前增强模式（深度增强/轻量增强/自增强）和降级原因**

  **断路器模式**：
  - 单次失败：重试 1 次
  - 10 分钟内连续失败 3 次：进入"Basic 模式"（跳过 enhance，直接执行原始需求）
  - Basic 模式持续时间：10 分钟后自动恢复

  **降级反馈规范**：每次降级时，必须通过 `mcp______zhi` 展示结构化状态更新：
  ```markdown
  🔄 **状态更新：Prompt 增强模式切换**
  - **当前模式**：`深度增强 (mcp______enhance)` / `轻量增强 (ace-tool)` / `自增强 (Claude-native)` / `Basic 模式（已跳过增强）`
  - **原因**：[具体失败原因，如：响应超时 (Timeout > 30s) / 连接失败 / API 限流 / 连续失败 3 次]
  - **策略**：[当前采取的措施，如：已启用本地启发式增强 / 已跳过增强直接执行 / 将在 10 分钟后恢复]
  - **建议**：[用户可选操作，如：若增强效果不佳，请检查网络或重试 `/ccg:enhance` / 可继续执行或手动补充需求细节]
  ```
  - `is_markdown`: true
  - `predefined_options`: ["继续执行", "手动补充需求", "重试增强"]

- `mcp__ace-tool__search_context` 不可用 → 使用 `mcp______sou` → 再不可用则使用 Grep/Glob
- Grok Search 失败 → 调用 `mcp__Grok_Search_Mcp__get_config_info` 诊断配置
  - 若状态异常，调用 `switch_model` 切换模型后重试一次
  - 仍失败则使用 `mcp______context7` 获取框架/库官方文档
  - 若仍不足，提示用户提供权威来源
- Grok Search 首次使用 → 调用 `toggle_builtin_tools` action: "off" 确保禁用内置 WebSearch/WebFetch
- Chrome DevTools 不可用 → 3 级降级策略：
  - **L1（部分受限）**：至少获取截图 + 控制台错误 + 基础性能指标
  - **L2（完全不可用）**：通过 `mcp______zhi` 生成手动验证清单，提示用户手动检查页面
  - **L3（高风险 UI 变更且无 DevTools）**：暂停执行，通过 `mcp______zhi` 要求用户确认后才能继续
- Memory MCP 不可用 → 使用 `mcp______ji` 存储简化信息
- CCG 命令失败 → 主代理直接实施（记录失败原因）
- 子代理不可用 → 主代理生成简化版设计文档

**搜索故障排查：**

1. 调用 `get_config_info` 检查 API 配置
2. 必要时使用 `switch_model` 切换模型
3. 使用 `toggle_builtin_tools` 确保内置工具已禁用

---

## 8. 按需查阅资源

**仅在遇到具体问题时读取，禁止预加载：**

| 触发场景 | 读取文件 | 解决什么问题 |
|----------|----------|--------------|
| CCG 命令执行失败或参数不明 | `commands/ccg/<name>.md` | 获取参数格式、降级策略 |
| 代理工作流中断或输出异常 | `agents/ccg/<name>-agent.md` | 理解阶段流程、检查点位置 |
| Skill 调用报错或返回空 | `skills/<name>/SKILL.md` | 查看输入格式、已知限制 |
| Git 钩子阻止提交 | 项目 `.git/hooks/` | 理解钩子逻辑以修复问题 |
| MCP 工具连接超时或认证失败 | `settings.json` | 检查服务器配置、API 密钥 |

**禁止**：在对话开始时预加载这些文档。

---

## 9. GitHub MCP 工具使用指南

**GitHub MCP 已集成 25 个工具，优先使用 MCP 工具而非 `gh` CLI。**

### 常用工具速查

| 场景 | 推荐工具 |
|------|----------|
| 创建/更新文件 | `mcp__github__create_or_update_file` / `mcp__github__push_files` |
| Pull Request | `mcp__github__create_pull_request` / `mcp__github__get_pull_request` / `mcp__github__merge_pull_request` |
| PR 审查 | `mcp__github__create_pull_request_review` / `mcp__github__get_pull_request_files` / `mcp__github__get_pull_request_status` |
| Issue 管理 | `mcp__github__create_issue` / `mcp__github__get_issue` / `mcp__github__update_issue` / `mcp__github__add_issue_comment` |
| 仓库/分支 | `mcp__github__create_repository` / `mcp__github__create_branch` / `mcp__github__fork_repository` |
| 搜索 | `mcp__github__search_code` / `mcp__github__search_repositories` / `mcp__github__search_issues` / `mcp__github__search_users` |
| 其他 | `mcp__github__get_file_contents` / `mcp__github__list_commits` / `mcp__github__list_pull_requests` / `mcp__github__list_issues` |

### CCG 命令集成映射

| CCG 命令 | 关联 GitHub 操作 |
|----------|------------------|
| `ccg:commit` | 提交后可用 `push_files` 推送 |
| `ccg:workflow` | 阶段 3 后 `create_branch`；阶段 7 `create_pull_request` |
| `ccg:review` | `get_pull_request` + `create_pull_request_review`；可选 `merge_pull_request` |
| `ccg:debug` | 修复后 `create_issue` 记录缺陷 |
| `ccg:feat` | 从 `get_issue` 获取需求 |
| `ccg:execute` | 完成后 `update_issue` + `add_issue_comment` |
| `ccg:init` | 初始化时 `create_repository` |
| `ccg:analyze` | `search_code` + `search_repositories` 查找参考 |

### 注意事项

1. GitHub MCP 工具可直接调用，无需额外加载步骤
2. 确保 GitHub token 已在 MCP 配置中正确设置
3. 调用失败时降级到 `gh` CLI，并提供清晰错误信息
4. 涉及 GitHub 操作时，使用 `mcp______zhi` 询问用户确认

**详细的集成场景、调用示例和工作流说明**：按需查阅 `.ccg/GITHUB-MCP-REFERENCE.md`

---

## 文件组织规范（2026-02-13 更新）

### 工作流目录结构

项目采用**工作流分类 + 生命周期分层**的目录结构：

```
.claude/
├── spec/                   # OpenSpec 工作流
│   ├── wip/               # 临时工作区（研究、分析、草稿）
│   ├── constraints/       # 约束集（正式）
│   ├── proposals/         # 提案（正式）
│   ├── plans/             # 计划（正式）
│   ├── reviews/           # 审查报告（正式）
│   ├── progress/          # 进度追踪（正式）
│   ├── templates/         # 模板（只读）
│   └── archive/           # 归档
│
├── agent-teams/            # Agent Teams 工作流
│   ├── wip/               # 临时工作区
│   ├── plans/             # 计划（正式）
│   ├── reviews/           # 审查报告（正式）
│   └── archive/           # 归档
│
├── workflow/               # 六阶段工作流
│   ├── wip/               # 临时工作区
│   ├── plans/             # 计划（正式）
│   ├── reviews/           # 审查报告（正式）
│   └── archive/           # 归档
│
└── common/                 # 通用计划
    ├── wip/               # 临时工作区
    ├── plans/             # 计划（正式）
    └── archive/           # 归档
```

### 生命周期管理

| 阶段 | 目录 | 版本控制 | 清理策略 |
|------|------|----------|----------|
| 临时 | `wip/` | 忽略 | 自动清理（> 30 天） |
| 正式 | `constraints/`、`proposals/`、`plans/`、`reviews/` | 跟踪 | 手动归档 |
| 归档 | `archive/` | 跟踪 | 手动清理 |

### 命名规范

**临时文件（wip/ 目录）**：
```
YYYYMMDD-<topic>-<type>.md
```

示例：
- `20260213-file-organization-research.md`
- `20260213-agent-teams-analysis.md`

**正式文件（plans/、reviews/ 目录）**：
```
YYYYMMDD-<topic>-<type>.md
```

示例：
- `20260213-ccg-upgrade-plan.md`
- `20260213-feature-x-review.md`

### 迁移说明

**已弃用的目录**：
- `.claude/team-plan/` → 已迁移到 `.doc/agent-teams/`
- `.claude/plan/` → 已迁移到 `.doc/common/`

**迁移文档**：
- 迁移映射表：`.doc/MIGRATION-MAP.md`
- 迁移指南：`.doc/MIGRATION-GUIDE.md`

**弃用时间表**：
- 弃用日期：2026-02-13
- 完全移除日期：2026-03-13（30 天后）

