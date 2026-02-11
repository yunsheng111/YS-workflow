# Chrome DevTools MCP 完整说明文档

> 连接方式：`cmd /c npx -y chrome-devtools-mcp@latest`
> 工具总数：27 个（全部为 deferred tools，按需加载）
> 验证状态：27/27 全部通过端到端测试（2026-02-08）

---

## 1. 工具分类总览

| 分类 | 数量 | 工具列表 |
|------|------|---------|
| 页面管理 | 6 | new_page, close_page, select_page, list_pages, navigate_page, resize_page |
| 元素交互 | 8 | click, hover, drag, fill, fill_form, press_key, upload_file, handle_dialog |
| 页面检查 | 5 | take_screenshot, take_snapshot, evaluate_script, emulate, wait_for |
| 网络/控制台调试 | 4 | list_console_messages, get_console_message, list_network_requests, get_network_request |
| 性能分析 | 3 | performance_start_trace, performance_stop_trace, performance_analyze_insight |

---

## 2. 工具详细说明

### 2.1 页面管理（6 个）

#### `new_page`
- **功能**：创建新浏览器页面
- **参数**：`url`（必填）、`background`（后台打开）、`timeout`
- **使用代理**：test-agent
- **使用场景**：E2E 测试时打开新页面进行用户流程模拟

#### `close_page`
- **功能**：关闭指定页面（最后一个页面不可关闭）
- **参数**：`pageId`（必填，通过 list_pages 获取）
- **使用代理**：test-agent
- **使用场景**：E2E 测试完成后清理测试页面

#### `select_page`
- **功能**：选择页面作为后续工具调用的上下文
- **参数**：`pageId`（必填）、`bringToFront`
- **使用代理**：（通用，按需调用）
- **使用场景**：多标签页调试时切换目标页面

#### `list_pages`
- **功能**：列出浏览器中所有打开的页面
- **参数**：无
- **使用代理**：execute-agent、test-agent
- **使用命令**：workflow.md、test.md
- **使用场景**：
  - execute-agent：实施后查找目标页面
  - test-agent：E2E 可用性检测（调用成功则启用 E2E）
  - workflow.md/test.md：作为 DevTools 可用性探针

#### `navigate_page`
- **功能**：导航到 URL、前进/后退/刷新
- **参数**：`type`（url/back/forward/reload）、`url`（type=url 时必填）、`timeout`、`ignoreCache`、`initScript`、`handleBeforeUnload`
- **使用代理**：execute-agent、test-agent
- **使用命令**：frontend.md、workflow.md、test.md
- **使用场景**：
  - execute-agent：代码变更后刷新页面验证
  - test-agent：导航至测试入口
  - frontend.md：验证门控第 1 步

#### `resize_page`
- **功能**：调整页面视口尺寸
- **参数**：`width`（必填）、`height`（必填）
- **使用代理**：test-agent、ui-ux-designer
- **使用命令**：frontend.md、test.md
- **使用场景**：
  - 响应式断点测试：375px / 768px / 1440px / 1920px
  - E2E 测试前设置标准视口（1920x1080）

---

### 2.2 元素交互（8 个）

#### `click`
- **功能**：点击指定元素
- **参数**：`uid`（必填，来自 snapshot）、`dblClick`、`includeSnapshot`
- **使用代理**：test-agent、ui-ux-designer
- **使用命令**：test.md
- **使用场景**：
  - test-agent：模拟用户点击按钮/链接/菜单
  - ui-ux-designer：触发交互状态（模态框、下拉菜单），审查动态内容 A11y

#### `hover`
- **功能**：悬停在指定元素上
- **参数**：`uid`（必填）、`includeSnapshot`
- **使用代理**：test-agent、ui-ux-designer
- **使用场景**：
  - test-agent：触发悬停菜单/工具提示
  - ui-ux-designer：验证 Hover 样式和工具提示的可访问性

