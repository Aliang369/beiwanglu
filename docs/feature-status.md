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
| 全部笔记 | 可用 | 展示未删除笔记，置顶优先，按更新时间排序。 | `NotesHome.tsx`, `NoteList.tsx`, `noteSelectors.ts` |
| 创建笔记 | 可用 | 新建标题为"未命名笔记"的草稿，默认 `folderId` 为 `inbox`。 | `notesStore.ts`, `webNotesRepository.ts` |
| 编辑笔记 | 可用 | TipTap 富文本编辑，自动更新摘要和更新时间。 | `EditorView.tsx`, `EditorPanel.tsx`, `RichEditor.tsx`, `noteDomain.ts` |
| 富文本编辑 | 可用 | TipTap 13 扩展（代码块/表格/任务列表/数学公式/图片/YouTube 等）。 | `RichEditor.tsx`, `useNotesEditor.ts` |
| 搜索 | 可用 | 标题/正文/摘要/标签匹配，`Cmd/Ctrl+K` 聚焦。 | `NoteSearchInput.tsx`, `noteSelectors.ts` |
| 搜索历史 | 可用 | 最近 8 条，`localStorage` 持久化。 | `searchHistory.ts`, `NoteSearchInput.tsx` |
| 标签过滤 | 可用 | 按标签 id 过滤。 | `TagFilterBar.tsx`, `noteSelectors.ts` |
| 收藏 | 可用 | 收藏/取消收藏，收藏视图查看。 | `FavoritesView.tsx`, `notesStore.ts` |
| 置顶 | 可用 | `togglePinned`，置顶优先显示，列表 Pin 图标。 | `notesStore.ts`, `NoteListRow.tsx` |
| 只读模式 | 可用 | `toggleReadOnly`，锁定内容防止意外修改。 | `notesStore.ts`, `EditorInfoPanel.tsx` |
| 笔记封面 | 可用 | `cover` 字段，`CoverDialog` 选择封面。 | `CoverDialog.tsx`, `notesStore.ts` |
| 回收站 | 可用 | 移入/恢复/永久删除/清空，30 天保留 + 自动清理，剩余天数动态展示，最后 3 天高亮。 | `TrashView.tsx`, `TrashNoteCard.tsx`, `notesStore.ts`, `noteDomain.ts` |
| 文件夹浏览 | 可用 | 一层子文件夹混合展示。 | `FoldersView.tsx`, `notesStore.ts` |
| 自定义文件夹 | 可用 | 创建/重命名/移动/删除持久化到 localStorage v4。 | `CreateFolderDialog.tsx`, `RenameFolderDialog.tsx`, `webNotesRepository.ts` |
| 文件夹多选 | 可用 | 全选/移动/删除批量操作。 | `FoldersSelectionBar.tsx`, `useIdSelection.ts` |
| 版本历史 | 可用 | 基于快照系统，每笔记最多 20 条 + 7 天 TTL，预览/恢复。 | `EditorHistoryPanel.tsx`, `snapshotsRepository.ts`, `useNotesEditor.ts` |
| 导出 | 可用 | PNG 长图 / PDF / Word(.docx) 三格式。 | `EditorExportOverlay.tsx`, `noteExport.ts` |
| 消息中心 | 可用 | 未登录本地 Mock，登录后 `messagesApi`；下拉与中心共用 store。 | `messagesStore.ts`, `MessageCenterView.tsx` |
| 通知下拉 | 可用 | 与消息中心共用 `messagesStore`。 | `NotificationDropdown.tsx`, `Toolbar.tsx` |
| 消息详情 | 可用 | 打开自动标已读。 | `MessageDetailModal.tsx` |
| 登录 | 可用 | 密码登录走 Auth store + Mock/Real API。 | `LoginView.tsx`, `authStore.ts` |
| 注册 | 可用 | 注册后回登录页，不自动登录。 | `RegisterView.tsx`, `authApi.ts` |
| 验证码登录 | 可用 | 发码/登录接 API；Mock 验证码 `123456`。 | `CodeLoginView.tsx` |
| 忘记密码 | 可用 | 验证码重置密码流程。 | `ForgotPasswordView.tsx` |
| 退出登录 | 可用 | `logout` 清 token/user。 | `NotesHome.tsx`, `authStore.ts` |
| 设置页 | 部分可用 | 资料/改密接 `userApi`；登录活动等仍演示。 | `SettingsView.tsx` |
| 帮助页 | 原型 | 静态帮助内容。 | `HelpView.tsx` |
| 编辑器信息面板 | 部分可用 | 展示笔记信息 + 置顶/只读开关。 | `EditorInfoPanel.tsx` |
| Web 开发服务 | 可用 | Vite 固定端口 5173。 | `vite.config.ts` |
| Tauri 桌面壳 | 基础可用 | 桌面开发和打包基础壳。 | `src-tauri/tauri.conf.json`, `src-tauri/src/main.rs` |
| SQLite 数据源 | 占位 | 类型别名。 | `sqliteNotesRepository.ts` |
| 移动端数据源 | 占位 | 类型别名。 | `mobileNotesRepository.ts` |
| API 基建层 | 可用 | HTTP 客户端、统一响应、Mock/Real 切换、4 个模块 API 完整实现。 | `src/shared/api/*`, `docs/api-contract.md` |
| Auth store | 可用 | token/user 恢复；登录/注册/验证码/重置/退出已接通 UI。 | `authStore.ts`, `authApi.ts`, `features/auth/*` |
| 远程笔记 API | **已实现未接入** | `notesApi` + `apiNotesRepository` 完整实现，未注入业务流。 | `notesApi.ts`, `apiNotesRepository.ts` |

