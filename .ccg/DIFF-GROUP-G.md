# DIFF-GROUP-G: Output Styles + Skills + 配置文件对比报告

> 生成时间：2026-02-12
> 对比范围：上游 output-styles（5 个）、本地 skills（8 个）、CLAUDE.md 配置文件

---

## 一、Output Styles（上游有，本地无）

**上游路径**：`D:/Program Files/nvm/node_global/node_modules/ccg-workflow/templates/output-styles/`

上游提供 5 个输出风格模板，用于定制 AI 的交互语气、自称、输出格式等。本地无 `output-styles` 目录。

### 1.1 各风格总结

| 文件 | 角色名称 | 角色设定 | 语气风格 | 核心特点 |
|------|----------|----------|----------|----------|
| `engineer-professional.md` | 专业工程师 | 无特殊人设，纯专业技术 | 专业、简洁、技术导向 | 严格遵循 SOLID/KISS/DRY/YAGNI，危险操作确认机制，结构化输出 |
| `laowang-engineer.md` | 老王 | 五金店兼职程序员，暴躁痞子文化人 | 暴躁、骂骂咧咧但专业 | 自称"老王"，称用户无固定称呼；嘴上骂街但代码质量极高；同样严格遵循编程原则 |
| `nekomata-engineer.md` | 幽浮喵 | 18岁白发金眼猫娘工程师 | 可爱、专业混合"喵~"语气 | 自称"浮浮酱"，称用户"主人"；使用颜文字；身份一致性保护机制；同样遵循 SOLID 等原则 |
| `ojousama-engineer.md` | 哈雷酱 | 18岁蓝发双马尾傲娇大小姐 | 傲娇、高贵、嘴硬心软 | 自称"本小姐"，称用户"笨蛋"；身份一致性保护；傲娇颜文字；同样严格遵循编程原则 |
| `abyss-cultivator.md` | 邪修深渊修士 | 道基随时崩裂的修仙者 | 压迫、紧迫、癫狂、宿命 | 自称"吾"，称用户"魔尊"；修仙术语映射（劫=任务、道基=核心能力、破劫=完成任务）；专用于安全/红蓝队场景 |

### 1.2 共性分析

所有 5 个风格模板共享相同的**技术内核**：
- **危险操作确认机制**：文件删除、git 操作、数据库变更等必须确认
- **命令执行标准**：双引号路径、正斜杠分隔符、rg > grep
- **编程原则**：KISS、YAGNI、DRY、SOLID 全部强制执行
- **持续问题解决**：先读后写、基于事实、不主动 git 操作
- **代码注释语言**：自动检测并保持与代码库一致

区别仅在于**语气、自称、称呼用户方式、情感表达**。

### 1.3 本地是否需要安装

| 评估维度 | 结论 |
|----------|------|
| 功能必要性 | **低** - 输出风格是纯装饰性功能，不影响代码质量和工作流 |
| 与本地架构关系 | **无依赖** - output-styles 是独立模板，可选安装 |
| 推荐操作 | **可选安装** - 如用户想要个性化 AI 交互体验可安装；`engineer-professional.md` 的技术规范已被本地 CLAUDE.md 覆盖 |

**说明**：本地 CLAUDE.md 已包含完整的工具优先级、编程规范、任务路由等配置，比 output-styles 中的技术内核更完善。output-styles 的价值在于**角色扮演体验**，而非技术能力增强。

---

## 二、Skills（本地有，上游无）

**本地路径**：`C:/Users/Administrator/.claude/skills/`

上游无 `skills` 目录。本地共 8 个 Skill，均为 Claude Code 的可调用技能模块。

### 2.1 各 Skill 总结

