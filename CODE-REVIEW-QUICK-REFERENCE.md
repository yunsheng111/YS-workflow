# 代码审查 - 快速查阅表

## 问题清单（按优先级排序）

### 🔴 Critical Issues（2 个 - 需立即修复）

| ID | 文件 | 行号 | 问题 | 修复难度 | 风险 | 影响范围 |
|---|---|---|---|---|---|---|
| **C1** | `ccg-commit-interceptor.cjs` | 119-142 | 命令注入风险 - 未验证 `command` 参数 | 中 | 🔴 高 | 可执行任意代码 |
| **C2** | `ccg-commit-msg-generator.cjs` | 199-208 | 敏感文件名暴露 - 文件名直接拼接 | 易 | 🔴 中高 | 信息泄露 |

---

### 🟡 Major Issues（4 个 - 需近期修复）

| ID | 文件 | 行号 | 问题 | 修复难度 | 风险 | 影响范围 |
|---|---|---|---|---|---|---|
| **M1** | `ccg-commit-interceptor.cjs` | 88-114 | TOCTOU 竞态条件 - 临时文件读取 | 中 | 🟡 中 | 多进程环境失败 |
| **M2** | `install-git-hooks.cjs` + `prepare-commit-msg` | 29, 41 | 路径遍历漏洞 - 相对路径问题 | 中 | 🟡 中 | 符号链接环境失败 |
| **M3** | `ccg-commit-msg-generator.cjs` | 115-146 | Type 推断错误 - 混合改动处理不当 | 中 | 🟡 中 | 提交信息不准确 |
| **M4** | `ccg-commit-msg-generator.cjs` | 148-169 | Scope 推断不完整 - 只看第一个文件 | 中 | 🟡 中 | 多文件改动不准确 |

---

### 🟡 Minor Issues（3 个 - 建议优化）

| ID | 文件 | 行号 | 问题 | 优化难度 |
|---|---|---|---|---|
| **Mi1** | `ccg-commit-msg-generator.cjs` | 23-66 | 配置加载缺乏验证 | 易 |
| **Mi2** | 多文件 | 多处 | 错误处理不一致 | 易 |
| **Mi3** | 整体 | - | 缺少集成测试 | 中 |

---

## 各文件问题统计

### 按文件分布

```
ccg-commit-msg-generator.cjs      [ C1 ] [ M2 ] [ M3 ] [ Mi1 ] — 4 个问题
ccg-commit-interceptor.cjs        [ C1 ] [ M1 ] — 2 个问题
install-git-hooks.cjs             [ M2 ] — 1 个问题
prepare-commit-msg                [ M2 ] — 1 个问题
整体架构                          [ Mi3 ] — 1 个问题
```

### 按优先级分布

```
🔴 Critical  ██░░░░░░░░ 2 个（18%）
🟡 Major     ████░░░░░░ 4 个（36%）
🟡 Minor     ███░░░░░░░ 3 个（27%）
🟢 Info      ██░░░░░░░░ 2 个（19%）
             ─────────────
             合计 11 个问题
```

---

## 修复路线图

### Week 1：安全加固

```timeline
Day 1-2
  └─ C1: 修复命令注入风险
     └─ 验证 command 参数
     └─ 实施命令白名单
     └─ 测试 exploit cases

Day 3-4
  └─ C2: 修复敏感文件暴露
     └─ 集成 excludePatterns
     └─ 添加警告日志
     └─ 测试敏感文件检测

Day 5
  └─ 集成测试 + 部署前验证
```

### Week 2：功能修复

```timeline
Day 1-2
  └─ M1: 临时文件竞态条件
     └─ 使用 UUID 方案
     └─ 测试并发场景

Day 3
  └─ M2: 路径遍历漏洞
     └─ 改进路径计算
     └─ 符号链接验证

Day 4-5
  └─ M3 + M4: Type/Scope 推断改进
     └─ 分类统计算法
     └─ 多文件处理
     └─ 单元测试
```

### Week 3：可维护性提升

```timeline
Day 1-2
  └─ Mi1: 配置验证
  └─ Mi2: 错误处理统一

Day 3-5
  └─ Mi3: 集成测试框架
     └─ e2e 测试
     └─ 多场景覆盖
```

---

## 修复检查清单

### C1: 命令注入风险

- [ ] 实现命令参数验证函数
- [ ] 添加白名单验证
- [ ] 添加 2-3 个 exploit 测试用例
- [ ] 验证修复后仍支持正常 git commit
- [ ] 代码审查
- [ ] 文档更新

**预计时间**：30 分钟

---

### C2: 敏感文件暴露

- [ ] 从 config 读取 excludePatterns
- [ ] 在 generateSubject 中集成过滤
- [ ] 在 generateBody 中集成过滤
- [ ] 添加警告日志
- [ ] 测试敏感文件列表：`.env*`, `*.key`, `*.pem`, `secret`, `password`
- [ ] 代码审查

**预计时间**：20 分钟

---

