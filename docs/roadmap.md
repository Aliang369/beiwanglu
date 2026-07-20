# 路线图

本文档记录 `灵感笔记` 从前端原型走向可用桌面产品的建议路线。路线图不是承诺排期，而是帮助后续开发判断优先级。

## 当前阶段

当前项目处于：

```text
前端功能基座完成 + 桌面壳原型 + API 基建就绪待真实后端
```

已经具备：

- React 19 / Vite 8 / Tauri 2 / Zustand 5 / Tailwind 4 / TipTap 3 基础工程。
- 笔记 CRUD：创建 / 编辑 / 收藏 / 置顶 / 只读 / 封面 / 标签。
- 富文本编辑：TipTap 13 扩展（代码块 / 表格 / 任务列表 / 数学公式 / 图片 / YouTube 等）。
- 搜索系统：标题 / 正文 / 摘要 / 标签匹配 + 搜索历史（最近 8 条）+ 关键词高亮。
- 文件夹：一层子文件夹 + 创建 / 重命名 / 移动 / 删除 / 多选批量。
- 回收站：30 天保留 + 自动清理 + 恢复 + 永久删除 + 清空 + 二次确认。
- 版本历史：基于快照系统（每笔记最多 20 条 + 7 天 TTL）+ 预览 / 恢复。
- 导出能力：PNG 长图 / PDF / Word(.docx) 三格式。
- 账号体系：登录 / 注册 / 验证码登录 / 忘记密码 / 退出，JWT + Mock/Real 双模式。
- 消息中心：通知下拉 + 消息列表 + 详情弹窗 + 已读 / 未读管理。
- API 基建：HTTP 客户端 + 统一响应 + 4 个模块 API + Mock/Real 切换。
- `NotesRepository` 数据仓储抽象 + `setRepository()` 双仓储切换机制。
- Web 端 `localStorage` 持久化（v4 + 多 key 治理）。
- Tailwind 语义 token 和完整 UI 风格 + 卡片布局硬约束。
- 桌面壳可跑（Tauri 2）。

仍然缺少：

- 真实后端对接（当前所有 API 走 Mock）。
- 笔记从 localStorage 迁移到远端（`apiNotesRepository` 已实现但未注入业务流）。
- 自动化测试。
- Tauri 发布级配置（图标 / CSP / 签名 / 公证）。
- 任意深度文件夹嵌套（当前仅一层）。

## P0：稳定当前基座

目标：让当前原型更稳定、可维护、可交接。

建议事项：

- 确保 `npm run lint` 和 `npm run build` 稳定通过。
- 为 `src-tauri/target`、`dist`、`.trae/**` 等目录配置 lint 忽略。
- 补充基础测试框架，优先覆盖 shared 纯逻辑（`noteDomain.ts` / `noteSelectors.ts` / `folderDomain.ts`）。
- 评估 `.trae/skills/` 是否保留（不影响应用构建，但 lint 会扫描该目录）。

对应文档：

- `docs/feature-status.md`
- `docs/testing.md`
- `CONTRIBUTING.md`

## P1：真实后端对接

目标：把账号、消息、设置从 Mock 接通升级为真实后端对接。

建议事项：

- 后端实现 `/auth/*` 接口，符合 `docs/api-contract.md` 约定。
- 将 `VITE_API_MODE` 切换为 `real`，配置 `VITE_API_BASE_URL`。
- 验证登录 / 注册 / 验证码登录 / 忘记密码 / 退出真实流程。
- 实现短信 / 邮件真实验证码通道（替换 Mock 固定 123456）。
- 实现 `/messages/*` 和 `/user/*` 真实接口。
- 评估 Refresh Token / Cookie Session 策略。

涉及模块：

- `src/shared/api/*`
- `src/shared/store/authStore.ts` / `messagesStore.ts`
- `src/features/auth/*`
- `src/features/notes/components/SettingsView.tsx`

## P2：笔记云同步

