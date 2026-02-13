# E 组对比报告：代理文件（Agents）

**对比时间**：2026-02-12
**上游路径**：`D:/Program Files/nvm/node_global/node_modules/ccg-workflow/templates/commands/agents/`
**本地路径**：`C:/Users/Administrator/.claude/agents/ccg/`

---

## 一、文件总览

| 维度 | 上游 | 本地 |
|------|------|------|
| 文件总数 | 4 | 20 |
| 共有文件 | 4 | 4 |
| 本地独有 | - | 16 |
| 上游独有 | 0 | - |

### 1.1 共有文件清单（4 个）

| 文件名 | 上游大小 | 本地大小 | 差异程度 |
|--------|----------|----------|----------|
| get-current-datetime.md | 835B | 864B | 完全一致（仅换行符差异） |
| init-architect.md | 5,779B | 7,029B | **有差异**（+1,250B） |
| planner.md | 7,531B | 8,368B | **有差异**（+837B） |
| ui-ux-designer.md | 13,724B | 18,167B | **有差异**（+4,443B） |

### 1.2 本地独有文件清单（16 个）

| 文件名 | 大小 | 角色定位 |
|--------|------|----------|
| analyze-agent.md | 3,561B | 多模型技术分析 |
| backend-agent.md | 3,845B | 后端专项开发 |
| commit-agent.md | 4,593B | 智能 Git 提交 |
| debug-agent.md | 4,479B | 复杂缺陷定位 |
| execute-agent.md | 6,157B | 计划执行器 |
| frontend-agent.md | 4,351B | 前端专项开发 |
| fullstack-agent.md | 7,443B | 全栈复杂开发（6 阶段工作流） |
| fullstack-light-agent.md | 4,003B | 全栈轻量开发（快速迭代） |
| optimize-agent.md | 4,166B | 性能分析与优化 |
| review-agent.md | 8,587B | 多维度代码审查 |
| test-agent.md | 6,018B | 测试用例生成 |
| spec-init-agent.md | 2,846B | OpenSpec 环境初始化 |
| spec-research-agent.md | 3,737B | OpenSpec 约束研究 |
| spec-plan-agent.md | 3,651B | OpenSpec 零决策规划 |
| spec-impl-agent.md | 4,042B | OpenSpec 计划实施 |
| spec-review-agent.md | 4,155B | OpenSpec 合规审查 |

---

## 二、共有文件精确 Diff 对比

### 2.1 get-current-datetime.md — 完全一致

**结论**：上游与本地内容完全一致，无任何差异（仅可能有 Windows/Linux 换行符差异）。

- frontmatter 相同：`name: get-current-datetime`, `tools: Bash, Read, Write`, `color: cyan`
- 正文内容逐行一致

### 2.2 init-architect.md — 有差异

**差异类型**：本地新增内容（+1,250B）

| 位置 | 上游 | 本地 | 差异说明 |
|------|------|------|----------|
| frontmatter tools | `Read, Write, Glob, Grep` | `Read, Write, Glob, Grep, mcp______zhi, mcp______ji, mcp__github__create_repository` | 本地新增 3 个 MCP 工具 |
| 五-B 章节 | 不存在 | 新增「确认与记忆」章节 | 调用 `mcp______zhi` 展示扫描摘要 + `mcp______ji` 存储项目元数据 |
| 五-C 章节 | 不存在 | 新增「GitHub 仓库创建（可选）」章节 | 调用 `mcp__github__create_repository` 创建仓库 + 降级方案 |

**详细差异**：

```diff
--- 上游 frontmatter
+++ 本地 frontmatter
- tools: Read, Write, Glob, Grep
+ tools: Read, Write, Glob, Grep, mcp______zhi, mcp______ji, mcp__github__create_repository
```

