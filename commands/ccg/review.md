---
description: '多视角代码审查：从安全性、性能、可维护性三个维度对代码变更进行系统化审查'
---

# Review - 多视角代码审查

从安全性、性能、可维护性三个维度对代码变更进行系统化审查。

## 使用方法

```bash
/review [options]
```

- **无参数**：自动审查 `git diff HEAD`
- **有参数**：审查指定代码或描述

## 选项

| 选项 | 说明 |
|------|------|
| `--pr <number>` | 审查指定 PR |
| `--files <paths>` | 审查指定文件 |

---

## Level 2: 命令层执行

**执行方式**：Task 调用代理

**代理**：`review-agent`

**调用**：
```
Task({
  subagent_type: "review-agent",
  prompt: "$ARGUMENTS",
  description: "多视角代码审查"
})
```

---

## Level 3: 工具层执行

**代理调用的工具**：
- 代码检索：`mcp__ace-tool__search_context`
- 用户确认：`mcp______zhi`
- GitHub 集成：`mcp__github__get_pull_request`、`mcp__github__create_pull_request_review`
- 浏览器验证：Chrome DevTools MCP

**详细说明**：参考 [review-agent.md](../../agents/ccg/review-agent.md)

---

## 执行流程（概述）

review-agent 将执行以下 7 阶段工作流：

1. **获取变更内容** — git diff / PR 详情
2. **上下文检索** — 检索变更文件的上下游依赖
3. **多维度审查** — 安全性、性能、可维护性、正确性
4. **问题分类** — Critical / Warning / Info
5. **输出审查报告** — 展示结论并确认
6. **GitHub PR 审查**（可选）— 创建 PR Review
7. **GitHub PR 合并**（可选）— 合并 PR

---

## 审查维度

| 维度 | 关注点 |
|------|--------|
| 安全性 | 注入风险、认证授权、敏感数据暴露 |
| 性能 | N+1 查询、内存泄漏、不必要的重渲染 |
| 可维护性 | 命名规范、代码重复、模块耦合 |
| 正确性 | 逻辑错误、边界条件、错误处理 |

---

## 关键规则

1. **禁止基于假设审查** — 必须先检索实际代码上下文
2. **Critical 问题必须提供修复方案**
3. **每个问题必须标注文件路径和行号**
4. **审查完成后必须通过 zhi 确认**
