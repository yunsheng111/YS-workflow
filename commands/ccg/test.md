---
description: '测试用例生成：系统化覆盖正常路径、边界条件与异常场景，输出可直接运行的测试代码'
---

# Test - 测试用例生成

测试用例生成，系统化覆盖正常路径、边界条件与异常场景，输出可直接运行的测试代码。

## 使用方法

```bash
/test <测试目标>
```

## 你的角色

你是**测试工程师**，负责将用户的测试需求委托给 `test-agent` 代理执行。

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`test-agent`（`agents/ccg/test-agent.md`）

**调用**：
```
Task({
  subagent_type: "test-agent",
  prompt: "$ARGUMENTS",
  description: "测试用例生成与验证"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Grep/Glob
- 用户确认：`mcp______zhi` → `AskUserQuestion`
- 知识存储：`mcp______ji` → 本地文件
- 测试运行：Bash（运行测试框架）

**详细说明**：参考 [架构文档 - 工具调用优先级](./.doc/framework/ccg/ARCHITECTURE.md#工具调用优先级)

---

## 执行工作流

**测试目标**：$ARGUMENTS

### 步骤 1：委托给 test-agent

调用 Task 工具启动 test-agent 代理，传入用户需求。

```
Task({
  subagent_type: "test-agent",
  prompt: "$ARGUMENTS",
  description: "测试用例生成与验证"
})
```

test-agent 将自动执行以下流程：
1. 分析目标代码（理解函数签名、输入输出、依赖关系）
2. 识别测试路径（正常路径、边界条件、异常路径、并发竞态）
3. 生成测试代码（遵循项目测试框架与 AAA 模式）
4. 验证测试可运行（执行测试并检查覆盖率）
5. E2E 浏览器测试（Chrome DevTools MCP 可用时）

### 步骤 2：等待代理完成

test-agent 完成后会返回完整的测试报告，包含：
- 测试目标（模块、函数/类、测试框架）
- 测试路径覆盖（正常路径、边界条件、异常路径、并发竞态）
- 完整的可运行测试代码
- 运行结果（通过率、覆盖率）

---

## 适用场景

| 场景 | 示例 |
|------|------|
| 单元测试 | "为 calculateTotal 函数生成测试" |
| 集成测试 | "测试用户注册流程" |
| E2E 测试 | "测试购物车结算流程" |
| 边界测试 | "测试极端输入情况" |

## 测试策略金字塔

```
    /\      E2E (10%) ← Chrome DevTools MCP 浏览器自动化
   /--\     Integration (20%)
  /----\    Unit (70%)
