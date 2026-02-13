# F 组对比报告：Prompts 模板文件（19 个文件）

> 生成时间：2026-02-12
> 上游路径：`D:/Program Files/nvm/node_global/node_modules/ccg-workflow/templates/prompts/`
> 本地路径：`C:/Users/Administrator/.claude/.ccg/prompts/`

---

## 一、对比总览

| # | 文件路径 | 差异类型 | 差异行数 | 严重程度 |
|---|---------|---------|---------|---------|
| 1 | claude/analyzer.md | 命令引用 + 中文语言要求 | 3处 | 低 |
| 2 | claude/architect.md | 命令引用 + 中文语言要求 | 2处 | 低 |
| 3 | claude/debugger.md | 仅中文语言要求 | 1处 | 低 |
| 4 | claude/optimizer.md | 仅中文语言要求 | 1处 | 低 |
| 5 | claude/reviewer.md | 命令引用 + 中文语言要求 | 2处 | 低 |
| 6 | claude/tester.md | 仅中文语言要求 | 1处 | 低 |
| 7 | codex/analyzer.md | 命令引用 + 中文语言要求 | 2处 | 低 |
| 8 | codex/architect.md | 命令引用 + 中文语言要求 | 2处 | 低 |
| 9 | codex/debugger.md | 仅中文语言要求 | 1处 | 低 |
| 10 | codex/optimizer.md | 仅中文语言要求 | 1处 | 低 |
| 11 | codex/reviewer.md | 命令引用 + Scoring引用 + 中文语言要求 | 3处 | 低 |
| 12 | codex/tester.md | 仅中文语言要求 | 1处 | 低 |
| 13 | gemini/analyzer.md | 命令引用 + 中文语言要求 | 2处 | 低 |
| 14 | gemini/architect.md | 无差异 | 0处 | 无 |
| 15 | gemini/debugger.md | 仅中文语言要求 | 1处 | 低 |
| 16 | gemini/frontend.md | 命令引用 + 中文语言要求 | 2处 | 低 |
| 17 | gemini/optimizer.md | 仅中文语言要求 | 1处 | 低 |
| 18 | gemini/reviewer.md | 命令引用 + Scoring引用 + 中文语言要求 | 3处 | 低 |
| 19 | gemini/tester.md | 仅中文语言要求 | 1处 | 低 |

**统计**：19 个文件中 18 个有差异，1 个完全一致（gemini/architect.md）。

---

## 二、逐文件详细对比

### 2.1 claude/analyzer.md

**差异 1：命令引用（第 3 行）**
```diff
- > For: /ccg:analyze, /ccg:think, /ccg:dev Phase 2
+ > For: /ccg:analyze, /ccg:workflow Phase 2
```
- 上游引用 `/ccg:think` 和 `/ccg:dev`
- 本地改为 `/ccg:workflow`，移除了 `/ccg:think` 和 `/ccg:dev`

**差异 2：中文语言要求（文件末尾）**
本地新增 6 行：
```markdown
## 语言要求

- 所有分析输出**必须**使用简体中文（简体中文）
- 技术术语可保留英文，但解释和描述必须用中文
- 代码注释使用中文描述意图
```

---

### 2.2 claude/architect.md

**差异 1：命令引用（第 3 行）**
```diff
- > For: /ccg:code, /ccg:dev Phase 3 (as third model)
+ > For: /ccg:workflow Phase 3 (as third model)
```
- 上游引用 `/ccg:code` 和 `/ccg:dev`
- 本地改为 `/ccg:workflow`

**差异 2：中文语言要求（文件末尾）**
本地新增同一模板的语言要求段落（同上）。

---

### 2.3 claude/debugger.md

**差异：仅中文语言要求（文件末尾）**
主体内容完全一致，本地在文件末尾新增语言要求段落。

---

### 2.4 claude/optimizer.md

**差异：仅中文语言要求（文件末尾）**
主体内容完全一致，本地在文件末尾新增语言要求段落。

---

### 2.5 claude/reviewer.md

