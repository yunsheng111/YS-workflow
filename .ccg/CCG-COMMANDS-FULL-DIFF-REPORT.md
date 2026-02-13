# CCG 26 个命令文件全量详细对比报告

> 生成时间：2026-02-12
> 上游版本：ccg-workflow@1.7.61
> 上游路径：`D:/Program Files/nvm/node_global/node_modules/ccg-workflow/templates/commands/`
> 本地路径：`C:/Users/Administrator/.claude/commands/ccg/`
> 对比方法：4 组并行 Agent Teams 逐文件逐段对比

---

## 一、总览仪表盘

### 文件分组统计

| 分组 | 文件数 | 本地 vs 上游 | 策略 | 详细报告 |
|------|--------|-------------|------|----------|
| **A 组**（本地过时） | 5 | 本地小 35-56% | 上游为主 + 本地增强叠加 | `DIFF-GROUP-A.md` |
| **B 组**（本地大幅增强） | 5 | 本地大 35-158% | 本地为主 + 上游补丁 | `DIFF-GROUP-B.md` |
| **C 组**（本地轻度增强） | 12 | 本地大 4-29% | 本地为主 + 上游补丁 | `DIFF-GROUP-C.md` |
| **D 组**（完全一致） | 4 | 0% | 待按本地模式定制 | `DIFF-GROUP-D.md` |
| **合计** | **26** | — | — | — |

### 差异热力图

```
文件名              增幅      差异方向    ████████████████████ 刻度
─────────────────────────────────────────────────────────────────
spec-review.md      -56%      ← 上游领先  ████████████████████ 最大
spec-plan.md        -45%      ← 上游领先  ████████████████
spec-impl.md        -43%      ← 上游领先  ███████████████
spec-init.md        -36%      ← 上游领先  ████████████
spec-research.md    -35%      ← 上游领先  ████████████
─────────────────────────────────────────────────────────────────
review.md           +158%     → 本地领先  ████████████████████ 最大
workflow.md         +116%     → 本地领先  ████████████████
commit.md           +85%      → 本地领先  ████████████
debug.md            +55%      → 本地领先  ████████████
frontend.md         +35%      → 本地领先  ████████
─────────────────────────────────────────────────────────────────
execute.md          +29%      → 本地领先  ██████
feat.md             +28%      → 本地领先  ██████
test.md             +27%      → 本地领先  ██████
rollback.md         +27%      → 本地领先  ██████
backend.md          +18%      → 本地领先  ████
plan.md             +16%      → 本地领先  ████
enhance.md          +14%      → 本地领先  ███
clean-branches.md   +14%      → 本地领先  ███
analyze.md          +13%      → 本地领先  ███
optimize.md         +12%      → 本地领先  ███
worktree.md         +10%      → 本地领先  ██
init.md             +4%       → 本地领先  █
─────────────────────────────────────────────────────────────────
team-exec.md         0%       = 一致      ─
team-plan.md         0%       = 一致      ─
team-research.md     0%       = 一致      ─
team-review.md       0%       = 一致      ─
```

---

## 二、全局架构差异（适用于所有 26 个文件）

### 2.1 工具映射对照表

| 功能 | 上游工具/占位符 | 本地工具 | 涉及文件数 |
|------|----------------|---------|-----------|
| 用户交互确认 | `AskUserQuestion` | `mcp______zhi`（三术 zhi） | 22/26 |
| 代码检索 | `{{MCP_SEARCH_TOOL}}` | `mcp__ace-tool__search_context` → `mcp______sou` → Glob/Grep | 18/26 |
| Prompt 增强 | 内联 `/ccg:enhance` 逻辑描述 | `mcp______enhance` → `mcp__ace-tool__enhance_prompt` | 14/26 |
| 网络搜索 | 无 | `mcp__Grok_Search_Mcp__web_search`（完整 5 步降级链） | 16/26 |
| 知识存储/回忆 | 无 | `mcp______ji`（记忆工具） | 16/26 |
| GitHub 集成 | 无 | GitHub MCP 工具（PR/Issue/Branch/Review/Merge） | 5/26 |
| Chrome DevTools | 无 | 前端验证门控（L1/L2/L3 降级） | 3/26 |
| 多模型调用 | `codeagent-wrapper` + `{{WORKDIR}}` | `codeagent-wrapper.exe` + `$PWD` | 18/26 |
| Gemini 模型 | `{{GEMINI_MODEL_FLAG}}` → `--gemini-model gemini-3-pro-preview` | 缺失 | 18/26 |
| 轻量模式 | `{{LITE_MODE_FLAG}}` | 缺失 | 18/26 |
| 多工作区检测 | `{{WORKDIR}}` + `/add-dir` 检测逻辑 | 缺失（使用 `$PWD`） | 18/26 |
| 会话复用语法 | `resume xxx`（非 `--resume`） | 部分文件错误使用 `--resume xxx` | 若干 |

