# YS-workflow 版本历史

## v1.0.1 (2026-02-15)

### ♻️ 重构：collab Skill 封装

**提交哈希**：e3a4a59

**核心改进**：
- 新增 collab Skill（5 个文件）：
  - SKILL.md：Skill 入口和使用指南
  - executor.md：双模型并行调用执行器
  - renderer.md：占位符渲染和命令构建
  - reporter.md：进度汇报和状态追踪
  - state-machine.md：调用状态机和降级策略

- 重构 12 个代理文件：
  - 移除手动编排的双模型调用逻辑
  - 统一使用 collab Skill 调用接口
  - 简化代理层代码，提升一致性

- 更新共享规范文档：
  - dual-model-orchestration.md：添加 collab Skill 使用说明
  - model-calling.md：补充 Skill 调用示例

**架构改进**：
- 代码复用：12 个代理共享同一套双模型调用逻辑
- 可维护性：集中管理降级策略和进度汇报
- 一致性：统一调用接口和错误处理
- 净减少：56 行代码（-521 + 465 = -56）

**修改文件**：19 个（+1515 行，-521 行）

**Co-Authored-By**: Claude Opus 4.6 <noreply@anthropic.com>

---

## v1.0.0 (2026-02-13)

### ♻️ 重构：CCG 架构优化

**提交哈希**：5902f5f

**核心改进**：
- 新增占位符渲染层（command-renderer.cjs），支持 {{CCG_BIN}}、{{WORKDIR}}、{{LITE_MODE_FLAG}}、{{GEMINI_MODEL_FLAG}}
- 12 个 CCG 命令从 Bash 调用改为 Task 调用对应代理
- 清理 11 个文件中的 56 处硬编码路径
- 新增架构体检脚本（check-architecture.js）
- 增强 enhance 工具可靠性（断路器模式 + 结构化降级）
- 更新架构文档（ARCHITECTURE.md、ARCHITECTURE-VISUAL.md）
- 新增 4 个 Agent Teams 命令（team-research/team-plan/team-exec/team-review）

**架构变化**：
- Task 调用：12 → 20 (+8)
- 外部模型+主代理：8 → 0 (-8)
- 直接执行：5 → 2 (-3)
- Agent Teams：1 → 4 (+3)

**修改文件**：49 个（+3928 行，-1872 行）

**新增文件**：
- `.ccg/runtime/command-renderer.cjs` - 占位符渲染层
- `.ccg/runtime/command-renderer.spec.cjs` - 单元测试（15 个测试用例）
- `.ccg/scripts/check-architecture.js` - 架构体检脚本
- `.ccg/scripts/check-architecture.spec.js` - 单元测试（7 个测试用例）
- `commands/ccg/team-exec.md` - Agent Teams 并行实施命令
- `commands/ccg/team-plan.md` - Agent Teams 规划命令
- `commands/ccg/team-research.md` - Agent Teams 需求研究命令
- `commands/ccg/team-review.md` - Agent Teams 审查命令
- `package.json` - npm 脚本配置

**Co-Authored-By**: Claude Opus 4.6 <noreply@anthropic.com>

---

## v0.2.0 (2026-02-12)

### 📝 文档：架构可视化

**提交哈希**：9218e94

**改进内容**：
- 创建 ARCHITECTURE-VISUAL.md，包含 4 个 Mermaid 图表
- 更新 ARCHITECTURE.md，添加快速导航
- 新增命令-代理映射矩阵
- 新增代理工具集配置矩阵

---

## v0.1.0 (2026-02-11)

### 🎉 初始化

**提交哈希**：734c3c9

**初始内容**：
- 初始化 YS-workflow 工作流仓库
- 基础 CCG 命令和代理结构
- 基础配置文件

---

## 版本规范

**版本号格式**：`v<major>.<minor>.<patch>`

- **major**：重大架构变更或不兼容更新
- **minor**：新增功能或重要改进
- **patch**：缺陷修复或小优化

**提交类型**：
- ♻️ refactor：重构
- ✨ feat：新功能
- 🐛 fix：缺陷修复
- 📝 docs：文档更新
- 🎨 style：代码格式
- ⚡️ perf：性能优化
- ✅ test：测试相关
- 🔧 chore：构建/工具
- 👷 ci：CI/CD
- 🎉 init：初始化
