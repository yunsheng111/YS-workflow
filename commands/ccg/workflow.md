---
description: '多模型协作开发工作流（研究→构思→计划→执行→审查与修复→验收），智能路由前端→Gemini、后端→Codex'
---

# Workflow - 多模型协作开发

使用质量把关、MCP 服务和多模型协作执行结构化开发工作流。

## 使用方法

```bash
/workflow <任务描述>
```

## 上下文

- 要开发的任务：$ARGUMENTS
- 带质量把关的结构化 6 阶段工作流
- 多模型协作：Codex（后端）+ Gemini（前端）+ Claude（编排）
- MCP 服务集成（ace-tool）以增强功能

## 核心协议

- **语言协议**：与工具/模型交互用**英语**，与用户交互用**中文**
- **强制并行**：Codex/Gemini 调用必须使用 `run_in_background: true`（包含单模型调用，避免阻塞主线程）
- **代码主权**：外部模型对文件系统**零写入权限**，所有修改由 Claude 执行
- **止损机制**：当前阶段输出通过验证前，不进入下一阶段
- **Enhance 接管**：本命令自带 enhance 流程（阶段 1），全局入口协议的步骤 1-2 由此接管

---

## 多模型调用规范（由 fullstack-agent 代理内部处理）

fullstack-agent 代理内部会自动处理多模型调用，使用占位符渲染层提供的以下占位符：

- `{{CCG_BIN}}` - codeagent-wrapper 路径
- `{{WORKDIR}}` - 当前工作目录
- `{{LITE_MODE_FLAG}}` - --lite 标志（如果 LITE_MODE=true）
- `{{GEMINI_MODEL_FLAG}}` - --gemini-model 标志

主代理无需关心这些细节，只需调用 Task 工具启动 fullstack-agent 代理即可

---

## 网络搜索规范（由 fullstack-agent 代理内部处理）

fullstack-agent 代理内部会自动处理网络搜索需求，包括 GrokSearch 调用和降级策略。主代理无需关心这些细节

---

## 执行工作流

**任务描述**：$ARGUMENTS

调用 fullstack-agent 代理执行完整的 6 阶段工作流：

```
Task({
  subagent_type: "fullstack-agent",
  prompt: "$ARGUMENTS",
  description: "6 阶段全栈开发（研究→构思→规划→实施→审查→验收）"
})
```

fullstack-agent 代理将自动完成以下流程：
1. 阶段 1：研究与分析（Prompt 增强 + 上下文检索 + 需求评分）
2. 阶段 2：方案构思（多模型并行分析 + 方案对比）
3. 阶段 3：详细规划（多模型协作规划 + 用户确认）
4. 阶段 4：实施（代码开发 + Chrome DevTools 验证）
5. 阶段 5：审查与修复（多模型并行审查 + 问题修复）
6. 阶段 6：验收（最终评估 + 用户确认）
7. 阶段 7（可选）：GitHub PR 创建

**重要**：fullstack-agent 代理内部会自动处理占位符渲染和多模型调用，主代理无需关心具体实现细节

### 工作流交付

fullstack-agent 代理完成后，会自动：
1. 将计划保存至 `.claude/plan/<任务名>.md`
2. 通过 `mcp______zhi` 向用户展示最终成果
3. 等待用户选择下一步操作（确认完成/运行 `/ccg:commit` 提交代码/创建 PR）

主代理无需额外处理，fullstack-agent 代理会处理所有交互

---

## 关键规则

1. **委托给 fullstack-agent 代理** – 主代理只需调用 Task 工具，所有工作流逻辑由 fullstack-agent 代理处理
2. **占位符渲染** – fullstack-agent 代理内部使用占位符（{{CCG_BIN}}、{{WORKDIR}} 等），由渲染层自动处理
3. **多模型并行** – fullstack-agent 代理会自动并行调用 Codex 和 Gemini 进行分析
4. **SESSION_ID 交接** – fullstack-agent 代理会在计划中包含 SESSION_ID，供后续使用
5. **阶段顺序不可跳过** – fullstack-agent 代理严格执行 6 阶段工作流（除非用户明确指令）
