# Team Research: ContextWeaver MCP 工具

## 增强后的需求

### [目标]
深入研究原仓库 `https://github.com/fengshao1227/ccg-workflow` 中的 **ContextWeaver MCP 工具**，理解其架构设计、功能实现、技术栈、使用方式及与当前项目的集成可能性。

### [范围]
1. **代码库探索**：
   - ContextWeaver 的源代码位置、文件结构
   - 核心模块、入口文件、配置文件
   - 依赖关系（package.json、requirements.txt 等）

2. **功能分析**：
   - ContextWeaver 的核心功能和用途
   - 提供的 MCP 工具列表及其参数
   - 与其他 MCP 工具的差异和优势

3. **技术实现**：
   - 使用的编程语言和框架
   - MCP 协议实现方式
   - 数据流和通信机制

4. **集成评估**：
   - 当前项目是否已集成 ContextWeaver
   - 集成所需的配置步骤
   - 潜在的兼容性问题

### [技术约束]
- 必须通过 GitHub API 或 Git 克隆获取源代码
- 需要识别 MCP 服务器的标准实现模式（stdio/SSE）
- 分析时需区分前端/后端/基础设施边界

### [验收标准]
1. 输出 ContextWeaver 的完整约束集（硬约束、软约束、依赖、风险）
2. 生成可验证的成功判据（功能、性能、兼容、安全、回归）
3. 识别所有开放问题并通过用户确认解决
4. 将研究成果写入 `.claude/team-plan/contextweaver-research.md`

---

## 约束集

### 硬约束

- [HC-1] **外部 API 依赖** — ContextWeaver 硬依赖外部 Embedding/Rerank API（SiliconFlow），缺失 `EMBEDDINGS_*` 或 `RERANK_*` 配置时检索不可用 — 来源：Codex（https://raw.githubusercontent.com/hsingjui/ContextWeaver/main/src/config.ts）

- [HC-2] **运行时环境要求** — 要求 Node.js >= 20 且依赖 native 模块（better-sqlite3、LanceDB、tree-sitter），部署环境需满足本地模块可用性 — 来源：Codex（https://raw.githubusercontent.com/hsingjui/ContextWeaver/main/package.json）

- [HC-3] **文件大小限制** — 文件大小阈值为 100KB（`MAX_FILE_SIZE = 100*1024`），超限文件直接跳过 — 来源：Codex（https://raw.githubusercontent.com/hsingjui/ContextWeaver/main/src/scanner/processor.ts）

- [HC-4] **MCP 参数协议** — ContextWeaver 使用 `information_request` + `technical_terms` + `repo_path` 参数，与 ace-tool 的 `query` + `project_root_path` 不兼容 — 来源：Codex（https://raw.githubusercontent.com/hsingjui/ContextWeaver/main/src/mcp/server.ts）

- [HC-5] **单工具限制** — MCP 只提供 `codebase-retrieval` 一个工具，不提供 `enhance_prompt` 等补充能力 — 来源：Codex（https://raw.githubusercontent.com/hsingjui/ContextWeaver/main/src/mcp/server.ts）

- [HC-6] **MCP 协议版本** — 必须遵循 MCP 协议的版本兼容性要求，确保与 Claude Desktop 的集成 — 来源：Gemini

- [HC-7] **数据出站限制** — 代码内容需要发送到外部 SiliconFlow API 进行向量化，仅限开发环境使用 — 来源：用户确认

- [HC-8] **完全替换策略** — 完全替换 ace-tool，不保留双 provider 降级策略 — 来源：用户确认

### 软约束

- [SC-1] **跨文件扩展默认关闭** — 默认配置关闭跨文件 import 扩展（`importFilesPerSeed=0`、`chunksPerImportFile=0`），跨模块关联召回受限 — 来源：Codex（https://raw.githubusercontent.com/hsingjui/ContextWeaver/main/src/search/config.ts）

- [SC-2] **意图与术语分离** — MCP 输入契约采用"语义意图 + 精确术语"分离设计，`information_request` 描述"做什么"，`technical_terms` 过滤"叫什么" — 来源：Codex（https://raw.githubusercontent.com/hsingjui/ContextWeaver/main/src/mcp/server.ts）

