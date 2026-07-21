# 后端对接约定（API Contract）

本文档定义前端与后端的统一接口约定。前端以 `VITE_API_MODE=mock` 运行本地 Mock，或以 `VITE_API_MODE=real` 对接本地/部署中的后端（开发默认 `VITE_API_BASE_URL=http://localhost:3000/api/v1`）。

相关前端实现：

```text
src/shared/api/                 # HTTP 客户端、配置、模块 API、Mock
src/shared/store/authStore.ts   # 登录态骨架（token / user）
src/shared/types/auth.ts
src/shared/types/message.ts
src/shared/types/userProfile.ts
```

> 本地优先：业务读写本机仓储（Web 优先 SQLite/sql.js，失败回退 `webNotesRepository`）。`notesApi` / `apiNotesRepository` 供同步引擎 LWW 推拉云端。未完成项见 [`docs/未完成与预留功能清单.md`](./未完成与预留功能清单.md)。

---

## 1. 基础约定

### 1.1 Base URL

- 开发默认：`http://localhost:3000/api/v1`
- 环境变量：`VITE_API_BASE_URL`
- 路径均相对于 base，例如：`POST /auth/login` → `{BASE}/auth/login`

### 1.2 模式切换

| 变量 | 值 | 说明 |
| --- | --- | --- |
| `VITE_API_MODE` | `mock`（默认） | 走前端 Mock，不发真实 HTTP |
| `VITE_API_MODE` | `real` | 走 `fetch` 请求真实后端 |
| `VITE_API_BASE_URL` | URL | `real` 模式下的 API 根路径 |

参考文件：`.env`、`.env.example`

### 1.3 统一响应体

所有接口（含错误场景的业务错误）应返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | `number` | `0` 表示成功；非 `0` 为业务错误码 |
| `message` | `string` | 可读提示，可直接展示给用户 |
| `data` | `T \| null` | 业务数据；无数据时可为 `null` |

前端成功判定：

1. HTTP 状态为 2xx
2. 且 `code === 0`
3. 返回值取 `data`

### 1.4 HTTP 状态建议

| HTTP | 场景 |
| --- | --- |
| 200 | 成功（含查询/变更） |
| 201 | 可选：创建资源成功（仍须 `code === 0`） |
| 400 | 参数错误（也可 200 + 业务 code） |
| 401 | 未登录 / token 无效或过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

前端对 **HTTP 401** 与 **业务 code 401** 均视为未授权（`ApiError.kind = 'unauthorized'`）。

### 1.5 鉴权

- 协议：**JWT Bearer Token**
- 登录类接口返回：

```ts
interface AuthSession {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number // 秒
  user: User
}
```

- 需登录接口请求头：

```http
Authorization: Bearer <accessToken>
```

- 前端存储：`localStorage`
  - `beiwanglu.auth.accessToken`
  - `beiwanglu.auth.user`（用户信息缓存 JSON）

- 本期不做 Refresh Token；token 失效后由客户端清理会话并引导重新登录（UI 接入阶段实现）。

### 1.6 时间与 ID

- 时间字段统一 **ISO 8601** 字符串，如 `2026-07-13T08:00:00.000Z`
- 资源 `id` 为字符串；后端可用 UUID 或雪花等，前端不假设格式

### 1.7 业务错误码（建议）

| code | 含义 |
| --- | --- |
| `0` | 成功 |
| `40001` | 参数缺失/不合法 |
| `40002` | 密码不符合规则 |
| `40003` | 业务约束冲突（如新旧密码相同） |
| `40101` | 账号或密码错误 |
| `401` | 未授权（也可仅用 HTTP 401） |
| `40401` | 资源不存在 |
| `50000` | 服务端未知错误 |

后端可扩展，但应保持 `code + message` 可解析。

---

## 2. 账号认证 `/auth`

### 2.1 密码登录

`POST /auth/login`（无需 token）

请求：

```json
{
  "account": "demo@example.com",
  "password": "123456"
}
```

响应 `data`：`AuthSession`