**差异 1：命令引用（第 3 行）**
```diff
- > For: /ccg:review, /ccg:bugfix, /ccg:dev Phase 5
+ > For: /ccg:review, /ccg:debug, /ccg:workflow Phase 5
```
- 上游引用 `/ccg:bugfix` 和 `/ccg:dev`
- 本地改为 `/ccg:debug` 和 `/ccg:workflow`

**差异 2：中文语言要求（文件末尾）**
本地新增语言要求段落。

---

### 2.6 claude/tester.md

**差异：仅中文语言要求（文件末尾）**
主体内容完全一致，本地在文件末尾新增语言要求段落。

---

### 2.7 codex/analyzer.md

**差异 1：命令引用（第 3 行）**
```diff
- > For: /ccg:think, /ccg:analyze, /ccg:dev Phase 2
+ > For: /ccg:analyze, /ccg:workflow Phase 2
```
- 上游引用 `/ccg:think` 和 `/ccg:dev`，且 `/ccg:think` 排在最前
- 本地改为 `/ccg:analyze` 和 `/ccg:workflow`，移除 `/ccg:think` 和 `/ccg:dev`

**差异 2：中文语言要求（文件末尾）**
本地新增语言要求段落。

---

### 2.8 codex/architect.md

**差异 1：命令引用（第 3 行）**
```diff
- > For: /ccg:code, /ccg:backend, /ccg:dev Phase 3
+ > For: /ccg:backend, /ccg:workflow Phase 3
```
- 上游引用 `/ccg:code` 和 `/ccg:dev`
- 本地改为 `/ccg:workflow`，移除 `/ccg:code` 和 `/ccg:dev`

**差异 2：中文语言要求（文件末尾）**
本地新增语言要求段落。

---

### 2.9 codex/debugger.md

**差异：仅中文语言要求（文件末尾）**
主体内容完全一致，本地在文件末尾新增语言要求段落。

---

### 2.10 codex/optimizer.md

**差异：仅中文语言要求（文件末尾）**
主体内容完全一致，本地在文件末尾新增语言要求段落。

---

### 2.11 codex/reviewer.md

**差异 1：命令引用（第 3 行）**
```diff
- > For: /ccg:review, /ccg:bugfix validation, /ccg:dev Phase 5
+ > For: /ccg:review, /ccg:debug, /ccg:workflow Phase 5
```
- 上游引用 `/ccg:bugfix validation` 和 `/ccg:dev`
- 本地改为 `/ccg:debug` 和 `/ccg:workflow`

**差异 2：Scoring Format 标题引用（第 41 行）**
```diff
- ## Scoring Format (for /ccg:bugfix)
+ ## Scoring Format (for /ccg:debug)
```
- 上游引用 `/ccg:bugfix`
- 本地改为 `/ccg:debug`

**差异 3：中文语言要求（文件末尾）**
本地新增语言要求段落。

---

### 2.12 codex/tester.md

**差异：仅中文语言要求（文件末尾）**
主体内容完全一致，本地在文件末尾新增语言要求段落。

---

### 2.13 gemini/analyzer.md

**差异 1：命令引用（第 3 行）**
```diff
- > For: /ccg:think, /ccg:analyze, /ccg:dev Phase 2
+ > For: /ccg:analyze, /ccg:workflow Phase 2
```
- 上游引用 `/ccg:think` 和 `/ccg:dev`
- 本地改为 `/ccg:analyze` 和 `/ccg:workflow`

**差异 2：中文语言要求（文件末尾）**
本地新增语言要求段落。

---

### 2.14 gemini/architect.md

**无差异** -- 上游与本地完全一致。

---

### 2.15 gemini/debugger.md

**差异：仅中文语言要求（文件末尾）**
主体内容完全一致，本地在文件末尾新增语言要求段落。

---

### 2.16 gemini/frontend.md

**差异 1：命令引用（第 3 行）**
```diff
- > For: /ccg:code, /ccg:frontend, /ccg:dev Phase 3
+ > For: /ccg:frontend, /ccg:workflow Phase 3
```
- 上游引用 `/ccg:code` 和 `/ccg:dev`
- 本地改为 `/ccg:workflow`，移除 `/ccg:code` 和 `/ccg:dev`