### M1: TOCTOU 竞态条件

- [ ] 改用 UUID 生成唯一文件名
- [ ] 改进 try-catch 处理
- [ ] 模拟并发执行测试（10 个并发进程）
- [ ] 验证文件不残留
- [ ] 代码审查

**预计时间**：40 分钟

---

### M2: 路径遍历漏洞

- [ ] 改进 install-git-hooks.cjs 路径计算（使用 realpath）
- [ ] 改进 prepare-commit-msg 路径计算
- [ ] 添加符号链接跳出检测
- [ ] 在特殊目录结构下测试
- [ ] 代码审查

**预计时间**：35 分钟

---

### M3: Type 推断错误

- [ ] 实现分类统计算法
- [ ] 处理多类型优先级
- [ ] 测试混合改动场景（至少 5 种组合）
- [ ] 回归测试现有场景
- [ ] 代码审查

**预计时间**：45 分钟

---

### M4: Scope 推断不完整

- [ ] 收集所有文件的 scope
- [ ] 处理多 scope 冲突
- [ ] 添加警告日志
- [ ] 测试跨 scope 改动
- [ ] 代码审查

**预计时间**：35 分钟

---

### Mi1-Mi3: 可维护性改进

- [ ] 添加 JSDoc 注解（全文件）
- [ ] 统一错误处理格式
- [ ] 创建集成测试框架
- [ ] 编写 5-10 个 e2e 测试
- [ ] 自动化测试 CI 流程

**预计时间**：2-3 小时

---

## 测试用例参考

### 安全性测试

```javascript
// C1: 命令注入测试
test('应拒绝注入恶意命令', () => {
  const maliciousCommand = 'git commit; rm -rf /';
  assert.throws(() => {
    modifyCommand(maliciousCommand, 'test message');
  }, /不安全的 git 命令/);
});

test('应拒绝注入管道命令', () => {
  const piped = 'git commit | cat /etc/passwd';
  assert.throws(() => {
    modifyCommand(piped, 'test message');
  });
});

// C2: 敏感文件测试
test('应过滤敏感文件名', () => {
  const analysis = {
    files: [
      { status: 'M', path: '.env.production' },
      { status: 'M', path: 'src/index.js' }
    ],
    // ...
  };
  const config = { excludePatterns: ['.env*', '*.key'] };
  const subject = generateSubject(analysis, 'feat', '', config);
  assert(!subject.includes('.env'));
});
```

### 功能测试

```javascript
// M3: Type 推断混合改动
test('混合改动应推断主类型', () => {
  const analysis = {
    files: [
      { status: 'A', path: 'src/Component.tsx' },
      { status: 'A', path: 'src/Component.spec.tsx' },
    ]
  };
  const type = inferCommitType(analysis);
  assert.strictEqual(type, 'feat');  // 业务代码为主
});

// M4: Scope 推断多文件
test('多 scope 改动应警告', () => {
  const analysis = {
    files: [
      { path: 'src/components/Button.tsx' },
      { path: 'src/api/fetch.js' }
    ]
  };
  const config = { scopeMap: { 'src/components/': 'ui', 'src/api/': 'api' } };
  const scope = inferScope(analysis, config);
  // 应返回空字符串或 'chore'，并打印警告
  assert.strictEqual(scope, '');
});
```

---

## 回归测试清单

修复每个问题后，必须验证以下场景仍正常工作：

```markdown
### 基本功能
- [ ] 普通 `git commit` 自动生成信息
- [ ] 指定 `-m "message"` 跳过生成
- [ ] `--no-verify` 跳过 hook
- [ ] `--amend` 跳过生成
- [ ] `-F file` 使用指定文件

### Claude Code 集成
- [ ] PreToolUse hook 拦截并生成
- [ ] 修改后的命令正确执行
- [ ] 提交信息格式正确

### Type/Scope 推断
- [ ] 单文件 → 正确推断
- [ ] 多文件同类型 → 正确推断
- [ ] 混合类型 → 合理推断
- [ ] 跨 scope → 合理处理

### 配置自定义
- [ ] 自定义 scopeMap 生效
- [ ] 自定义 typeEmojis 生效
- [ ] 自定义 coAuthoredBy 生效
```

---

## 完成标准

修复被认为"完成"必须满足：

1. ✅ 代码改动通过审查
2. ✅ 单元测试全部通过（coverage > 90%）
3. ✅ 集成测试全部通过
4. ✅ 回归测试清单全部通过
5. ✅ 文档更新（注释 + GIT-HOOKS-GUIDE.md）
6. ✅ 无新增 warning（ESLint）

---

## 参考资源

- **完整审查报告**：`./CODE-REVIEW-REPORT.md`
- **原始脚本**：`./hooks/*.cjs`
- **配置文件**：`./.ccg/commit-config.json`
- **文档**：`./GIT-HOOKS-GUIDE.md`

---

**生成时间**：2026-02-15
**审查版本**：1.0
**下一版本**：1.1（修复完成后）