Mock：任意账号 + 密码 `123456` 成功。

### 2.2 注册

`POST /auth/register`（无需 token）

请求：

```json
{
  "account": "newuser",
  "password": "123456",
  "name": "可选昵称"
}
```

响应 `data`：`AuthSession`

### 2.5 重置密码

`POST /auth/reset-password`（无需 token）

请求：

```json
{
  "account": "demo@example.com",
  "code": "123456",
  "newPassword": "654321"
}
```

响应 `data`：

```json
{ "success": true }
```

### 2.6 当前用户

`GET /auth/me`（需要 token）

响应 `data`：`User`

```ts
interface User {
  id: string
  account: string
  name: string
  bio: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}
```

### 2.7 退出登录

`POST /auth/logout`（需要 token）

响应 `data`：

```json
{ "success": true }
```

服务端可使 token 失效；前端无论远端是否成功，本地都会清会话。

---

## 3. 用户资料与安全 `/user`

### 3.1 获取资料

`GET /user/profile`（需要 token）

响应 `data`：`UserProfile`（字段同 `User`）

### 3.2 更新资料

`PATCH /user/profile`（需要 token）

请求（均可选）：

```json
{
  "name": "新昵称",
  "bio": "简介",
  "avatarUrl": "https://..."
}
```

响应 `data`：更新后的 `UserProfile`

### 3.3 修改密码

`POST /user/change-password`（需要 token）

请求：

```json
{
  "currentPassword": "123456",
  "newPassword": "654321"
}
```

响应 `data`：`{ "success": true }`

---

## 4. 消息与通知 `/messages` `/notifications`

### 4.1 消息列表

`GET /messages`（需要 token）

响应 `data`：

```ts
interface MessageListResult {
  items: MessageItem[]
  unreadCount: number
}

interface MessageItem {
  id: string
  title: string
  summary: string
  content: string[]
  time: string          // 展示用相对/格式化文案（后端也可只给 createdAt，由前端格式化）
  createdAt: string
  type: 'system' | 'comment' | 'reminder' | 'update'
  category: 'system' | 'security' | 'content'
  source: string
  tag: string
  unread: boolean
  primaryAction?: string
  secondaryAction?: string
}
```

### 4.2 消息详情

`GET /messages/:id`（需要 token）

响应 `data`：`MessageItem`

### 4.3 标记已读

`POST /messages/:id/read`（需要 token）

响应 `data`：更新后的 `MessageItem`

### 4.4 全部已读

`POST /messages/read-all`（需要 token）

响应 `data`：

```json
{ "success": true, "unreadCount": 0 }
```

### 4.5 通知设置

`GET /notifications/settings`（需要 token）

`PATCH /notifications/settings`（需要 token）

请求/响应 `data`：

```ts
interface NotificationSettings {
  systemEnabled: boolean
  securityEnabled: boolean
  contentEnabled: boolean
}
```

`PATCH` 支持部分字段更新。

---

## 5. 笔记与文件夹 `/notes` `/folders`

> 同步引擎经 `notesApi`（或兼容层 `apiNotesRepository`）调用下列接口；业务 UI 读写本机仓储。字段模型需与后端保持一致。创建草稿可带可选客户端 `id` 以保留本地主键。

### 5.1 笔记

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/notes` | 列表 |
| GET | `/notes/:id` | 详情 |
| POST | `/notes` | 创建 |
| PATCH | `/notes/:id` | 更新 |
| DELETE | `/notes/:id` | 永久删除 |

创建请求 `NoteDraft`：

```ts
{
  title: string
  content: string
  tags?: NoteTag[]
  folderId?: string | null
  cover?: string | null
}
```

`Note` 字段与前端 [`src/shared/types/note.ts`](../src/shared/types/note.ts) 对齐，关键字段：

- `id`, `title`, `content`, `excerpt`, `tags[]`
- `folderId`, `isFavorite`, `isDeleted`, `deletedAt`
- `cover`, `pinned`, `readOnly`
- `createdAt`, `updatedAt`

更新 `PATCH` 支持部分字段（含收藏、回收站、封面、置顶、只读等）。

### 5.2 文件夹

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/folders` | 列表 |
| POST | `/folders` | 创建 |
| PATCH | `/folders/:id` | 更新 |
| POST | `/folders/delete` | 批量删除 |

