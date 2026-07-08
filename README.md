# 灵感笔记

一个基于 React、Vite 和 Tauri 构建的桌面笔记应用。当前版本聚焦本地笔记管理、收藏、文件夹视图、回收站、消息中心和基础账号界面，适合作为跨平台桌面端笔记产品的前端原型与功能基座。

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

当前项目包含可用功能和前端原型功能。为了避免误解，新增或调整功能前请先确认下表状态。

| 模块 | 当前状态 | 数据来源 | 说明 |
| --- | --- | --- | --- |
| 笔记列表 | 可用 | `localStorage` | 展示未删除笔记，按更新时间排序。 |
| 笔记编辑 | 可用 | `localStorage` | 支持创建笔记、编辑标题和正文。 |
| 搜索过滤 | 可用 | Zustand 内存状态 + 笔记数据 | 支持按标题、正文、摘要和标签名称搜索。 |
| 收藏 | 可用 | `localStorage` | 支持收藏和取消收藏，并在收藏视图查看。 |
| 回收站 | 部分可用 | `localStorage` | 支持移入回收站和查看回收站；恢复、永久删除尚未实现。 |
| 文件夹 | 部分可用 | 笔记 `folderId` + 运行时状态 | 可按文件夹浏览；新建自定义文件夹目前主要是界面状态，尚未形成独立持久化模型。 |
| 消息中心 | 原型 | `messageMockData.ts` | 通知下拉、消息列表和详情弹窗已完成；已读状态、通知设置待接真实数据。 |
| 账号界面 | 原型 | 前端组件状态 | 登录、注册、验证码登录、忘记密码是界面流程，尚未接入真实认证和会话管理。 |
| 设置与帮助 | 原型 | 静态 UI | 作为产品界面基座，暂未接入真实用户配置。 |
| 导出面板 | 原型 | 静态 UI | 展示导出入口，尚未实现真实文件导出。 |
| 版本历史 | 原型 | 静态 mock | 展示历史记录面板，尚未接入真实版本记录。 |
| Tauri 桌面端 | 基础可用 | `src-tauri/tauri.conf.json` | 已有桌面窗口与构建配置，打包、安全策略和插件能力仍需按发布目标完善。 |

更详细的状态说明见 [`docs/feature-status.md`](docs/feature-status.md)。

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
npm run tauri        # 调用 Tauri CLI
npm run tauri:dev    # 启动 Tauri 桌面开发环境
npm run tauri:build  # 构建桌面应用安装包
```

更多开发和排错说明见 [`docs/development.md`](docs/development.md)。

## 数据说明

当前笔记数据通过 `WebNotesRepository` 存储在浏览器 `localStorage` 中，存储键为 `beiwanglu.notes.v1`。首次启动或本地数据缺失时，会写入 `src/shared/data/mockNotes.ts` 中的示例笔记。

数据访问通过 `NotesRepository` 接口抽象，后续可替换为 SQLite、移动端本地存储或远程 API。`sqliteNotesRepository.ts` 和 `mobileNotesRepository.ts` 当前保留为类型占位。

开发时如需重置本地示例数据，可以在浏览器控制台执行：

```js
localStorage.removeItem('beiwanglu.notes.v1')
```

刷新页面后，应用会重新写入 mock 笔记数据。详细模型说明见 [`docs/data-model.md`](docs/data-model.md)。

## 应用配置

Tauri 配置位于 `src-tauri/tauri.conf.json`：

- 产品名称：`灵感笔记`
- 应用标识：`com.beiwanglu.notes`
- 默认窗口尺寸：`1280 x 800`
- 最小窗口尺寸：`1024 x 700`
- 前端构建目录：`dist`
- 开发地址：`http://localhost:5173`

桌面端细节见 [`docs/tauri.md`](docs/tauri.md)。

## 架构与设计文档

- [`CONTRIBUTING.md`](CONTRIBUTING.md)：协作流程、代码约定、文档维护和提交前检查。
- [`docs/architecture.md`](docs/architecture.md)：应用入口、页面结构、状态流、数据仓储和模块边界。
- [`docs/feature-status.md`](docs/feature-status.md)：当前功能完成度、原型能力和待接入能力。
- [`docs/data-model.md`](docs/data-model.md)：笔记类型、过滤状态、仓储接口和本地存储机制。
- [`docs/development.md`](docs/development.md)：启动、构建、预览、端口占用和常见问题。
- [`docs/design-system.md`](docs/design-system.md)：Tailwind 语义 token、布局尺寸、字体、圆角和阴影规范。
- [`docs/tauri.md`](docs/tauri.md)：Tauri 2 桌面端配置、启动和打包注意事项。
- [`docs/ai-skills.md`](docs/ai-skills.md)：`.trae/skills/` 和 `kilo.json` 的用途、边界和维护建议。
- [`docs/testing.md`](docs/testing.md)：测试分层、推荐工具和后续接入顺序。
- [`docs/roadmap.md`](docs/roadmap.md)：从前端原型到桌面产品的后续路线建议。

## AI / 设计辅助配置

项目包含 `.trae/skills/` 和 `kilo.json`，用于加载设计、品牌、幻灯片、UI styling 等 AI/设计辅助技能。这些文件不是 Web 或 Tauri 运行时的必要依赖，不影响 `npm run dev`、`npm run build` 或 `npm run tauri:dev`。

如果团队继续使用 Kilo/Trae 工作流，请保留这些配置；如果只关注应用运行和业务开发，可以先把它们视为辅助资料。

## 质量检查

提交或交付前建议运行：

```bash
npm run lint
npm run build
```

当前项目尚未配置单元测试、组件测试或 E2E 测试。后续如果继续扩展业务逻辑，建议优先为以下模块补充测试：

- `src/shared/notes/noteDomain.ts`
- `src/shared/notes/noteSelectors.ts`
- `src/shared/data/webNotesRepository.ts`
- 关键页面交互，如创建笔记、编辑笔记、收藏、移入回收站和搜索过滤。

## 开发约定

- 业务状态通过 `src/shared/store/notesStore.ts` 中的 Zustand store 管理。
- 笔记筛选、排序、摘要生成等纯逻辑放在 `src/shared/notes/`。
- UI 页面组件按功能归档在 `src/features/notes/components/`。
- 新增数据源时优先实现 `NotesRepository` 接口，避免组件直接依赖具体存储实现。
- 账号、消息、导出、版本历史等原型功能在接入真实能力前，需要同步更新 [`docs/feature-status.md`](docs/feature-status.md)。
- 提交前建议运行 `npm run lint` 和 `npm run build`。