目标：从单机本地笔记扩展到云端同步。

建议事项：

- 后端实现 `/notes/*` 和 `/folders/*` 接口。
- 在 `notesStore.setRepository()` 注入 `apiNotesRepository`（已实现，待注入）。
- 设计离线缓存策略（localStorage 作为缓存层）。
- 设计同步冲突解决方案。
- 评估是否需要端到端加密。
- 兼容已有 `localStorage` 数据迁移到云端。

涉及模块：

- `src/shared/data/apiNotesRepository.ts`
- `src/shared/store/notesStore.ts`
- `src/features/notes/notesStore.ts`（注入点）

注意：

云同步会显著改变数据模型。接入前建议先明确：

- 是否必须云同步。
- 是否需要端到端加密。
- 是否支持离线优先。
- 是否兼容已有 `localStorage` 数据迁移。

## P3：完善桌面端能力

目标：把 Tauri 从"桌面壳"升级为更完整的桌面应用。

建议事项：

- 引入 SQLite 或文件系统存储（实现 `sqliteNotesRepository.ts`）。
- 支持本地 Markdown / JSON 导入。
- 配置应用图标（`bundle.icon` 当前为空数组）。
- 配置 CSP（当前为 `null`）。
- 评估自动更新（Tauri updater plugin）。
- 评估系统托盘、菜单、快捷键。
- macOS 公证、Windows 签名、Linux 包格式。

涉及文档：

- `docs/tauri.md`
- `docs/data-model.md`
- `docs/architecture.md`

## P4：消息、通知和协作能力

目标：让消息中心从 mock UI 变成真实产品能力。

建议事项：

- 消息列表 API（真实后端）。
- 已读 / 未读状态持久化。
- 通知偏好设置保存。
- 桌面原生通知（Tauri notification plugin）。
- 系统通知权限处理。
- 如果引入协作：评论、分享、提醒等。

## P5：产品化和发布

目标：达到可分发桌面应用质量。

建议事项：

- 完整应用图标。
- 应用签名和平台发布配置。
- macOS 公证。
- Windows 安装包签名。
- Linux 包格式确认。
- 自动更新策略。
- 错误收集和日志策略。
- 隐私政策和用户协议。
- 离线字体资源（替代 Google Fonts CDN）。
- 可访问性检查。

## 技术债清单

- `src-tauri/tauri.conf.json` 中 `csp` 当前为 `null`。
- `tauri.conf.json` 中 bundle `icon` 当前为空数组。
- `sqliteNotesRepository.ts` 和 `mobileNotesRepository.ts` 只是类型占位。
- `apiNotesRepository.ts` 已实现但未注入业务流。
- 消息中心使用 mock 数据（未对接真实后端）。
- 账号流程使用 mock 数据（未对接真实后端）。
- 没有测试脚本（无 Vitest / Jest / Playwright）。
- 没有 CI。
- `.oxlintrc.json` 未忽略 `.trae/**`，lint 会扫描 AI skills 目录。
- 文件夹仅支持一层嵌套。

## 建议近期顺序

1. 让 `npm run lint` 稳定通过（含 `.trae/**` 忽略决策）。
2. 接入 Vitest，覆盖 shared 纯逻辑（`noteDomain` / `noteSelectors` / `folderDomain`）。
3. 真实后端实现 `/auth/*`，前端切换 `VITE_API_MODE=real`。
4. 真实后端实现 `/notes/*`，注入 `apiNotesRepository` 启用云同步。
5. 完善 Tauri 图标和 CSP。
6. 评估 SQLite 本地存储（替换 localStorage）。

## 文档同步规则

每完成一项路线图能力，至少检查：

- `README.md`
- `docs/feature-status.md`
- `docs/data-model.md`
- `docs/architecture.md`
- `docs/tauri.md`
- `docs/testing.md`
- Obsidian 知识库（`/Users/aliang/Documents/Obsidian Vault/beiwanglu/`）中相关笔记