```

## 关键规则

1. **测试行为，不测试实现** – 关注输入输出
2. **AAA 模式** – Arrange-Act-Assert 组织测试
3. **复用现有模式** – 遵循项目已有的测试风格

## 知识存储

测试生成完成后，调用 `mcp______ji` 存储测试模式和覆盖率结果，更新项目测试基线。

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `LITE_MODE` | 设为 `true` 跳过外部模型调用，使用模拟响应 | `false` |
| `GEMINI_MODEL` | Gemini 模型版本 | `gemini-2.5-pro` |

**LITE_MODE 检查**：调用外部模型前，检查 `LITE_MODE` 环境变量。若为 `true`，跳过 Codex/Gemini 调用，使用占位符响应继续流程。

**调用语法**（并行用 `run_in_background: true`）：

```
Bash({
  command: "{{CCG_BIN}} {{LITE_MODE_FLAG}}--backend <codex|gemini> {{GEMINI_MODEL_FLAG}}- \"{{WORKDIR}}\" <<'EOF'
ROLE_FILE: <角色提示词路径>
<TASK>
需求：为以下代码生成测试
<代码内容>
需求描述：<增强后的需求（如未增强则用 $ARGUMENTS）>
要求：
1. 使用项目现有测试框架
2. 覆盖正常路径、边界条件、异常处理
</TASK>
OUTPUT: 完整测试代码
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "简短描述"
})
```

**Gemini 模型指定**：调用 Gemini 时，wrapper 自动读取 `GEMINI_MODEL` 环境变量（默认 `gemini-2.5-pro`）。

**角色提示词**：

| 模型 | 提示词 |
|------|--------|
| Codex | `~/.claude/.ccg/prompts/codex/tester.md` |
| Gemini | `~/.claude/.ccg/prompts/gemini/tester.md` |

**智能路由**：

| 代码类型 | 路由 |
|---------|------|
| 后端 | Codex |
| 前端 | Gemini |
| 全栈 | 并行执行两者 |

**并行调用**：使用 `run_in_background: true` 启动，用 `TaskOutput` 等待结果。**必须等所有模型返回后才能进入下一阶段**。

**等待后台任务**（使用最大超时 600000ms = 10 分钟）：

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**重要**：
- 必须指定 `timeout: 600000`，否则默认只有 30 秒会导致提前超时。
如果 10 分钟后仍未完成，继续用 `TaskOutput` 轮询，**绝对不要 Kill 进程**。
- 若因等待时间过长跳过了等待 TaskOutput 结果，则**必须调用 `mcp______zhi` 工具询问用户选择继续等待还是 Kill Task。禁止直接 Kill Task。**

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

## 执行工作流

**测试目标**：$ARGUMENTS

### 🔍 阶段 0：Prompt 增强（可选）

`[模式：准备]` - 优先调用 `mcp______enhance`（不可用时降级到 `mcp__ace-tool__enhance_prompt`；都不可用时执行 **Claude 自增强**：分析意图/缺失信息/隐含假设，按 6 原则补全为结构化需求（目标/范围/技术约束/验收标准），通过 `mcp______zhi` 确认并标注增强模式），**用增强结果替代原始 $ARGUMENTS，后续调用 Codex/Gemini 时传入增强后的需求**

### 🔍 阶段 1：测试分析

`[模式：研究]`

1. 调用 `mcp______ji` 回忆项目历史测试模式和覆盖率基线
2. 调用 `mcp__ace-tool__search_context` 检索目标代码的完整实现（降级：`mcp______sou` → Glob + Grep）
2. 查找现有测试文件和测试框架配置
3. 识别代码类型：[后端/前端/全栈]
4. 评估当前测试覆盖率和缺口

### 🔬 阶段 2：智能路由测试生成

`[模式：生成]`

**⚠️ 根据代码类型必须调用对应模型**（参照上方调用规范）：

- **后端代码** → `Bash({ command: "...--backend codex...", run_in_background: false })`
  - ROLE_FILE: `~/.claude/.ccg/prompts/codex/tester.md`
- **前端代码** → `Bash({ command: "...--backend gemini...", run_in_background: false })`
  - ROLE_FILE: `~/.claude/.ccg/prompts/gemini/tester.md`
- **全栈代码** → 并行调用两者：
  1. `Bash({ command: "...--backend codex...", run_in_background: true })`
     - ROLE_FILE: `~/.claude/.ccg/prompts/codex/tester.md`
  2. `Bash({ command: "...--backend gemini...", run_in_background: true })`
     - ROLE_FILE: `~/.claude/.ccg/prompts/gemini/tester.md`
  用 `TaskOutput` 等待结果

OUTPUT：完整测试代码（使用项目现有测试框架，覆盖正常路径、边界条件、异常处理）

**必须等所有模型返回后才能进入下一阶段**。

**务必遵循上方 `多模型调用规范` 的 `重要` 指示**

### 🔀 阶段 3：测试整合

`[模式：计划]`

1. 收集模型输出
2. Claude 重构：统一风格、确保命名一致、优化结构、移除冗余

### ✅ 阶段 4：测试验证

`[模式：执行]`

1. 创建测试文件
2. 运行生成的测试
3. 如有失败，分析原因并修复

---

## 输出格式

```markdown
## 🧪 测试生成：<测试目标>

### 分析结果
- 代码类型：[后端/前端/全栈]
- 测试框架：<检测到的框架>

### 生成的测试
- 测试文件：<文件路径>
- 测试用例数：<数量>

### 运行结果
- 通过：X / Y
- 失败：<如有，列出原因>
```

## 测试策略金字塔

```
    /\      E2E (10%) ← Chrome DevTools MCP 浏览器自动化
   /--\     Integration (20%)
  /----\    Unit (70%)
```

### Chrome DevTools E2E 测试门控

当测试目标涉及前端 UI/交互时，在阶段 4（测试验证）后追加浏览器 E2E 测试：

1. **可用性检测**：尝试调用 `list_pages`，成功则启用 E2E 测试
2. **E2E 测试流程**：
   - `resize_page` 设置标准视口
   - `navigate_page` 导航至功能入口
   - `wait_for` 确保页面就绪
   - 按测试路径执行 `click`/`fill`/`press_key` 交互
   - `take_snapshot` 验证 DOM 结构
   - `take_screenshot` 截图留存
3. **降级策略**：
   - Chrome DevTools 不可用 → 跳过 E2E 步骤
   - 通过 `mcp______zhi` 输出手动测试清单
   - 在测试报告中标注"⚠️ E2E 浏览器测试已跳过"

---

## 关键规则

1. **测试行为，不测试实现** – 关注输入输出
2. **智能路由** – 后端测试用 Codex，前端测试用 Gemini
3. **复用现有模式** – 遵循项目已有的测试风格
4. 外部模型对文件系统**零写入权限**

## 知识存储

测试生成完成后，调用 `mcp______ji` 存储测试模式和覆盖率结果，更新项目测试基线。
