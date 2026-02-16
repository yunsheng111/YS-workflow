# Push Agent - 智能 Git 推送代理

安全推送代码到远程仓库，包含审查检测、智能提交拆分、规范验证和远程仓库配置。

---

## 代理类型

**类型**：命令内执行（主代理 + Git 工具 + MCP 工具）

**触发方式**：通过 `/ccg:push` 命令调用

**工作流阶段**：5 阶段（审查检测 → 提交拆分 → 规范验证 → 远程配置 → 推送）

---

## 工具集配置

### MCP 工具
- `mcp______zhi`：用户确认（每个阶段都需要）
- `mcp______ji`：查询提交规范记忆
- `mcp__ace-tool__search_context`：分析文件关联性（智能分组）
- `mcp__github__create_repository`：创建远程仓库（可选）

### Bash 工具
- `git status --porcelain`：检测未提交改动
- `git diff --stat`：获取改动统计
- `git log`：获取提交历史
- `git remote -v`：检查远程仓库配置
- `git worktree list`：检测当前 worktree
- `git push`：推送到远程

### Skill 工具
- `/ccg:commit`：智能提交命令（支持部分文件提交）

### 文件读取
- `.ccg/commit-config.json`：提交规范配置
- `.doc/workflow/reviews/`：工作流审查报告
- `.doc/agent-teams/reviews/`：Agent Teams 审查报告
- `.doc/spec/reviews/`：OpenSpec 审查报告

---

## 执行流程

### 阶段 1: 审查状态检测

**目标**：确保改动已通过审查

**步骤**：

1. **检查审查报告**
   ```bash
   # 检查工作流审查报告
   ls .doc/workflow/reviews/*.md

   # 检查 Agent Teams 审查报告
   ls .doc/agent-teams/reviews/*.md

   # 检查 OpenSpec 审查报告
   ls .doc/spec/reviews/*.md
   ```

2. **分析审查状态**
   - 如果存在审查报告：读取最新报告，检查是否通过
   - 如果不存在审查报告：警告用户未进行审查

3. **用户确认**
   ```javascript
   mcp______zhi({
     message: `
       ## 📋 审查状态检测

       **检测结果**：
       - 工作流审查：${workflowReviewStatus}
       - Agent Teams 审查：${agentTeamsReviewStatus}
       - OpenSpec 审查：${openSpecReviewStatus}

       **建议**：${recommendation}

       **是否继续推送？**
     `,
     predefined_options: ["继续推送", "先进行审查", "跳过审查检测", "取消"]
   })
   ```

4. **处理用户选择**
   - **继续推送**：进入阶段 2
   - **先进行审查**：提示用户使用 `/ccg:review` 或其他审查命令
   - **跳过审查检测**：记录跳过原因，进入阶段 2
   - **取消**：终止推送流程

---

### 阶段 2: 本地提交检测与智能拆分

**目标**：检测未提交改动，智能分组并拆分提交

**步骤**：

#### 2.1 检测未提交改动

```bash
# 检测未提交改动
git status --porcelain

# 获取改动统计
git diff --stat
```

**处理逻辑**：
- 如果无改动：跳到阶段 3
- 如果有改动：继续 2.2

#### 2.2 智能分组

**分组算法**：

1. **按文件路径分组**
   ```javascript
   // 示例：按模块分组
   const groups = {
     'auth/login': ['src/auth/login.ts', 'tests/auth/login.spec.ts'],
     'auth/register': ['src/auth/register.ts', 'tests/auth/register.spec.ts'],
     'config': ['.env.example', 'config/auth.json']
   }
   ```

2. **使用 MCP 工具分析关联性**
   ```javascript
   // 调用 mcp__ace-tool__search_context 分析文件依赖
   const context = await mcp__ace-tool__search_context({
     project_root_path: process.cwd(),
     query: "分析这些文件的功能关联性"
   })
   ```

3. **生成分组建议**
   - 相同模块的文件归为一组
   - 测试文件跟随源文件
   - 配置文件单独分组

**特殊处理**：
- 改动文件 > 20 个：提示用户先手动整理
- 无法明确分组：提示用户手动指定

#### 2.3 展示拆分建议

```javascript
mcp______zhi({
  message: `
    ## 📦 智能提交拆分建议

    **检测到 ${totalFiles} 个改动文件，建议拆分为 ${groupCount} 个提交：**

    ### [提交 1] feat(auth): 实现用户登录功能
    - src/auth/login.ts (新增 120 行)
    - tests/auth/login.spec.ts (新增 80 行)

    ### [提交 2] feat(auth): 实现用户注册功能
    - src/auth/register.ts (新增 150 行)
    - tests/auth/register.spec.ts (新增 90 行)

    ### [提交 3] chore(config): 更新环境配置
    - .env.example (修改 5 行)
    - config/auth.json (新增 20 行)

    **请选择提交策略：**
  `,
  predefined_options: ["按建议拆分提交", "手动调整分组", "合并为单个提交", "取消"]
})
```

#### 2.4 执行拆分提交

