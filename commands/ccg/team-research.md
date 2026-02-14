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

**执行方式**：主代理直接执行 + 外部模型协作

**工作流**：8 个阶段（Prompt 增强 → 代码库评估 → 定义探索边界 → 多模型并行探索 → 聚合与综合 → 歧义消解 → 写入研究文件 → 归档研究成果）

---

## Level 3: 工具层执行

**主代理调用的工具**：
- Prompt 增强：`mcp______enhance` → `mcp__ace-tool__enhance_prompt` → Claude 自增强
- 代码检索：`mcp__ace-tool__search_context` → `mcp______sou` → Grep/Glob
- 用户确认：`mcp______zhi`
- 知识存储：`mcp______ji`
- 外部模型：Codex + Gemini（并行探索不同上下文边界）

**详细说明**：参考 [team-research-agent.md](../../agents/ccg/team-research-agent.md)

---

## 执行流程

1. **Prompt 增强** — 调用 enhance 增强用户需求（MANDATORY）
2. **代码库评估** — 检索项目结构和技术栈
3. **多模型并行探索** — Codex（后端）+ Gemini（前端）并行分析
4. **聚合约束集** — 整合为硬约束/软约束/依赖/风险
5. **歧义消解** — 通过 zhi 确认开放问题
6. **写入研究文件** — 输出到 `.doc/agent-teams/research/`
7. **归档** — 调用 ji 存储关键信息

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
