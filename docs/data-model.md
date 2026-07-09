# 数据模型与本地存储

本文档说明当前笔记数据结构、过滤状态、仓储接口和 Web 端 `localStorage` 存储机制。

## 当前数据源

当前 Web 端使用：

```text
src/shared/data/webNotesRepository.ts
```

数据存储在浏览器 `localStorage`：

```text
beiwanglu.notes.v1
```

首次启动或该 key 不存在时，会写入：

```text
src/shared/data/mockNotes.ts
```

中的示例笔记。

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
| `content` | `string` | 笔记正文。 |
| `excerpt` | `string` | 摘要，由正文生成，最长约 96 个字符。 |
| `tags` | `NoteTag[]` | 标签列表。 |
| `folderId` | `string \| null` | 所属文件夹 id。当前没有独立 Folder 持久化模型。 |
| `isFavorite` | `boolean` | 是否收藏。 |
| `isDeleted` | `boolean` | 是否在回收站。 |
| `deletedAt` | `string \| null` | 进入废纸篓的 ISO 时间；恢复后为 `null`。旧数据缺失时回退到 `updatedAt`。 |
| `createdAt` | `string` | ISO 格式创建时间。 |
| `updatedAt` | `string` | ISO 格式更新时间。 |

## NoteTag

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 标签唯一标识。 |
| `name` | `string` | 标签显示名称。 |
| `tone` | `'neutral' \| 'danger' \| 'primary'` | 可选视觉语义。 |

## NoteDraft

新建笔记使用的输入结构：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 初始标题。 |
| `content` | `string` | 初始正文。 |
| `tags` | `NoteTag[]` | 可选标签；未传时默认生成草稿标签。 |
| `folderId` | `string \| null` | 可选文件夹；当前创建逻辑默认使用 `inbox`。 |

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
- 正文
- 摘要
- 标签名称

## NotesRepository

接口位置：

```text
src/shared/data/notesRepository.ts
```

接口方法：

```ts
interface NotesRepository {
  list(): Promise<Note[]>
  create(draft: NoteDraft): Promise<Note>
  update(
    id: string,
    patch: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'folderId' | 'isFavorite' | 'isDeleted' | 'deletedAt'>>,
  ): Promise<Note>
  delete(id: string): Promise<void>
}
```

组件不应直接读写 `localStorage`，而应通过 store action 间接调用 repository。

## WebNotesRepository 行为

当前实现位置：

```text
src/shared/data/webNotesRepository.ts
```

行为说明：

1. `list()`：读取本地数据，并按 `updatedAt` 倒序排序。
2. `create()`：创建新笔记，写入本地存储。
3. `update()`：根据 id 更新笔记字段，重新生成摘要和更新时间。
4. `read()`：读取 `localStorage`，缺失或解析失败时回退 mock 数据。
5. `write()`：将完整笔记数组 JSON 序列化后写入 `localStorage`。

## 摘要生成

位置：

```text
src/shared/notes/noteDomain.ts
```

规则：

- 将连续空白字符合并为单个空格。
- 去除首尾空白。
- 截取前 96 个字符。

## 排序规则

笔记通过 `updatedAt` 倒序排序。更新时间越新，越靠前。

## 本地数据重置

在浏览器开发者工具控制台执行：

```js
localStorage.removeItem('beiwanglu.notes.v1')
```

刷新页面后会重新写入 mock 数据。

## 数据损坏回退

如果 `localStorage` 中的 JSON 无法解析，`WebNotesRepository` 会重新写入 mock 数据。这个行为适合开发阶段，但生产环境中可能需要更谨慎的迁移和备份策略。

## 废纸篓保留策略

- 保留天数：`30` 天（`TRASH_RETENTION_DAYS`）。
- 删除时写入 `deletedAt`；恢复时清空。
- 加载笔记列表时，会清理已到期（剩余天数 <= 0）的废纸篓笔记。
- UI 动态展示“N天后清除”；剩余天数 <= 3 天时用 error 语义高亮。
- 兼容旧数据：`isDeleted=true` 但没有 `deletedAt` 时，回退使用 `updatedAt`。

## 当前限制

- 没有数据版本号。
- 没有 schema migration。
- 没有独立 Folder 模型。
- 没有用户维度。
- 没有同步或冲突解决。
- 没有加密存储。
- SQLite 和移动端 repository 只是类型占位。

## 后续扩展建议

### 引入数据版本

建议将存储结构从数组升级为：

```ts
interface NotesStorageV2 {
  version: 2
  notes: Note[]
  folders: Folder[]
  updatedAt: string
}
```

### 引入 Folder 模型

建议新增：

```ts
interface Folder {
  id: string
  name: string
  icon?: string
  createdAt: string
  updatedAt: string
}
```

### 替换为 SQLite

如果桌面端需要更可靠的本地存储，可以实现：

```text
src/shared/data/sqliteNotesRepository.ts
```

并保持 `NotesRepository` 接口不变，使 UI 层无需调整。

### 接入远程 API

可以新增：

```text
src/shared/data/apiNotesRepository.ts
```

需要额外处理：

- 认证状态。
- 网络错误。
- 乐观更新。
- 离线缓存。
- 同步冲突。