```diff
--- 上游（五和六之间无内容）
+++ 本地新增
+ ## 五-B、确认与记忆
+
+ 1. **确认结果**：调用 `mcp______zhi` 展示扫描摘要（模块数、覆盖率、主要缺口），等待用户确认或选择补扫。
+ 2. **存储元数据**：调用 `mcp______ji` 存储项目元数据（技术栈、模块列表、覆盖率），供后续会话复用。
+
+ ## 五-C、GitHub 仓库创建（可选）
+
+ 初始化完成后，调用 `mcp______zhi` 询问用户是否创建 GitHub 仓库：
+ - `predefined_options`: ["创建 GitHub 仓库", "跳过"]
+ - 如果用户选择创建：
+   1. 询问仓库名称、描述、是否私有
+   2. 调用 `mcp__github__create_repository` 创建仓库
+   3. 添加远程仓库：`git remote add origin <仓库URL>`
+   4. 降级方案：GitHub MCP 不可用时使用 `gh repo create`
```

**核心差异总结**：上游是纯文件操作工具；本地增加了用户交互确认、知识存储、GitHub 仓库创建三大能力。

### 2.3 planner.md — 有差异

**差异类型**：工具集扩充 + 工作流增强（+837B）

| 位置 | 上游 | 本地 | 差异说明 |
|------|------|------|----------|
| frontmatter tools | `Read, Write, {{MCP_SEARCH_TOOL}}` | `Read, Write, mcp__ace-tool__search_context, mcp______sou, mcp______zhi, mcp______ji, mcp__Grok_Search_Mcp__web_search, mcp__Grok_Search_Mcp__web_fetch` | 上游使用模板变量；本地展开为 8 个具体工具 |
| 核心职责 | 4 条 | 5 条 | 本地新增「知识复用：通过 `mcp______ji` 回忆项目历史规划模式」 |
| 步骤 1 | 直接分析需求 | 先调用 `mcp______ji` 回忆历史，再分析需求 | 新增记忆检索环节 |
| 步骤 2 | `{{MCP_SEARCH_TOOL}}` 模板变量 | `mcp__ace-tool__search_context` + 降级说明 | 模板变量实例化 + 降级策略 |
| 步骤 4 | 直接生成文档 | 先 `mcp______zhi` 确认 → 生成文档 → `mcp______ji` 存储 | 新增确认与存储环节 |
| 其余正文 | 完全一致 | 完全一致 | 输出模板、关键原则、示例等均相同 |

**详细差异**：

```diff
--- 上游 frontmatter
+++ 本地 frontmatter
- tools: Read, Write, {{MCP_SEARCH_TOOL}}
+ tools: Read, Write, mcp__ace-tool__search_context, mcp______sou, mcp______zhi, mcp______ji, mcp__Grok_Search_Mcp__web_search, mcp__Grok_Search_Mcp__web_fetch
```

```diff
--- 上游核心职责
+++ 本地核心职责
  4. **工作量估算**：使用"任务点"为单位
+ 5. **知识复用**：通过 `mcp______ji` 回忆项目历史规划模式
```

```diff
--- 上游步骤 1
+++ 本地步骤 1
+ 调用 `mcp______ji` 回忆项目历史规划经验和已知技术约束。
+
  分析用户需求，明确：
```

```diff
--- 上游步骤 2
+++ 本地步骤 2
- 如果需要了解现有实现，使用 ace-tool 检索：
+ 如果需要了解现有实现，使用 ace-tool 检索（不可用时降级到 `mcp______sou`）：

- {{MCP_SEARCH_TOOL}} {
+ mcp__ace-tool__search_context {
```

```diff
--- 上游步骤 4
+++ 本地步骤 4
+ 调用 `mcp______zhi` 向用户展示规划摘要并确认后，生成 Markdown 格式的规划文档。
+
+ 规划完成后，调用 `mcp______ji` 存储规划模式和关键技术决策。
+
  生成 Markdown 格式的规划文档，包含以下章节：
```

**核心差异总结**：上游使用模板变量占位符（`{{MCP_SEARCH_TOOL}}`），本地实例化为具体 MCP 工具，并新增记忆系统（`ji`）和用户确认（`zhi`）两大交互环节。

### 2.4 ui-ux-designer.md — 有差异

**差异类型**：大幅扩充工具集和工作流（+4,443B）