- [SC-3] **工厂缓存模式** — 核心服务使用工厂缓存模式（Indexer/VectorStore/GraphExpander 单例化）降低重复初始化成本 — 来源：Codex

- [SC-4] **单调更新策略** — 向量层遵循单调更新（先插入新版本再删除旧版本）优先保证可检索性 — 来源：Codex（https://raw.githubusercontent.com/hsingjui/ContextWeaver/main/src/vectorStore/index.ts）

- [SC-5] **双阶段词法检索** — 词法检索统一分词器 `segmentQuery`，并采用 strict(AND) + relaxed(OR) 双阶段补录 — 来源：Codex（https://raw.githubusercontent.com/hsingjui/ContextWeaver/main/src/search/fts.ts）

- [SC-6] **渐进式增强** — 前端采用"渐进式增强"策略，在不打断用户工作流的前提下，后台静默编织上下文 — 来源：Gemini

- [SC-7] **上下文来源透明** — 编织后的上下文来源需透明，用户能清晰识别哪些是原始代码，哪些是生成的元数据 — 来源：Gemini

- [SC-8] **TypeScript 类型驱动** — 遵循 TypeScript 类型定义驱动的接口设计 — 来源：Gemini

### 依赖关系

- [DEP-1] **MCP 层依赖链** — `mcp/server.ts` → `codebaseRetrieval` → `scan` + `SearchService` — 来源：Codex（https://raw.githubusercontent.com/hsingjui/ContextWeaver/main/src/mcp/server.ts）

- [DEP-2] **索引链路依赖** — scanner(crawler/filter/processor) → indexer(embedding+batch upsert) → vectorStore + FTS — 来源：Codex（https://raw.githubusercontent.com/hsingjui/ContextWeaver/main/src/scanner/index.ts）

- [DEP-3] **搜索链路依赖** — SearchService 同时依赖 Indexer、FTS、Reranker、GraphExpander、ContextPacker — 来源：Codex（https://raw.githubusercontent.com/hsingjui/ContextWeaver/main/src/search/SearchService.ts）

- [DEP-4] **存储层依赖** — SQLite 元数据/FTS 与 LanceDB 向量表并行维护一致性 — 来源：Codex（https://raw.githubusercontent.com/hsingjui/ContextWeaver/main/src/db/index.ts）

- [DEP-5] **CCG 集成依赖** — `init.ts/config-mcp.ts` → `installContextWeaver` → `utils/mcp.ts` 写入 Claude 配置 — 来源：Codex（https://raw.githubusercontent.com/fengshao1227/ccg-workflow/main/src/commands/init.ts）

- [DEP-6] **MCP SDK 依赖** — 前端依赖 `@modelcontextprotocol/sdk` 实现 MCP 客户端协议栈 — 来源：Gemini

- [DEP-7] **命令渲染器依赖** — 依赖现有的 CLI 响应渲染器 `command-renderer.cjs` — 来源：Gemini

### 风险

- [RISK-1] **参数协议错位** — ccg-workflow 模板参数协议不一致（`query/project_root_path` vs `information_request/repo_path`）导致调用失败 — 缓解：需要更新所有 CCG 命令模板中的参数调用 — 来源：Codex

- [RISK-2] **文档与代码漂移** — README 的默认检索参数与 `search/config.ts` 不一致，可能误导调优 — 缓解：以代码为准，更新文档 — 来源：Codex

- [RISK-3] **构建脚本缺失文件** — `package.json` 构建脚本引用 `src/mcp/main.ts`，但主分支文件树未见该文件 — 缓解：验证构建流程，必要时修复 — 来源：Codex

- [RISK-4] **外部 API 抖动** — 外部 API 抖动/限流会影响索引与检索 SLA — 缓解：实现重试和退避策略 — 来源：Codex

- [RISK-5] **Windows 安装失败** — Windows/受限网络下全局安装 ContextWeaver 及 native 依赖可能失败 — 缓解：提供离线安装包或 Docker 镜像 — 来源：Codex

- [RISK-6] **跨文件召回不足** — 默认关闭跨文件 import 扩展，复杂后端调用链问题可能需要更多轮人工检索 — 缓解：根据用户确认保持默认关闭，必要时手动开启 — 来源：Codex + 用户确认

