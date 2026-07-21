# 架构说明

本文档说明 `灵感笔记` 的前端结构、状态流、数据仓储边界、富文本编辑器栈和 Tauri 桌面壳关系。

技术栈：React 19 + TypeScript 6 + Vite 8 + Tauri 2 + Zustand 5 + Tailwind 4 + TipTap 3。

## 总体结构

```text
index.html
└── src/main.tsx
    └── src/app/App.tsx
        ├── NotFoundView
        └── NotesHome
            ├── Sidebar
            ├── Toolbar（含 NoteSearchInput / NotificationDropdown）
            ├── NoteViewSwitcher
            ├── TagFilterBar
            ├── 视图区
            │   ├── NoteList / FavoritesView / FoldersView / TrashView
            │   ├── EditorView（含 EditorPanel / RichEditor / EditorToolbar 等）
            │   └── SettingsView / HelpView / MessageCenterView
            ├── AuthModal
            ├── MessageDetailModal
            ├── MoveToFolderDialog
            └── 悬浮创建按钮
```

应用没有引入路由库。`App.tsx` 只接受 `/` 和 `/index.html`，其他路径显示 `NotFoundView`。当前选中笔记通过 URL 查询参数 `?note=<id>` 维持，便于刷新恢复和浏览器后退。

## 应用入口

- `index.html`：挂载 `#root`，加载 `/src/main.tsx`。
- `src/main.tsx`：创建 React root，渲染 `App`，加载全局样式。
- `src/app/App.tsx`：进行极简路径判断，合法路径进入 `NotesHome`。
- `src/features/notes/NotesHome.tsx`：主应用编排层，负责切换笔记视图、工具视图、编辑视图、账号弹窗、消息详情弹窗和移动笔记弹窗；并在登录态变化时切换笔记数据仓储、加载消息。

## 页面编排

`NotesHome` 维护少量 UI 状态：

- `editingNoteId`：当前是否进入编辑器，同时同步到 URL `?note=<id>`。
- `utilityView`：`settings` / `help` / `messages` 等辅助视图。
- `authModal`：`login` / `register` / `code-login` / `forgot-password` 等账号弹窗模式。
- `settingsTab`：设置页默认标签。
- `selectedMessage`：当前打开的消息详情。
- `movingNoteId`：当前正在移动到其它文件夹的笔记。
- `previewingSnapshotId`：编辑器中正在预览的历史快照 id。

笔记数据、文件夹数据、过滤状态、快照缓存均来自 `useNotesStore`。登录态来自 `useAuthStore`，消息数据来自 `useMessagesStore`。

`NotesHome` 中有两个关键副作用：

- 启动 `initLocalBackend` 后注入本机仓储（SQLite 或 localStorage 回退）；登录且同步开启时跑同步引擎再 `loadNotes`。
- 登录态变化时调用 `loadMessages(isAuthenticated)` 切换 guest Mock / 远端 messagesApi。

## 状态流

```text
UI 组件
  ↓ 调用 action
useNotesStore
  ↓ 调用 repository
NotesRepository（接口）
  ↓ 未登录：WebNotesRepository
  ↓ 已登录：ApiNotesRepository
  ↓
localStorage: beiwanglu.notes.v4（兼容 v1/v2/v3 迁移链）
        或  notesApi → HTTP / Mock
```

核心文件：

- `src/features/notes/notesStore.ts`：把 `webNotesRepository` 注入 Zustand store 工厂（作为初始仓储）。
- `src/shared/store/notesStore.ts`：定义 `NotesState`、各 action 和 `setRepository` 仓储切换方法。
- `src/shared/data/notesRepository.ts`：定义数据仓储接口（8 个方法）。
- `src/shared/data/webNotesRepository.ts`：localStorage 实现（回退/兼容）。
- `src/shared/data/apiNotesRepository.ts`：远端实现（同步推拉通道）。

## 数据仓储边界