## 接入真实能力前的检查项

### 账号系统

全部已完成：

- 密码登录 / 注册 / 验证码登录 / 忘记密码 UI 流程。
- `authApi` 完整实现 Mock 与 Real 双模式。
- `useAuthStore` 持久化 `accessToken` / `user` 到 `localStorage`。
- 退出登录会清会话并关闭依赖登录的视图。
- 表单内错误提示与协议弹窗。

可选后续：

- Refresh Token 自动续期。
- 短信/邮件真实验证码（当前 Mock 固定 `123456`）。
- 隐私协议和服务条款实际内容。

### 消息系统

全部已完成：

- 未登录使用 guest Mock；登录后切换 `messagesApi`。
- 已读/未读状态、全部已读、消息详情获取。
- 通知设置读取与保存。
- 下拉与消息中心共用 `messagesStore`。

可选后续：

- 真实后端推送通道。
- 消息分类与筛选。

### 文件夹

全部已完成：

- 独立 `Folder` 模型 + `localStorage` v4 持久化。
- 创建 / 重命名 / 移动 / 删除完整持久化。
- 删除时子文件夹一并删除，笔记移入废纸篓。
- 仅支持一层子文件夹（`assertValidParentId` 等校验在 `folderDomain.ts`）。
- 多选批量移动/删除（`FoldersSelectionBar` + `useIdSelection`）。

可选后续：

- 任意深度嵌套。
- 拖拽排序。

### 回收站

全部已完成：

- 移入 / 恢复 / 永久删除 / 清空。
- 30 天保留 + 加载时自动清理到期笔记。
- 剩余天数动态展示；最后 3 天高亮提醒。

可选后续：

- 30 天到期前提醒。
- 批量恢复。

### 导出和历史

全部已完成：

- 导出 PNG 长图（html2canvas-pro）。
- 导出 PDF（jsPDF，A4 自动分页）。
- 导出 Word(.docx)（docx 库遍历 ProseMirror JSON）。
- 版本历史基于快照系统：每笔记最多 20 条 + 7 天 TTL，支持预览与恢复。

## 明确未做

以下能力当前没有实现，对应文件仅占位或仅 Mock：

- **真实后端对接**：账号、消息、笔记三套 API 都通过 `VITE_API_MODE=mock` 跑 Mock，未对接真实后端服务。
- **笔记从 localStorage 迁移到远端**：`apiNotesRepository` 已实现 8 个方法，登录后会被 `NotesHome` 自动启用，但本地→云端的数据迁移和同步未做，两套仓储数据隔离。
- **Refresh Token**：当前只保存 `accessToken`，过期后需要重新登录。
- **短信/邮件真实验证码**：Mock 模式固定返回 `123456`。
- **多端同步**：未做云端同步、冲突解决和离线缓存。
- **任意深度文件夹嵌套**：`folderDomain.ts` 强制一层子文件夹。
- **自动化测试**：仓库未引入测试框架，`shared/notes/` 纯逻辑和 repository 暂无单测覆盖。

## 文档维护规则

当功能状态变化时，应同步更新：

- `README.md` 的功能状态表。
- 本文档的状态表。
- 如涉及数据结构，更新 `docs/data-model.md`。
- 如涉及桌面端能力，更新 `docs/tauri.md`。