#### `drag`
- **功能**：拖拽元素到另一个元素
- **参数**：`from_uid`（必填）、`to_uid`（必填）、`includeSnapshot`
- **使用代理**：test-agent
- **使用场景**：测试拖拽排序、文件拖放等交互

#### `fill`
- **功能**：向输入框/文本域填入文本，或选择 `<select>` 选项
- **参数**：`uid`（必填）、`value`（必填）、`includeSnapshot`
- **使用代理**：test-agent
- **使用命令**：test.md
- **使用场景**：表单填写测试
- **兼容性备注**：对 combobox（autocomplete/haspopup）类型元素可能失败，此时用 `click` 聚焦 + `press_key` 逐键输入替代

#### `fill_form`
- **功能**：一次填写多个表单元素
- **参数**：`elements`（必填，uid+value 数组）、`includeSnapshot`
- **使用代理**：test-agent
- **使用场景**：批量表单填写（注册/登录/设置页面）

#### `press_key`
- **功能**：按键或组合键
- **参数**：`key`（必填，如 "Enter"、"Control+A"）、`includeSnapshot`
- **使用代理**：test-agent
- **使用命令**：test.md
- **使用场景**：
  - 键盘快捷键测试
  - combobox 类型元素的替代输入方式（配合 `click`）

#### `upload_file`
- **功能**：通过文件输入元素上传文件
- **参数**：`uid`（必填）、`filePath`（必填，本地路径）、`includeSnapshot`
- **使用代理**：test-agent
- **使用场景**：文件上传功能的 E2E 测试

#### `handle_dialog`
- **功能**：处理浏览器对话框（alert/confirm/prompt）
- **参数**：`action`（必填，accept/dismiss）、`promptText`
- **使用代理**：test-agent
- **使用场景**：测试确认对话框、提示输入框等原生浏览器弹窗

---

### 2.3 页面检查（5 个）

#### `take_screenshot`
- **功能**：截取页面或元素的截图
- **参数**：`format`（png/jpeg/webp）、`quality`（0-100）、`fullPage`、`uid`、`filePath`
- **使用代理**：execute-agent、review-agent、ui-ux-designer
- **使用命令**：frontend.md、workflow.md、test.md
- **使用场景**：
  - execute-agent：实施后截图确认页面渲染正常
  - review-agent：视觉回归截图
  - ui-ux-designer：设计还原度验证
  - 所有命令：验证门控的证据留存

#### `take_snapshot`
- **功能**：获取页面的 A11y 树文本快照（含元素 uid）
- **参数**：`verbose`（完整 A11y 树）、`filePath`
- **使用代理**：test-agent、review-agent、ui-ux-designer
- **使用命令**：frontend.md、workflow.md、test.md
- **使用场景**：
  - test-agent：E2E 操作后验证 DOM 结构
  - review-agent：A11y 树快照，验证语义化结构
  - ui-ux-designer：**核心工具** — 获取 A11y Tree 审查可访问性
  - 所有命令：结构验证

#### `evaluate_script`
- **功能**：在页面中执行 JavaScript 函数并返回 JSON 结果
- **参数**：`function`（必填，JS 函数声明）、`args`（可选，uid 引用的元素列表）
- **使用代理**：execute-agent、test-agent、ui-ux-designer
- **使用命令**：frontend.md、workflow.md
- **安全约束**（文档级，非工具级强制）：
  - 允许：`getComputedStyle`、`querySelector`、`document.title`、`innerText`、`matchMedia`
  - 禁止：修改 DOM/样式/存储、发起网络请求、访问敏感 API（`localStorage.clear()`、`document.cookie` 写入）
- **使用场景**：
  - execute-agent：验证关键 DOM 元素渲染状态
  - test-agent：自定义断言脚本
  - ui-ux-designer：获取计算样式验证设计还原度