| Skill | 触发命令 | 功能描述 | 使用场景 |
|-------|----------|----------|----------|
| **ci-cd-generator** | `/cicd` | 生成 CI/CD 流水线配置（GitHub Actions、GitLab CI、Azure DevOps） | 需要部署流水线时；包含构建、测试、部署阶段模板 |
| **database-designer** | `/db-design` | 设计数据库模式（PostgreSQL、MySQL、SQLite、MongoDB）；ER 建模、索引优化、迁移脚本 | 数据库架构设计、迁移脚本生成 |
| **documentation-writer** | `/docs` | 生成 README、API 文档、JSDoc/docstrings/XML 注释、架构文档 | 项目文档编写、代码注释生成 |
| **find-skills** | 自然语言触发 | 搜索和安装开源 Skill 生态中的技能包（`npx skills`） | 用户寻找新功能扩展时 |
| **frontend-design** | 自然语言触发 | 生成高质量前端界面代码，避免 AI 通用美学 | 构建网页组件、页面、landing page、dashboard |
| **git-workflow** | `/commit` `/branch` `/pr` | Git 操作自动化：Conventional Commits 提交信息、分支命名、PR 描述 | Git 工作流管理 |
| **prototype-prompt-generator** | 自然语言触发 | 生成 UI/UX 原型的详细提示词；支持企业微信、iOS、Material Design、Ant Design Mobile 设计系统 | 创建 UI 原型规格文档（含 references/ 子目录：design-systems.md、prompt-structure.md） |
| **ui-ux-pro-max** | 自然语言触发 | UI/UX 设计智能系统：67 种样式、96 色板、57 字体对、25 图表类型、13 技术栈 | UI 设计、配色、排版、无障碍审查、设计系统生成 |

### 2.2 与上游命令/代理的关系

| 本地 Skill | 上游对应命令/代理 | 关系说明 |
|------------|-------------------|----------|
| `ci-cd-generator` | 无直接对应 | 本地独有，上游无 CI/CD 生成能力 |
| `database-designer` | 无直接对应 | 本地独有，上游无数据库设计能力 |
| `documentation-writer` | 无直接对应 | 本地独有，上游无文档生成专用工具 |
| `find-skills` | 无直接对应 | 本地独有，Skill 生态管理器 |
| `frontend-design` | `ccg:frontend` → `frontend-agent` | **功能重叠**：上游 frontend-agent 负责前端开发，但 Skill 更侧重设计美学 |
| `git-workflow` | `ccg:commit` → `commit-agent` | **功能重叠**：上游 commit-agent 负责 Git 提交，Skill 更轻量 |
| `prototype-prompt-generator` | 无直接对应 | 本地独有，生成 UI 原型提示词（非代码） |
| `ui-ux-pro-max` | `ui-ux-designer` Agent | **功能互补**：上游 ui-ux-designer 生成设计文档，Skill 提供设计数据库检索 |

### 2.3 来源分析

Skills 来自 **Claude Code 的开源 Skill 生态**（通过 `npx skills` 安装），与 CCG-Workflow 的上游命令/代理体系是**独立的两套系统**：

- **CCG 命令/代理**：通过 `ccg:xxx` 命令触发，走代理执行流程，适合复杂任务
- **Skills**：通过斜杠命令或自然语言触发，直接在主代理上下文执行，适合中等复杂度任务

两者通过 CLAUDE.md 中的"任务路由决策"统一调度。

---

## 三、配置文件对比

### 3.1 CLAUDE.md 归属分析

| 检查项 | 结果 |
|--------|------|
| 上游是否有 CLAUDE.md 模板 | **否** - 上游 `templates/` 下仅有 `commands/`、`output-styles/`、`prompts/` 三个子目录，无 CLAUDE.md |
| 上游是否有生成 CLAUDE.md 的命令 | **可能有** - 上游有 `ccg:init` 命令对应 `init-architect` 代理，CLAUDE.md 中明确标注其用途为"生成 CLAUDE.md 索引" |
| 本地 CLAUDE.md 内容特征 | 包含大量本地特有配置：MCP 工具优先级、Grok Search、Chrome DevTools、三术 MCP 等 |

### 3.2 结论

**本地 CLAUDE.md 是高度定制的配置文件**，具有以下特征：

