# CCG 命令文件对比任务文档

> 上游版本：ccg-workflow@1.7.61
> 本地路径：`~/.claude/commands/ccg/`
> 生成时间：2026-02-12

---

## 一、全局差异模式总结

### 1.1 架构差异

| 维度 | 上游模式 | 本地模式 |
|------|----------|----------|
| 路径风格 | `~/.claude/bin/codeagent-wrapper` + `{{WORKDIR}}` 占位符 | `C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe` + `$PWD` |
| Gemini 模型 | `{{GEMINI_MODEL_FLAG}}` → `--gemini-model gemini-3-pro-preview ` | 无此参数（缺失） |
| Lite 模式 | `{{LITE_MODE_FLAG}}` 占位符 | 无此参数（缺失） |
| 用户交互 | `AskUserQuestion` 工具 | `mcp______zhi`（三术）工具 |
| 上下文检索 | `{{MCP_SEARCH_TOOL}}` 占位符 | `mcp__ace-tool__search_context`（带降级链） |
| Prompt 增强 | 内联 `/ccg:enhance` 逻辑描述 | `mcp______enhance` 工具调用（带降级链） |
| 知识存储 | 无 | `mcp______ji`（记忆工具） |
| 网络搜索 | 无 | GrokSearch MCP 完整规范 |
| GitHub 集成 | 无 | GitHub MCP 工具（PR/Issue/Branch） |
| Chrome DevTools | 无 | 前端验证门控（L1/L2/L3 降级） |
| 会话复用语法 | `resume xxx`（非 `--resume`） | `--resume xxx`（部分文件错误） |
| 工作目录检测 | `/add-dir` 多工作区检测 + `AskUserQuestion` | 无多工作区检测逻辑 |

### 1.2 文件分类总览

| 分类 | 文件 | 状态 |
|------|------|------|
| **本地过时（需同步上游）** | spec-init, spec-research, spec-plan, spec-impl, spec-review | 本地比上游小 35-56% |
| **本地增强（保留本地）** | workflow, review, commit, debug, frontend | 本地比上游大 35-158% |
| **本地轻度增强** | analyze, backend, execute, feat, optimize, plan, test, enhance, init, rollback, clean-branches, worktree | 本地比上游大 5-29% |
| **完全一致（刚复制）** | team-exec, team-plan, team-research, team-review | 文件大小相同 |

---

## 二、A 组：本地过时 — 需同步上游更新（5 个文件）

### 2.1 spec-init.md

| 指标 | 上游 | 本地 | 差异 |
|------|------|------|------|
| 大小 | 4,374B | 2,794B | -36% |

**上游有而本地缺失的内容：**

1. **OS 检测逻辑**：`uname -s`（Unix）或环境变量（Windows），本地无此步骤
2. **OpenSpec CLI 安装验证**：`npx @fission-ai/openspec --version`，全局安装 + 验证流程
3. **项目初始化**：`npx @fission-ai/openspec init --tools claude`，检查 `openspec/` 目录、`.claude/skills/openspec-*`、`.claude/commands/opsx/`
4. **MCP 工具验证**：codeagent-wrapper 版本检测、Codex/Gemini 后端测试（含 `{{WORKDIR}}` 占位符）
5. **ace-tool MCP 可选验证**：检查 `{{MCP_SEARCH_TOOL}}` 可用性、配置诊断（Active/Inactive/Not installed）
6. **状态汇总表**：7 项组件状态表（OpenSpec CLI / Project / Skills / wrapper / Codex / Gemini / ace-tool）
7. **后续步骤指引**：`/ccg:spec-research` → `/ccg:spec-plan` → `/ccg:spec-impl`

**本地有而上游缺失的内容：**

1. GrokSearch 网络搜索规范
2. `mcp______zhi` 交互确认
3. `mcp______ji` 知识存储
4. 子代理委托架构（`Task({ subagent_type: "spec-init-agent" })`）

**同步建议：** 合并上游的 OPSX 直接集成逻辑到本地，保留本地的 MCP 工具增强。

---

### 2.2 spec-research.md

| 指标 | 上游 | 本地 | 差异 |
|------|------|------|------|
| 大小 | 4,612B | 2,993B | -35% |

**上游有而本地缺失的内容：**

1. **强制 Prompt 增强**：步骤 0 标记为 MANDATORY/NON-NEGOTIABLE
2. **OPSX Change 生成**：`openspec list --json` 检查 + `openspec new change "<name>"` 创建
3. **基于上下文边界的探索分区**（非角色分区）：
   - Subagent 1: 用户域代码（models, services, UI）
   - Subagent 2: 认证授权（middleware, session, tokens）
   - Subagent 3: 基础设施（configs, deployments, builds）