组件不应该直接操作 `localStorage`。新增数据能力时优先走：

```text
组件 → useNotesStore action → NotesRepository 实现
```

这样可以替换数据源而不影响 UI：

- SQLite：`src/shared/data/sqliteNotesRepository.ts`（类型别名占位）
- 移动端本地存储：`src/shared/data/mobileNotesRepository.ts`（类型别名占位）
- 远程 API：`src/shared/data/apiNotesRepository.ts`（同步引擎推拉）

## 双仓储切换说明

笔记数据流采用"本机优先（SQLite / localStorage 回退）+ 登录可选云同步"模式：

- 本机优先：`SqliteNotesRepository`（Web sql.js）；失败回退 `WebNotesRepository`（`beiwanglu.notes.v4`）。
- 登录后：`ApiNotesRepository` 调用 `notesApi`，由 `httpClient` 走真实 HTTP 或 Mock（取决于 `VITE_API_MODE`）。

切换由 `NotesHome` 中的副作用驱动：

```ts
useEffect(() => {
  // 本地优先：initLocalBackend 后注入 sqlite 或 web；登录同步走 sync 引擎
}, [isAuthenticated, setRepository])
```

`notesStore.setRepository()` 会重置 `notes / folders / selectedNoteId / snapshots` 等本地状态，然后立即调用 `loadNotes()` 重新拉取。本地优先：本机 SQLite（失败回退 localStorage）；登录且同步开启时 LWW 与云端合并。

注意：业务读写本机仓储；`apiNotesRepository` 供同步。本地 FastAPI 可与 `VITE_API_MODE=real` 联调。未完成/预留见 [`docs/未完成与预留功能清单.md`](./未完成与预留功能清单.md)。

## 领域逻辑边界

纯逻辑应放在 `src/shared/notes/`：

- `noteDomain.ts`：摘要生成、字数统计、新建笔记、应用 patch、废纸篓到期清理与剩余天数计算。
- `noteSelectors.ts`：搜索分词、笔记评分排序、可见笔记过滤、标签聚合、首个可见笔记、日期格式化。
- `folderDomain.ts`：文件夹的构建、补丁、规范化、一层嵌套校验、子树收集、移动合法性、同名冲突、根级列表、按名排序。
- `folderIcons.ts`：`FolderIcon` 枚举到 `lucide-react` 图标的映射。
- `noteExport.ts`：PNG 长图 / PDF / Word(.docx) 三种导出实现（html2canvas-pro + jsPDF + docx）。
- `searchHistory.ts`：搜索关键词历史读写，`SEARCH_HISTORY_LIMIT = 8`，`localStorage: beiwanglu.searchHistory.v1`。

组件层应尽量只负责展示和事件转发，避免重复实现筛选、排序、摘要生成、文件夹移动校验等规则。

## shared/notes/ 模块职责

| 文件 | 主要导出 | 职责 |
| --- | --- | --- |
| `noteDomain.ts` | `createExcerpt`、`buildNewNote`、`applyNotePatch`、`normalizeNote(s)`、`sortNotesByUpdatedAt`、`purgeExpiredTrashNotes`、`getTrashDaysRemaining`、`isTrashPurgeUrgent`、`formatTrashPurgeLabel`、`extractTextFromNoteContent`、`extractTextExcludeCode`、`countVisibleNoteChars`、`EMPTY_DOC_JSON`、`EXCERPT_MAX_LENGTH`、`TRASH_RETENTION_DAYS`、`TRASH_URGENT_DAYS`、`DEFAULT_COVER_URL` | 笔记纯逻辑与常量 |
| `noteSelectors.ts` | `getVisibleNotes`、`getAllTags`、`firstVisibleNoteId`、`parseSearchTerms`、`scoreNoteMatch`、`noteMatchesSearchTerms`、`formatUpdatedAt`、`formatClockTime`、`getNoteTagNames` | 视图过滤、搜索评分、日期格式化 |
| `folderDomain.ts` | `buildFolder`、`applyFolderPatch`、`normalizeFolder(s)`、`getChildFolders`、`getRootFolders`、`collectSubtreeIds`、`collectSubtreeIdsForMany`、`assertValidParentId`、`hasFolderNameConflict`、`canMoveFolder`、`canPlaceFoldersInParent`、`getValidMoveTargets`、`sortFoldersByName` | 文件夹结构与一层嵌套校验 |
| `folderIcons.ts` | `FOLDER_ICON_MAP`、`getFolderIcon` | 图标映射 |
| `noteExport.ts` | `exportNoteToPng`、`exportNoteToPdf`、`exportNoteToDocx` | 笔记导出 |
| `searchHistory.ts` | `loadSearchHistory`、`saveSearchHistory`、`pushSearchHistory`、`removeSearchHistoryItem`、`clearSearchHistory`、`SEARCH_HISTORY_LIMIT` | 搜索历史持久化 |

