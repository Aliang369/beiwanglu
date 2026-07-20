# 数据模型与本地存储

本文档说明当前笔记/文件夹/快照数据结构、过滤状态、仓储接口和 Web 端 `localStorage` 存储机制。

## 当前数据源

当前 Web 端使用：

```text
src/shared/data/webNotesRepository.ts
```

数据存储在浏览器 `localStorage`：

```text
beiwanglu.notes.v4（兼容迁移旧 key v1/v2/v3）
```

首次启动或该 key 不存在时，会写入：

```text
src/shared/data/mockNotes.ts
```

中的示例笔记。登录后由 `NotesHome` 调用 `notesStore.setRepository(apiNotesRepository)` 切换到远端仓储，与本地数据隔离。

## 本地存储 key 索引

应用在 `localStorage` 中使用以下 6 个 key：

| Key | 用途 | 写入方 | 数据形态 |
| --- | --- | --- | --- |
| `beiwanglu.notes.v4` | 笔记 + 文件夹主存储 | `webNotesRepository` | `{ version: 4, notes: Note[], folders: Folder[], updatedAt: string }` |
| `beiwanglu.notes.v1` | 兼容旧读取方的笔记数组镜像 | `webNotesRepository.write()` | `Note[]`（仅 notes 数组） |
| `beiwanglu.snapshots.v1` | 笔记版本快照 | `webSnapshotsRepository` | `{ version: 1, snapshots: Record<noteId, Snapshot[]> }` |
| `beiwanglu.searchHistory.v1` | 搜索关键词历史 | `searchHistory.ts` | `string[]`（最多 8 条） |
| `beiwanglu.auth.accessToken` | 登录态访问令牌 | `tokenStorage.ts` | `string` |
| `beiwanglu.auth.user` | 登录用户信息缓存 | `tokenStorage.ts` | `User` JSON 字符串 |

旧 key `beiwanglu.notes.v2` / `beiwanglu.notes.v3` 仅在 `migrateToV4()` 迁移时读取，不再写入。

## Note

定义位置：

```text
src/shared/types/note.ts
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 笔记唯一标识。Web 端新建时使用 `window.crypto.randomUUID()`。 |
| `title` | `string` | 笔记标题。 |
| `content` | `string` | 笔记正文。新笔记为 ProseMirror doc 的 JSON 字符串化结果（见 `noteDomain.EMPTY_DOC_JSON`）；历史纯文本/HTML 由 `RichEditor` 做 fallback 解析。 |
| `excerpt` | `string` | 摘要，由正文生成，最长 `EXCERPT_MAX_LENGTH = 480` 个字符。 |
| `tags` | `NoteTag[]` | note-scoped 标签列表（非全局标签表）。 |
| `folderId` | `string \| null` | 所属文件夹 id。 |
| `isFavorite` | `boolean` | 是否收藏。 |
| `isDeleted` | `boolean` | 是否在回收站。 |
| `deletedAt` | `string \| null` | 进入废纸篓的 ISO 时间；恢复后为 `null`。旧数据缺失时回退到 `updatedAt`。 |
| `cover` | `string \| null`（可选） | 封面图片 URL；`null`/`undefined` 表示无封面。空字符串视为无封面。 |
| `pinned` | `boolean`（可选） | 是否置顶（在列表顶部优先显示）。 |
| `readOnly` | `boolean`（可选） | 是否只读（锁定内容防止意外修改）。 |
| `createdAt` | `string` | ISO 格式创建时间。 |
| `updatedAt` | `string` | ISO 格式更新时间。 |

## NoteTag

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 标签唯一标识。 |
| `name` | `string` | 标签显示名称。 |
| `tone` | `'neutral' \| 'danger' \| 'primary'`（可选） | 视觉语义；当前 UI 统一默认色，不按 tone 分色。 |

## NoteDraft

新建笔记使用的输入结构：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 初始标题。 |
| `content` | `string` | 初始正文。 |
| `tags` | `NoteTag[]`（可选） | 可选标签；未传时默认空数组。 |
| `folderId` | `string \| null`（可选） | 可选文件夹；未传时默认 `null`。 |
| `cover` | `string \| null`（可选） | 可选封面 URL。 |

## Folder

定义位置：

```text
src/shared/types/folder.ts
```

```ts
interface Folder {
  id: string
  name: string
  icon: FolderIcon  // 'work' | 'study' | 'travel' | 'ideas' | 'recipes' | 'finance' | 'folder'
  parentId: string | null  // null = 根；非空时父级必须是根级（仅一层子文件夹）
  createdAt: string
  updatedAt: string
}
```

规则：

- `parentId === null` 表示根级文件夹；非空时父级必须存在且其 `parentId` 为 `null`（仅允许一层子文件夹）。
- 删除文件夹会一并删除其直接子文件夹，并将其中笔记移入废纸篓（`folderId` 置 `null`）。
- 同级不允许同名文件夹（`hasFolderNameConflict`）。

## FolderDraft

创建文件夹使用的输入结构：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 文件夹名称。 |
| `icon` | `FolderIcon`（可选） | 文件夹图标；未传时默认 `'folder'`。 |
| `parentId` | `string \| null`（可选） | 父文件夹 id；未传时默认 `null`（根级）。 |

## Snapshot

定义位置：

```text
src/shared/types/snapshot.ts
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 快照唯一标识，使用 `window.crypto.randomUUID()`。 |
| `noteId` | `string` | 所属笔记 id。 |
| `title` | `string` | 快照标题，用于面板展示（如"自动保存" / "恢复前自动保存"）。 |
| `noteTitle` | `string` | 快照时刻的笔记标题。 |
| `content` | `string` | 快照时刻的笔记内容（ProseMirror doc JSON 字符串）。 |
| `createdAt` | `string` | ISO 时间戳。 |