- [RISK-7] **Token 溢出** — 过度自动化的上下文编织可能导致 LLM 幻觉或 Token 溢出 — 缓解：实现智能截断策略（Smart TopK） — 来源：Gemini

- [RISK-8] **跨平台样式不一致** — 跨平台集成（VS Code vs CLI）中的样式不一致 — 缓解：统一 UI/UX 规范 — 来源：Gemini

---

## 成功判据

每条判据必须满足：可观测、可自动化验证、无主观评价。

| 编号 | 类型 | 判据描述 | 验证方式 | 关联约束 |
|------|------|----------|----------|----------|
| OK-1 | 功能 | 安装后 `~/.claude.json` 中存在 `mcpServers.contextweaver`，命令为 `contextweaver`，参数含 `mcp` | 读取配置文件并验证 JSON 结构 | HC-2, DEP-5 |
| OK-2 | 功能 | `~/.contextweaver/.env` 配置完成后，`contextweaver index <repo>` 能生成 `index.db` 与 `vectors.lance` | 执行索引命令并检查文件存在性 | HC-1, HC-2, DEP-2 |
| OK-3 | 功能 | MCP 调用 `codebase-retrieval`（`repo_path + information_request`）可返回 `Found X relevant code blocks` 且包含文件+行号片段 | 执行 MCP 调用并解析返回结果 | HC-4, HC-5, DEP-1 |
| OK-4 | 功能 | 重复调用检索时表现为增量更新（added/modified/deleted 可观测），且并发请求下无索引竞争异常（锁生效） | 多次调用并观察日志输出 | SC-4, DEP-4 |
| OK-5 | 功能 | 在当前项目中完成参数适配后，不再出现 MCP schema 参数报错 | 执行 CCG 命令并检查错误日志 | HC-4, RISK-1 |
| OK-6 | 性能 | 上下文获取的延迟低于 500ms（增量更新场景） | 测量 MCP 调用响应时间 | SC-6 |
| OK-7 | 性能 | 首次索引完成时间 < 5 分钟（中型项目，~1000 文件） | 测量索引命令执行时间 | HC-1, DEP-2 |
| OK-8 | 兼容 | 支持 TypeScript、JavaScript、Python、Go、Java、Rust 六大语言的 AST 解析 | 在多语言项目中执行索引并验证 chunks 生成 | HC-2 |
| OK-9 | 安全 | 代码内容仅在开发环境出站到 SiliconFlow API，生产环境禁用 | 检查环境变量配置和网络请求日志 | HC-7 |
| OK-10 | 回归 | 现有 CCG 命令（plan/execute/analyze 等）在替换 ace-tool 后仍能正常工作 | 执行完整的 CCG 工作流并验证输出 | HC-8, RISK-1 |

---

## 开放问题（已解决）

- **Q1**: 当前项目目标是完全替换 ace-tool，还是并行保留双 provider？ → **A**: 完全替换为 ContextWeaver → 约束：[HC-8]

- **Q2**: 是否允许代码内容出站到外部模型服务（SiliconFlow）进行 embedding/rerank？ → **A**: 允许（仅开发环境） → 约束：[HC-7]

- **Q3**: 是否接受"每次检索前增量扫描"的时延模型，或需要额外的离线预热/守护进程策略？ → **A**: 接受首次检索时延 + 需要预热策略 → 约束：在 ccg:init 阶段预热索引

- **Q4**: 是否要在当前项目启用跨文件 import 扩展（提高架构级问题召回）？ → **A**: 保持默认关闭 → 约束：[SC-1]

- **Q5**: 当前仓库是否存在大量 >100KB 关键源码文件，需要放宽扫描阈值？ → **A**: 保持 100KB 限制 → 约束：[HC-3]

- **Q6**: 是否要求兼容现有 `mcp__ace-tool__search_context` 调用语义（`query` 参数）以降低迁移成本？ → **A**: 直接使用新参数 → 约束：[HC-4]

---

## 架构概览