## 富文本编辑器栈

编辑器基于 TipTap 3（`@tiptap/react` + `@tiptap/starter-kit` 等），在 `src/features/notes/hooks/useNotesEditor.ts` 中组装。共启用 13 个扩展：

1. `StarterKit`（关闭 `codeBlock`，配置 `link`）
2. `CodeBlockLowlight`（基于 lowlight + common 语法）
3. `Image`（允许 base64）
4. `TableKit`（resizable 表格）
5. `TaskList`
6. `TaskItem`（嵌套）
7. `TextStyle`
8. `Color`
9. `Highlight`（multicolor）
10. `TextAlign`（heading / paragraph）
11. `Mathematics`（KaTeX 渲染）
12. `Youtube`（嵌入视频）
13. `Placeholder`

`note.content` 存储的是 `JSON.stringify(editor.getJSON())`，即 ProseMirror doc 的 JSON 字符串。新笔记使用 `noteDomain.EMPTY_DOC_JSON` 作为初始内容。历史纯文本/HTML 字符串在渲染时由 `parseContent` 做 fallback 解析。

`useNotesEditor` 还负责：

- 切换笔记时 `setContent` 重置（`emitUpdate:false` 避免回环）。
- 同笔记 `content` 外部变化时同步（如恢复历史版本），用 `skipRef` 计数器避免回环。
- 编辑时 debounce 400ms 调用 `onChange` 保存，并触发 `onSaved` 钩子（用于自动生成快照）。

## 快照系统

笔记版本快照由 `useNotesStore` 编排、`WebSnapshotsRepository` 持久化。每次保存成功后会写入一条"自动保存"快照；恢复历史时先把当前内容存为"恢复前自动保存"快照，再用快照内容覆盖笔记。每笔记最多保留 20 条且在 7 天 TTL 内。详细数据模型见 `docs/data-model.md` 的"快照系统"章节。

## 功能模块边界

```text
src/features/auth/      # 账号相关 UI（登录/注册/协议/输入框）
src/features/notes/     # 笔记主功能、页面编排、编辑器与全部组件
src/shared/api/         # 远程 API 客户端、Mock、token/user 存储（见 docs/api-contract.md）
src/shared/data/        # 本地数据接口和实现（笔记仓储 + 快照仓储）
src/shared/notes/       # 笔记/文件夹领域逻辑、导出、搜索历史
src/shared/store/       # Zustand store（notes + auth + messages，三个均已完整实现）
src/shared/types/       # 共享类型（note / folder / snapshot / message / auth / userProfile）
src/shared/ui/          # 跨 feature 共享 UI 原语（多选基建、悬浮菜单、搜索高亮）
src/styles/             # 全局样式
```

远程 API 与本地仓储边界：