相关常量：

```ts
export const MAX_SNAPSHOTS_PER_NOTE = 20
export const SNAPSHOT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 天
```

## NotesView

当前视图类型：

```ts
'all' | 'favorites' | 'trash' | 'folders'
```

含义：

- `all`：全部未删除笔记。
- `favorites`：已收藏且未删除笔记。
- `trash`：已删除笔记。
- `folders`：有 `folderId` 且未删除的笔记。

## NotesFilter

过滤状态包含：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `view` | `NotesView` | 当前主视图。 |
| `query` | `string` | 搜索关键词。 |
| `tagId` | `string \| null` | 当前选中的标签。 |

过滤逻辑位于：

```text
src/shared/notes/noteSelectors.ts
```

搜索会匹配：

- 标题
- 正文（由 `extractTextFromNoteContent` 提取纯文本）
- 标签名称

匹配采用评分排序：标题命中权重最高，标签次之，正文最低；同分按置顶 + `updatedAt` 倒序。

## NotesRepository

接口位置：

```text
src/shared/data/notesRepository.ts
```

接口方法（共 8 个）：

```ts
interface NotesRepository {
  list(): Promise<Note[]>
  listFolders(): Promise<Folder[]>
  create(draft: NoteDraft): Promise<Note>
  createFolder(draft: FolderDraft): Promise<Folder>
  update(
    id: string,
    patch: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'folderId' | 'isFavorite' | 'isDeleted' | 'deletedAt' | 'cover' | 'pinned' | 'readOnly'>>,
  ): Promise<Note>
  updateFolder(id: string, patch: Partial<Pick<Folder, 'name' | 'icon' | 'parentId'>>): Promise<Folder>
  delete(id: string): Promise<void>
  deleteFolders(ids: string[]): Promise<void>
}
```

组件不应直接读写 `localStorage`，而应通过 store action 间接调用 repository。切换仓储时调用 `notesStore.setRepository()`，会重置状态并重新加载。

## WebNotesRepository 行为

当前实现位置：

```text
src/shared/data/webNotesRepository.ts
```

存储 key：

```text
主 key：beiwanglu.notes.v4
镜像 key：beiwanglu.notes.v1（仅 notes 数组，兼容旧读取方）
```

行为说明：

1. `list()`：读取本地数据，调用 `purgeAndPersist` 清理到期废纸篓笔记，再按 `updatedAt` 倒序排序。
2. `listFolders()`：读取本地文件夹数组。
3. `create()`：构建新笔记（`buildNewNote`），前置插入到 notes，写回 v4 + v1 镜像。
4. `createFolder()`：校验父级与同名冲突（`assertValidParentId` / `hasFolderNameConflict`），构建文件夹并写入。
5. `update()`：根据 id 找到笔记，调用 `applyNotePatch` 重新生成摘要与更新时间，写回。
6. `updateFolder()`：校验移动合法性与同名冲突，调用 `applyFolderPatch` 写回。
7. `delete()`：从 notes 中过滤掉目标 id 并写回。
8. `deleteFolders()`：批量删除文件夹；调用方（`notesStore`）负责把相关笔记移入废纸篓。

