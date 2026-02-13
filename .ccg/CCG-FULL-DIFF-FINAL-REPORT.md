# CCG 架构全量对比报告（A-G 七组完整版）

> 生成时间：2026-02-12
> 上游版本：ccg-workflow（npm 全局安装）
> 上游路径：`D:/Program Files/nvm/node_global/node_modules/ccg-workflow/templates/`
> 本地路径：`C:/Users/Administrator/.claude/`
> 对比方法：Agent Teams 7 组并行对比

---

## 一、全量清单总览

### 1.1 上游文件清单（56 个模板文件）

| 目录 | 文件数 | 说明 |
|------|--------|------|
| `commands/` | 26 | CCG 命令定义（含 4 个 team-*） |
| `commands/agents/` | 4 | 代理定义（get-current-datetime, init-architect, planner, ui-ux-designer） |
| `prompts/claude/` | 6 | Claude 子模型角色提示词 |
| `prompts/codex/` | 6 | Codex 子模型角色提示词 |
| `prompts/gemini/` | 7 | Gemini 子模型角色提示词（多一个 frontend.md） |
| `output-styles/` | 5 | AI 输出风格模板 |
| **合计** | **54** | — |

### 1.2 本地文件清单（有效配置文件）

| 目录 | 文件数 | 说明 |
|------|--------|------|
| `commands/ccg/` | 26 | CCG 命令定义（与上游一一对应） |
| `agents/ccg/` | 20 | 代理定义（4 个上游 + 16 个本地独有） |
| `.ccg/prompts/claude/` | 6 | Claude 子模型角色提示词 |
| `.ccg/prompts/codex/` | 6 | Codex 子模型角色提示词 |
| `.ccg/prompts/gemini/` | 7 | Gemini 子模型角色提示词 |
| `skills/` | 8（+2 ref） | Skills 技能包（本地独有） |
| `CLAUDE.md` | 1 | 全局主代理配置（本地独有） |
| `settings.json` | 1 | MCP 服务器配置（本地独有） |
| **合计** | **75+** | — |

### 1.3 七组对比分组

| 组别 | 文件类型 | 文件数 | 对比结果 | 详细报告 |
|------|----------|--------|----------|----------|
| **A** | 5 个 spec-* 命令 | 5 | 本地过时 35-56% | `DIFF-GROUP-A.md` (26KB) |
| **B** | 5 个本地大幅增强命令 | 5 | 本地领先 35-158% | `DIFF-GROUP-B.md` (26KB) |
| **C** | 12 个本地轻度增强命令 | 12 | 本地领先 4-29% | `DIFF-GROUP-C.md` (21KB) |
| **D** | 4 个 team-* 命令 | 4 | 完全一致 0% | `DIFF-GROUP-D.md` (11KB) |
| **E** | 20 个代理文件 | 20 | 4 共有 + 16 本地独有 | `DIFF-GROUP-E.md` (25KB) |
| **F** | 19 个 prompts 模板 | 19 | 18 有差异 + 1 一致 | `DIFF-GROUP-F.md` (17KB) |
| **G** | output-styles + skills + 配置 | 14 | 上游独有 5 + 本地独有 9 | `DIFF-GROUP-G.md` (11KB) |
| **合计** | — | **79** | — | **137KB** |

---

## 二、全局差异热力图