| 位置 | 上游 | 本地 | 差异说明 |
|------|------|------|----------|
| frontmatter tools | `Read, Write, {{MCP_SEARCH_TOOL}}` | 12 个具体 MCP 工具名 | 上游模板变量；本地展开全部工具 |
| 核心职责 | 5 条 | 6 条 | 新增「设计系统对齐：通过三术 UI/UX 工具获取设计规范和组件知识」 |
| 新增「工具集」章节 | 不存在 | 新增完整工具集文档（约 1,500B） | 包含 MCP 工具、Chrome DevTools MCP、内置工具三大类 |
| 步骤 1 | 直接分析需求 | 先 `mcp______ji` 回忆 + `mcp______uiux_search` 搜索 | 新增记忆检索和设计知识搜索 |
| 步骤 2 | 标题为「检索现有组件」 | 标题改为「检索现有组件与设计系统」 | 新增 `uiux_design_system`、`uiux_stack`、`tu` 调用 |
| 步骤 2 代码 | `{{MCP_SEARCH_TOOL}}` | `mcp__ace-tool__search_context` | 模板变量实例化 |
| 新增步骤 3.5 | 不存在 | 新增「浏览器感知验证」步骤（约 900B） | 9 步 Chrome DevTools MCP 操作 + 降级处理 |
| 步骤 3 后 | 直接结束 | 新增 `mcp______zhi` 确认 + `mcp______ji` 存储 | 新增确认与存储环节 |
| 其余正文 | 完全一致 | 完全一致 | 输出模板、示例、使用指南均相同 |

**本地新增工具集章节详情**：

```
### MCP 工具（8 个）
- mcp__ace-tool__search_context（代码检索）
- mcp______zhi（设计方案确认）
- mcp______ji（存储设计决策）
- mcp______uiux_search（UI/UX 知识搜索）
- mcp______uiux_stack（技术栈推荐）
- mcp______uiux_design_system（设计系统查询）
- mcp______tu（图标资源搜索）

### Chrome DevTools MCP（8 个工具）
- take_snapshot — A11y Tree 验证（核心工具）
- take_screenshot — 截图视觉现状
- resize_page — 响应式断点检查
- emulate — 模拟设备/深色模式/触控
- evaluate_script — 获取计算样式（只读）
- click — 触发交互状态审查 A11y
- hover — 验证悬停态可访问性
- 降级方案说明

### 内置工具
- Read / Write
```

**本地新增步骤 3.5 详情**：
1. `take_snapshot` 获取 Accessibility Tree
2. `take_screenshot` 获取视觉现状
3. `resize_page` 遍历标准断点（375px/768px/1440px/1920px）
4. `emulate` 模拟设备、深色模式、触控模式
5. `evaluate_script` 获取关键元素计算样式
6. `click`/`hover` 触发交互状态 + `take_snapshot` 审查动态 A11y
7. 基于真实 DOM 结构提出设计建议
8. A11y 重点关注事项
9. 降级处理说明

**核心差异总结**：上游是基础模板（模板变量+纯文件操作）；本地大幅增强为完整设计验证流程，集成了 UI/UX 知识库、Chrome DevTools 浏览器验证、记忆系统和用户确认。

---

## 三、共有文件差异模式总结

所有 4 个共有文件（除 get-current-datetime 完全一致外）呈现一致的差异模式：

| 差异模式 | 说明 | 涉及文件 |
|----------|------|----------|
| 模板变量实例化 | `{{MCP_SEARCH_TOOL}}` → 具体工具名 | planner, ui-ux-designer |
| 工具集扩充 | 从基础工具扩展为完整 MCP 工具链 | init-architect, planner, ui-ux-designer |
| 记忆系统集成 | 新增 `mcp______ji` 存储/回忆知识 | init-architect, planner, ui-ux-designer |
| 用户确认集成 | 新增 `mcp______zhi` 关键节点确认 | init-architect, planner, ui-ux-designer |
| Chrome DevTools 集成 | 新增浏览器验证与降级策略 | ui-ux-designer |
| GitHub MCP 集成 | 新增 GitHub 操作能力 | init-architect |
| 降级策略文档化 | 每个工具标注降级方案 | 全部有差异的文件 |

