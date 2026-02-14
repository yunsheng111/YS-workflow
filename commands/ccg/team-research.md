---
description: 'Agent Teams 需求研究 - 并行探索代码库，产出约束集 + 可验证成功判据'
---

# Team Research - Agent Teams 需求研究

并行探索代码库，产出约束集 + 可验证成功判据。

## 使用方法

```bash
/ccg:team-research <需求描述>
```

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`team-research-agent`

**调用**：
```
Task({
  subagent_type: "team-research-agent",
  prompt: "$ARGUMENTS",
  description: "Agent Teams 需求研究"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- Prompt 增强：`mcp______enhance` → `mcp__ace-tool__enhance_prompt` → Claude 自增强
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Grep/Glob
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`
- 外部模型：Codex + Gemini（并行探索不同上下文边界）

**详细说明**：参考 [team-research-agent.md](../../agents/ccg/team-research-agent.md)

---

## 执行流程（概述）

team-research-agent 将执行以下 8 阶段工作流：

1. **Prompt 增强** — 调用 enhance 增强用户需求（MANDATORY）
2. **代码库评估** — 检索项目结构和技术栈
3. **定义探索边界** — 按上下文边界划分 Codex/Gemini 探索范围
4. **多模型并行探索** — Codex（后端）+ Gemini（前端）并行分析
5. **聚合约束集** — 整合为硬约束/软约束/依赖/风险
6. **歧义消解** — 通过 zhi 确认开放问题
7. **写入研究文件** — 输出到 `.doc/agent-teams/research/`
8. **归档** — 调用 ji 存储关键信息

---

## 关键规则

1. **Prompt 增强不可跳过** — 必须先增强再探索
2. **多模型协作是 mandatory** — Codex + Gemini 必须并行调用
3. **不做架构决策** — 只发现约束
4. **使用 zhi 解决歧义** — 绝不假设

**Exit Criteria**
- [ ] Codex + Gemini 探索完成
- [ ] 所有歧义已通过用户确认解决
- [ ] 约束集 + 成功判据已写入研究文件
- [ ] 零开放问题残留