```
                    ← 上游领先                     本地领先 →
文件                │ 差异 │ ████████████████████████████████ 刻度
────────────────────┼──────┼──────────────────────────────────
命令 A 组
  spec-review.md    │ -56% │ ████████████████████           ← 最大落后
  spec-plan.md      │ -45% │ ████████████████
  spec-impl.md      │ -43% │ ███████████████
  spec-init.md      │ -36% │ ████████████
  spec-research.md  │ -35% │ ████████████
命令 B 组
  review.md         │+158% │                    ████████████████████ → 最大领先
  workflow.md       │+116% │                    ████████████████
  commit.md         │ +85% │                    ████████████
  debug.md          │ +55% │                    ████████████
  frontend.md       │ +35% │                    ████████
命令 C 组（12 个）  │+4~29%│                    ██~██████
命令 D 组（4 个）   │   0% │ ─ (完全一致)
代理 E 组
  4 共有            │+4~32%│                    █~████████
  16 本地独有       │ N/A  │                    ████████████████████ (独有)
Prompts F 组
  18 有差异         │ +微量│                    █ (仅命令引用+中文)
  1 完全一致        │   0% │ ─
G 组
  5 output-styles   │ N/A  │ ████████████████████ (上游独有)
  8 skills          │ N/A  │                    ████████████████████ (本地独有)
  CLAUDE.md         │ N/A  │                    ████████████████████ (本地独有)
```

---

## 三、各组核心结论

### A 组：5 个 spec-* 命令（本地过时）

**核心问题**：本地采用「命令=路由层+代理=执行层」架构，命令精简但将执行逻辑委托给子代理。

**关键发现**：
- 上游命令包含完整的 Core Philosophy、Guardrails、详细工作流步骤、Exit Criteria
- 本地命令仅保留路由框架（`Task(subagent_type: "spec-*-agent")`）
- **E 组验证结论**：5 个 spec-*-agent 子代理确实包含完整执行逻辑，覆盖了 Core Philosophy、Guardrails、多模型并行调用、Exit Criteria

**结论**：A 组的「过时」是**架构差异**而非内容缺失。执行逻辑已迁移到子代理。

### B 组：5 个本地大幅增强命令（保留）

| 文件 | 增幅 | 核心增强 |
|------|------|---------|
| review.md | +158% | GitHub PR 完整审查+合并流程 |
| workflow.md | +116% | 核心协议+GrokSearch+Chrome DevTools+GitHub PR |
| commit.md | +85% | zhi 确认 UI + GitHub 推送 |
| debug.md | +55% | GrokSearch + ji 知识 + GitHub Issue |
| frontend.md | +35% | Chrome DevTools 验证门控 |

**需从上游补丁**：`resume` 语法修复、`{{LITE_MODE_FLAG}}`、`{{GEMINI_MODEL_FLAG}}`

### C 组：12 个本地轻度增强命令

**15 类共性差异模式**，核心 3 类需同步：
1. `{{LITE_MODE_FLAG}}` 缺失（10/12 文件）
2. `{{GEMINI_MODEL_FLAG}}` 缺失（8/12 文件）
3. `{{WORKDIR}}` 多工作区检测缺失（8/12 文件）

### D 组：4 个 team-* 命令（完全一致）

与上游 100% 字节精确匹配。待按本地增强模式定制（zhi/ji/enhance）。

### E 组：20 个代理文件（核心发现）

**共有 4 个文件差异模式一致**：
- `get-current-datetime.md` — 完全一致
- `init-architect.md` — +1,250B（新增 zhi 确认 + ji 存储 + GitHub 仓库创建）
- `planner.md` — +837B（模板变量实例化 + ji 记忆 + zhi 确认）
- `ui-ux-designer.md` — +4,443B（12 个 MCP 工具 + Chrome DevTools 9 步验证 + UI/UX 知识库）

**本地独有 16 个代理覆盖完整开发生命周期**：
- 11 个通用开发代理：analyze/backend/commit/debug/execute/frontend/fullstack/fullstack-light/optimize/review/test
- 5 个 OpenSpec 代理：spec-init/research/plan/impl/review（形成约束驱动闭环）

**OpenSpec 代理关键验证**：
- Core Philosophy 全覆盖（约束驱动、零决策、多模型、可追溯）
- Guardrails 全覆盖（Critical 零容忍、约束不遗漏、审批门控、二次验证）
- 多模型并行调用 4/5 代理实现（Codex+Gemini + TaskOutput 等待）
- Exit Criteria 每个代理均有明确退出条件

### F 组：19 个 prompts 模板（差异极小）