**差异 2：中文语言要求（文件末尾）**
本地新增语言要求段落。

---

### 2.17 gemini/optimizer.md

**差异：仅中文语言要求（文件末尾）**
主体内容完全一致，本地在文件末尾新增语言要求段落。

---

### 2.18 gemini/reviewer.md

**差异 1：命令引用（第 3 行）**
```diff
- > For: /ccg:review, /ccg:bugfix validation, /ccg:dev Phase 5
+ > For: /ccg:review, /ccg:debug, /ccg:workflow Phase 5
```
- 上游引用 `/ccg:bugfix validation` 和 `/ccg:dev`
- 本地改为 `/ccg:debug` 和 `/ccg:workflow`

**差异 2：Scoring Format 标题引用（第 47 行）**
```diff
- ## Scoring Format (for /ccg:bugfix)
+ ## Scoring Format (for /ccg:debug)
```
- 上游引用 `/ccg:bugfix`
- 本地改为 `/ccg:debug`

**差异 3：中文语言要求（文件末尾）**
本地新增语言要求段落。

---

### 2.19 gemini/tester.md

**差异：仅中文语言要求（文件末尾）**
主体内容完全一致，本地在文件末尾新增语言要求段落。

---

## 三、差异模式分类汇总

### 3.1 共性差异（18/19 文件）

#### 模式 A：中文语言要求追加（18 个文件）

所有文件（除 gemini/architect.md 外）本地版本在文件末尾统一追加了完全相同的段落：

```markdown
## 语言要求

- 所有分析输出**必须**使用简体中文（简体中文）
- 技术术语可保留英文，但解释和描述必须用中文
- 代码注释使用中文描述意图
```

**影响文件**：18/19（所有文件除 gemini/architect.md）

**分析**：这是本地定制化的核心改动，要求所有模型角色的输出都必须使用简体中文。这与 CLAUDE.md 全局提示词中第 5 节"语言与注释规范"一致。

---

#### 模式 B：命令名称重命名（10 个文件）

本地将上游的命令名称做了系统性重命名：

| 上游命令 | 本地命令 | 涉及文件数 |
|---------|---------|-----------|
| `/ccg:think` | （移除） | 3 |
| `/ccg:dev` | `/ccg:workflow` | 8 |
| `/ccg:code` | （移除，保留具体子命令） | 3 |
| `/ccg:bugfix` | `/ccg:debug` | 3 |

**详细映射**：

| 上游引用 | 本地引用 | 文件 |
|---------|---------|------|
| `/ccg:analyze, /ccg:think, /ccg:dev Phase 2` | `/ccg:analyze, /ccg:workflow Phase 2` | claude/analyzer.md |
| `/ccg:code, /ccg:dev Phase 3` | `/ccg:workflow Phase 3` | claude/architect.md |
| `/ccg:review, /ccg:bugfix, /ccg:dev Phase 5` | `/ccg:review, /ccg:debug, /ccg:workflow Phase 5` | claude/reviewer.md |
| `/ccg:think, /ccg:analyze, /ccg:dev Phase 2` | `/ccg:analyze, /ccg:workflow Phase 2` | codex/analyzer.md |
| `/ccg:code, /ccg:backend, /ccg:dev Phase 3` | `/ccg:backend, /ccg:workflow Phase 3` | codex/architect.md |
| `/ccg:review, /ccg:bugfix validation, /ccg:dev Phase 5` | `/ccg:review, /ccg:debug, /ccg:workflow Phase 5` | codex/reviewer.md |
| `/ccg:think, /ccg:analyze, /ccg:dev Phase 2` | `/ccg:analyze, /ccg:workflow Phase 2` | gemini/analyzer.md |
| `/ccg:code, /ccg:frontend, /ccg:dev Phase 3` | `/ccg:frontend, /ccg:workflow Phase 3` | gemini/frontend.md |
| `/ccg:review, /ccg:bugfix validation, /ccg:dev Phase 5` | `/ccg:review, /ccg:debug, /ccg:workflow Phase 5` | gemini/reviewer.md |