内部读取流程 `read()`：

1. 优先读取 `beiwanglu.notes.v4`，解析后调用 `normalizeNotes` + `normalizeFolders` + `sanitizeNoteFolderRefs`（修正失效 `folderId` 为 `null`）。
2. 若 v4 不存在或解析失败，进入 `migrateToV4()` 一次性迁移。

一次性迁移 `migrateToV4()`：

- 依次尝试读取 `beiwanglu.notes.v3` / `beiwanglu.notes.v2` / `beiwanglu.notes.v1` 旧 payload。
- 过滤掉 `LEGACY_SEED_FOLDER_IDS`（`inbox` / `work` / `study` / `personal` / `travel` / `ideas` / `recipes` / `finance`）这些历史默认/种子文件夹。
- 旧笔记的 `folderId` 若属于种子 id，置为 `null`。
- 调用 `sanitizeNoteFolderRefs` 修正失效引用。
- 写入 v4 主 key；后续不再做种子过滤。

写入流程 `write()`：

- 主数据写入 `beiwanglu.notes.v4`。
- 兼容性写入 `beiwanglu.notes.v1`（仅 notes 数组镜像），失败不影响主写入。

## 摘要生成

位置：

```text
src/shared/notes/noteDomain.ts
```

规则：

- 通过 `extractTextFromNoteContent` 提取纯文本：ProseMirror doc JSON 递归收集 text 节点，块级节点之间补换行；解析失败或非 doc 结构视为纯文本/HTML 原样返回。
- 将连续空白字符合并为单个空格。
- 去除首尾空白。
- 截取前 `EXCERPT_MAX_LENGTH = 480` 个字符。

## 排序规则

- 列表展示：`compareNotesPinnedFirst`，置顶笔记优先排在顶部，同级别按 `updatedAt` 倒序。
- 仓储原始顺序：`sortNotesByUpdatedAt`，仅按 `updatedAt` 倒序（不感知置顶）。
- 文件夹：`sortFoldersByName`，按 `name` 用 `zh-CN` locale 排序。

## 本地数据重置

在浏览器开发者工具控制台执行：

```js
localStorage.removeItem('beiwanglu.notes.v4')
localStorage.removeItem('beiwanglu.notes.v1')
```

刷新页面后会重新写入 mock 数据。如需同时清空快照、搜索历史和登录态：

```js
localStorage.removeItem('beiwanglu.snapshots.v1')
localStorage.removeItem('beiwanglu.searchHistory.v1')
localStorage.removeItem('beiwanglu.auth.accessToken')
localStorage.removeItem('beiwanglu.auth.user')
```

## 数据损坏回退

如果 `localStorage` 中的 JSON 无法解析，`WebNotesRepository` 会回退到迁移流程；若所有旧 key 都不存在或都解析失败，则使用 `mockNotes` 作为初始数据。这个行为适合开发阶段，但生产环境中可能需要更谨慎的迁移和备份策略。

## 废纸篓保留策略

- 保留天数：`30` 天（`TRASH_RETENTION_DAYS`）。
- 删除时写入 `deletedAt`；恢复时清空。
- 加载笔记列表时，`purgeExpiredTrashNotes` 会清理已到期（剩余天数 <= 0）的废纸篓笔记并持久化。
- UI 动态展示"N天后清除"；剩余天数 <= `TRASH_URGENT_DAYS`（3 天）时用 error 语义高亮。
- 兼容旧数据：`isDeleted=true` 但没有 `deletedAt` 时，回退使用 `updatedAt`。

## 快照系统

实现位置：

```text
src/shared/data/snapshotsRepository.ts
src/shared/types/snapshot.ts
```

存储 key：

```text
beiwanglu.snapshots.v1
```

存储结构：

```ts
interface SnapshotsStorage {
  version: 1
  snapshots: Record<string, Snapshot[]>  // noteId → 快照列表
}
```

行为说明：