---

## 四、本地独有 16 个代理文件详细分析

### 4.1 通用开发代理（11 个）

#### 4.1.1 analyze-agent.md（3,561B）
- **角色定位**：多模型技术分析代理
- **核心工作流**：
  1. 增强需求（`enhance` + `ji` 回忆）
  2. 检索上下文（`search_context` + GitHub MCP 搜索参考）
  3. 多视角分析（Codex 后端 + Gemini 前端 + 交叉视角）
  4. 可行性评估（技术可行性 + 实施成本 + 替代方案）
  5. 输出技术方案（`zhi` 确认 + `ji` 存储）
- **特色**：集成 `mcp______uiux_suggest` 评估 UI/UX 可行性；方案对比至少 2 个

#### 4.1.2 backend-agent.md（3,845B）
- **角色定位**：后端专项开发代理
- **核心工作流**：
  1. 上下文检索（`ji` 回忆 + `search_context` 检索 API/服务/模型）
  2. 接口设计（RESTful/GraphQL + DTO/Schema + 数据库设计）
  3. 代码实现（路由 → 控制器 → 服务层 → 数据层 → 迁移脚本）
  4. 测试与验证（单元测试 + 集成测试 + 安全检查）
- **特色**：集成 `database-designer` Skill；Codex 作为后端分析权威参考

#### 4.1.3 commit-agent.md（4,593B）
- **角色定位**：智能 Git 提交代理
- **核心工作流**：
  1. 收集变更信息（`ji` 回忆 + `git status/diff/log`）
  2. 分析改动类型（9 种 Conventional Commit 类型）
  3. 生成提交信息（`zhi` 预览确认）
  4. 评估拆分提交（多类型/多模块/重构混合）
  5. GitHub 推送（可选，`push_files`）
- **特色**：严格遵循 Conventional Commit 规范；禁止 `git add -A`/`--no-verify`/`--amend`

#### 4.1.4 debug-agent.md（4,479B）
- **角色定位**：假设驱动复杂缺陷定位代理
- **核心工作流**：
  1. 收集错误信息（`ji` 回忆 + 错误日志/堆栈/环境/频率）
  2. 上下文检索（调用链追踪 + `git log` 可疑提交）
  3. 生成假设列表（按可能性排序，每个有验证方法）
  4. 逐一验证假设（日志注入/断点/Chrome DevTools）
  5. 确定根因（`zhi` 确认）
  6. 提出修复方案（影响范围 + 回归风险 + 测试用例）
  7. 创建 GitHub Issue（可选）
- **特色**：禁止跳过假设验证直接给修复方案；前端问题优先用 Chrome DevTools

#### 4.1.5 execute-agent.md（6,157B）
- **角色定位**：计划执行代理（通用执行器）
- **核心工作流**：
  1. 计划读取与验证（`ji` 回忆 + 读取 `.claude/plan/`）
  2. 逐步实施（每步确认前置条件 + 执行 + 验证）
  3. 进度追踪（`zhi` 里程碑报告）
  4. 阻碍处理（立即暂停 + `zhi` 报告 + 等待指示）
  5. 完成报告（更新 Issue + `ji` 存储）
  5.5. 浏览器验证（Chrome DevTools MCP + L1/L2/L3 降级）
- **特色**：严格按计划执行不偏离；集成 GitHub Issue 更新；Chrome DevTools 3 级降级

#### 4.1.6 frontend-agent.md（4,351B）
- **角色定位**：前端专项开发代理
- **核心工作流**：
  1. 上下文检索（`ji` + `search_context` + `uiux_design_system` + `uiux_stack`）
  2. 组件结构设计（`uiux_search` 设计模式 + `tu` 图标 + Props/State 定义）
  3. 代码实现（组件 + 样式 + 交互 + `context7` 框架 API）
  4. 验证与优化（Chrome DevTools + a11y + lint + `ji` 存储）