**分析**：本地版本对命令体系做了简化重构：
1. **`/ccg:dev` 统一为 `/ccg:workflow`**：将开发流程入口统一到 workflow 命令
2. **`/ccg:bugfix` 改为 `/ccg:debug`**：将 bugfix 概念合并到 debug 命令
3. **`/ccg:think` 被移除**：分析功能统一到 `/ccg:analyze`
4. **`/ccg:code` 被移除**：代码生成功能分散到具体子命令（frontend/backend/workflow）

---

#### 模式 C：Scoring Format 引用更新（2 个文件）

与模式 B 联动，reviewer 角色中的 Scoring Format 标题也做了对应更新：

| 文件 | 上游 | 本地 |
|------|------|------|
| codex/reviewer.md | `Scoring Format (for /ccg:bugfix)` | `Scoring Format (for /ccg:debug)` |
| gemini/reviewer.md | `Scoring Format (for /ccg:bugfix)` | `Scoring Format (for /ccg:debug)` |

---

### 3.2 特有差异

**无特有差异**。所有差异均属于上述三种共性模式（A/B/C），没有单个文件出现独特的结构或内容修改。

---

### 3.3 唯一无差异文件

**gemini/architect.md**：上游与本地完全一致。

原因分析：该文件的命令引用为 `/ccg:plan, /ccg:execute, /ccg:workflow Phase 2-3`，上游已使用 `/ccg:workflow`，无需重命名；但奇怪的是它也没有追加中文语言要求段落，这可能是遗漏。

---

## 四、各模型 Prompt 角色设计差异分析

### 4.1 三模型角色分工矩阵

| 角色 | Claude | Codex | Gemini | 分工定位 |
|------|--------|-------|--------|---------|
| **Analyzer** | Systems Analyst（系统分析师） | Technical Analyst（技术分析师） | Design Analyst（设计分析师） | Claude=平衡综合，Codex=后端架构，Gemini=前端UX |
| **Architect** | Full-Stack Architect（全栈架构师） | Backend Architect（后端架构师） | Frontend Architect（前端架构师） | Claude=桥接前后端，Codex=后端专精，Gemini=前端专精 |
| **Debugger** | Debugger（跨栈调试） | Backend Debugger（后端调试） | UI Debugger（UI调试） | Claude=跨栈集成问题，Codex=API/DB/并发，Gemini=组件/样式/交互 |
| **Optimizer** | Performance Optimizer（端到端优化） | Performance Optimizer（后端优化） | Frontend Performance Optimizer（前端优化） | Claude=端到端流程，Codex=DB/算法/缓存，Gemini=渲染/Bundle/CWV |
| **Reviewer** | Code Reviewer（正确性/可维护性） | Code Reviewer（安全/性能/后端） | UI Reviewer（可访问性/设计一致性） | Claude=集成+正确性，Codex=安全+性能，Gemini=a11y+设计 |
| **Tester** | Test Engineer（集成/契约测试） | Backend Test Engineer（后端单元/集成） | Frontend Test Engineer（组件/交互测试） | Claude=E2E+契约，Codex=pytest/单元，Gemini=RTL/视觉 |

### 4.2 角色设计模式

**1. "Unique Value" 互补设计**

每个角色都有一个 "Unique Value (vs Codex/Gemini)" 或类似段落，明确界定该模型与其他两个模型的差异化定位：

- **Claude** 定位为**综合协调者**：跨栈视角、集成问题、端到端流程
- **Codex** 定位为**后端专家**：数据库、算法、安全、API
- **Gemini** 定位为**前端专家**：UI/UX、可访问性、设计系统、组件

**2. 输出格式差异**

| 角色类型 | 输出格式 |
|---------|---------|
| Analyzer | Structured analysis report（纯分析，不修改代码） |
| Architect | Unified Diff Patch（只读，输出补丁建议） |
| Debugger | Structured diagnostic report（诊断，不修改代码） |
| Optimizer | Analysis report + Unified Diff Patch |
| Reviewer | Review comments / Scoring report |
| Tester | Unified Diff Patch for test files ONLY |

