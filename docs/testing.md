# 测试策略

当前项目尚未配置单元测试、组件测试或端到端测试脚本。本文档记录推荐的测试分层和后续接入顺序。

## 当前可用检查

目前 `package.json` 中可用于质量检查的命令：

```bash
npm run lint
npm run build
```

含义：

- `npm run lint`：使用 Oxlint 检查代码。
- `npm run build`：执行 TypeScript build 和 Vite production build。

## 当前限制

- 没有 `npm test`。
- 没有 Vitest / Jest。
- 没有 React Testing Library。
- 没有 Playwright / Cypress。
- 没有覆盖率统计。
- 没有 CI 配置。

## 推荐测试分层

### 1. 纯逻辑单元测试

优先级最高，收益最大。

建议覆盖：

```text
src/shared/notes/noteDomain.ts
src/shared/notes/noteSelectors.ts
```

测试重点：

- `createExcerpt` 是否正确处理空白和长度。
- `sortNotesByUpdatedAt` 是否按更新时间倒序。
- `buildNewNote` 是否生成默认字段。
- `applyNotePatch` 是否更新摘要和更新时间。
- `getVisibleNotes` 是否正确处理视图、搜索、标签过滤。
- `getAllTags` 是否去重。
- `firstVisibleNoteId` 是否符合当前视图。

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

### 第一阶段

- 安装 Vitest。
- 新增 `npm test`。
- 覆盖 `noteDomain.ts` 和 `noteSelectors.ts`。

### 第二阶段

- 覆盖 `webNotesRepository.ts`。
- 覆盖 `createNotesStore` 的主要 action。

### 第三阶段

- 引入 React Testing Library。
- 覆盖关键组件空状态和交互。

### 第四阶段

- 引入 Playwright。
- 覆盖核心用户路径。
- 视情况接入 CI。

## 建议脚本

后续可考虑在 `package.json` 中增加：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "e2e": "playwright test"
  }
}
```

实际添加前需要安装对应依赖，并更新 README 与本文档。

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