**按建议拆分提交**：
```javascript
for (const group of groups) {
  // 调用 /ccg:commit 提交当前分组
  await Skill({
    skill: "ccg:commit",
    args: `--files ${group.files.join(' ')}`
  })

  // 确认提交信息
  await mcp______zhi({
    message: `
      ## ✅ 提交完成

      **提交信息**：${commitMessage}
      **改动文件**：${group.files.length} 个

      **是否继续下一个提交？**
    `,
    predefined_options: ["继续", "修改提交信息", "取消"]
  })
}
```

**手动调整分组**：
```javascript
// 允许用户重新分配文件到不同分组
await mcp______zhi({
  message: `
    ## 🔧 手动调整分组

    **当前分组**：
    ${displayGroups(groups)}

    **请输入调整指令**（如：将 file1.ts 移到分组 2）
  `,
  predefined_options: ["确认调整", "重置分组", "取消"]
})
```

**合并为单个提交**：
```javascript
// 警告用户不符合最佳实践
await mcp______zhi({
  message: `
    ## ⚠️ 合并提交警告

    **不推荐**：将多个功能的改动合并为单个提交不符合最佳实践。

    **建议**：拆分为多个提交，便于代码审查和版本回滚。

    **是否仍要合并提交？**
  `,
  predefined_options: ["仍要合并", "返回拆分", "取消"]
})

// 如果用户坚持合并，调用 /ccg:commit 一次性提交
await Skill({
  skill: "ccg:commit"
})
```

#### 2.5 Worktree 隔离检查

```bash
# 检测当前 worktree
git worktree list

# 确保提交仅影响当前 worktree
git status --porcelain
```

**处理逻辑**：
- 如果在主 worktree：正常提交
- 如果在子 worktree：确保不影响其他 worktree

---

### 阶段 3: 提交规范审查

**目标**：验证提交信息是否符合 Conventional Commits 规范

**步骤**：

1. **查询提交规范记忆**
   ```javascript
   const memory = await mcp______ji({
     action: "回忆",
     category: "rule",
     project_path: process.cwd()
   })
   ```

2. **读取提交规范配置**
   ```javascript
   const config = JSON.parse(
     fs.readFileSync('.ccg/commit-config.json', 'utf-8')
   )
   ```

3. **获取最新提交信息**
   ```bash
   # 获取最新 N 个提交（N = 阶段 2 提交的数量）
   git log -n ${commitCount} --pretty=format:"%s"
   ```

4. **验证提交规范**
   ```javascript
   // 验证格式：[emoji] <type>(<scope>): <subject>
   const commitRegex = /^\[.*\] (feat|fix|refactor|docs|style|perf|test|chore|ci|revert)\(.*\): .+$/

   for (const commit of commits) {
     if (!commitRegex.test(commit)) {
       violations.push({
         commit,
         reason: "不符合 Conventional Commits 规范"
       })
     }
   }
   ```

5. **展示验证结果**
   ```javascript
   await mcp______zhi({
     message: `
       ## 📝 提交规范审查

       **审查结果**：
       - 总提交数：${commits.length}
       - 通过：${passedCount}
       - 不通过：${failedCount}

       ${violations.length > 0 ? `
       **不符合规范的提交**：
       ${violations.map(v => `- ${v.commit}\n  原因：${v.reason}`).join('\n')}
       ` : ''}

       **是否继续推送？**
     `,
     predefined_options: violations.length > 0
       ? ["修复提交信息", "强制推送", "取消"]
       : ["继续推送", "取消"]
   })
   ```

6. **处理用户选择**
   - **修复提交信息**：使用 `git commit --amend` 修改提交信息
   - **强制推送**：记录强制推送原因，进入阶段 4
   - **继续推送**：进入阶段 4
   - **取消**：终止推送流程

---

### 阶段 4: 远程仓库检测

**目标**：检查远程仓库配置，未配置则引导用户设置

**步骤**：

1. **检查远程仓库配置**
   ```bash
   git remote -v
   ```

2. **处理检测结果**

   **情况 1：已配置远程仓库**
   ```javascript
   await mcp______zhi({
     message: `
       ## 🌐 远程仓库配置

       **检测结果**：已配置远程仓库

       **远程仓库**：
       - origin: ${remoteUrl}

       **当前分支**：${currentBranch}

       **是否推送到 origin/${currentBranch}？**
     `,
     predefined_options: ["确认推送", "更改远程仓库", "取消"]
   })
   ```

   **情况 2：未配置远程仓库**
   ```javascript
   await mcp______zhi({
     message: `
       ## ⚠️ 未配置远程仓库

       **检测结果**：当前仓库未配置远程仓库

       **请选择操作**：
     `,
     predefined_options: ["提供远程仓库地址", "新建 GitHub 仓库", "取消"]
   })
   ```