#### `emulate`
- **功能**：模拟设备特性（视口、深色模式、网络、地理位置、CPU 节流）
- **参数**：`viewport`（width/height/deviceScaleFactor/hasTouch/isMobile/isLandscape）、`colorScheme`（dark/light/auto）、`networkConditions`、`geolocation`、`cpuThrottlingRate`、`userAgent`
- **使用代理**：ui-ux-designer
- **使用命令**：frontend.md
- **使用场景**：
  - 移动端模拟：375x812, 3xDPR, hasTouch: true
  - 深色模式验证
  - 弱网环境测试（Slow 3G/Fast 3G）

#### `wait_for`
- **功能**：等待页面中出现指定文本
- **参数**：`text`（必填）、`timeout`
- **使用代理**：test-agent
- **使用命令**：test.md
- **使用场景**：E2E 测试中确保关键元素/文本加载完毕后再继续操作

---

### 2.4 网络/控制台调试（4 个）

#### `list_console_messages`
- **功能**：列出当前页面自上次导航以来的所有控制台消息
- **参数**：`types`（过滤类型：log/error/warn 等）、`pageIdx`、`pageSize`、`includePreservedMessages`
- **使用代理**：execute-agent、review-agent
- **使用命令**：frontend.md、workflow.md
- **使用场景**：
  - execute-agent：实施后检查控制台是否有新增错误
  - review-agent：确保无残留错误/警告

#### `get_console_message`
- **功能**：按 ID 获取单条控制台消息的详细内容
- **参数**：`msgid`（必填）
- **使用代理**：（通用，按需调用）
- **使用场景**：深入分析特定控制台错误的详细信息

#### `list_network_requests`
- **功能**：列出当前页面的所有网络请求
- **参数**：`resourceTypes`（过滤：document/xhr/fetch 等）、`pageIdx`、`pageSize`、`includePreservedRequests`
- **使用代理**：（通用，按需调用）
- **使用场景**：分析页面加载的网络请求，排查 API 调用问题

#### `get_network_request`
- **功能**：获取单个网络请求的详细信息（请求/响应体）
- **参数**：`reqid`、`requestFilePath`、`responseFilePath`
- **使用代理**：（通用，按需调用）
- **使用场景**：分析特定 API 请求的请求体和响应体

---

### 2.5 性能分析（3 个）

#### `performance_start_trace`
- **功能**：启动性能追踪录制
- **参数**：`reload`（必填，是否自动重载页面）、`autoStop`（必填，是否自动停止）、`filePath`（保存原始 trace 数据）
- **使用代理**：review-agent
- **使用命令**：workflow.md
- **使用场景**：性能审查时启动 trace，获取 LCP/CLS/FID 等 Core Web Vitals

#### `performance_stop_trace`
- **功能**：停止性能追踪录制
- **参数**：`filePath`（保存 trace 数据）
- **使用代理**：review-agent
- **使用命令**：workflow.md
- **使用场景**：手动停止 trace（autoStop=false 时使用）

#### `performance_analyze_insight`
- **功能**：分析性能 trace 中的特定 Insight
- **参数**：`insightSetId`（必填）、`insightName`（必填，如 "LCPBreakdown"）
- **使用代理**：review-agent
- **使用场景**：深入分析 LCP 分解、资源加载延迟等性能问题

---

## 3. 角色分配矩阵

| 代理角色 | 核心职责 | 分配工具数 | 工具列表 |
|----------|---------|-----------|---------|
| **execute-agent**（Developer） | 实施后即时验证 | 5 | list_pages, navigate_page, evaluate_script, take_screenshot, list_console_messages |
| **test-agent**（Tester） | E2E 用户交互模拟 | 16 | new_page, navigate_page, resize_page, close_page, click, fill, fill_form, press_key, hover, drag, upload_file, wait_for, handle_dialog, take_snapshot, evaluate_script, take_screenshot |
| **review-agent**（Reviewer） | 视觉/A11y/性能门控 | 6 | take_screenshot, take_snapshot, list_console_messages, performance_start_trace, performance_stop_trace, performance_analyze_insight |
| **ui-ux-designer**（Designer） | 设计还原度与 A11y | 7 | take_snapshot, take_screenshot, resize_page, emulate, evaluate_script, click, hover |

