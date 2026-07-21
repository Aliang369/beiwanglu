# 灵感笔记

一个基于 React、Vite 和 Tauri 构建的桌面笔记应用。本地优先 + 可选云端同步；前端功能基座与后端本地端到端已跑通，设置/帮助等仍有部分原型与预留能力。

## 功能特性

- 笔记列表：展示全部未删除笔记，并按更新时间排序。
- 笔记编辑：支持创建笔记、编辑标题和正文内容。
- 搜索过滤：可按标题、正文、摘要和标签名称搜索笔记。
- 收藏管理：支持收藏笔记，并在收藏视图中集中查看。
- 文件夹视图：按文件夹维度组织和浏览笔记。
- 回收站：支持将笔记移动到回收站并在回收站视图查看。
- 消息中心：包含通知下拉、消息列表和消息详情弹窗。
- 设置与帮助：提供个人资料、安全设置、帮助中心等辅助界面。
- 桌面壳能力：通过 Tauri 提供桌面应用窗口与打包能力。

## 功能状态

当前项目以「可用」能力为主，另有部分原型/占位。新增或调整功能前请先确认下表；未完成与预留项见 [`docs/未完成与预留功能清单.md`](docs/未完成与预留功能清单.md)。

| 模块 | 当前状态 | 数据来源 | 说明 |
| --- | --- | --- | --- |
| 笔记列表 | 可用 | 本机 SQLite（失败回退 localStorage）+ 可选云同步 | 展示未删除笔记，置顶优先，按更新时间排序。 |
| 笔记编辑 | 可用 | 同上 | 支持创建、富文本编辑、封面/置顶/只读等。 |
| 搜索过滤 | 可用 | Zustand + 笔记数据 | 标题/正文/摘要/标签匹配 + 搜索历史。 |
| 收藏 | 可用 | 同上仓储 | 收藏与收藏视图。 |
| 回收站 | 可用 | 同上仓储 | 移入/恢复/永久删除/清空，30 天保留 + 自动清理。 |
| 文件夹 | 可用 | 独立 Folder 模型 + 仓储 | 一层子文件夹；删除后笔记未分类（`folderId=null`）。 |
| 消息中心 | 可用 | Mock 或 Real `messagesApi` | 下拉与中心共用 store；已读/设置可走 API。 |
| 账号 | 可用 | Auth store + Mock/Real | 用户名密码登录/注册/退出；设置页改密。 |
| 设置 | 部分可用 | `userApi` + 同步开关 | 资料/改密/同步已接。 |
| 帮助 | 原型 | 静态 UI | 帮助中心文案与列表，无真实文章。 |
| 导出 | 可用 | 前端导出库 | PNG / PDF / Word 三格式；设置页 JSON 备份导出（未删除笔记）。 |
| 版本历史 | 可用 | 本地或远端快照仓储 | 20 条 + 7 天 TTL，预览/恢复。 |
| Tauri 桌面端 | 基础可用 | `src-tauri/` | 窗口与打包壳；图标/CSP/原生 command 待完善。 |

更详细的状态说明见 [`docs/feature-status.md`](docs/feature-status.md)；未完成/预留盘点见 [`docs/未完成与预留功能清单.md`](docs/未完成与预留功能清单.md)。

## 技术栈

- React 19
- TypeScript 6
- Vite 8
- Tauri 2
- Zustand
- Tailwind CSS 4
- lucide-react
- Oxlint

## 项目结构

```text
.
├── public/                    # 静态资源
├── src/
│   ├── app/                   # 应用入口组件与顶层路径判断
│   ├── assets/                # 前端资源占位目录
│   ├── components/            # 跨功能通用组件占位目录
│   ├── features/
│   │   ├── auth/              # 登录、注册和账号弹窗界面
│   │   └── notes/             # 笔记主功能与页面组件
│   ├── shared/
│   │   ├── data/              # 笔记数据仓储接口与实现
│   │   ├── notes/             # 笔记领域逻辑和选择器
│   │   ├── store/             # Zustand 状态工厂
│   │   ├── types/             # 共享类型定义
│   │   └── ui/                # 共享 UI 占位目录
│   └── styles/                # 全局样式
├── src-tauri/                 # Tauri 桌面端配置、图标与 Rust 入口
├── docs/                      # 项目维护文档
├── .trae/skills/              # AI / 设计辅助技能配置
├── index.html                 # Web 入口 HTML
├── vite.config.ts             # Vite 配置
├── tailwind.config.ts         # Tailwind 设计 token 配置
├── kilo.json                  # Kilo/Trae skills 加载配置
└── package.json               # npm 脚本与依赖
```

## 快速开始

### 环境要求

- Node.js：建议使用当前 LTS 版本或更高版本。
- npm：随 Node.js 安装。
- Rust 与 Tauri 依赖：运行桌面端开发和打包时需要安装 Tauri 所需的系统依赖。

### 安装依赖

```bash
npm install
```

### 启动 Web 开发环境

```bash
npm run dev
```

默认开发服务地址为 `http://localhost:5173`。

项目在 `vite.config.ts` 中设置了固定端口 `5173` 和 `strictPort: true`。如果端口被占用，Vite 会直接失败，不会自动切换到其他端口。可以先关闭占用端口的进程，或临时调整 Vite 配置后再启动。

### 启动 Tauri 桌面开发环境

```bash
npm run tauri:dev
```

该命令会先启动 Vite 开发服务，再打开 Tauri 桌面窗口。

## 常用命令

```bash
npm run dev          # 启动 Vite 开发服务
npm run build        # 执行 TypeScript 构建并生成前端产物
npm run preview      # 预览前端构建产物
npm run lint         # 使用 Oxlint 检查代码
npm test             # 运行 Vitest 纯逻辑单测
npm run tauri        # 调用 Tauri CLI
npm run tauri:dev    # 启动 Tauri 桌面开发环境
npm run tauri:build  # 构建桌面应用安装包
```