### 2.2 路径体系差异

| 用途 | 上游 | 本地 |
|------|------|------|
| 可执行文件 | `~/.claude/bin/codeagent-wrapper` | `C:/Users/Administrator/.claude/bin/codeagent-wrapper.exe` |
| 提示词目录 | `~/.claude/.ccg/prompts/...` | `C:/Users/Administrator/.claude/.ccg/prompts/...` |
| 工作目录 | `{{WORKDIR}}` 占位符 | `$PWD` 硬编码 |
| OPSX 制品 | `openspec/changes/<id>/` | `.claude/spec/constraints/` `.claude/spec/proposals/` |

### 2.3 架构模式差异（仅影响 A 组 spec-* 文件）

| 维度 | 上游 | 本地 |
|------|------|------|
| 命令定位 | 命令 = 完整执行逻辑（单体） | 命令 = 路由层（调用子代理） |
| 执行者 | 命令自身执行全部步骤 | `Task(subagent_type: "spec-*-agent")` 子代理 |
| 文件标记 | HTML 注释 `<!-- CCG:SPEC:*:START/END -->` | Markdown 标题层级 |
| OPSX 集成 | `openspec CLI` 直接调用 | `.claude/spec/` 目录结构 |

---

## 三、A 组详细对比：本地过时（5 个 spec-* 文件）

### 3.1 spec-init.md（上游 4374B → 本地 2794B，-36%）

| 段落 | 上游 | 本地 | 差异类型 |
|------|------|------|----------|
| Core Philosophy | 3 条原则（OPSX+CCG 协作、就绪检查、快速失败） | 缺失 | 上游有，本地缺失 |
| Guardrails | 4 条（OS 检测、按步执行、可操作错误、尊重配置） | 缺失 | 上游有，本地缺失 |
| 标题+用法+角色 | 无 | 完整的命令规范头部 | 本地新增 |
| 网络搜索规范 | 无 | GrokSearch 5 步降级链 | 本地新增 |
| 步骤 1：检测 OS | `uname -s` / 环境变量检测 | 缺失（委托子代理） | 上游有，本地缺失 |
| 步骤 2：安装 OpenSpec | `npx` 验证→全局安装→再验证→降级 | 缺失（委托子代理） | 上游有，本地缺失 |
| 步骤 3：初始化 OPSX | `openspec init --tools claude` + 验证 3 目录 | 缺失（委托子代理） | 上游有，本地缺失 |
| 步骤 4：验证多模型 MCP | codeagent-wrapper 版本+Codex/Gemini 测试 | 缺失（委托子代理） | 上游有，本地缺失 |
| 步骤 5：验证上下文检索 | `{{MCP_SEARCH_TOOL}}` 可用性 3 级诊断 | 缺失（委托子代理） | 上游有，本地缺失 |
| 步骤 6：汇总报告 | 7 项状态表 + Next Steps | 缺失（委托子代理） | 上游有，本地缺失 |
| 执行工作流 | 无 | `Task(subagent_type: "spec-init-agent")` + zhi 确认 | 本地新增 |
| Reference | 5 条参考 | 缺失 | 上游有，本地缺失 |

### 3.2 spec-research.md（上游 4612B → 本地 2993B，-35%）