- **特色**：集成 `ui-ux-pro-max` + `frontend-design` 两个 Skill；Gemini 作为前端分析权威

#### 4.1.7 fullstack-agent.md（7,443B）
- **角色定位**：全栈复杂开发代理（架构变更+多模块联动）
- **核心工作流（6 阶段）**：
  1. 研究（深度上下文分析 + 影响分析报告）
  2. 构思（候选方案设计 + `zhi` 方案对比确认）
  3. 计划（步骤拆解 + 依赖关系 + `zhi` 确认）
  4. 执行（数据层 → 服务层 → API 层 → 前端层 → 集成层 + GitHub 分支管理）
  5. 审查与修复（集成测试 + 性能分析 + Chrome DevTools L1/L2/L3 降级）
  6. 验收（变更清单 + 代码质量自查 + `ji` 存储）
  7. GitHub PR 创建（可选）
- **特色**：3 个 Skill（`ui-ux-pro-max`, `database-designer`, `ci-cd-generator`）；完整 PR 工作流

#### 4.1.8 fullstack-light-agent.md（4,003B）
- **角色定位**：全栈轻量开发代理（中等复杂度单模块）
- **核心工作流**：
  1. 需求范围分析（`ji` + `search_context` + GitHub Issue 获取需求）
  2. 前后端一体规划（数据流设计 + API 契约 + `zhi` 确认）
  3. 代码实现（数据层 → 服务层 → 展示层 → 连接层）
  4. 集成测试（端到端数据流验证）
- **特色**：轻量版 fullstack-agent；如复杂度超出范围建议升级

#### 4.1.9 optimize-agent.md（4,166B）
- **角色定位**：性能分析与优化代理
- **核心工作流**：
  1. 识别性能瓶颈（`ji` + Chrome DevTools Lighthouse + 慢查询分析）
  2. 分析热路径（DB 查询计划 + 算法复杂度 + 渲染 + Bundle）
  3. 提出优化方案（收益/成本/风险 + 按性价比排序）
  4. 确认优化方案（`zhi`）
  5. 实施优化（验证效果 + 前后对比 + `ji` 更新基线）
- **特色**：按 P0/P1/P2 性价比排序；禁止基于假设优化

#### 4.1.10 review-agent.md（8,587B）
- **角色定位**：多维度代码审查代理
- **核心工作流**：
  1. 获取变更（`ji` + `git diff/log` + GitHub PR 详情全套获取）
  2. 上下文检索（上下游依赖分析）
  3. 多维度审查（安全 + 性能 + 可维护性 + 正确性 + 前端视觉/A11y）
  4. 问题分类（Critical/Major/Minor/Suggestion）
  5. 输出审查报告（`zhi` + 创建 Issue）
  6. GitHub PR Review（可选，APPROVE/REQUEST_CHANGES/COMMENT）
  7. GitHub PR 合并（可选，squash/merge/rebase）
- **特色**：集成 13 个 GitHub MCP 工具；Chrome DevTools 性能追踪；最完整的 PR 审查流程

#### 4.1.11 test-agent.md（6,018B）
- **角色定位**：测试用例生成代理
- **核心工作流**：
  1. 分析目标代码（`ji` + `search_context` + 框架识别）
  2. 识别测试路径（Happy Path + Boundary + Error Path + 并发竞态）
  3. 生成测试代码（AAA 模式 + Mock/Stub）
  4. 验证测试可运行（执行 + 覆盖率 + `ji` 更新基线）
  5. E2E 浏览器测试（Chrome DevTools MCP 15 个操作 + 降级处理）
- **特色**：Chrome DevTools 全套操作（click/fill/drag/upload/wait_for 等）；`fill` 兼容性备注

---

### 4.2 OpenSpec 代理（5 个）— 重点分析

