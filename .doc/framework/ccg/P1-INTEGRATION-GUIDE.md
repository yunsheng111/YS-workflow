# P1 三术 MCP 集成指南

## 概述

本文档提供 P1 优先级问题的详细修改指南，包括为关键命令添加 `mcp______ji` 记忆管理和统一用户交互为 `mcp______zhi`。

---

## 修改清单

### 1. 添加 `ji` 记忆管理（4个命令）

| 文件 | 状态 | 说明 |
|------|------|------|
| workflow.md | ✅ 已完成 | 参考模板 |
| plan.md | ✅ 已完成 | 规划命令 |
| execute.md | ✅ 已完成 | 执行命令 |
| feat.md | ✅ 已完成 | 功能开发命令 |

### 2. 统一用户交互为 `zhi`（11个命令）

| 文件 | AskUserQuestion 使用次数 | 说明 |
|------|-------------------------|------|
| workflow.md | ✅ 0 处 | 已全部替换为 zhi |
| test.md | ✅ 0 处 | 已全部替换为 zhi |
| plan.md | ✅ 0 处 | 已全部替换为 zhi |
| optimize.md | ✅ 0 处 | 已全部替换为 zhi |
| frontend.md | ✅ 0 处 | 已全部替换为 zhi |
| feat.md | ✅ 0 处 | 已全部替换为 zhi |
| debug.md | ✅ 0 处 | 已全部替换为 zhi |
| backend.md | ✅ 0 处 | 已全部替换为 zhi |
| analyze.md | ✅ 0 处 | 已全部替换为 zhi |
| execute.md | ✅ 0 处 | 已全部替换为 zhi |
| review.md | ✅ 0 处 | 已全部替换为 zhi |

---

## 修改模板

### 模板 1：添加 `ji` 记忆管理

#### 位置 1：命令开始处（工作流初始化）

**插入位置：** 在 `## 执行XXX流程` 或类似标题之后，第一个阶段之前

**模板代码：**
```markdown
**工作流初始化**：
1. 调用 `mcp______ji` 回忆项目历史XXX模式、架构决策和开发规范
2. 如有历史经验，在后续阶段中参考使用
```

**示例（workflow.md 已完成）：**
```markdown
## 执行工作流

**任务描述**：$ARGUMENTS

**工作流初始化**：
1. 调用 `mcp______ji` 回忆项目历史工作流模式、架构决策和开发规范
2. 如有历史经验，在后续阶段中参考使用

### 🔍 阶段 1：研究与分析
...
```

#### 位置 2：命令结束处（工作流完成）

**插入位置：** 在最后一个阶段的用户确认之后，`---` 或 `## 关键规则` 之前

**模板代码：**
```markdown
**工作流结束**：
调用 `mcp______ji` 存储本次XXX的关键决策、架构变更和实施经验，供后续会话复用。
```

**示例（workflow.md 已完成）：**
```markdown
  工作流已完成，请确认：
  ```
- `is_markdown`: true
- `predefined_options`: ["确认完成", "提交代码", "查看完整报告", "继续优化"]

**工作流结束**：
调用 `mcp______ji` 存储本次工作流的关键决策、架构变更和实施经验，供后续会话复用。

---

## 关键规则
...
```

---

### 模板 2：统一用户交互为 `zhi`

#### 查找模式

搜索文件中的 `AskUserQuestion` 调用，通常格式为：

```markdown
调用 `AskUserQuestion` 工具：
- `question`: "..."
- `options`: [...]
```

或

```markdown
使用 `AskUserQuestion` 询问用户：
...
```

#### 替换模板

**原始代码（AskUserQuestion）：**
```markdown
调用 `AskUserQuestion` 工具：
- `question`: "是否继续执行？"
- `options`: ["继续", "取消", "查看详情"]
```

**替换为（mcp______zhi）：**
```markdown
调用 `mcp______zhi` 工具：
- `message`:
  ```
  ## 标题

  ### 内容
  <详细信息>

  是否继续执行？
  ```