**3. 权限约束一致性**

所有角色（除部分 analyzer）都有以下约束：
- `ZERO file system write permission` 或 `READ-ONLY`
- `NEVER execute actual modifications`
- 明确的输出格式限制

**4. Gemini 独有角色：frontend.md**

Gemini 有一个其他模型没有的角色 -- **Frontend Developer**，这是三模型中唯一的实现级前端开发角色，定位为 React 组件实现，带有组件清单（checklist）。

### 4.3 Phase 映射关系

| Phase | 用途 | Claude | Codex | Gemini |
|-------|------|--------|-------|--------|
| Phase 2 | 分析/诊断 | analyzer, debugger, optimizer | analyzer, debugger, optimizer | analyzer, debugger, optimizer, architect |
| Phase 3 | 架构/实现 | architect | architect | architect, frontend |
| Phase 5 | 审查 | reviewer | reviewer | reviewer |
| 独立 | 测试 | tester | tester | tester |

---

## 五、结论与建议

### 5.1 差异性质评估

所有 18 个差异文件的改动都属于**本地化定制**，分为两类：

1. **中文语言要求追加**（18 个文件）：功能性增强，确保多模型输出统一使用简体中文
2. **命令名称重映射**（10 个文件）：命令体系重构，将上游的多入口命令简化为本地统一的 workflow/debug/analyze 体系

### 5.2 潜在问题

| 问题 | 说明 | 建议 |
|------|------|------|
| gemini/architect.md 缺少中文语言要求 | 19 个文件中唯一没有追加语言要求的文件 | 补充追加，保持一致性 |
| 上游命令更新风险 | 如上游新增 `/ccg:think` 或 `/ccg:code` 的功能，本地版本可能需要同步 | 上游版本更新时需检查命令映射表 |

### 5.3 本地版本改进质量

- 命令引用统一性良好，10 个文件的重命名遵循一致的规则
- 中文语言要求模板化程度高，18 个文件使用完全相同的段落
- 所有改动都是追加或替换，未删除任何核心功能描述

---

## 六、附录：完整文件对比矩阵

| 文件 | 上游行数 | 本地行数 | 差异行 | 模式 A | 模式 B | 模式 C |
|------|---------|---------|-------|--------|--------|--------|
| claude/analyzer.md | 59 | 66 | +7 | Yes | Yes | - |
| claude/architect.md | 55 | 61 | +6 | Yes | Yes | - |
| claude/debugger.md | 71 | 78 | +7 | Yes | - | - |
| claude/optimizer.md | 73 | 80 | +7 | Yes | - | - |
| claude/reviewer.md | 63 | 70 | +7 | Yes | Yes | - |
| claude/tester.md | 69 | 76 | +7 | Yes | - | - |
| codex/analyzer.md | 51 | 57 | +6 | Yes | Yes | - |
| codex/architect.md | 47 | 53 | +6 | Yes | Yes | - |
| codex/debugger.md | 67 | 73 | +6 | Yes | - | - |
| codex/optimizer.md | 75 | 81 | +6 | Yes | - | - |
| codex/reviewer.md | 67 | 73 | +6 | Yes | Yes | Yes |
| codex/tester.md | 56 | 62 | +6 | Yes | - | - |
| gemini/analyzer.md | 54 | 60 | +6 | Yes | Yes | - |
| gemini/architect.md | 48 | 48 | 0 | **No** | - | - |
| gemini/debugger.md | 71 | 77 | +6 | Yes | - | - |
| gemini/frontend.md | 57 | 63 | +6 | Yes | Yes | - |
| gemini/optimizer.md | 78 | 84 | +6 | Yes | - | - |
| gemini/reviewer.md | 74 | 80 | +6 | Yes | Yes | Yes |
| gemini/tester.md | 62 | 68 | +6 | Yes | - | - |

**模式 A**：中文语言要求追加 | **模式 B**：命令名称重映射 | **模式 C**：Scoring Format 引用更新