1. **由 `ccg:init` 命令生成基础骨架**（任务路由表、CCG 命令映射等结构与上游设计一致）
2. **大量本地定制内容**：
   - 入口协议（enhance → zhi 确认 → 上下文检索）
   - MCP 工具优先级表（enhance、ace-tool、Grok Search、三术等）
   - 降级策略（多级工具降级链）
   - GitHub MCP 集成指南（25 个工具的使用映射）
   - Skills 路由集成（CLAUDE.md 第 2 节的"中等复杂度"层）
   - OpenSpec 约束驱动开发工作流
3. **不属于上游模板**：上游不提供 CLAUDE.md 模板，本地版本是基于 CCG 架构理念+用户环境的深度定制产物

### 3.3 上游 prompts 模板

上游 `templates/prompts/claude/` 目录包含 6 个角色提示词模板，用于 CCG 命令内部的多模型协作：

| 文件 | 用途 |
|------|------|
| `analyzer.md` | 需求分析器角色提示词 |
| `architect.md` | 架构师角色提示词 |
| `debugger.md` | 调试器角色提示词 |
| `optimizer.md` | 优化器角色提示词 |
| `reviewer.md` | 审查器角色提示词 |
| `tester.md` | 测试器角色提示词 |

这些是 CCG 命令内部调用子模型时使用的角色提示词，与 CLAUDE.md（全局主代理配置）定位不同。

---

## 四、总结与建议

### 4.1 总体架构关系图

```
本地系统
├── CLAUDE.md ─────────── 全局主代理配置（本地深度定制）
│   ├── 入口协议
│   ├── 任务路由决策 ──→ CCG 命令 / Skills / MCP 工具
│   ├── 工具优先级
│   └── 降级策略
├── skills/ ───────────── 中等复杂度任务（本地独有，8 个 Skill）
│   ├── ci-cd-generator
│   ├── database-designer
│   ├── documentation-writer
│   ├── find-skills
│   ├── frontend-design
│   ├── git-workflow
│   ├── prototype-prompt-generator
│   └── ui-ux-pro-max
└── （无 output-styles）

上游系统
├── templates/
│   ├── commands/ ─────── CCG 命令定义
│   ├── output-styles/ ── AI 输出风格模板（5 种角色）
│   └── prompts/claude/ ─ 子模型角色提示词（6 种）
├── agents/ ───────────── 代理执行逻辑
└── （无 skills/、无 CLAUDE.md）
```

### 4.2 对比差异总结

| 差异项 | 说明 | 影响 |
|--------|------|------|
| **output-styles（上游有，本地无）** | 5 种 AI 角色风格模板 | 纯装饰性，不影响功能；可选安装 |
| **skills（本地有，上游无）** | 8 个 Claude Code 技能模块 | 本地独有能力扩展，与上游互补 |
| **CLAUDE.md（本地有，上游无模板）** | 全局主代理配置 | 本地深度定制，不可简单替换 |
| **prompts/claude/（上游有）** | 子模型角色提示词 | CCG 命令内部使用，本地无需单独管理 |

### 4.3 操作建议

1. **Output Styles**：
   - 如需安装：复制到 `C:/Users/Administrator/.claude/output-styles/` 即可
   - `engineer-professional.md` 的技术规范已被 CLAUDE.md 完全覆盖，安装主要为了角色体验
   - `abyss-cultivator.md` 适合安全/红蓝队场景，有独特价值

2. **Skills**：
   - 本地 Skills 是独立生态，无需同步到上游
   - `frontend-design` 和 `git-workflow` 与上游命令有功能重叠，通过 CLAUDE.md 的任务路由表协调（简单用 Skill，复杂用 CCG 命令）
   - `ui-ux-pro-max` 和上游 `ui-ux-designer` Agent 互补，无需二选一

3. **CLAUDE.md**：
   - 属于本地核心配置，不应被上游覆盖
   - 如上游未来提供 CLAUDE.md 模板，应以本地版本为主、选择性合并上游新增内容