#### 4.2.1 spec-init-agent.md（2,846B）
- **角色定位**：OpenSpec 约束驱动开发环境初始化
- **核心工作流**：
  1. 环境检查（验证 MCP 工具 + codeagent-wrapper 可用性）
  2. 项目扫描（技术栈 + 现有约束识别）
  3. 目录初始化（`.claude/spec/` 及 5 个子目录）
  4. 结果报告（`zhi` 确认 + `ji` 存储元数据）

#### 4.2.2 spec-research-agent.md（3,737B）
- **角色定位**：需求转约束集（硬/软/依赖/风险）
- **核心工作流**：
  1. 需求增强（`enhance` + `search_context`）
  2. **多模型并行探索**（Codex 后端约束 + Gemini 前端约束 + `TaskOutput` 等待）
  3. 约束分类与整合（4 类约束 + 来源标注）
  4. 生成提案（写入 `.claude/spec/proposals/` + `zhi` 确认 + `ji` 存储）

#### 4.2.3 spec-plan-agent.md（3,651B）
- **角色定位**：约束集转零决策可执行计划
- **核心工作流**：
  1. 输入读取（提案 + 约束集 + 当前文件状态）
  2. **多模型规划**（Codex 后端步骤 + Gemini 前端步骤 + `TaskOutput` 等待）
  3. 消除歧义（零决策化：操作类型/目标文件/变更内容/验证方式/约束映射 + 依赖关系）
  4. 计划输出（写入 `.claude/spec/plans/` + `zhi` 审批 + `ji` 存储）

#### 4.2.4 spec-impl-agent.md（4,042B）
- **角色定位**：按零决策计划严格执行 + 多模型审计
- **核心工作流**：
  1. 计划加载（验证零决策完整性 + `zhi` 确认）
  2. 逐步实施（执行前确认 → 执行 → 验证 → 标记状态）
  3. **多模型审计**（Codex reviewer + Gemini reviewer + Critical 暂停机制 + `TaskOutput` 等待）
  4. 阻碍处理（文件不符/验证失败/Critical/约束冲突 → 暂停报告）
  5. 完成报告（写入 `.claude/spec/reviews/` 供下游使用）

#### 4.2.5 spec-review-agent.md（4,155B）
- **角色定位**：双模型交叉合规审查 + Critical 零容忍
- **核心工作流**：
  1. 输入收集（计划 + 约束集 + 实施报告 + 变更代码）
  2. **双模型交叉审查**（Codex 安全/性能 + Gemini 可访问性/UX + `TaskOutput` 等待）
  3. 交叉验证（整合双方结果 + 按严重程度分类 + 逐条核对约束覆盖）
  4. 合规裁决（Critical → 修复 → 重新审查；无 Critical → 通过）
  5. 归档（完整周期文件 → `.claude/spec/archive/` + `ji` + `zhi`）

---

## 五、OpenSpec 代理关键特性深度分析

### 5.1 Core Philosophy（核心理念）覆盖情况

| 核心理念 | spec-init | spec-research | spec-plan | spec-impl | spec-review |
|----------|-----------|---------------|-----------|-----------|-------------|
| 约束驱动开发 | 初始化环境 | **约束发现与分类** | 约束→步骤映射 | 约束→验证 | **约束合规矩阵** |
| 零决策执行 | - | - | **零决策化处理** | **严格按计划执行** | - |
| 多模型协作 | 工具可用性验证 | **Codex+Gemini 并行** | **Codex+Gemini 并行** | **Codex+Gemini 审计** | **Codex+Gemini 交叉审查** |
| 可追溯性 | 元数据存储 | 约束来源标注 | 步骤↔约束映射 | 变更↔步骤↔约束 | **合规矩阵** |

### 5.2 Guardrails（护栏）覆盖情况

| 护栏规则 | 覆盖代理 | 实现方式 |
|----------|----------|----------|
| Critical 零容忍 | spec-impl, spec-review | impl: Critical 立即暂停；review: Critical 不允许归档 |
| 约束不可遗漏 | spec-plan, spec-review | plan: 未覆盖约束需标注原因；review: 逐条核对合规 |
| 计划审批门控 | spec-plan | 「计划审批前不得进入实施阶段」 |
| 修复后二次验证 | spec-review | 「修复后必须重新审查，不允许跳过二次验证」 |
| 阻碍立即暂停 | spec-impl | 4 种暂停条件明确列出 |
| 多模型并行强制 | spec-research, spec-plan, spec-impl, spec-review | 均要求「必须并行执行，等待所有返回后再整合」 |

