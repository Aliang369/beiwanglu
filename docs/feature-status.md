# 功能状态说明

本文档记录当前功能完成度，避免把前端原型、mock 数据和真实可用功能混在一起。

## 状态定义

- 可用：已有基本数据流和交互，可在当前应用中持续使用。
- 部分可用：核心界面或部分交互可用，但缺少关键能力。
- 原型：主要是 UI 和流程演示，尚未接入真实数据或业务逻辑。
- 占位：为后续扩展预留，目前没有实际功能。

## 功能状态表

| 功能 | 状态 | 说明 | 主要文件 |
| --- | --- | --- | --- |
| 全部笔记 | 可用 | 展示未删除笔记，按更新时间排序。 | `NotesHome.tsx`, `NoteList.tsx`, `noteSelectors.ts` |
| 创建笔记 | 可用 | 新建标题为“未命名笔记”的草稿，默认 folderId 为 `inbox`。 | `notesStore.ts`, `webNotesRepository.ts` |
| 编辑笔记 | 可用 | 支持标题和正文修改，自动更新摘要和更新时间。 | `EditorView.tsx`, `EditorPanel.tsx`, `noteDomain.ts` |
| 搜索 | 可用 | 按标题、正文、摘要和标签名称过滤。 | `Toolbar.tsx`, `noteSelectors.ts` |
| 标签过滤 | 可用 | 根据标签 id 过滤可见笔记。 | `TagFilterBar.tsx`, `noteSelectors.ts` |
| 收藏 | 可用 | 支持收藏/取消收藏并在收藏视图查看。 | `FavoritesView.tsx`, `notesStore.ts` |
| 回收站 | 部分可用 | 支持移入回收站和查看；恢复、永久删除、清空回收站尚未实现。 | `TrashView.tsx`, `notesStore.ts` |
| 文件夹浏览 | 部分可用 | 可根据笔记 `folderId` 聚合展示。 | `FoldersView.tsx` |
| 自定义文件夹 | 部分可用 | 有新建弹窗和运行时状态，但尚未形成独立持久化模型。 | `CreateFolderDialog.tsx`, `FoldersView.tsx` |
| 消息中心 | 原型 | 使用 mock 消息；已读状态、通知设置、后端同步待接入。 | `MessageCenterView.tsx`, `messageMockData.ts` |
| 通知下拉 | 原型 | 展示消息入口和列表预览，数据来自 mock。 | `NotificationDropdown.tsx` |
| 消息详情 | 原型 | 可打开消息详情弹窗，数据来自 mock。 | `MessageDetailModal.tsx` |
| 登录 | 原型 | 表单和流程存在，未接真实认证。 | `LoginView.tsx`, `AuthModal.tsx` |
| 注册 | 原型 | 表单和流程存在，未接真实注册接口。 | `RegisterView.tsx`, `AuthModal.tsx` |
| 验证码登录 | 原型 | 前端交互流程存在，未接短信/邮件验证码服务。 | `CodeLoginView.tsx` |
| 忘记密码 | 原型 | 前端界面存在，未接真实重置密码流程。 | `ForgotPasswordView.tsx` |
| 退出登录 | 原型 | 当前只是关闭账号状态，源码中保留 TODO。 | `NotesHome.tsx` |
| 设置页 | 原型 | 展示个人资料、安全设置等 UI，未持久化用户配置。 | `SettingsView.tsx` |
| 帮助页 | 原型 | 静态帮助内容。 | `HelpView.tsx` |
| 编辑器信息面板 | 原型/部分可用 | 可展示当前笔记信息，依赖已有 note 数据。 | `EditorInfoPanel.tsx` |
| 编辑器版本历史 | 原型 | 使用静态历史记录展示。 | `EditorHistoryPanel.tsx` |
| 编辑器导出 | 原型 | 有导出面板和按钮，尚未实现真实导出文件。 | `EditorExportOverlay.tsx` |
| Web 开发服务 | 可用 | Vite 固定端口 5173。 | `vite.config.ts` |
| Tauri 桌面壳 | 基础可用 | 可用于桌面开发和打包基础壳。 | `src-tauri/tauri.conf.json`, `src-tauri/src/main.rs` |
| SQLite 数据源 | 占位 | 目前只是类型别名，没有实现。 | `sqliteNotesRepository.ts` |
| 移动端数据源 | 占位 | 目前只是类型别名，没有实现。 | `mobileNotesRepository.ts` |

## 接入真实能力前的检查项

### 账号系统

需要补充：

- 认证 API 或本地认证方案。
- 登录态保存和恢复。
- 退出登录真实逻辑。
- 表单校验和错误提示。
- 隐私协议和服务条款实际内容。

### 消息系统

需要补充：

- 消息列表数据源。
- 已读/未读状态。
- 通知设置保存。
- 消息详情获取和错误处理。

### 文件夹

需要补充：

- 独立的 Folder 模型。
- 文件夹创建、重命名、删除持久化。
- 删除文件夹后的笔记归属策略。
- 默认文件夹和自定义文件夹的边界。

### 回收站

需要补充：

- 恢复笔记。
- 永久删除。
- 清空回收站。
- 删除确认。

### 导出和历史

需要补充：

- 导出格式定义。
- 文件保存方式，Web 与 Tauri 可能不同。
- 版本历史的数据模型。
- 历史版本恢复策略。

## 文档维护规则

当功能状态变化时，应同步更新：

- `README.md` 的功能状态表。
- 本文档的状态表。
- 如涉及数据结构，更新 `docs/data-model.md`。
- 如涉及桌面端能力，更新 `docs/tauri.md`。