- `listByNote(noteId)`：返回指定笔记的快照列表。
- `add(snapshot)`：追加快照，调用 `trim` 按双重策略清理。
- `setNoteSnapshots(noteId, snapshots)`：整体替换某笔记的快照（清理用）。
- `deleteByNote(noteId)`：删除某笔记的全部快照（笔记被永久删除时调用）。

双重保留策略 `trim`：

1. 时间上限：保留 `createdAt` 在 `SNAPSHOT_TTL_MS`（7 天）内的快照。
2. 数量上限：按 `createdAt` 倒序排序后取前 `MAX_SNAPSHOTS_PER_NOTE`（20）条。

编排逻辑在 `notesStore` 中：

- `createSnapshot(noteId, content, noteTitle, title)`：每次保存成功后调用，默认标题"自动保存"。
- `restoreSnapshot(noteId, snapshotId)`：先把当前内容存为"恢复前自动保存"快照，再用快照内容覆盖笔记。
- `loadSnapshots(noteId)`：加载到 state 供面板展示。
- `permanentlyDeleteNote`：删除笔记时同步清理快照。

TODO：后续迁移到 IndexedDB 或后端存储，当前先跑通流程使用 `localStorage`。

## 搜索历史

实现位置：

```text
src/shared/notes/searchHistory.ts
```

存储 key：

```text
beiwanglu.searchHistory.v1
```

常量：

```ts
export const SEARCH_HISTORY_LIMIT = 8
```

行为说明：

- `loadSearchHistory()`：读取并规范化（trim、去空、限 8 条）。
- `saveSearchHistory(items)`：写入时同样限 8 条。
- `pushSearchHistory(query, current?)`：把新查询前置，按小写去重，限 8 条。
- `removeSearchHistoryItem(query, current?)`：删除单条。
- `clearSearchHistory()`：清空 key。

## 鉴权存储

实现位置：

```text
src/shared/api/tokenStorage.ts
```

存储 key：

```text
beiwanglu.auth.accessToken  // 访问令牌
beiwanglu.auth.user         // User 对象 JSON 缓存
```

行为说明：

- `getAccessToken` / `setAccessToken` / `clearAccessToken`：读写访问令牌。
- `getCachedUserJson` / `setCachedUserJson` / `clearCachedUser`：读写用户信息缓存。
- `clearAuthStorage`：登出时一次性清空两个 key。

`useAuthStore.hydrate()` 在应用启动时从这两个 key 恢复登录态。当前没有 Refresh Token，令牌过期需重新登录。

## 当前限制

- 没有数据版本号字段（存储结构有 `version: 4`，但单条 Note/Folder 没有 schema 版本）。
- 没有 schema migration 框架（迁移逻辑写在 `WebNotesRepository` 内）。
- Folder 模型已落地，但仅支持一层子文件夹。
- 没有用户维度（本地数据无 user id 关联；登录后切换到 `apiNotesRepository`，两套数据隔离）。
- 没有同步或冲突解决。
- 没有加密存储。
- SQLite 和移动端 repository 只是类型别名占位。
- 快照存储使用 `localStorage`，未迁移到 IndexedDB 或后端。

## 后续扩展建议

### 引入数据版本

存储结构已经升级为：

```ts
interface NotesStorageV4 {
  version: 4
  notes: Note[]
  folders: Folder[]
  updatedAt: string
}
```

后续新增字段时建议保持 `version` 字段并在 `migrateToV4` 之外新增 `migrateToV5` 等函数，避免一次性迁移逻辑臃肿。

### Folder 模型（已落地）

定义位置：`src/shared/types/folder.ts`，规则如上"Folder"章节。当前限制是一层子文件夹，后续可放宽 `assertValidParentId` / `canMoveFolder` 等校验以支持任意深度嵌套。

### 替换为 SQLite

如果桌面端需要更可靠的本地存储，可以把：

```text
src/shared/data/sqliteNotesRepository.ts
```

从类型别名替换为真实实现，并保持 `NotesRepository` 接口不变，使 UI 层无需调整。注入方式参考 `NotesHome` 的 `setRepository()` 调用。

### 接入远程 API

`apiNotesRepository.ts` **已实现未接入**业务流：登录态下会被 `NotesHome` 自动启用，但本地→云端的数据迁移和同步未做。需要额外处理：

- 认证状态过期与刷新（Refresh Token）。
- 网络错误与重试。
- 乐观更新与回滚。
- 离线缓存与冲突解决。
- 本地到云端的一次性数据迁移。