**18/19 有差异**，但差异类型高度一致：
1. **命令引用更新**（8/19）：上游 `/ccg:think`、`/ccg:dev`、`/ccg:code`、`/ccg:bugfix` → 本地 `/ccg:workflow`、`/ccg:analyze`、`/ccg:debug`
2. **中文语言要求**（18/19）：本地末尾追加 6 行简体中文输出要求
3. **完全一致**：仅 `gemini/architect.md`

**影响**：极低。命令引用差异反映上游重命名了命令，本地已适配新命名。

### G 组：output-styles + skills + 配置

**Output Styles（5 个，上游有本地无）**：
- 5 种 AI 角色风格（专业工程师/暴躁老王/猫娘/大小姐/修仙者）
- 纯装饰性功能，技术规范已被 CLAUDE.md 覆盖
- **可选安装**，不影响功能

**Skills（8 个，本地有上游无）**：
- ci-cd-generator、database-designer、documentation-writer、find-skills
- frontend-design、git-workflow、prototype-prompt-generator、ui-ux-pro-max
- 来自 Claude Code 开源 Skill 生态（`npx skills`），与 CCG 命令体系独立互补
- 通过 CLAUDE.md 任务路由表统一调度

**CLAUDE.md（本地独有）**：
- 不属于上游模板，是基于 CCG 架构理念的深度定制配置
- 包含入口协议、MCP 工具优先级、降级策略、GitHub MCP 集成、任务路由等

---

## 四、完整架构关系图

```
本地 CCG 系统
├── CLAUDE.md ─────────────── 全局主代理配置（本地深度定制）
│   ├── 入口协议（enhance → zhi → search_context）
│   ├── 任务路由决策 ──→ CCG 命令 / Skills / MCP 工具
│   ├── 工具优先级表
│   ├── 降级策略
│   └── GitHub MCP 集成指南
│
├── commands/ccg/ ─────────── 26 个 CCG 命令（路由层）
│   ├── A 组 spec-*（5）     → 委托 spec-*-agent 子代理
│   ├── B 组增强命令（5）     → workflow/review/commit/debug/frontend
│   ├── C 组轻度增强（12）    → 其余通用命令
│   └── D 组 team-*（4）      → Agent Teams 四阶段流水线
│
├── agents/ccg/ ───────────── 20 个代理（执行层）
│   ├── 上游共有（4）         → get-current-datetime, init-architect, planner, ui-ux-designer
│   ├── 本地通用（11）        → analyze/backend/commit/debug/execute/frontend/fullstack/...
│   └── 本地 OpenSpec（5）    → spec-init/research/plan/impl/review
│
├── .ccg/prompts/ ─────────── 19 个多模型角色提示词
│   ├── claude/（6）           → analyzer/architect/debugger/optimizer/reviewer/tester
│   ├── codex/（6）            → 同上
│   └── gemini/（7）           → 同上 + frontend
│
├── skills/ ───────────────── 8 个 Skills（本地独有，中等复杂度任务）
│   ├── ci-cd-generator       → CI/CD 配置
│   ├── database-designer     → 数据库设计
│   ├── documentation-writer  → 文档生成
│   ├── find-skills           → Skill 生态管理
│   ├── frontend-design       → 前端设计
│   ├── git-workflow          → Git 自动化
│   ├── prototype-prompt-gen  → 原型提示词
│   └── ui-ux-pro-max        → UI/UX 智能设计
│
└── （无 output-styles）

上游 CCG 模板
├── commands/（26） + commands/agents/（4）
├── prompts/ claude(6) + codex(6) + gemini(7)
├── output-styles/（5 种角色风格）
└── （无 skills/、无 CLAUDE.md）
```

---

## 五、优先级行动清单（全量版）

### P0 — 必须做