| 段落 | 上游 | 本地 | 差异类型 |
|------|------|------|----------|
| Core Philosophy | 4 条（约束集、缩小方案空间、可验证、OPSX 规则） | 缺失 | 上游有，本地缺失 |
| Guardrails | 6 条（必须 enhance、按上下文边界分区、自包含等） | 缺失 | 上游有，本地缺失 |
| 步骤 0：MANDATORY Enhance | 详细 enhance 逻辑（分析意图/缺失/假设/补全） | 缺失 | 上游有，本地缺失 |
| 步骤 1：OPSX Change 生成 | `openspec list --json` + `openspec new change` | 缺失 | 上游有，本地缺失 |
| 步骤 2：初始代码评估 | 扫描→判断单/多目录→决策并行探索 | 缺失 | 上游有，本地缺失 |
| 步骤 3：定义探索边界 | 3 个 subagent（用户域/认证/基础设施）；按上下文边界划分 | 缺失 | 上游有，本地缺失 |
| 步骤 4：多模型并行探索 | JSON 输出模板（8 字段）；Codex→后端、Gemini→前端 | 缺失 | 上游有，本地缺失 |
| 步骤 5：聚合与综合 | 4 类约束集（硬/软/依赖/风险） | 缺失 | 上游有，本地缺失 |
| 步骤 6：用户交互 | `AskUserQuestion` 分组提问 | 缺失 | 上游有，本地缺失 |
| 步骤 7：OPSX Proposal 定稿 | Context + Requirements + Success Criteria | 缺失 | 上游有，本地缺失 |
| 步骤 8：上下文检查点 | 80K tokens 建议 `/clear` | 缺失 | 上游有，本地缺失 |

### 3.3 spec-plan.md（上游 5389B → 本地 2940B，-45%）

| 段落 | 上游 | 本地 | 差异类型 |
|------|------|------|----------|
| Core Philosophy | 4 条（消除决策点、解决歧义、多模型盲点、PBT） | 缺失 | 上游有，本地缺失 |
| 步骤 2：多模型并行分析 | 完整 Codex+Gemini 并行调用模板；`run_in_background: true` | 缺失 | **核心差异** |
| 步骤 3：不确定性消除审计 | Anti-Pattern 检测（"或"/"可能"/"TBD"） | 缺失 | 上游有，本地缺失 |
| 步骤 4：PBT 属性提取 | 6 类属性（幂等/单调/往返/不变量/交换/等价） | 缺失 | **核心差异** |
| 步骤 5：OPSX 制品更新 | `openspec status --change` | 缺失 | 上游有，本地缺失 |
| Exit Criteria | 5 项清单 | 缺失 | 上游有，本地缺失 |

### 3.4 spec-impl.md（上游 5412B → 本地 3092B，-43%）

| 段落 | 上游 | 本地 | 差异类型 |
|------|------|------|----------|
| Core Philosophy | 4 条（机械执行、原型参考、范围控制、最小文档） | 缺失 | 上游有，本地缺失 |
| 步骤 3：最小可验证阶段 | 最小可独立验证的实施阶段 | 缺失 | 上游有，本地缺失 |
| 步骤 4：任务路由 | Gemini=前端、Codex=后端、Claude=胶水代码 | 缺失 | **核心差异** |
| 步骤 5：原型重写规则 | 5 项规则（去冗余/清晰命名/对齐风格/消注释/无新依赖） | 缺失 | **核心差异** |
| 步骤 6：副作用审查 | 4 项检查清单（范围/模块影响/依赖/接口） | 缺失 | 上游有，本地缺失 |
| 步骤 7：多模型并行审查 | 完整 JSON 输出格式 | 缺失 | 上游有，本地缺失 |
| Exit Criteria | 4 项 | 缺失 | 上游有，本地缺失 |
| 本地独有：执行前确认 | 无 | `mcp______zhi` 确认执行计划 | 本地新增 |
| 本地独有：回滚选项 | 无 | 确认选项含「回滚变更」 | 本地新增 |

### 3.5 spec-review.md（上游 6705B → 本地 2972B，-56%，差异最大）

| 段落 | 上游 | 本地 | 差异类型 |
|------|------|------|----------|
| Core Philosophy | 4 条（双模型交叉、Critical 必须处理等） | 缺失 | 上游有，本地缺失 |
| 步骤 3：多模型审查 | Codex 5 维度 + Gemini 5 维度；完整 JSON 输出格式 | 缺失 | **核心差异** |
| 步骤 4：综合发现 | 去重 + Critical/Warning/Info 分级 | 缺失（本地用 Critical/Major/Minor） | 分级名称不一致 |
| 步骤 5：审查报告模板 | 完整格式+示例 | 缺失 | 上游有，本地缺失 |
| 步骤 6：决策门控 | Critical>0→阻止归档 | 缺失 | **核心差异** |
| 步骤 7：内联修复模式 | 路由到模型→unified diff→循环至 Critical=0 | 缺失 | **核心差异** |
| Exit Criteria | 4 项 | 缺失 | 上游有，本地缺失 |
| 本地独有：知识沉淀 | 无 | `mcp______ji` 存储约束经验 | 本地新增 |

