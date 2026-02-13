---
description: '智能功能开发 - 自动识别输入类型，规划/讨论/实施全流程'
---

# Feat - 智能功能开发

$ARGUMENTS

---

## 网络搜索规范（GrokSearch 优先）

**首次需要外部信息时执行以下步骤**：

1. 调用 `mcp__Grok_Search_Mcp__get_config_info` 做可用性检查
2. 调用 `mcp__Grok_Search_Mcp__toggle_builtin_tools`，`action: "off"`，确保禁用内置 WebSearch/WebFetch
3. 使用 `mcp__Grok_Search_Mcp__web_search` 进行搜索；需要全文时再调用 `mcp__Grok_Search_Mcp__web_fetch`
4. 若搜索失败或结果不足，执行降级步骤：
   - 调用 `get_config_info` 获取状态
   - 若状态异常，调用 `switch_model` 切换模型后重试一次
   - 仍失败则使用 `mcp______context7` 获取框架/库官方文档
   - 若仍不足，提示用户提供权威来源
5. 关键结论与来源需通过 `mcp______ji` 记录，便于后续复用与审计

---

## 沟通守则

1. 在需要询问用户时，优先使用三术 (`mcp______zhi`) 工具进行交互，举例场景：请求用户确认/选择/批准

---

## 核心工作流程

**功能开发初始化**：
1. 调用 `mcp______ji` 回忆项目历史功能开发模式、技术选型和实施经验
2. 如有历史经验，在后续阶段中参考使用

### 1. 输入类型判断

**每次交互必须首先声明**：「我判断此次操作类型为：[具体类型]」

| 类型 | 关键词 | 动作 |
|------|--------|------|
| **需求规划** | 实现、开发、新增、添加、构建、设计 | → 步骤 2（完整规划） |
| **讨论迭代** | 调整、修改、优化、改进、包含计划文件路径 | → 读取现有计划 → 步骤 2.3 |
| **执行实施** | 开始实施、执行计划、按照计划、根据计划 | → 步骤 3（直接实施） |

---

### 2. 需求规划流程

#### 2.0 Prompt 增强

**优先调用 `mcp______enhance`**（不可用时降级到 `mcp__ace-tool__enhance_prompt`；都不可用时执行 **Claude 自增强**：分析意图/缺失信息/隐含假设，按 6 原则补全为结构化需求（目标/范围/技术约束/验收标准），通过 `mcp______zhi` 确认并标注增强模式），**用增强结果替代原始 $ARGUMENTS，后续调用 Codex/Gemini 时传入增强后的需求**

#### 2.1 上下文检索

调用 `mcp__ace-tool__search_context` 检索相关代码、组件、技术栈（降级：`mcp______sou` → Glob + Grep）。

**如果用户提供了 Issue 编号或 URL**：
- 检测仓库信息（`git remote get-url origin`），解析 owner 和 repo
- 调用 `mcp__github__get_issue` 获取 Issue 详情：
  ```
  mcp__github__get_issue({
    owner: "<owner>",
    repo: "<repo>",
    issue_number: <issue-number>
  })
  ```
- 将 Issue 标题和描述作为需求补充信息
- 降级方案：GitHub MCP 不可用时使用 `gh issue view <issue-number>`

#### 2.2 任务类型判断

| 任务类型 | 判断依据 | 调用流程 |
|----------|----------|----------|
| **前端** | 页面、组件、UI、样式、布局 | ui-ux-designer → planner |
| **后端** | API、接口、数据库、逻辑、算法 | planner |
| **全栈** | 同时包含前后端 | ui-ux-designer → planner |

#### 2.3 调用 Agents

**前端/全栈任务**：先调用 `ui-ux-designer` agent
```
Task(
  subagent_type="ui-ux-designer",
  prompt="项目上下文 + 用户需求 + 技术栈",
  description="生成 UI/UX 设计方案"
)
```

**所有任务**：调用 `planner` agent
```
Task(
  subagent_type="planner",
  prompt="项目上下文 + UI设计方案(如有) + 用户需求",
  description="生成功能规划文档"
)
```

#### 2.4 保存计划

**文件命名规则**：
- 首次规划：`.claude/plan/功能名.md`
- 迭代版本：`.claude/plan/功能名-1.md`、`.claude/plan/功能名-2.md`...

#### 2.5 交互确认（使用三术 zhi）

规划完成后，调用 `mcp______zhi` 工具获取用户确认：
- `message`:
  ```
  ## 📋 功能规划完成

  ### 计划文件
  `.claude/plan/<功能名>.md`

  ### 规划摘要
  <计划的关键步骤摘要，3-5 条>

  ### 任务类型
  <前端/后端/全栈>

  请选择下一步操作：
  ```
- `is_markdown`: true
- `predefined_options`: ["开始实施", "讨论调整", "重新规划", "仅保存计划"]

根据用户选择：
- 「开始实施」→ 步骤 3
- 「讨论调整」→ 重新执行步骤 2.3
- 「重新规划」→ 删除当前计划，重新执行步骤 2
- 「仅保存计划」→ 退出

---

### 3. 执行实施流程

#### 3.1 读取计划

优先使用用户指定路径，否则读取最新的计划文件。

#### 3.2 任务类型分析

从计划提取任务分类：前端 / 后端 / 全栈

#### 3.3 调用 fullstack-light-agent 实施

调用 `fullstack-light-agent` 代理执行实施：

```
Task(
  subagent_type="fullstack-light-agent",
  prompt="<增强后的需求> + <计划文件内容>",
  description="智能功能开发"
)
```

代理内部会自动识别任务类型（前端/后端/全栈）并调用对应的外部模型（Codex/Gemini）

#### 3.4 实施后验证

```bash
git status --short
git diff --name-status
```

询问用户是否运行代码审查（`/ccg:review`）。

---

### 4. 关键执行原则

1. **强制响应要求**：每次交互必须首先说明判断的操作类型
2. **文档一致性**：规划文档与实际执行保持同步
3. **依赖关系管理**：前端任务必须确保 UI 设计完整性
4. **多模型信任规则**：
   - 前端以 Gemini 为准
   - 后端以 Codex 为准
5. **用户沟通透明**：所有判断和动作都要明确告知用户

**功能开发结束**：
调用 `mcp______ji` 存储本次功能开发的关键决策、技术方案和实施经验，供后续会话复用。

---

## 使用方法

```bash
/feat <功能描述>
```