创建请求：

```json
{
  "name": "工作",
  "icon": "work",
  "parentId": null
}
```

`Folder.icon`：`work | study | travel | ideas | recipes | finance | folder`

批量删除请求：

```json
{ "ids": ["folder_1", "folder_2"] }
```

字段对齐 [`src/shared/types/folder.ts`](../src/shared/types/folder.ts)。业务规则提示：

- 无默认文件夹；笔记可 `folderId=null`（未分类）
- 删除文件夹后，夹内笔记改为未分类（不进废纸篓）
- 当前产品仅支持一层子文件夹（`parentId` 指向根级）
- 历史 `is_inbox` 仅用于登录时清理存量 inbox

---

## 5.3 快照 `/snapshots`

> 笔记版本历史快照。前端 `SnapshotsRepository`：本机 SQLite 或 localStorage 实现；云端经 `snapshotsApi` / `ApiSnapshotsRepository` 由同步引擎推拉。

### 5.3.1 列表

`GET /snapshots?noteId=<id>`（需要 token）

响应 `data`：

```ts
interface SnapshotListResult {
  items: Snapshot[]
}
```

```ts
interface Snapshot {
  id: string
  noteId: string
  title: string           // 快照类型文案，如 "自动保存" / "恢复前自动保存"
  noteTitle: string       // 快照时刻的笔记标题
  content: string         // ProseMirror doc JSON 字符串
  createdAt: string       // ISO 时间戳
}
```

返回顺序：按 `createdAt` 倒序。

权限校验：`noteId` 对应的笔记必须属于当前用户，否则 403。

### 5.3.2 创建

`POST /snapshots`（需要 token）

请求：

```json
{
  "noteId": "note_xxx",
  "title": "自动保存",
  "noteTitle": "我的笔记",
  "content": "{\"type\":\"doc\",...}"
}
```

响应 `data`：创建后的 `Snapshot`（含服务端生成的 `id` 与 `createdAt`）

后端必须实现双重保留策略（参考前端 `[[快照双重保留策略决策]]`）：

1. **时间上限**：保留 `createdAt` 在 7 天内（`SNAPSHOT_TTL_MS = 7 * 24 * 60 * 60 * 1000`）的快照
2. **数量上限**：按 `createdAt` 倒序取前 20 条（`MAX_SNAPSHOTS_PER_NOTE = 20`）

两条策略同时应用，取交集。每次 `POST` 后自动清理超限的旧快照。

### 5.3.3 删除单条

`DELETE /snapshots/:id`（需要 token）

响应 `data`：

```json
{ "success": true }
```

权限校验：快照必须属于当前用户（通过 `noteId` → `note.user_id` 链路）。

### 5.3.4 清理某笔记全部快照

`DELETE /snapshots?noteId=<id>`（需要 token）

响应 `data`：

```json
{ "success": true, "deletedCount": 5 }
```

使用场景：笔记被永久删除时级联调用，清理其全部快照。

### 5.3.5 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 快照唯一标识，后端生成（UUID） |
| `noteId` | `string` | 所属笔记 id |
| `title` | `string` | 快照类型文案："自动保存" / "恢复前自动保存" |
| `noteTitle` | `string` | 快照时刻的笔记标题，用于恢复时覆盖 `note.title` |
| `content` | `string` | ProseMirror doc JSON 字符串 |
| `createdAt` | `string` | ISO 时间戳 |

`title` 与 `noteTitle` 的区分：

- `title` — 在历史面板列表展示的「快照类型」文案，由前端写入时给定
- `noteTitle` — 快照当时的笔记标题，恢复时用于覆盖 `note.title`

---

## 5.4 文件上传 `/uploads`

