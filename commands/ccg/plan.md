---
description: '多模型协作规划 - 上下文检索 + 双模型分析 → 生成 Step-by-step 实施计划'
---

# Plan - 多模型协作规划

$ARGUMENTS

---

## 核心协议

- **语言协议**：与工具/模型交互用**英语**，与用户交互用**中文**
- **强制并行**：Codex/Gemini 调用必须使用 `run_in_background: true`（包含单模型调用，避免阻塞主线程）
- **代码主权**：外部模型对文件系统**零写入权限**，所有修改由 Claude 执行
- **止损机制**：当前阶段输出通过验证前，不进入下一阶段
- **仅规划**：本命令允许读取上下文与写入 `.claude/plan/*` 计划文件，但**禁止修改产品代码**

---

## 多模型调用规范（由 planner 代理内部处理）

planner 代理内部会自动处理多模型调用，使用占位符渲染层提供的以下占位符：

- `{{CCG_BIN}}` - codeagent-wrapper 路径
- `{{WORKDIR}}` - 当前工作目录
- `{{LITE_MODE_FLAG}}` - --lite 标志（如果 LITE_MODE=true）
- `{{GEMINI_MODEL_FLAG}}` - --gemini-model 标志

主代理无需关心这些细节，只需调用 Task 工具启动 planner 代理即可

---

## 网络搜索规范（由 planner 代理内部处理）

planner 代理内部会自动处理网络搜索需求，包括 GrokSearch 调用和降级策略。主代理无需关心这些细节

---

## 执行工作流

**规划任务**：$ARGUMENTS

调用 planner 代理执行完整的规划流程：

```
Task({
  subagent_type: "planner",
  prompt: "$ARGUMENTS",
  description: "WBS 任务分解与实施计划生成"
})
```

planner 代理将自动完成以下流程：
1. Prompt 增强（使用 `mcp______enhance` 或降级方案）
2. 上下文检索（使用 `mcp__ace-tool__search_context` 或降级方案）
3. 多模型协作分析（Codex + Gemini 并行调用）
4. 生成实施计划并保存到 `.claude/plan/<功能名>.md`
5. 通过 `mcp______zhi` 向用户展示计划并等待确认

**重要**：planner 代理内部会自动处理占位符渲染和多模型调用，主代理无需关心具体实现细节

### 计划交付

planner 代理完成后，会自动：
1. 将计划保存至 `.claude/plan/<功能名>.md`
2. 通过 `mcp______zhi` 向用户展示计划摘要
3. 等待用户选择下一步操作

主代理无需额外处理，planner 代理会处理所有交互

---

## 计划保存（由 planner 代理内部处理）

planner 代理会自动将计划保存至 `.claude/plan/<功能名>.md`，主代理无需额外处理。

---

## 计划修改流程（由 planner 代理内部处理）

planner 代理会自动处理用户的计划修改请求，主代理无需额外处理

---

## 关键规则

1. **仅规划不实施** – 本命令不执行任何代码变更
2. **委托给 planner 代理** – 主代理只需调用 Task 工具，所有规划逻辑由 planner 代理处理
3. **占位符渲染** – planner 代理内部使用占位符（{{CCG_BIN}}、{{WORKDIR}} 等），由渲染层自动处理
4. **多模型并行** – planner 代理会自动并行调用 Codex 和 Gemini 进行分析
5. **SESSION_ID 交接** – planner 代理会在计划中包含 SESSION_ID，供后续 `/ccg:execute` 使用