### 命令层集成

| 命令 | 集成方式 | 引用工具数 |
|------|---------|-----------|
| **frontend.md** | 阶段 4（执行）+ 阶段 6（审查）验证门控 | 7 |
| **workflow.md** | 阶段 4 + 阶段 6 验证门控 | 8 |
| **test.md** | E2E 测试门控（阶段 4 后追加） | 9 |

---

## 4. 降级策略

### 统一三级降级定义

| 级别 | 触发条件 | 行为 | 证据产出 |
|------|---------|------|---------|
| **L1（部分受限）** | DevTools 可连接但部分工具失败 | 继续执行，使用可用工具 | 截图 + 控制台错误 + 基础性能指标 |
| **L2（完全不可用）** | DevTools 无法连接 | 跳过自动化验证，通过 `mcp______zhi` 生成手动验证清单 | 手动验证清单 |
| **L3（高风险阻断）** | 高风险 UI 变更且无 DevTools | 暂停执行，通过 `mcp______zhi` 要求用户确认 | 阻断提示 + 风险说明 |

### 各层级实现分布

- **代理层**（execute-agent, test-agent, review-agent, ui-ux-designer）：统一实现 **L2**
- **命令层**（frontend.md, workflow.md）：补充实现 **L1 + L3**
- **可用性探针**：`list_pages` 调用成功 → 启用 DevTools 功能

---

## 5. 安全约束

### evaluate_script 使用规范

| 类别 | 操作 | 允许/禁止 |
|------|------|----------|
| 只读查询 | `getComputedStyle`、`querySelector`、`document.title`、`innerText`、`matchMedia` | 允许 |
| DOM 修改 | `textContent = ...`、`innerHTML = ...`、`appendChild` | 禁止 |
| 样式修改 | `style.xxx = ...`、`classList.add/remove` | 禁止 |
| 存储操作 | `localStorage.clear()`、`document.cookie` 写入 | 禁止 |
| 网络请求 | `fetch()`、`XMLHttpRequest` | 禁止 |

> **注意**：安全约束为**文档级行为规范**，由代理自行遵循。工具本身不强制拦截，具备完整 JavaScript 执行能力。

---

## 6. 兼容性备注

| 工具 | 场景 | 问题 | 替代方案 |
|------|------|------|---------|
| `fill` | combobox（autocomplete/haspopup）类型元素 | 尝试匹配选项失败 | `click` 聚焦 + `press_key` 逐键输入 |
| `emulate` | 重置视口 | viewport 设为 null | 恢复默认视口 |
| `performance_start_trace` | autoStop=true + reload=true | 自动完成 trace 并返回结果 | 无需手动调用 stop_trace |

---

## 7. 典型使用流程

### Developer（实施验证）
```
list_pages → navigate_page(reload) → list_console_messages(types:["error"])
→ evaluate_script(验证 DOM) → take_screenshot(截图留证)
```

### Tester（E2E 测试）
```
new_page(url) → resize_page(1920x1080) → wait_for("关键文本")
→ click/fill/press_key(模拟交互) → take_snapshot(验证结构)
→ take_screenshot(截图留证) → close_page(清理)
```

### Reviewer（质量门控）
```
take_screenshot(视觉回归) → take_snapshot(A11y 审查)
→ list_console_messages(残留错误) → performance_start_trace(性能)
→ performance_analyze_insight(分析 LCP/CLS)
```

### Designer（设计验证）
```
resize_page(375) → emulate(mobile+dark+touch)
→ take_snapshot(A11y Tree) → click/hover(触发交互状态)
→ take_snapshot(动态 A11y) → evaluate_script(计算样式)
→ take_screenshot(移动端截图)
```