| # | 任务 | 影响范围 | 说明 |
|---|------|----------|------|
| 1 | ~~验证 spec-*-agent 子代理~~ | 已完成 ✅ | E 组确认 5 个子代理包含完整执行逻辑 |
| 2 | 修复 `resume` → 不是 `--resume` | workflow.md 等 | 上游明确注释，本地可能语法错误 |
| 3 | Prompts 命令引用同步 | 8/19 个 prompts | 上游已重命名命令（think→analyze 等），本地已适配但需确认双向一致 |

### P1 — 应该做

| # | 任务 | 影响范围 | 说明 |
|---|------|----------|------|
| 4 | 添加 `--gemini-model` 参数 | 18 个含 Gemini 调用的文件 | 缺失会使用默认模型 |
| 5 | 添加 `{{LITE_MODE_FLAG}}` | 18 个含 codeagent-wrapper 的文件 | 缺失无法使用精简模式 |
| 6 | 添加多工作区检测 `{{WORKDIR}}` | 18 个文件 | 缺失无法支持 `/add-dir` |
| 7 | 定制 4 个 team-* 文件 | team-exec/plan/research/review | 添加 zhi/ji/enhance 本地增强 |
| 8 | 统一 Prompts 中文语言要求 | 18/19 个 prompts | 本地已添加，确认格式统一 |

### P2 — 可以做

| # | 任务 | 影响范围 | 说明 |
|---|------|----------|------|
| 9 | 安装 output-styles（可选） | 5 个风格模板 | 纯装饰性，不影响功能 |
| 10 | 路径去硬编码 | 22 个本地增强文件 | `C:/Users/Administrator/.claude/` → 环境变量 |
| 11 | enhance.md 补回"增强原则"段 | enhance.md | 上游 4 条原则有参考价值 |
| 12 | spec-* 命令补充 Core Philosophy 摘要 | 5 个 spec-* 命令 | 命令层可保留设计理念简述（详细在子代理） |

---

## 六、关键结论

### 本地架构 6 大优势（保留）

1. **三术(zhi)交互系统** — 结构化确认，22/26 命令 + 19/20 代理覆盖
2. **GitHub MCP 完整集成** — PR/Issue/Branch/Review/Merge 自动化
3. **Chrome DevTools 验证门控** — 前端自动化验证 + L1/L2/L3 降级
4. **GrokSearch 搜索降级链** — 5 步降级策略，16/26 命令覆盖
5. **ji 知识管理** — 跨会话经验复用，16/26 命令 + 19/20 代理覆盖
6. **命令+代理分离架构** — spec-* 和通用命令均实现关注点分离

### 本地架构 3 个已消除的风险

1. ~~spec-*-agent 执行逻辑缺失~~ → E 组验证：16 个本地独有代理完整覆盖上游逻辑 ✅
2. ~~OpenSpec 工作流断裂~~ → E 组验证：5 个代理形成完整闭环 ✅
3. ~~Prompts 过时~~ → F 组验证：仅命令引用和语言要求差异，核心提示词完整 ✅

### 需关注的 2 个风险

1. **`--resume` 语法问题** — 可能导致会话复用失败
2. **缺失 Gemini 模型指定 + Lite 模式** — 影响多模型协作精确性

---

## 七、详细报告索引

| 报告 | 内容 | 大小 | 文件数 |
|------|------|------|--------|
| `DIFF-GROUP-A.md` | 5 个 spec-* 命令逐段对比 | 26KB | 5 |
| `DIFF-GROUP-B.md` | 5 个增强命令逐段对比 | 26KB | 5 |
| `DIFF-GROUP-C.md` | 12 个轻度增强命令 + 15 类共性模式 | 21KB | 12 |
| `DIFF-GROUP-D.md` | 4 个 team-* 一致性验证 + 定制建议 | 11KB | 4 |
| `DIFF-GROUP-E.md` | 20 个代理文件 + OpenSpec 深度分析 | 25KB | 20 |
| `DIFF-GROUP-F.md` | 19 个 prompts 逐文件对比 | 17KB | 19 |
| `DIFF-GROUP-G.md` | output-styles + skills + CLAUDE.md | 11KB | 14 |
| **合计** | — | **137KB** | **79** |