> 图片/封面上传，2026-07-21 新增。前端将从 base64 改为调本接口返回 URL。

### 5.4.1 上传图片

`POST /uploads/image`（需要 token）

请求：`multipart/form-data`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `file` | File | 图片文件，5MB 上限 |

白名单 MIME：

- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`

响应 `data`：

```json
{
  "url": "/uploads/{user_id}/{uuid}.{ext}"
}
```

返回的 URL 为相对路径，前端拼接 `VITE_API_BASE_URL` 的 origin 后访问。

### 5.4.2 静态访问

`GET /uploads/:path`（无需 token）

后端将上传文件存储到服务器本地磁盘（如 `backend/uploads/{user_id}/{uuid}.{ext}`），并通过静态文件挂载对外提供访问。

权限说明：URL 中包含 `user_id` 路径段，但访问本身不做鉴权（图片可被任何持有 URL 的人访问）。如需私密访问，未来可改为 token 校验或签名 URL。

---

## 6. 前端分层与使用方式

```text
UI（features/*）  —— 本期不改业务 UI 流程
    ↓ 后续可调用
useAuthStore / 各 *Api
    ↓
authApi | messagesApi | userApi | notesApi
    ↓
mock/*  或  httpClient.request → 真实后端
```

导入示例：

```ts
import { authApi, messagesApi, userApi, notesApi, isMockApiMode, ApiError } from '../shared/api'
import { useAuthStore } from '../shared/store/authStore'
```

Auth store 能力：

- `hydrate()`：启动时从 localStorage 恢复（`main.tsx` 已调用）
- `login` / `register` / `refresh` / `me` / `logout`
- `fetchMe` / `logout` / `setSession` / `clearSession`
- 状态：`accessToken`, `user`, `isAuthenticated`, `isHydrated`, `isLoading`

---

## 7. 对接检查清单（给后端）

- [ ] 所有接口统一 `{ code, message, data }`
- [ ] 成功 `code === 0`
- [ ] 登录返回 `accessToken` + `user`
- [ ] 受保护接口校验 `Authorization: Bearer`
- [ ] 401 时前端会按未授权处理
- [ ] 时间 ISO 字符串；id 字符串
- [ ] 字段命名与本文档 / 前端 types 一致（camelCase）
- [ ] CORS 允许前端开发源（如 `http://localhost:5173`）并暴露必要头

---

## 8. 本期范围说明

**已完成（前端基建 + 本地后端联调）**

- 环境配置与 mock/real 切换（`VITE_API_MODE`）
- HTTP 客户端与统一错误处理（`httpClient.ts` + 统一响应体 `{code,message,data}`）
- Token 存储与 Auth store（`tokenStorage.ts` + `authStore.ts`：hydrate/login/register/fetchMe/logout/setSession/clearSession）
- 模块 API：`authApi` / `messagesApi` / `userApi` / `notesApi` / 快照与上传等
- `ApiNotesRepository` 实现 `NotesRepository`；供同步引擎推拉，非登录硬切业务源
- 账号 / 消息 / 设置 UI 已接通 Mock 与 Real（视环境变量）
- 本地 FastAPI + MySQL（库名 `beiwanglu`）端到端已跑通

**明确未做**

- **笔记从 localStorage 迁移到远端**：仓储可切换，但无一次性迁移与冲突合并
- Refresh Token / Cookie Session
- 多端同步稳健性增强（一期 LWW 双路径已通）

> 注：将 `VITE_API_MODE=real` 并启动后端即可联调；默认 Mock 仍可独立开发 UI。完整预留清单见 [`docs/未完成与预留功能清单.md`](./未完成与预留功能清单.md)。

后端接口就绪后，建议接入顺序：

1. 将 `VITE_API_MODE=real`，联调 `/auth/*`，验证账号 UI 真实流程
2. 接通消息与用户资料真实数据
3. 在本地优先 + 同步引擎一期基础上强化迁移稳健性与冲突策略
4. 评估离线缓存与冲突解决