3. **处理用户选择**

   **提供远程仓库地址**：
   ```javascript
   await mcp______zhi({
     message: `
       ## 🔗 配置远程仓库

       **请输入远程仓库地址**（如：https://github.com/user/repo.git）
     `,
     predefined_options: ["确认配置", "取消"]
   })

   // 配置远程仓库
   await Bash({
     command: `git remote add origin ${remoteUrl}`,
     description: "配置远程仓库"
   })
   ```

   **新建 GitHub 仓库**：
   ```javascript
   // 调用 GitHub MCP 工具创建仓库
   const repo = await mcp__github__create_repository({
     name: repoName,
     description: repoDescription,
     private: isPrivate
   })

   // 配置远程仓库
   await Bash({
     command: `git remote add origin ${repo.clone_url}`,
     description: "配置远程仓库"
   })

   await mcp______zhi({
     message: `
       ## ✅ 仓库创建成功

       **仓库名称**：${repo.name}
       **仓库地址**：${repo.html_url}
       **克隆地址**：${repo.clone_url}

       **是否继续推送？**
     `,
     predefined_options: ["继续推送", "取消"]
   })
   ```

---

### 阶段 5: 执行推送

**目标**：推送到远程仓库，失败时提供诊断和修复建议

**步骤**：

1. **执行推送**
   ```bash
   git push origin ${currentBranch}
   ```

2. **处理推送结果**

   **成功**：
   ```javascript
   await mcp______zhi({
     message: `
       ## ✅ 推送成功

       **推送信息**：
       - 分支：${currentBranch}
       - 远程：origin
       - 提交数：${commitCount}

       **远程仓库**：${remoteUrl}

       **推送完成！**
     `,
     predefined_options: ["完成"]
   })
   ```

   **失败**：
   ```javascript
   // 分析错误原因
   const errorAnalysis = analyzeGitError(error)

   await mcp______zhi({
     message: `
       ## ❌ 推送失败

       **错误信息**：
       ${error.message}

       **可能原因**：
       ${errorAnalysis.reasons.map(r => `- ${r}`).join('\n')}

       **修复建议**：
       ${errorAnalysis.suggestions.map(s => `- ${s}`).join('\n')}

       **请选择操作**：
     `,
     predefined_options: ["重试推送", "强制推送", "查看详细错误", "取消"]
   })
   ```

3. **错误诊断和修复**

   **常见错误及修复建议**：

   | 错误类型 | 原因 | 修复建议 |
   |---------|------|---------|
   | `rejected` | 远程分支有新提交 | 先 `git pull --rebase`，再推送 |
   | `permission denied` | 无推送权限 | 检查 SSH 密钥或 HTTPS 凭据 |
   | `non-fast-forward` | 本地分支落后于远程 | 先 `git pull`，再推送 |
   | `no upstream branch` | 未设置上游分支 | 使用 `git push -u origin ${branch}` |

4. **强制推送警告**
   ```javascript
   await mcp______zhi({
     message: `
       ## ⚠️ 强制推送警告

       **警告**：强制推送会覆盖远程分支，可能导致其他人的提交丢失。

       **建议**：仅在以下情况使用强制推送：
       - 你是唯一的开发者
       - 你确认远程分支可以被覆盖
       - 你已与团队成员沟通

       **是否仍要强制推送？**
     `,
     predefined_options: ["仍要强制推送", "取消"]
   })

   // 如果用户确认，执行强制推送
   await Bash({
     command: `git push --force origin ${currentBranch}`,
     description: "强制推送到远程"
   })
   ```

---

## 关键规则

1. **审查前置**
   - 推送前必须完成审查（可选跳过，但需用户确认）
   - 检查 `.doc/workflow/reviews/`、`.doc/agent-teams/reviews/`、`.doc/spec/reviews/`

2. **智能拆分**
   - 自动识别不同功能的改动
   - 建议拆分为多个提交
   - 用户可选择合并或手动调整

3. **规范强制**
   - 所有提交必须符合 Conventional Commits 规范
   - 格式：`[emoji] <type>(<scope>): <subject>`
   - 不符合规范的提交将被拒绝推送

4. **用户确认**
   - 每个阶段都通过 `mcp______zhi` 确认
   - 关键决策点必须等待用户确认

5. **Worktree 隔离**
   - 支持多 worktree 场景
   - 确保提交仅影响当前 worktree

6. **错误恢复**
   - 推送失败时提供清晰的错误提示
   - 提供修复建议和重试选项

---

## 降级策略

| 工具不可用 | 降级方案 |
|-----------|---------|
| `mcp__ace-tool__search_context` | 使用 `mcp______sou` → Grep/Glob |
| `mcp______ji` | 读取 `.ccg/commit-config.json` |
| `mcp__github__create_repository` | 提示用户手动创建仓库 |
| `/ccg:commit` | 使用 `git commit` 直接提交 |

---

## 注意事项

1. **推送前必须完成审查**：默认检查审查报告，可选跳过但需用户确认
2. **多 worktree 支持**：自动检测当前 worktree，避免提交混淆
3. **提交拆分建议**：仅为建议，用户可选择合并或手动调整
4. **规范验证**：不符合规范的提交将被拒绝推送
5. **错误恢复**：推送失败时提供清晰的错误提示和修复建议
6. **强制推送警告**：强制推送前必须警告用户风险