- 本机笔记：`NotesRepository` → `sqliteNotesRepository` 或 `webNotesRepository`
- 云端同步：`notesApi` / `apiNotesRepository`（Mock/Real）经同步引擎 LWW
- 消息：`useMessagesStore`（guest Mock / 登录后 `messagesApi`）
- 鉴权：`useAuthStore` + `authApi`（Mock/Real）+ `tokenStorage`
- 后端对接基建：`src/shared/api/*` + `useAuthStore`（默认 Mock，可切 real）

## shared/ui/ 共享原语

`src/shared/ui/` 当前包含 7 个文件，提供跨 feature 复用的多选基建、悬浮菜单和搜索高亮能力：

| 文件 | 导出 | 职责 |
| --- | --- | --- |
| `index.ts` | 统一 barrel | 对外暴露共享原语 |
| `useIdSelection.ts` | `useIdSelection`、`IdSelection` | 多选 id 集合状态管理（全选/反选/单选） |
| `SelectionBar.tsx` | `SelectionBar`、`SelectionBarProps` | 多选模式下的批量操作工具条 |
| `SelectionCheckbox.tsx` | `SelectionCheckbox`、`SelectionTileIdle`、`SelectionCheckboxVariant` | 多选复选框与悬停态 |
| `handleSelectableActivate.ts` | `handleSelectableActivate` | 悬停激活多选的统一处理 |
| `HoverActionMenu.tsx` | `HoverActionMenu`、`HoverMenuItem` | 悬浮操作菜单 |
| `highlightSearchMatch.tsx` | `highlightSearchMatch` | 搜索结果高亮片段 |

`src/components/` 目录目前仅留 `.gitkeep` 占位。后续如果多个 feature 共享同一个组件，可以放入 `src/components/` 或 `src/shared/ui/`；只被笔记功能使用的组件应继续留在 `src/features/notes/components/`。

## 完整组件清单

`src/features/notes/components/` 下的组件按职责分组：

**导航与外壳**

- `Sidebar.tsx`：左侧导航栏，切换主视图与工具视图。
- `Toolbar.tsx`：顶部工具条，承载搜索、刷新、登录/资料/账号设置/退出/消息入口。
- `NoteSearchInput.tsx`：搜索输入框，含历史下拉与快捷键 `Cmd/Ctrl+K` 聚焦。
- `NotificationDropdown.tsx`：通知下拉，与消息中心共用 `messagesStore`。
- `NoteViewSwitcher.tsx`：视图切换胶囊。

**笔记列表**

- `NoteList.tsx`：全部笔记列表容器。
- `NoteListRow.tsx`：列表行，含置顶/收藏/移动等操作。
- `NoteCard.tsx`、`NoteCardShell.tsx`：笔记卡片与外壳。
- `EmptyState.tsx`：通用空状态。
- `FilteredEmptyState.tsx`：被搜索/标签过滤后无结果的空状态。
- `FirstRunGuide.tsx`：首次使用引导。

**收藏**

- `FavoritesView.tsx`：收藏视图。
- `FavoriteNoteCard.tsx`、`FavoriteNoteListItem.tsx`：收藏卡片与列表项。

**文件夹**

- `FoldersView.tsx`：文件夹浏览视图（一层子文件夹混合展示）。
- `FolderCard.tsx`、`FolderListItem.tsx`：文件夹卡片与列表项。
- `FoldersEmptyState.tsx`：文件夹空状态。
- `FoldersSelectionBar.tsx`：文件夹多选工具条（全选/移动/删除）。
- `CreateFolderDialog.tsx`：创建文件夹弹窗。
- `RenameFolderDialog.tsx`：重命名文件夹弹窗。
- `FolderNameDialog.tsx`：文件夹名称输入基础弹窗。
- `MoveFolderDialog.tsx`：移动文件夹弹窗。
- `MoveToFolderDialog.tsx`：将笔记移动到文件夹的弹窗。
- `DestinationPickerDialog.tsx`：通用目标选择器。
- `DashedCreate.tsx`：虚线创建占位卡。

**回收站**