### A 组同步建议

**关键行动**：需验证 5 个 `spec-*-agent` 子代理文件是否包含上游的详细工作流步骤。如果子代理缺少这些内容，执行质量将严重下降。

**必须同步**：Core Philosophy + Guardrails + 详细工作流步骤 + Exit Criteria + PBT 属性 + 决策门控 + JSON 审查格式

---

## 四、B 组详细对比：本地大幅增强（5 个文件）

### 4.1 workflow.md（上游 7067B → 本地 15283B，+116%）

**本地独有的 8 大增强**：

| 增强 | 内容 | 价值 |
|------|------|------|
| 核心协议区块 | 语言协议、代码主权、Enhance 接管、止损机制、阶段回退 | 高 |
| 网络搜索规范 | GrokSearch 完整 5 步降级链 | 高 |
| 每阶段 zhi 确认 | 含 Markdown 格式、predefined_options | 高 |
| 工作流初始化 | `mcp______ji` 回忆历史经验 | 中 |
| 分支管理（阶段 3 后） | `mcp__github__create_branch` + 降级 | 高 |
| Chrome DevTools 验证门控 | 阶段 4+阶段 6（L1/L2/L3 降级） | 高 |
| 阶段 7：GitHub PR | `mcp__github__create_pull_request` 完整流程 | 高 |
| ji 经验存储 | 工作流结束时存储 | 中 |

**需从上游同步**：`{{GEMINI_MODEL_FLAG}}`、`{{LITE_MODE_FLAG}}`、`{{WORKDIR}}` 多工作区检测、`resume` 语法修复

### 4.2 review.md（上游 4321B → 本地 11149B，+158%，增幅最大）

**本地独有增强**：

| 增强 | 内容 |
|------|------|
| GitHub PR 审查 | `get_pull_request` → `get_pull_request_files` → `update_pull_request_branch` |
| CI/CD 状态检查 | `get_pull_request_status` + CI 失败标注 |
| 阶段 5：PR 审查提交 | `create_pull_request_review`（Critical→REQUEST_CHANGES/Major→COMMENT/其他→APPROVE） |
| 阶段 6：PR 合并 | `merge_pull_request`（squash/merge/rebase 选择） |
| Issue 创建 | `create_issue` 记录严重问题 |

### 4.3 commit.md（上游 2474B → 本地 4584B，+85%）

**本地独有增强**：

| 增强 | 内容 |
|------|------|
| zhi 确认 UI | 阶段 4 展示变更摘要+提交信息预览+4 选项 |
| 阶段 6：GitHub 推送 | `push_files` → 降级 `git push` |

**核心 5 阶段工作流完全一致，无需同步核心逻辑。**

### 4.4 debug.md（上游 4636B → 本地 7177B，+55%）

**本地独有增强**：

| 增强 | 内容 |
|------|------|
| GrokSearch | 完整网络搜索规范 |
| ji 知识回忆/存储 | 回忆历史缺陷模式 + 存储修复方案 |
| enhance 工具 | `mcp______enhance` 替代内联逻辑 |
| 阶段 6：GitHub Issue | 修复后创建 Issue 记录缺陷 |

### 4.5 frontend.md（上游 5261B → 本地 7107B，+35%）

**本地独有增强**：

| 增强 | 内容 |
|------|------|
| Chrome DevTools 验证 | 阶段 4 执行后 + 阶段 6 评审（6 步验证流程） |
| 响应式断点测试 | 375px / 768px / 1440px / 1920px |
| 移动/深色模式模拟 | emulate viewport + colorScheme |

### B 组同步建议

**保留全部本地增强**。仅需补丁 3 项上游更新：
1. `resume` vs `--resume` 语法修复（上游明确注释"不是 --resume"）
2. `{{LITE_MODE_FLAG}}` 支持
3. `{{GEMINI_MODEL_FLAG}}` / `--gemini-model` 参数

---

## 五、C 组详细对比：本地轻度增强（12 个文件）

### 5.1 共性差异汇总（15 类）

