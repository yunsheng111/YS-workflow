# CCG 智能路由用户指南

本指南帮助您理解 CCG 的智能路由机制，以及如何选择合适的命令来优化成本和效率。

---

## 什么是智能路由？

CCG 命令层实现了智能路由，根据任务特征自动选择最优执行方式：

- **主代理直接执行**（1x 成本）：简单任务，无需额外上下文
- **Subagent 执行**（1x 成本）：独立任务，需要专项能力
- **混合策略**（2-3x 成本）：复杂任务，分阶段使用不同工具
- **Agent Teams**（7x 成本）：需要实时协作的并行任务

---

## 如何选择合适的命令？

### 场景 1：简单的 Git 操作

**任务**：提交代码、回滚版本、清理分支

**推荐命令**：
- `/ccg:commit` - 智能生成提交信息
- `/ccg:rollback` - 交互式回滚
- `/ccg:clean-branches` - 清理分支

**成本**：1x（主代理直接执行）

---

### 场景 2：单模块功能开发

**任务**：添加一个新的 API 端点、创建一个新组件

**推荐命令**：
- `/ccg:feat` - 智能功能开发（自动识别前/后/全栈）
- `/ccg:frontend` - 前端专项开发
- `/ccg:backend` - 后端专项开发

**成本**：1x（Subagent 执行）

**示例**：
```bash
/ccg:feat 添加用户登录功能
```

---

### 场景 3：多模块全栈开发

**任务**：开发一个完整的功能模块，涉及前后端联调

**推荐命令**：
- `/ccg:workflow` - 6 阶段全栈开发工作流

**成本**：2-3x（混合策略）

**为什么使用混合策略？**
- 阶段 1-3（研究、构思、规划）：使用 Subagents 并行分析（1x）
- 阶段 4（实施）：主代理直接实施（1x）
- 阶段 5-6（审查、验收）：使用 Subagents 并行审查（1x）
- 总成本：2-3x，比纯 Agent Teams（7x）节省 64%

**示例**：
```bash
/ccg:workflow 开发用户管理模块，包含用户列表、详情、编辑功能
```

---

### 场景 4：大规模并行开发

**任务**：多个模块并行开发，需要接口契约实时对齐

**推荐命令**：
- `/ccg:team-research` - 需求研究（产出约束集）
- `/ccg:team-plan` - 并行规划（产出零决策计划）
- `/ccg:team-exec` - 并行实施（spawn Builder teammates）
- `/ccg:team-review` - 交叉审查

**成本**：7x（Agent Teams）

**何时使用 Agent Teams？**
- 文件数量 > 8 个
- 需要前后端并行开发
- 需要接口契约实时对齐
- 预算充足

**示例**：
```bash
/ccg:team-research 重构整个认证系统，包含前端登录页、后端 API、数据库迁移
/ccg:team-plan
/ccg:team-exec
/ccg:team-review
```

---

## 成本对比

| 执行方式 | 成本倍数 | 适用场景 | 示例命令 |
|----------|----------|----------|----------|
| 主代理直接执行 | 1x | 简单任务、无代码变更 | commit, enhance, rollback |
| Subagents | 1x | 独立任务、低耦合 | feat, frontend, backend, analyze |
| 混合策略 | 2-3x | 复杂任务、分阶段执行 | workflow |
| Agent Teams | 7x | 需要实时协作、接口对齐 | team-exec |

---

## 成本预估

执行命令前，CCG 会显示成本预估：

```
📊 成本预估：/workflow
执行模式：混合策略
复杂度：高
协作需求：高

预估 Token 成本：2,500 tokens (2-3x)
基准成本：1,000 tokens

💡 混合策略模式，在不同阶段使用不同工具，成本适中
```

---

## 动态降级

当 Agent Teams 不可用时，CCG 会自动提供降级方案：

```
⚠️ Agent Teams 不可用，需要降级执行

可用降级方案：

方案 1：使用 Subagents 串行执行
  成本：1x
  权衡：失去实时协作能力

方案 2：主代理直接执行
  成本：1x
  权衡：失去并行能力，执行时间增加
```

**如何启用 Agent Teams？**

1. 打开 Claude Code 配置文件：
   - Windows: `%APPDATA%\Claude\settings.json`
   - macOS/Linux: `~/.config/Claude/settings.json`

2. 添加以下配置：
   ```json
   {
     "env": {
       "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
     }
   }
   ```

3. 重启 Claude Code

---

## 最佳实践

### 1. 从简单到复杂

先尝试成本较低的命令，如果不满足需求再升级：

```
/ccg:feat → /ccg:workflow → /ccg:team-exec
```

### 2. 合理使用混合策略

对于复杂任务，优先使用 `/ccg:workflow`（混合策略），而不是直接使用 Agent Teams：

- 成本节省 64%
- 适用于大多数全栈开发场景
- 只有在需要实时协作时才升级到 Agent Teams

### 3. 利用成本预估

执行前查看成本预估，评估是否值得：

- 如果成本过高，考虑拆分任务
- 如果任务简单，使用更轻量的命令

### 4. 善用降级方案

如果 Agent Teams 不可用，不要放弃：

- 方案 1（Subagents）适合大多数场景
- 方案 2（主代理）适合简单任务

---

## 常见问题

### Q: 如何知道我的任务应该使用哪个命令？

A: 参考本指南的"如何选择合适的命令"章节，根据任务特征选择：
- 简单任务 → commit, enhance, rollback
- 单模块 → feat, frontend, backend
- 多模块 → workflow
- 大规模并行 → team-exec

### Q: 为什么 workflow 比 team-exec 便宜？

A: workflow 使用混合策略，只在需要的阶段使用 Subagents，而 team-exec 全程使用 Agent Teams。混合策略成本 2-3x，Agent Teams 成本 7x。

### Q: 什么时候应该使用 Agent Teams？

A: 满足以下条件时考虑使用 Agent Teams：
- 文件数量 > 8 个
- 需要前后端并行开发
- 需要接口契约实时对齐
- 预算充足

### Q: 如果成本预估显示 7x，我还能继续吗？

A: 可以，但建议先评估：
- 任务是否真的需要实时协作？
- 能否拆分为多个独立任务？
- 能否使用混合策略（workflow）替代？

### Q: 降级方案会影响功能吗？

A: 降级方案会影响执行方式，但不影响最终结果：
- 方案 1（Subagents）：失去实时协作，但保留并行能力
- 方案 2（主代理）：失去并行能力，但保留所有功能

---

## 相关文档

- [成本优化指南](./user-guide-cost-optimization.md) - 如何降低 Token 成本
- [架构文档](../.ccg/ARCHITECTURE.md) - 智能路由章节
- [命令参考](../commands/ccg/) - 所有命令的详细说明

---

**版本**：v1.0
**更新时间**：2026-02-13
**适用于**：CCG 架构优化后的版本