4. **统一 JSON 输出模板**：`module_name`, `existing_structures`, `existing_conventions`, `constraints_discovered`, `open_questions`, `dependencies`, `risks`, `success_criteria_hints`
5. **多模型并行探索**：Codex 负责后端边界，Gemini 负责前端边界
6. **约束集聚合**：硬约束 / 软约束 / 依赖 / 风险 四类分类
7. **OPSX Proposal 定稿**：Context + Requirements + Success Criteria 结构
8. **上下文检查点**：80K tokens 时建议 `/clear` + `/ccg:spec-plan`

**同步建议：** 上游的 8 步工作流远比本地详细，需完整同步 OPSX 集成和约束集框架。

---

### 2.3 spec-plan.md

| 指标 | 上游 | 本地 | 差异 |
|------|------|------|------|
| 大小 | 5,389B | 2,940B | -45% |

**上游有而本地缺失的内容：**

1. **并行 Codex+Gemini 分析**：显式 Bash 调用模式（`run_in_background: true`）
2. **不确定性消除审计**：反模式检测（"或"/"可能"/"待定"/"TBD" 等模糊词）
3. **PBT 属性提取**（6 类属性）：
   - 幂等性（Idempotency）
   - 单调性（Monotonicity）
   - 往返一致性（Round-trip）
   - 不变量（Invariants）
   - 交换性（Commutativity）
   - 等价性（Equivalence）
4. **OPSX 制品更新**：`openspec status --change "<id>" --json` 状态检查
5. **退出标准清单**：每个任务零歧义 + 可验证成功标准 + PBT 属性标注
6. **上下文检查点**：同 spec-research

**同步建议：** PBT 属性和不确定性审计是上游核心创新，必须同步。

---

### 2.4 spec-impl.md

| 指标 | 上游 | 本地 | 差异 |
|------|------|------|------|
| 大小 | 5,412B | 3,092B | -43% |

**上游有而本地缺失的内容：**

1. **Change 选择**：`openspec list --json` 列出可用 change，用户选择
2. **最小可验证阶段识别**：将计划拆分为最小可独立验证的实施阶段
3. **任务路由规则**：Gemini=前端/UI，Codex=后端/逻辑，Claude=胶水代码/配置
4. **原型重写规则**：外部模型输出仅作参考，Claude 重写时必须遵循项目规范
5. **副作用审查清单**：检查新增依赖、配置变更、数据库迁移、API 契约变更
6. **并行多模型审查**：实施后 Codex+Gemini 并行审查（含 JSON 输出格式）
7. **任务状态更新**：`openspec status --change "<id>"` 更新进度
8. **归档流程**：所有任务完成后执行归档
9. **上下文检查点**：同其他 spec-* 命令

**同步建议：** 原型重写规则和副作用审查是实施质量保障的关键，需同步。

---

### 2.5 spec-review.md

| 指标 | 上游 | 本地 | 差异 |
|------|------|------|------|
| 大小 | 6,705B | 2,972B | -56% |

**上游有而本地缺失的内容：**

1. **Proposal 选择**：`openspec list --json` 列出已实施的 change
2. **实施制品收集**：收集代码变更、测试结果、文档更新
3. **并行审查 JSON 输出格式**：
   ```json
   {
     "severity": "critical|warning|info",
     "dimension": "security|performance|correctness|...",
     "file": "path",
     "line": N,
     "description": "...",
     "constraint_violated": "requirement ID",
     "fix_suggestion": "..."
   }
   ```
4. **发现综合去重**：跨模型去重 + 严重程度分类（Critical/Warning/Info）
5. **决策门控**：Critical > 0 → 阻止归档，必须修复
6. **内联修复模式**：Claude 直接修复 Critical 问题，修复后重新审查
7. **退出标准**：Critical=0 + 所有 Warning 已确认 + Proposal 状态更新
8. **上下文检查点**：同其他 spec-* 命令

**同步建议：** 这是差异最大的文件（-56%），JSON 审查格式和决策门控逻辑是核心，必须完整同步。

---

## 三、B 组：本地增强 — 保留本地特性（5 个文件）

### 3.1 workflow.md

| 指标 | 上游 | 本地 | 差异 |
|------|------|------|------|
| 大小 | 7,067B | 15,283B | +116% |

**本地增强内容（保留）：**

1. **核心协议区块**：语言协议、代码主权、Enhance 接管、止损机制、阶段回退
2. **GrokSearch 网络搜索规范**：完整 5 步降级链
3. **每阶段 `mcp______zhi` 确认模板**：含 Markdown 格式、predefined_options
4. **工作流初始化**：`mcp______ji` 回忆历史经验
5. **分支管理（阶段 3 后）**：`mcp__github__create_branch` 创建 feature 分支
6. **Chrome DevTools 验证门控**：阶段 4 实施后 + 阶段 6 验收（L1/L2/L3 降级）
7. **阶段 7：GitHub PR 创建**：`mcp__github__create_pull_request` 完整流程
8. **知识存储**：工作流结束时 `mcp______ji` 存储经验