| 编号 | 差异类别 | 上游 → 本地 | 涉及文件数 | 建议 |
|------|---------|------------|-----------|------|
| C1 | 路径硬编码（可执行文件） | `~/.claude/bin/codeagent-wrapper` → Windows 绝对路径 | 10/12 | 保留本地 |
| C2 | 路径硬编码（提示词） | `~/.claude/.ccg/prompts/` → Windows 绝对路径 | 10/12 | 保留本地 |
| C4 | `{{LITE_MODE_FLAG}}` 缺失 | 上游有，本地移除 | 10/12 | **建议同步** |
| C5 | `{{GEMINI_MODEL_FLAG}}` 缺失 | 上游有，本地移除 | 8/12 | **建议同步** |
| C6 | `{{WORKDIR}}` 多工作区缺失 | 上游有，本地用 `$PWD` | 8/12 | **建议同步** |
| C8 | 用户确认工具替换 | `AskUserQuestion` → `mcp______zhi` | 10/12 | 保留本地 |
| C9 | 新增 GrokSearch 规范 | 无 → 完整 5 步降级 | 8/12 | 保留本地 |
| C10 | 新增 ji 知识存储 | 无 → `mcp______ji` 存储 | 8/12 | 保留本地 |
| C11 | 新增执行初始化 | 无 → `mcp______ji` 回忆 | 7/12 | 保留本地 |
| C12 | Prompt 增强工具替换 | 内联逻辑 → `mcp______enhance` | 7/12 | 保留本地 |
| C13 | 上下文检索工具替换 | `{{MCP_SEARCH_TOOL}}` → `mcp__ace-tool__search_context` | 6/12 | 保留本地 |

### 5.2 各文件特有差异

| 文件 | 增幅 | 特有差异 | 复杂度 |
|------|------|---------|--------|
| execute.md | +29% | GitHub Issue 更新流程、Phase 0 zhi 确认、Phase 5.3 zhi 交付 | 高 |
| feat.md | +28% | GitHub Issue 获取（`get_issue`）、zhi 交互确认 | 高 |
| test.md | +27% | **Chrome DevTools E2E 测试门控**（唯一新增浏览器自动化测试的文件） | 中高 |
| rollback.md | +27% | **阶段 7 回滚历史记录**（`mcp______ji` 存储回滚记录） | 中 |
| enhance.md | +14% | **工作流完全重构**（上游 4 步手动 → 本地 3 步工具驱动）；缺失上游"增强原则"段 | 中高 |
| plan.md | +16% | Phase 2 结束 zhi 交付确认 | 中 |
| backend.md | +18% | 纯共性模式（无特有差异）；仅 Codex 不涉及 Gemini | 低 |
| optimize.md | +12% | 纯共性模式 | 低 |
| analyze.md | +13% | 纯共性模式 | 低 |
| clean-branches.md | +14% | 阶段 3 zhi 报告预览（差异最小，无 codeagent-wrapper 调用） | 低 |
| worktree.md | +10% | 仅 zhi 确认增强（Add 创建+Migrate 迁移步骤） | 低 |
| init.md | +4% | 仅 `{{WORKDIR}}` → `$PWD`（差异最小） | 极低 |

---

## 六、D 组详细对比：完全一致（4 个 team-* 文件）

### 6.1 一致性验证

| 文件 | 上游字节 | 本地字节 | diff 结果 |
|------|---------|---------|-----------|
| team-exec.md | 3692 | 3692 | 完全一致 |
| team-plan.md | 4445 | 4445 | 完全一致 |
| team-research.md | 5497 | 5497 | 完全一致 |
| team-review.md | 4276 | 4276 | 完全一致 |

### 6.2 工作流数据流

```
team-research                team-plan                team-exec              team-review
  (约束发现)     ──────>      (零决策规划)    ──────>   (并行实施)    ──────>   (交叉审查)
  输出:                       输出:                    输出:                  输出:
  <名>-research.md           <名>.md                  代码变更               审查报告
  约束集+成功判据             子任务+并行分组           Builder 产出           Critical 修复
```

### 6.3 定制建议

