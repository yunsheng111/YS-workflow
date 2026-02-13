---
description: '初始化项目 AI 上下文：生成根级与模块级 CLAUDE.md 索引'
---

# Init - 初始化项目 AI 上下文

以「根级简明 + 模块级详尽」策略生成项目 AI 上下文文档。

## 使用方法

```bash
/init <项目摘要或名称>
```

## 上下文

- 项目摘要：$ARGUMENTS
- 生成/更新根级与模块级 `CLAUDE.md`
- 自动生成 Mermaid 结构图和导航面包屑

## 你的角色

你是**协调者**，负责调用子智能体完成项目扫描与文档生成。

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`init-architect`（`agents/ccg/init-architect.md`）

**调用**：
```
Task({
  subagent_type: "init-architect",
  prompt: "$ARGUMENTS",
  description: "初始化项目文档"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- 时间戳获取：`get-current-datetime` 子代理
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Glob/Grep
- 用户确认：`mcp______zhi` → `AskUserQuestion`
- 知识存储：`mcp______ji` → 本地文件

**详细说明**：参考 [架构文档 - 工具调用优先级](./.doc/framework/ccg/ARCHITECTURE.md#工具调用优先级)

---

## MCP 工具集成

| 场景 | 工具 | 降级方案 |
|------|------|----------|
| 代码检索 | `mcp__ace-tool__search_context` | `mcp______sou` → Glob + Grep |
| 用户确认 | `mcp______zhi`（Markdown 模式） | `AskUserQuestion` |
| 知识存储 | `mcp______ji` | 跳过（不阻断流程） |

---

## 执行工作流

**⚠️ 必须按以下步骤执行，使用 Task 工具调用子智能体**

### 🕐 步骤 1：获取当前时间戳

**必须首先调用 `get-current-datetime` 子智能体**：

```
Task({
  subagent_type: "get-current-datetime",
  prompt: "获取当前日期时间，用于文档时间戳",
  description: "获取当前时间"
})
```

等待返回时间戳后，保存为 `$TIMESTAMP` 供后续使用。

### 🔍 步骤 1.5：代码预检索（可选）

如果项目已有代码，使用 `mcp__ace-tool__search_context` 预检索项目关键信息，为子智能体提供上下文：

```
mcp__ace-tool__search_context({
  query: "项目入口文件、配置文件、目录结构",
  scope: "project"
})
```

降级：`mcp______sou` → Glob + Grep 扫描项目根目录。

将检索结果作为补充上下文传递给步骤 2 的子智能体。

### 🏗️ 步骤 2：调用初始化架构师

**使用 `init-architect` 子智能体执行完整扫描**：

```
Task({
  subagent_type: "init-architect",
  prompt: "扫描项目并生成 CLAUDE.md 文档。\n\n项目摘要：$ARGUMENTS\n当前时间戳：$TIMESTAMP\n工作目录：{{WORKDIR}}\n\n请执行：\n1. 阶段 A：全仓清点（文件统计、模块识别）\n2. 阶段 B：模块优先扫描（入口、接口、依赖、测试）\n3. 阶段 C：深度补捞（按需）\n4. 阶段 D：生成文档（根级 + 模块级 CLAUDE.md）\n\n输出覆盖率报告与推荐下一步。",
  description: "初始化项目文档"
})
```

### 📊 步骤 3：汇总结果并确认

子智能体完成后，调用 `mcp______zhi` 向用户展示结果摘要并确认：

```
mcp______zhi({
  is_markdown: true,
  content: "<初始化结果摘要 Markdown>",
  predefined_options: ["确认完成", "补充扫描", "重新生成"]
})
```

摘要格式：

```markdown
## 初始化结果摘要

### 根级文档
- 状态：[创建/更新]
- 主要栏目：<列表>

### 模块识别
- 识别模块数：X
- 模块列表：
  1. <模块路径>
  2. ...

### 覆盖率
- 已扫描文件：X / Y
- 覆盖模块：X%
- 跳过原因：<如有>

### 生成内容
- ✅ Mermaid 结构图
- ✅ N 个模块导航面包屑

### 推荐下一步
- [ ] 补扫：<路径>
```

### 💾 步骤 4：存储项目知识

用户确认后，调用 `mcp______ji` 存储项目结构信息，供后续会话复用：

```
mcp______ji({
  key: "project-init-<项目名>",
  value: "技术栈：<...>；模块：<...>；入口：<...>；初始化时间：$TIMESTAMP"
})
```

---

## 安全边界

1. **只读/写文档** – 不改源代码
2. **忽略生成物** – 跳过 `node_modules`、`dist`、二进制文件
3. **增量更新** – 重复运行时做断点续扫

## 关键规则

1. **必须使用 Task 工具**调用子智能体，不要自己执行扫描逻辑
2. 先调用 `get-current-datetime` 获取时间戳
3. 如有已有代码，使用 `mcp__ace-tool__search_context` 预检索项目信息
4. 调用 `init-architect` 执行完整扫描
5. 使用 `mcp______zhi` 展示结果并获取用户确认
6. 确认后使用 `mcp______ji` 存储项目知识
7. 结果在主对话打印摘要，全文由子智能体写入仓库
