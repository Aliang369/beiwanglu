# 灵感笔记

一个基于 React、Vite 和 Tauri 构建的桌面笔记应用。**本地优先 + 可选云端同步**；前端功能基座、后端本地端到端、同步稳健性与可用桌面级能力已落地。帮助页仍为原型，公开链接等入口仍预留。

## 功能特性

- 笔记 CRUD：创建/编辑/删除/恢复/永久删除/批量管理。
- 富文本编辑：TipTap（代码块、表格、任务列表、数学公式、图片、YouTube 等）。
- 搜索与标签：标题/正文/标签匹配，搜索历史，按标签筛选。
- 文件夹：一层子文件夹；无默认 inbox；删除后笔记未分类。
- 回收站：软删除 + 30 天保留 + 自动清理。
- 版本历史：双重保留（20 条 + 7 天 TTL），预览/恢复。
- 导出：单篇 PNG / PDF / Word；设置页 JSON 备份导出（未删除笔记）。
- 导入：设置页/菜单导入 Markdown 或 JSON 备份。
- 消息中心：系统/安全等消息，已读与通知设置（Mock/Real）。
- 账号：用户名密码登录/注册/退出；Refresh Token 自动续期；设置页改密。
- 云同步：登录默认同步，LWW + 队列重试，设置页可开关/立即同步。
- 桌面端：Tauri 窗口、图标/CSP、原生 SQLite（失败回退 sql.js）、托盘/菜单/快捷键。

## 功能状态

以「可用」为主。详细状态见 [`docs/feature-status.md`](docs/feature-status.md)；未完成/预留见 [`docs/未完成与预留功能清单.md`](docs/未完成与预留功能清单.md)。

| 模块 | 当前状态 | 数据来源 | 说明 |
| --- | --- | --- | --- |
| 笔记列表/编辑 | 可用 | 本机 SQLite（Web sql.js 或桌面原生；失败回退 localStorage）+ 可选云同步 | 置顶、封面、只读、富文本等 |
| 搜索/标签 | 可用 | Zustand + 本机笔记 | 评分排序 + 搜索历史 |
| 收藏/回收站/文件夹 | 可用 | 同上 | 一层文件夹；删夹后未分类 |
| 消息中心 | 可用 | Mock 或 Real `messagesApi` | 已读/设置可走 API |
| 账号 | 可用 | Auth store + Mock/Real | 用户名密码；Refresh Token 续期；设置页改密 |
| 云端同步 | 可用 | `src/shared/sync/` | LWW + 队列重试 + 自动触发 |
| 设置 | 部分可用 | `userApi` + 同步/导入导出 | 资料/改密/同步/JSON 备份；帮助仍原型 |
| 帮助 | 原型 | 静态 UI | 无真实文章 |
| 导出 | 可用 | 前端导出库 | PNG / PDF / Word；JSON 备份 |
| 版本历史 | 可用 | 本机快照 + 同步推拉 | 20 条 + 7 天 TTL |
| Tauri 桌面端 | 可用 | `src-tauri/` | 图标/CSP/原生 SQLite command/托盘菜单/导入导出 |
| 测试与 CI | 部分可用 | Vitest + GitHub Actions | 纯逻辑单测 + lint/test/build 门禁；无组件/E2E |

## 技术栈

- React 19 · TypeScript 6 · Vite 8 · Tauri 2
- Zustand · Tailwind CSS 4 · TipTap 3 · lucide-react
- sql.js / 桌面原生 SQLite · FastAPI + MySQL（后端）
- Oxlint · Vitest

## 项目结构

```text
.
├── public/                         # 静态资源（含 sql.js wasm）
├── src/
│   ├── app/                        # 应用入口组件
│   ├── features/
│   │   ├── auth/                   # 登录、注册、协议弹窗
│   │   └── notes/                  # 笔记主界面与页面组件
│   ├── shared/
│   │   ├── api/                    # HTTP 客户端、Mock/Real 模块 API
│   │   ├── data/                   # 本机仓储（SQLite/sql.js、localStorage 回退）
│   │   ├── desktop/                # 桌面桥、导入/JSON 备份导出
│   │   ├── notes/                  # 领域逻辑、选择器、单测
│   │   ├── store/                  # auth / notes / messages / sync
│   │   ├── sync/                   # LWW 同步引擎与队列
│   │   ├── types/                  # 共享类型
│   │   └── ui/                     # 共享 UI 原语
│   └── styles/
├── src-tauri/                      # Tauri 配置、图标、capabilities、Rust 入口
├── backend/                        # FastAPI + MySQL + Alembic
├── docs/                           # 开发者文档与未完成清单
├── .github/workflows/              # CI（lint / test / build）
├── index.html
├── vite.config.ts
└── package.json
```

## 快速开始

### 前端

```bash
npm install
npm run dev          # http://localhost:5173
```

### 后端（real 模式联调）

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# 配置 backend/.env（参考 .env.example）
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 3000
```

前端 `.env` 示例：

```bash
VITE_API_MODE=real
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### 桌面

```bash
npm run tauri:dev
npm run tauri:build
```

## 常用命令

```bash
npm run dev
npm run build
npm run lint
npm test
npm run tauri:dev
npm run tauri:build
```

## 文档

- [`docs/feature-status.md`](docs/feature-status.md) — 功能状态
- [`docs/未完成与预留功能清单.md`](docs/未完成与预留功能清单.md) — 未完成/预留真相源
- [`docs/roadmap.md`](docs/roadmap.md) — 路线图
- [`docs/api-contract.md`](docs/api-contract.md) — 接口约定
- [`docs/architecture.md`](docs/architecture.md) — 架构
- [`docs/data-model.md`](docs/data-model.md) — 数据模型
- [`docs/tauri.md`](docs/tauri.md) — 桌面端
- [`docs/testing.md`](docs/testing.md) — 测试
- [`docs/development.md`](docs/development.md) — 本地开发

## 说明

- 默认 `VITE_API_MODE=mock` 可独立开发 UI；联调后端时切 `real`。
- 业务读写本机仓储；云端经同步引擎 LWW 推拉（可关同步）。
- 明确不做：团队协作、完整 CRDT、端到端加密存储、插件生态、AI 写作（见产品定位/清单第五节）。