| 文件 | 需要的增强 | 优先级 |
|------|-----------|--------|
| **全部 4 个** | `AskUserQuestion` → `mcp______zhi` | 高 |
| team-research | `mcp______enhance` 替换内联 enhance 逻辑 | 高 |
| team-research | `mcp______ji` 约束集归档 + GrokSearch 外部调研 | 中 |
| team-review | Chrome DevTools 前端验证步骤 | 中 |
| team-plan/exec | `mcp______ji` 关键决策/变更摘要写入 | 低 |

---

## 七、优先级行动清单

### P0 — 必须做（影响功能正确性）

| # | 任务 | 文件范围 | 说明 |
|---|------|----------|------|
| 1 | **验证 5 个 spec-*-agent 子代理**是否包含上游详细工作流 | spec-init/research/plan/impl/review-agent.md | A 组命令将执行逻辑委托给子代理，如果子代理缺少上游的详细步骤，执行质量严重下降 |
| 2 | **同步 5 个 spec-* 命令**的上游核心更新 | spec-*.md | PBT 属性、决策门控、JSON 审查格式、原型重写规则 |
| 3 | **修复 `resume` 语法** | workflow.md 及相关文件 | 上游明确："是 `resume`，不是 `--resume`" |

### P1 — 应该做（影响功能完整性）

| # | 任务 | 文件范围 | 说明 |
|---|------|----------|------|
| 4 | 添加 `--gemini-model gemini-3-pro-preview` 参数 | 18 个含 Gemini 调用的文件 | 缺失会导致 Gemini 使用默认模型 |
| 5 | 添加 `{{LITE_MODE_FLAG}}` 支持 | 18 个含 codeagent-wrapper 的文件 | 缺失无法使用精简模式 |
| 6 | 添加多工作区检测逻辑 | 18 个含 `$PWD` 的文件 | 缺失无法支持 `/add-dir` 多工作区 |
| 7 | 定制 4 个 team-* 文件 | team-exec/plan/research/review.md | 按本地增强模式添加 zhi/ji/enhance 等 |
| 8 | 统一分级名称 | spec-review 相关 | 上游 Critical/Warning/Info vs 本地 Critical/Major/Minor |

### P2 — 可以做（优化项）

| # | 任务 | 文件范围 | 说明 |
|---|------|----------|------|
| 9 | 路径去硬编码 | 22 个本地增强文件 | `C:/Users/Administrator/.claude/` → 环境变量 |
| 10 | enhance.md 补回"增强原则"段 | enhance.md | 上游的 4 条原则有参考价值 |
| 11 | description 语言统一 | A 组 5 个文件 | 上游中文，本地英文 |
| 12 | Context Checkpoint 同步 | 子代理文件 | 80K tokens 上下文管理 |

---

## 八、关键发现总结

### 本地架构的 6 大优势（保留）

1. **三术(zhi)交互系统** — 结构化确认替代纯文本，覆盖 22/26 文件
2. **GitHub MCP 完整集成** — PR/Issue/Branch/Review/Merge 自动化
3. **Chrome DevTools 验证门控** — 前端自动化验证 + L1/L2/L3 降级
4. **GrokSearch 搜索降级链** — 5 步降级策略，16/26 文件覆盖
5. **ji 知识管理** — 跨会话经验复用，16/26 文件覆盖
6. **命令+代理分离架构** — spec-* 系列实现关注点分离

### 本地架构的 4 大风险（需修复）

1. **spec-* 执行逻辑可能不完整** — 上游 35-56% 的内容可能未迁移到子代理
2. **`--resume` 语法错误** — 可能导致会话复用失败
3. **缺失 Gemini 模型指定** — 可能使用非预期的默认模型
4. **缺失 Lite 模式** — 无法在精简模式下运行

---

## 九、详细报告索引

| 报告文件 | 内容 | 大小 |
|----------|------|------|
| `DIFF-GROUP-A.md` | A 组 5 个 spec-* 文件逐段对比 | 26KB |
| `DIFF-GROUP-B.md` | B 组 5 个本地增强文件逐段对比 | 26KB |
| `DIFF-GROUP-C.md` | C 组 12 个轻度增强文件逐段对比 + 共性模式 | 21KB |
| `DIFF-GROUP-D.md` | D 组 4 个 team-* 文件一致性验证 + 定制建议 | 11KB |
| `CCG-COMMANDS-DIFF-REPORT.md` | 前一轮对比报告（大小+核心差异） | 已有 |
| `CCG-COMMANDS-DIFF-PROGRESS.md` | 进度追踪文档 | 已有 |
