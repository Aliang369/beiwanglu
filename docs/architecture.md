# 架构说明

本文档说明 `灵感笔记` 的前端结构、状态流、数据仓储边界和 Tauri 桌面壳关系。

## 总体结构

```text
index.html
└── src/main.tsx
    └── src/app/App.tsx
        ├── NotFoundView
        └── NotesHome
            ├── Sidebar
            ├── Toolbar
            ├── NoteList / FavoritesView / FoldersView / TrashView
            ├── EditorView
            ├── SettingsView / HelpView / MessageCenterView
            ├── AuthModal
            └── MessageDetailModal
```

应用没有引入路由库。`App.tsx` 只接受 `/` 和 `/index.html`，其他路径显示 `NotFoundView`。

## 应用入口

- `index.html`：挂载 `#root`，加载 `/src/main.tsx`。
- `src/main.tsx`：创建 React root，渲染 `App`，加载全局样式。
- `src/app/App.tsx`：进行极简路径判断，合法路径进入 `NotesHome`。
- `src/features/notes/NotesHome.tsx`：主应用编排层，负责切换笔记视图、工具视图、编辑视图、账号弹窗和消息详情弹窗。

## 页面编排

`NotesHome` 维护少量 UI 状态：

- `editingNoteId`：当前是否进入编辑器。
- `utilityView`：设置、帮助、消息中心等辅助视图。
- `authModal`：登录、注册、验证码登录、忘记密码等账号弹窗。
- `settingsTab`：设置页默认标签。
- `selectedMessage`：当前打开的消息详情。

笔记数据和过滤状态来自 `useNotesStore`。

## 状态流

```text
UI 组件
  ↓ 调用 action
useNotesStore
  ↓ 调用 repository
NotesRepository
  ↓ 当前实现
WebNotesRepository
  ↓
localStorage: beiwanglu.notes.v1
```

核心文件：

- `src/features/notes/notesStore.ts`：把 `webNotesRepository` 注入 Zustand store 工厂。
- `src/shared/store/notesStore.ts`：定义 `NotesState` 和各类 action。
- `src/shared/data/notesRepository.ts`：定义数据仓储接口。
- `src/shared/data/webNotesRepository.ts`：当前 Web 端 `localStorage` 实现。

## 数据仓储边界

组件不应该直接操作 `localStorage`。新增数据能力时优先走：

```text
组件 → useNotesStore action → NotesRepository 实现
```

这样后续可以替换数据源：

- SQLite：`src/shared/data/sqliteNotesRepository.ts`
- 移动端本地存储：`src/shared/data/mobileNotesRepository.ts`
- 远程 API：可新增 `apiNotesRepository.ts`

目前 SQLite 和 Mobile 文件只是类型占位，还没有真实实现。

## 领域逻辑边界

纯逻辑应放在 `src/shared/notes/`：

- `noteDomain.ts`：摘要生成、排序、新建笔记、应用 patch。
- `noteSelectors.ts`：可见笔记过滤、标签聚合、首个可见笔记、日期格式化。

组件层应尽量只负责展示和事件转发，避免重复实现筛选、排序、摘要生成等规则。

## 功能模块边界

```text
src/features/auth/      # 账号相关 UI 原型
src/features/notes/     # 笔记主功能和页面编排
src/shared/data/        # 数据接口和实现
src/shared/notes/       # 笔记领域逻辑
src/shared/store/       # Zustand store 工厂
src/shared/types/       # 共享类型
src/styles/             # 全局样式
```

`src/components/` 和 `src/shared/ui/` 目前是占位目录。后续如果多个 feature 共享同一个组件，可以放入这些目录；只被笔记功能使用的组件应继续留在 `src/features/notes/components/`。

## Tauri 关系

Tauri 目前主要提供桌面壳能力：

- `src-tauri/tauri.conf.json`：窗口、开发地址、构建命令、产物目录等配置。
- `src-tauri/src/main.rs`：Rust 入口，初始化 Tauri builder 和 opener plugin。

当前业务数据仍由 Web 前端的 `localStorage` 管理，没有接入 Tauri command、SQLite 或文件系统 API。

如果后续要实现桌面原生存储，建议路径是：

1. 在 Tauri/Rust 层实现命令或插件。
2. 在前端新增一个实现 `NotesRepository` 的仓储。
3. 在 `src/features/notes/notesStore.ts` 中替换注入的数据仓储。
4. 保持 UI 组件不感知底层存储变化。

## 原型功能边界

以下模块当前更接近 UI 原型或 mock 数据能力：

- 账号登录/注册/验证码/忘记密码。
- 消息中心和通知设置。
- 设置页真实保存。
- 编辑器导出。
- 版本历史。
- 自定义文件夹独立持久化。

接入真实能力时，需要同步更新：

- `docs/feature-status.md`
- `docs/data-model.md`
- 相关 README 功能状态说明

## 扩展建议

- 新增笔记字段：先更新 `src/shared/types/note.ts`，再更新 domain、repository 和文档。
- 新增数据源：实现 `NotesRepository`，不要让组件直接依赖具体存储。
- 新增视图：优先在 `NotesHome` 中接入视图编排，再拆分 feature 组件。
- 新增复杂 UI：同步维护 `docs/design-system.md`，避免样式分散。
- 新增测试：优先覆盖 shared 纯逻辑和 repository。