### 5.3 多模型并行调用覆盖情况

| 代理 | 调用模式 | Codex 角色 | Gemini 角色 | 等待机制 |
|------|----------|------------|-------------|----------|
| spec-research | 并行探索 | analyzer（后端约束） | analyzer（前端约束） | `TaskOutput` |
| spec-plan | 并行规划 | architect（后端步骤） | architect（前端步骤） | `TaskOutput` |
| spec-impl | 里程碑审计 | reviewer（安全/性能） | reviewer（UI/可访问性） | `TaskOutput` |
| spec-review | 交叉审查 | reviewer（约束合规/安全） | reviewer（约束合规/UX） | `TaskOutput` |

### 5.4 Exit Criteria（退出条件）覆盖情况

| 代理 | 退出条件/检查点 |
|------|-----------------|
| spec-init | 工具可用性报告 + 目录创建完成 + `zhi` 确认 |
| spec-research | 约束集完整（4 类） + 硬/风险约束逐条确认 + 提案文件写入 + `zhi` 确认 |
| spec-plan | 零决策完整性 + 所有约束被覆盖 + 依赖关系标注 + 用户审批 |
| spec-impl | 所有步骤执行完毕 + 审计无 Critical + 实施报告写入 + `zhi` 确认 |
| spec-review | 约束逐条核对合规 + Critical 零容忍 + 归档确认 + `zhi` 确认 |

### 5.5 OpenSpec 工作流完整性评估

```
spec-init → spec-research → spec-plan → spec-impl → spec-review
  初始化      约束研究        零决策规划     计划实施       合规审查
  (环境)    (需求→约束)    (约束→计划)   (计划→代码)   (代码→归档)
```

**结论**：5 个 spec-*-agent 文件构成完整的闭环工作流，覆盖了：
- Core Philosophy: 约束驱动、零决策执行、多模型协作、可追溯性均有具体实现
- Guardrails: Critical 零容忍、约束不遗漏、审批门控、二次验证均有明确约束条款
- 多模型并行调用: 4/5 个代理（除 init 外）均使用 Codex+Gemini 并行 + `TaskOutput` 等待
- Exit Criteria: 每个代理均有明确的退出条件和检查点输出

---

## 六、整体结论

### 6.1 上游 vs 本地的关系

| 维度 | 结论 |
|------|------|
| 上游定位 | 基础模板，使用 `{{MCP_SEARCH_TOOL}}` 等模板变量，工具集精简 |
| 本地定位 | 完整实例化版本，展开所有模板变量，集成全套 MCP 工具链 |
| 内容兼容性 | 本地完全兼容上游（上游内容 100% 保留，本地仅新增不删减） |
| 扩展方向 | 本地统一增加了 3 类能力：记忆系统（`ji`）、用户确认（`zhi`）、降级策略 |

### 6.2 本地独有 16 个代理的架构价值

| 类别 | 数量 | 价值 |
|------|------|------|
| 通用开发代理 | 11 | 覆盖完整开发生命周期（分析→规划→前端/后端/全栈→测试→审查→调试→优化→提交） |
| OpenSpec 代理 | 5 | 约束驱动开发闭环（初始化→研究→规划→实施→审查） |

### 6.3 建议

1. **上游可考虑合并**的本地增强：记忆系统（`ji`）、用户确认（`zhi`）、降级策略文档化
2. **本地独有代理中可上游化的**：commit-agent（通用性强）、debug-agent（方法论完整）
3. **OpenSpec 代理**：作为高级特性，建议作为可选扩展包而非默认内置
4. **模板变量处理**：上游的 `{{MCP_SEARCH_TOOL}}` 设计更灵活，本地硬编码工具名降低了可移植性，建议保留模板变量机制并在安装时实例化