- `is_markdown`: true
- `predefined_options`: ["继续", "取消", "查看详情"]
- `project_root_path`: "$PWD"
```

**注意事项：**
1. `question` 参数改为 `message` 参数
2. `message` 内容使用 Markdown 格式，更丰富的展示
3. `options` 改为 `predefined_options`
4. 添加 `is_markdown: true` 参数
5. 添加 `project_root_path: "$PWD"` 参数

---

## 具体修改说明

### 1. plan.md

#### 修改 1：添加规划初始化

**位置：** 第 65 行附近，`**规划任务**：$ARGUMENTS` 之后

**插入内容：**
```markdown
**规划初始化**：
1. 调用 `mcp______ji` 回忆项目历史规划模式、架构约束和技术决策
2. 如有历史规划经验，在后续阶段中参考使用
```

#### 修改 2：添加规划结束

**位置：** 文件末尾，最后一个阶段确认之后

**插入内容：**
```markdown
**规划结束**：
调用 `mcp______ji` 存储本次规划的关键决策、架构方案和实施路径，供后续会话复用。
```

#### 修改 3：统一用户交互（如有 AskUserQuestion）

搜索文件中的 `AskUserQuestion`，按照模板 2 替换为 `mcp______zhi`。

---

### 2. execute.md

#### 修改 1：添加执行初始化

**位置：** 执行流程开始处

**插入内容：**
```markdown
**执行初始化**：
1. 调用 `mcp______ji` 回忆项目历史实施经验、常见问题和解决方案
2. 如有历史经验，在后续阶段中参考使用
```

#### 修改 2：添加执行结束

**位置：** 执行流程结束处

**插入内容：**
```markdown
**执行结束**：
调用 `mcp______ji` 存储本次执行的关键决策、遇到的问题和解决方案，供后续会话复用。
```

#### 修改 3：统一用户交互

搜索并替换 `AskUserQuestion` 为 `mcp______zhi`。

---

### 3. feat.md

#### 修改 1：添加功能开发初始化

**位置：** 功能开发流程开始处

**插入内容：**
```markdown
**功能开发初始化**：
1. 调用 `mcp______ji` 回忆项目历史功能开发模式、技术选型和实施经验
2. 如有历史经验，在后续阶段中参考使用
```

#### 修改 2：添加功能开发结束

**位置：** 功能开发流程结束处

**插入内容：**
```markdown
**功能开发结束**：
调用 `mcp______ji` 存储本次功能开发的关键决策、技术方案和实施经验，供后续会话复用。
```

#### 修改 3：统一用户交互

搜索并替换 `AskUserQuestion` 为 `mcp______zhi`。

---

### 4. 其他命令文件（test.md, optimize.md, frontend.md, debug.md, backend.md, analyze.md, review.md）

这些文件只需要统一用户交互，不需要添加 `ji` 记忆管理。

#### 修改步骤：

1. 打开文件
2. 搜索 `AskUserQuestion`
3. 按照模板 2 替换为 `mcp______zhi`
4. 确保参数完整：
   - `message`（Markdown 格式）
   - `is_markdown: true`
   - `predefined_options`
   - `project_root_path: "$PWD"`

---

## 验证清单

修改完成后，请验证以下内容：

### 1. `ji` 记忆管理验证

- [x] workflow.md - 开始回忆 + 结束存储 ✅
- [x] plan.md - 开始回忆 + 结束存储 ✅
- [x] execute.md - 开始回忆 + 结束存储 ✅
- [x] feat.md - 开始回忆 + 结束存储 ✅

### 2. `zhi` 用户交互验证

- [x] workflow.md - 所有 AskUserQuestion 已替换 ✅
- [x] test.md - 所有 AskUserQuestion 已替换 ✅
- [x] plan.md - 所有 AskUserQuestion 已替换 ✅
- [x] optimize.md - 所有 AskUserQuestion 已替换 ✅
- [x] frontend.md - 所有 AskUserQuestion 已替换 ✅
- [x] feat.md - 所有 AskUserQuestion 已替换 ✅
- [x] debug.md - 所有 AskUserQuestion 已替换 ✅
- [x] backend.md - 所有 AskUserQuestion 已替换 ✅
- [x] analyze.md - 所有 AskUserQuestion 已替换 ✅
- [x] execute.md - 所有 AskUserQuestion 已替换 ✅
- [x] review.md - 所有 AskUserQuestion 已替换 ✅

### 3. 参数完整性验证

所有 `mcp______zhi` 调用必须包含：
- [ ] `message` 参数（Markdown 格式）
- [ ] `is_markdown: true`
- [ ] `predefined_options` 数组
- [ ] `project_root_path: "$PWD"`

---

## 预期效果

完成 P1 修复后：

### 集成度提升

| 工具 | 修复前 | 修复后 | 提升 |
|------|--------|--------|------|
| `mcp______ji` | 代理 90% / 命令 0% | 代理 90% / 命令 18% | +18% |
| `mcp______zhi` | 命令 36% | 命令 86% | +50% |

### 架构一致性

- ✅ 全局提示词、代理、命令三层工具优先级统一
- ✅ 降级策略完善（enhance, sou, zhi）
- ✅ 记忆管理覆盖核心工作流
- ✅ 用户交互方式统一

---

## 附录：已完成的 P0 修复

### P0 修复成果

1. **全局提示词更新** - 工具优先级表 + 降级策略
2. **16 个代理添加 `sou` 降级方案** - 代码检索容错
3. **2 个代理统一 `enhance` 优先级** - 需求增强优先级
4. **10 个命令统一 `enhance` 调用** - 命令层工具一致

### 集成度提升（P0）

| 工具 | 修复前 | 修复后 | 提升 |
|------|--------|--------|------|
| `mcp______sou` | 2% | 62% | +60% |
| `mcp______enhance` | 5% | 29% | +24% |

### 工具优先级链（已统一）

```
需求增强：mcp______enhance → mcp__ace-tool__enhance_prompt → mcp______zhi
代码检索：mcp__ace-tool__search_context → mcp______sou → Grep/Glob
用户确认：mcp______zhi > AskUserQuestion
```

---

## 联系与反馈

如在修改过程中遇到问题，请参考：
- workflow.md（已完成的参考模板）
- 本文档的模板和示例
- 全局提示词 CLAUDE.md 中的工具优先级说明
