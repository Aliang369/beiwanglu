# 测试策略

本文档记录当前已落地的质量检查，以及后续测试分层与接入顺序。

## 当前可用检查

`package.json` 中可用于质量检查的命令：

```bash
npm run lint
npm test
npm run test:watch
npm run build
```

含义：

- `npm run lint`：使用 Oxlint 检查代码（已忽略 `dist/**`、`src-tauri/target/**`、`.trae/**`、`public/sql.js/**`）。
- `npm test`：Vitest 单次跑完（`vitest run`），覆盖 `src/shared/notes` 纯逻辑。
- `npm run test:watch`：Vitest 监听模式，本地开发时用。
- `npm run build`：执行 TypeScript build 和 Vite production build。

## 已落地的单元测试

工具：Vitest 4（与 Vite 8 对齐，配置在 `vite.config.ts` 的 `test` 字段）。

当前覆盖：

```text
src/shared/notes/noteDomain.test.ts
src/shared/notes/noteSelectors.test.ts
src/shared/notes/folderDomain.test.ts
```

测试重点（已实现）：

- `createExcerpt` / `buildNewNote` / `applyNotePatch` / 废纸篓天数与到期清理
- `parseSearchTerms` / `scoreNoteMatch` / `getVisibleNotes` / 标签聚合
- `assertValidParentId` / `canMoveFolder` / 同级重名 / 一层嵌套 normalize

## CI

GitHub Actions：`.github/workflows/ci.yml`

- 触发：`pull_request`，以及推送到 `main`
- 步骤：`npm ci` → `npm run lint` → `npm test` → `npm run build`

## 当前限制

- 没有 React Testing Library / 组件测试。
- 没有 Playwright / Cypress / E2E。
- 没有覆盖率统计脚本。
- Repository / Store 层单测尚未接入。

## 推荐测试分层

### 1. 纯逻辑单元测试

优先级最高，收益最大。

建议覆盖：

```text
src/shared/notes/noteDomain.ts
src/shared/notes/noteSelectors.ts
```

- `src/shared/notes/folderDomain.ts`（文件夹移动校验、重名检测、normalize）
- `src/shared/notes/searchHistory.ts`（搜索历史持久化、上限 8 条）

测试重点：

- `createExcerpt` 是否正确处理空白和长度。
- `sortNotesByUpdatedAt` 是否按更新时间倒序。
- `buildNewNote` 是否生成默认字段。
- `applyNotePatch` 是否更新摘要和更新时间。
- `getVisibleNotes` 是否正确处理视图、搜索、标签过滤。
- `getAllTags` 是否去重。
- `firstVisibleNoteId` 是否符合当前视图。
- `canMoveFolder` / `hasFolderNameConflict` / `assertValidParentId` 校验逻辑。
- `pushSearchHistory` 是否正确去重和限制条数。

推荐工具：

```text
Vitest
```

### 2. Repository 测试

建议覆盖：

```text
src/shared/data/webNotesRepository.ts
```

测试重点：

- 无本地数据时写入 mock。
- JSON 损坏时回退 mock。
- `create()` 正确写入新笔记。
- `update()` 正确更新字段。
- 找不到 note id 时抛错。
- `list()` 返回按更新时间排序的数据。

Repository 测试需要 mock `localStorage` 和 `crypto.randomUUID()`。

- `src/shared/data/snapshotsRepository.ts` 测试重点：
  - 双重保留策略（数量上限 20 + TTL 7 天）。
  - `add()` 自动 trim。
  - `deleteByNote()` 级联清理。
  - localStorage key `beiwanglu.snapshots.v1`。
- `src/shared/data/apiNotesRepository.ts` 测试重点（同步推拉通道，非登录硬切业务源）：
  - 8 方法（list / listFolders / create / createFolder / update / updateFolder / delete / deleteFolders）。
  - mock fetch 验证请求路径和 body。

### 6. 导出测试

建议覆盖：

```text
src/shared/notes/noteExport.ts
```

测试重点：

- `exportNoteToPng` 生成 PNG 文件。
- `exportNoteToPdf` 生成 PDF 文件。
- `exportNoteToDocx` 生成 Word 文件。
- `sanitizeFileName` 去除非法字符。
- ProseMirror doc JSON → docx 转换正确性。

导出测试可能需要 mock html2canvas-pro / jsPDF / docx 库。

### 3. Store 测试

建议覆盖：

```text
src/shared/store/notesStore.ts
```

测试重点：

- `loadNotes()` 加载并选择首个可见笔记。
- `createNote()` 新建后切回全部视图。
- `toggleFavorite()` 更新收藏状态。
- `moveToTrash()` 更新删除状态并处理选中项。
- `setView()` 切换视图并更新选中项。

Store 测试可以通过注入 fake repository 完成。

- `src/shared/store/authStore.ts` 测试重点：
  - `hydrate()` 从 localStorage 恢复 token/user。
  - `login()` / `register()` 流程；refresh 自动续期（httpClient）。
  - `logout()` 清理 token/user。
  - `setSession()` / `clearSession()` 状态切换。
- `src/shared/store/messagesStore.ts` 测试重点：
  - guest Mock 与登录后 messagesApi 切换。
  - 未读数计算。
  - 标已读。

### 4. 组件测试

适合在核心逻辑稳定后接入。

建议覆盖：

- `NoteList`
- `FavoritesView`
- `TrashView`
- `FoldersView`
- `EditorView`
- `AuthModal`

测试重点：

- 空状态是否正确显示。
- 点击主操作是否调用回调。
- 搜索和标签过滤状态是否正确传递。
- 弹窗开关是否正确。

推荐工具：

```text
React Testing Library
Vitest
```

### 5. E2E 测试

适合在功能从原型走向真实产品前接入。

建议覆盖用户路径：

1. 首次打开应用，看到 mock 笔记。
2. 创建一篇新笔记。
3. 编辑标题和正文。
4. 收藏笔记。
5. 搜索笔记。
6. 移入回收站。
7. 切换到回收站查看。
8. 打开消息中心。
9. 打开账号弹窗。

推荐工具：

```text
Playwright
```

如果要覆盖桌面窗口，可以再评估 Tauri/E2E 方案。

## 建议接入顺序

### 第一阶段（已完成）

- 安装 Vitest。
- 新增 `npm test` / `test:watch`。
- 覆盖 `noteDomain.ts`、`noteSelectors.ts`、`folderDomain.ts`。
- 接入 GitHub Actions（lint + test + build）。

### 第二阶段

- 覆盖 `webNotesRepository.ts`。
- 覆盖 `createNotesStore` 的主要 action。

### 第三阶段

- 引入 React Testing Library。
- 覆盖关键组件空状态和交互。

### 第四阶段

- 引入 Playwright。
- 覆盖核心用户路径。
- CI 已具备前端质量门禁，可再挂 E2E job。

## 脚本现状

已添加：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

后续可再考虑：

```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "e2e": "playwright test"
  }
}
```

## 测试数据建议

测试中不要直接复用完整 `mockNotes` 作为所有场景的数据。建议为不同测试构造小而明确的数据集，例如：

- 一个未删除普通笔记。
- 一个收藏笔记。
- 一个回收站笔记。
- 一个带多个标签的笔记。
- 一个不同 folderId 的笔记。

这样测试失败时更容易定位问题。

## 文档维护

一旦新增测试框架或命令，需要同步更新：

- `README.md` 的质量检查部分。
- `CONTRIBUTING.md` 的提交前检查。
- 本文档的“当前可用检查”和“建议脚本”。