### ContextWeaver 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Interface Layer                          │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  CLI Entry   │              │  MCP Server  │            │
│  │ (index.ts)   │              │ (server.ts)  │            │
│  └──────┬───────┘              └──────┬───────┘            │
└─────────┼──────────────────────────────┼──────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Search Service                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Vector     │  │   Lexical    │  │     RRF      │     │
│  │  Retrieval   │  │  Retrieval   │  │   Fusion     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                            ▼                                │
│                    ┌──────────────┐                         │
│                    │   Reranker   │                         │
│                    └──────┬───────┘                         │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Context Expansion                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ E1: Neighbor │  │ E2: Breadcrumb│ │ E3: Import   │     │
│  │  Expansion   │  │   Completion  │  │  Resolution  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                            ▼                                │
│                    ┌──────────────┐                         │
│                    │   Context    │                         │
│                    │    Packer    │                         │
│                    └──────┬───────┘                         │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Storage Layer                            │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   SQLite     │              │   LanceDB    │            │
│  │ (index.db)   │              │(vectors.lance)│           │
│  │  - Metadata  │              │  - Vectors   │            │
│  │  - FTS5      │              │  - Chunks    │            │
│  └──────────────┘              └──────────────┘            │
└─────────────────────────────────────────────────────────────┘
          ▲                              ▲
          │                              │
┌─────────┴──────────────────────────────┴──────────────────┐
│                  Indexing Pipeline                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Crawler    │→ │   Semantic   │→ │   Indexer    │    │
│  │   (fdir)     │  │   Splitter   │  │  (Batch)     │    │
│  │              │  │ (Tree-sitter)│  │ (Embedding)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────────────────────────────────────────┘
```

### CCG 集成架构

```
┌─────────────────────────────────────────────────────────────┐
│                    CCG Commands                             │
│  /ccg:plan  /ccg:execute  /ccg:analyze  /ccg:feat  ...     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Command Templates                          │
│  - 参数适配：query → information_request                    │
│  - 参数适配：project_root_path → repo_path                  │
│  - 添加：technical_terms（可选）                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  MCP Client Layer                           │
│  - 工具发现：listTools()                                    │
│  - 工具调用：callTool("codebase-retrieval", {...})         │
│  - 结果解析：解析 JSON-RPC 响应                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              ContextWeaver MCP Server                       │
│  - 监听 stdio                                               │
│  - 处理 JSON-RPC 请求                                       │
│  - 返回编织后的上下文                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 技术栈总结

### ContextWeaver 核心技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 语言 | TypeScript | 主要开发语言 |
| 运行时 | Node.js >= 20 | 执行环境 |
| MCP 协议 | @modelcontextprotocol/sdk | MCP 服务器实现 |
| AST 解析 | Tree-sitter | 语义分片 |
| 向量存储 | LanceDB | 向量索引 |
| 元数据存储 | SQLite + FTS5 | 元数据和全文搜索 |
| Embedding | SiliconFlow API | 向量化 |
| Reranker | SiliconFlow API | 精排 |
| 文件扫描 | fdir | 高性能文件遍历 |

### CCG 集成技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 命令系统 | CCG Commands | 任务编排 |
| 模板引擎 | Markdown Templates | 命令模板 |
| 配置管理 | ~/.claude.json | MCP 服务器配置 |
| 环境变量 | ~/.contextweaver/.env | ContextWeaver 配置 |
| 安装器 | installer.ts | 自动化安装流程 |

---

## 下一步行动

1. **更新 CCG 命令模板** — 将所有模板中的 `query` + `project_root_path` 替换为 `information_request` + `repo_path`
2. **实现预热策略** — 在 `ccg:init` 命令中添加 `contextweaver index` 调用
3. **验证构建流程** — 检查 ContextWeaver 的构建脚本是否正常工作
4. **更新文档** — 同步 README 和代码中的默认配置参数
5. **测试完整工作流** — 执行 `ccg:workflow` 验证端到端集成

---

## 参考资源

- ContextWeaver 原仓库：https://github.com/hsingjui/ContextWeaver
- CCG Workflow 仓库：https://github.com/fengshao1227/ccg-workflow
- MCP 协议规范：https://modelcontextprotocol.io/
- Tree-sitter 文档：https://tree-sitter.github.io/tree-sitter/
- LanceDB 文档：https://lancedb.github.io/lancedb/