**需从上游同步的内容：**

1. `{{GEMINI_MODEL_FLAG}}` → `--gemini-model gemini-3-pro-preview `（本地缺失 Gemini 模型指定）
2. `{{LITE_MODE_FLAG}}` 占位符（本地缺失轻量模式支持）
3. `{{WORKDIR}}` 多工作区检测逻辑（本地用 `$PWD` 替代，缺少 `/add-dir` 检测）
4. 会话复用语法：上游 `resume xxx`，本地错误写成 `--resume xxx`

**需修复的本地问题：**

1. 路径硬编码：`C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe` → 应改为可移植路径
2. 会话复用语法错误：`--resume` → `resume`（上游已修正）

---

### 3.2 review.md

| 指标 | 上游 | 本地 | 差异 |
|------|------|------|------|
| 大小 | 4,321B | 11,149B | +158% |

**本地增强内容（保留）：**

1. **GrokSearch 网络搜索规范**
2. **`mcp______ji` 知识回忆与存储**
3. **GitHub PR 审查工作流（阶段 5-6）**：
   - `mcp__github__get_pull_request` 获取 PR 详情
   - `mcp__github__get_pull_request_status` 检查 CI/CD
   - `mcp__github__list_commits` 查看提交历史
   - `mcp__github__create_pull_request_review` 提交审查
   - `mcp__github__merge_pull_request` 合并 PR
4. **GitHub Issue 创建**：审查发现严重问题时创建 Issue

**需从上游同步的内容：**

1. `{{GEMINI_MODEL_FLAG}}` 和 `{{LITE_MODE_FLAG}}`
2. `{{WORKDIR}}` 多工作区检测
3. `{{MCP_SEARCH_TOOL}}` 占位符（本地已具体化为 `mcp__ace-tool__search_context`，可保留）

---

### 3.3 commit.md

| 指标 | 上游 | 本地 | 差异 |
|------|------|------|------|
| 大小 | 2,474B | 4,584B | +85% |

**本地增强内容（保留）：**

1. **`mcp______zhi` 确认 UI**：阶段 4 生成提交信息后展示给用户确认
2. **GitHub 推送工作流（阶段 6）**：`mcp__github__push_files` + `git push` 降级

**上游与本地一致的内容：** 核心 5 阶段工作流完全一致，无需同步。

---

### 3.4 debug.md

| 指标 | 上游 | 本地 | 差异 |
|------|------|------|------|
| 大小 | 4,636B | 7,177B | +55% |

**本地增强内容（保留）：**

1. **GrokSearch 网络搜索规范**
2. **`mcp______ji` 知识回忆与存储**
3. **`mcp______enhance` Prompt 增强**（上游用内联 `/ccg:enhance` 逻辑）
4. **GitHub Issue 创建（阶段 6）**：修复后创建 Issue 记录缺陷

**需从上游同步的内容：**

1. `{{GEMINI_MODEL_FLAG}}` 和 `{{WORKDIR}}`
2. 多工作区检测逻辑

---

### 3.5 frontend.md

| 指标 | 上游 | 本地 | 差异 |
|------|------|------|------|
| 大小 | 5,261B | 7,107B | +35% |

**本地增强内容（保留）：**

1. **GrokSearch 网络搜索规范**
2. **`mcp______ji` 知识回忆与存储**
3. **`mcp______enhance` Prompt 增强**
4. **Chrome DevTools 验证门控**：阶段 4 执行后 + 阶段 6 评审（含响应式断点测试 375/768/1440/1920px）

**需从上游同步的内容：**

1. `{{GEMINI_MODEL_FLAG}}` → `--gemini-model gemini-3-pro-preview `
2. `{{LITE_MODE_FLAG}}`
3. `{{WORKDIR}}` 多工作区检测


---

## 四、C 组：本地轻度增强 — 模式一致（12 个文件）

以下文件本地均比上游大 5-29%，增强模式高度一致，统一说明。

| 文件 | 上游 | 本地 | 增幅 |
|------|------|------|------|
| execute.md | 10,244B | 13,214B | +29% |
| feat.md | 6,630B | 8,470B | +28% |
| plan.md | 8,553B | 9,960B | +16% |
| enhance.md | 1,755B | 1,997B | +14% |
| test.md | 5,502B | 7,010B | +27% |
| analyze.md | 5,072B | 5,728B | +13% |
| backend.md | 5,261B | 6,189B | +18% |
| optimize.md | 5,458B | 6,099B | +12% |
| rollback.md | 2,403B | 3,051B | +27% |
| clean-branches.md | 2,346B | 2,683B | +14% |
| worktree.md | 2,781B | 3,060B | +10% |
| init.md | 2,555B | 2,648B | +4% |

