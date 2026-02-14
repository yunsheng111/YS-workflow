# Changelog - Git Hooks 安全加固版本

## [1.1.0] - 2026-01-10

### 🔒 Security（安全修复）

#### Critical 修复
- **修复命令注入漏洞** ([#C1](./SECURITY-FIXES-SUMMARY.md#c1-命令注入风险))
  - 添加 `validateCommand()` 函数验证 git commit 命令
  - 实现命令标志白名单机制
  - 拒绝包含管道、重定向、命令链接符的命令
  - 添加 `escapeFilePath()` 函数进行路径转义
  - **影响**：防止攻击者通过 git commit 命令注入恶意指令

- **修复敏感文件信息泄露** ([#C2](./SECURITY-FIXES-SUMMARY.md#c2-敏感文件信息泄露))
  - 添加 `isSensitiveFile()` 函数检测敏感文件
  - 支持通配符模式匹配（`.env*`, `*.key` 等）
  - 在提交信息中混淆敏感文件名为通用标记 `(敏感文件)`
  - 统计并显示敏感文件数量而非文件名
  - **影响**：防止敏感信息（密钥、密码等）被暴露在 Git 历史中

#### Major 修复
- **修复 TOCTOU 竞态条件** ([#M1](./SECURITY-FIXES-SUMMARY.md#m1-toctoutimeof-checktime-of-use竞态条件))
  - 添加 `generateUniqueTempFileName()` 使用加密随机数
  - 每次调用生成唯一的临时文件名
  - 使用 `crypto.randomBytes()` 生成 8 字节随机 ID
  - **影响**：防止多进程并发执行时临时文件冲突

- **修复路径遍历漏洞** ([#M2](./SECURITY-FIXES-SUMMARY.md#m2-路径遍历漏洞))
  - 添加 `validatePath()` 函数使用 `path.resolve()` 验证路径
  - 检查符号链接和相对路径
  - 确保所有路径都在预期的基目录下
  - **影响**：防止攻击者通过符号链接跳出项目目录

- **改进 Type 推断算法** ([#M3](./SECURITY-FIXES-SUMMARY.md#m3-type-推断错误混合改动时不准确))
  - 实现权重统计算法，分析所有文件而非仅第一个
  - 为不同类型赋予权重（test:10, docs:10, style:8, chore:5 等）
  - 统计权重后返回最高分的类型
  - **影响**：提高混合改动场景下类型推断的准确性

- **改进 Scope 推断算法** ([#M4](./SECURITY-FIXES-SUMMARY.md#m4-scope-推断不完整多scope-冲突时只选第一个))
  - 收集所有文件的 scope 而非仅第一个
  - 使用 Set 去重
  - 处理多 scope 冲突：查找公共前缀或按字母序返回
  - **影响**：跨 scope 改动时能正确识别所有受影响的模块

### 📝 Documentation

- 添加 [SECURITY-FIXES-SUMMARY.md](./SECURITY-FIXES-SUMMARY.md) 详细修复说明
- 更新 [GIT-HOOKS-GUIDE.md](./GIT-HOOKS-GUIDE.md) 安全性部分
- 添加代码注释说明安全修复逻辑

### 🧪 Testing

- 所有单元测试通过 (15/15) ✅
- 脚本语法验证通过 ✅
- 新增测试用例（在 ccg-commit-msg-generator.spec.cjs 中）
  - 敏感文件检测测试
  - 命令验证测试
  - 路径验证测试

### 🚀 Performance（性能）

- TOCTOU 修复通过唯一文件名避免文件锁竞争
- Scope/Type 推断改为一次遍历（避免多次扫描）

---

## [1.0.0] - 2026-01-09

### ✨ Features（初始功能）

- 双层 Hook 机制（Git Native Hook + Claude Code PreToolUse Hook）
- 智能提交信息生成引擎
  - Type 推断（feat, fix, docs, style, refactor, perf, test, chore, ci, revert）
  - Scope 推断（根据文件路径匹配）
  - Subject 生成（Conventional Commits 格式）
  - Body 生成（变更分类统计）
  - Footer 生成（Co-Authored-By 签名）
- Emoji 支持
- 敏感文件排除（基础）
- Hook 安装/卸载工具
- 15 个单元测试

### 📦 Files

- `hooks/ccg-commit-msg-generator.cjs` - 提交信息生成引擎
- `hooks/ccg-commit-interceptor.cjs` - Claude Code PreToolUse 拦截器
- `hooks/install-git-hooks.cjs` - Hook 安装工具
- `hooks/ccg-commit-msg-generator.spec.cjs` - 单元测试
- `prepare-commit-msg` - Git hook 入口脚本
- `.ccg/commit-config.json` - 配置文件
- `GIT-HOOKS-GUIDE.md` - 完整使用指南
- `package.json` - npm scripts（install-hooks, uninstall-hooks, verify-hooks）
- `settings.json` - Claude Code PreToolUse hook 配置

---

## Security Policy

本项目遵循以下安全政策：

1. **命令执行安全**：所有用户输入都经过白名单校验
2. **文件操作安全**：所有文件路径都经过遍历检查和符号链接验证
3. **临时文件安全**：使用加密随机数生成唯一的临时文件名，避免竞态条件
4. **信息安全**：敏感文件名在提交信息中被混淆显示
5. **定期审计**：计划每月进行代码安全审查

如发现安全漏洞，请立即通过以下方式报告：
- 查看 [SECURITY-FIXES-SUMMARY.md](./SECURITY-FIXES-SUMMARY.md) 了解已修复的漏洞
- 参考 [GIT-HOOKS-GUIDE.md](./GIT-HOOKS-GUIDE.md) 的故障排查部分

---

## 版本对比

| 版本 | Release Date | Critical Fixes | Major Fixes | Features | Status |
|------|--------------|----------------|-------------|----------|--------|
| 1.1.0 | 2026-01-10 | 2 | 4 | 0 | ✅ Latest |
| 1.0.0 | 2026-01-09 | 0 | 0 | 9 | ⭐ Initial |

---

## 升级指南

### 从 1.0.0 升级到 1.1.0

```bash
# 1. 更新脚本文件（自动，如果从 Git 拉取）
git pull origin main

# 2. 重新安装 hook（建议）
npm run install-hooks

# 3. 验证安装
npm run verify-hooks
```

### 兼容性

✅ 完全向后兼容。1.1.0 的 API 和配置格式与 1.0.0 相同。

---

## Known Issues

无已知问题。

---

## Future Roadmap

### v1.2.0（规划中）
- [ ] `commit-msg` hook 进行提交信息格式校验
- [ ] `.commitlintrc` 标准配置文件支持
- [ ] 更多敏感文件模式（用户自定义）

### v1.3.0（规划中）
- [ ] Git 日志分析学习项目历史提交风格
- [ ] 多语言提交信息支持

### v2.0.0（规划中）
- [ ] AI 集成生成更智能的提交信息
- [ ] 团队级别的提交规范配置
- [ ] Web UI 管理界面

---

**维护者**：Claude Code
**许可证**：MIT
**最后更新**：2026-01-10