- `TrashView.tsx`：回收站视图。
- `TrashNoteCard.tsx`、`TrashNoteListItem.tsx`：回收站卡片与列表项。
- `TrashNoteActions.tsx`：回收站单条操作。
- `TrashEmptyState.tsx`：回收站空状态。

**编辑器**

- `EditorView.tsx`：编辑器主视图，组合工具栏、面板、信息侧栏、移动菜单等。
- `EditorPanel.tsx`：编辑器内容面板。
- `EditorToolbar.tsx`：富文本工具栏。
- `EditorEmptyState.tsx`：编辑器空状态。
- `EditorMetaBar.tsx`：编辑器元信息侧条。
- `EditorInfoPanel.tsx`：笔记信息面板，含置顶/只读开关。
- `EditorActionMenu.tsx`：编辑器动作菜单。
- `EditorHistoryPanel.tsx`：版本历史面板，预览/恢复快照。
- `EditorExportOverlay.tsx`：导出预览覆盖层。
- `ImmersiveToolbar.tsx`：沉浸式工具栏。
- `InsertPopover.tsx`：插入弹层。
- `NoteTitleEditor.tsx`：标题编辑器。
- `RichEditor.tsx`：TipTap 富文本编辑器封装。
- `NoteEditorTags.tsx`：编辑器标签编辑。
- `TagChip.tsx`：标签胶囊。

**标签筛选**

- `TagFilterBar.tsx`：顶部标签筛选条。

**通用**

- `ConfirmDialog.tsx`：确认弹窗。
- `CoverDialog.tsx`：封面选择弹窗。

**消息**

- `MessageCenterView.tsx`：消息中心视图。
- `MessageDetailModal.tsx`：消息详情弹窗（打开时自动标已读）。

**工具视图**

- `SettingsView.tsx`：设置页（资料/安全/通知等）。
- `HelpView.tsx`：帮助页（静态内容）。

**账号（`src/features/auth/`）**

- `AuthModal.tsx`：账号弹窗外壳，切换登录/注册。
- `LoginView.tsx`、`RegisterView.tsx`：登录/注册表单。
- `AgreementModal.tsx`：协议弹窗。
- `AuthInput.tsx`：账号输入框。
- `authFormUtils.ts`：账号表单工具函数。

## Tauri 关系

Tauri 目前主要提供桌面壳能力：

- `src-tauri/tauri.conf.json`：窗口（1280×800，最小 1024×700）、开发地址 `http://localhost:5173`、构建命令、产物目录等配置。
- `src-tauri/src/main.rs`：Rust 入口，初始化 Tauri builder 和 `tauri_plugin_opener`。

Web 业务数据优先 sql.js SQLite，失败回退 localStorage；桌面原生 SQLite / Tauri command 尚未接入。

如果后续要实现桌面原生存储，建议路径是：

1. 在 Tauri/Rust 层实现命令或插件。
2. 在前端实现一个 `NotesRepository` 的真实实现（替换 `sqliteNotesRepository.ts` 类型别名）。
3. 在 `NotesHome` 切换仓储时注入该实现，或在 `notesStore` 工厂层做平台判定。
4. 保持 UI 组件不感知底层存储变化。

## 扩展建议

- 新增笔记字段：先更新 `src/shared/types/note.ts`，再更新 `noteDomain.ts`、`notesRepository.ts` 接口、各仓储实现和 `docs/data-model.md`。
- 新增数据源：实现 `NotesRepository` 接口（参考 `apiNotesRepository.ts`），通过 `notesStore.setRepository()` 注入；不要让组件直接依赖具体存储。
- 新增视图：优先在 `NotesHome` 中接入视图编排，再拆分 feature 组件。
- 新增复杂 UI：跨 feature 复用的组件放入 `src/shared/ui/`，同步维护 `docs/design-system.md`，避免样式分散。
- 新增测试：优先覆盖 `shared/notes/` 纯逻辑和 repository 实现。