**统一增强模式（本地共性）：**

1. 路径硬编码：`~/.claude/bin/codeagent-wrapper` → `C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe`
2. 用户交互：`AskUserQuestion` → `mcp______zhi`
3. 上下文检索：`{{MCP_SEARCH_TOOL}}` → `mcp__ace-tool__search_context`（带降级链）
4. Prompt 增强：内联逻辑 → `mcp______enhance`（带降级链）
5. 新增 GrokSearch 网络搜索规范（部分文件）
6. 新增 `mcp______ji` 知识存储（部分文件）
7. 新增 Chrome DevTools 验证门控（前端相关文件）

**统一需同步的上游内容：**

1. `{{GEMINI_MODEL_FLAG}}` → `--gemini-model gemini-3-pro-preview `
2. `{{LITE_MODE_FLAG}}` 轻量模式支持
3. `{{WORKDIR}}` 多工作区检测逻辑
4. 会话复用语法统一为 `resume`（非 `--resume`）

---

## 五、D 组：完全一致（4 个文件）

| 文件 | 大小 | 状态 |
|------|------|------|
| team-exec.md | 3,692B | 刚从上游复制，无差异 |
| team-plan.md | 4,445B | 刚从上游复制，无差异 |
| team-research.md | 5,497B | 刚从上游复制，无差异 |
| team-review.md | 4,276B | 刚从上游复制，无差异 |

**后续任务：** 这 4 个文件需要按本地增强模式进行定制（添加 zhi/ji/GrokSearch/硬编码路径等）。

---

## 六、执行任务清单

### P0 — 紧急同步（上游核心更新）

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 1 | 同步 spec-review.md | spec-review.md | 差异最大（-56%），补充 JSON 审查格式、决策门控、内联修复模式 |
| 2 | 同步 spec-plan.md | spec-plan.md | 补充 PBT 属性提取、不确定性审计、退出标准 |
| 3 | 同步 spec-impl.md | spec-impl.md | 补充原型重写规则、副作用审查、归档流程 |
| 4 | 同步 spec-init.md | spec-init.md | 补充 OS 检测、OpenSpec 安装验证、MCP 工具验证、状态汇总表 |
| 5 | 同步 spec-research.md | spec-research.md | 补充上下文边界探索、JSON 输出模板、约束集聚合、OPSX Proposal |

### P1 — 全局修复（影响所有文件）

| # | 任务 | 影响范围 | 说明 |
|---|------|----------|------|
| 6 | 添加 `--gemini-model` 参数 | 所有含 Gemini 调用的文件 | 上游使用 `{{GEMINI_MODEL_FLAG}}`，本地缺失 `--gemini-model gemini-3-pro-preview` |
| 7 | 添加 `{{LITE_MODE_FLAG}}` 支持 | 所有含 codeagent-wrapper 调用的文件 | 上游支持轻量模式，本地完全缺失 |
| 8 | 修复会话复用语法 | workflow.md 及其他使用 `--resume` 的文件 | `--resume xxx` → `resume xxx` |
| 9 | 添加多工作区检测 | 所有含 `$PWD` 的文件 | 上游有 `/add-dir` 多工作区检测逻辑，本地缺失 |

### P2 — 路径可移植性（可选优化）

| # | 任务 | 影响范围 | 说明 |
|---|------|----------|------|
| 10 | 路径去硬编码 | 所有 22 个本地增强文件 | `C:/Users/Administrator/.claude/` → `~/.claude/` 或环境变量 |

### P3 — 本地增强补全（team-* 文件定制）

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 11 | 定制 team-exec.md | team-exec.md | 添加 zhi/ji/GrokSearch/路径/Chrome DevTools |
| 12 | 定制 team-plan.md | team-plan.md | 同上 |
| 13 | 定制 team-research.md | team-research.md | 同上 |
| 14 | 定制 team-review.md | team-review.md | 同上 |

---

## 七、同步策略建议

### 合并原则

对于 A 组（本地过时）文件，采用**上游为主 + 本地增强叠加**策略：

1. 以上游文件为基础骨架
2. 替换路径为本地硬编码路径（或可移植路径）
3. 替换 `AskUserQuestion` → `mcp______zhi`
4. 替换 `{{MCP_SEARCH_TOOL}}` → `mcp__ace-tool__search_context`（带降级链）
5. 添加 GrokSearch 网络搜索规范
6. 添加 `mcp______ji` 知识存储
7. 添加 Chrome DevTools 验证门控（前端相关）

对于 B/C 组（本地增强）文件，采用**本地为主 + 上游补丁**策略：

1. 保留本地所有增强内容
2. 仅补充上游新增的参数（`--gemini-model`、`LITE_MODE_FLAG`）
3. 修复语法错误（`--resume` → `resume`）
4. 添加多工作区检测逻辑
