# 贡献指南

本文档说明 `灵感笔记` 的协作、开发、质量检查和文档维护约定。

## 开发前准备

1. 安装 Node.js 和 npm。
2. 如需桌面端开发，安装 Rust 和 Tauri 2 所需系统依赖。
3. 安装依赖：

```bash
npm install
```

4. 启动 Web 开发服务：

```bash
npm run dev
```

5. 如需启动桌面端：

```bash
npm run tauri:dev
```

更多说明见 [`docs/development.md`](docs/development.md)。

## 推荐工作流

1. 先阅读相关文档：
   - [`README.md`](README.md)
   - [`docs/architecture.md`](docs/architecture.md)
   - [`docs/feature-status.md`](docs/feature-status.md)
2. 明确当前功能状态：可用、部分可用、原型或占位。
3. 修改源码或文档。
4. 运行质量检查。
5. 如果功能状态、数据结构或运行方式变化，同步更新文档。

## 目录约定

```text
src/app/                 # 应用入口和顶层视图
src/features/auth/       # 账号相关 UI 原型
src/features/notes/      # 笔记业务功能
src/shared/data/         # 数据仓储接口和实现
src/shared/notes/        # 笔记领域逻辑和选择器
src/shared/store/        # Zustand store 工厂
src/shared/types/        # 共享类型
src/shared/ui/           # 预留共享 UI 组件目录
src/styles/              # 全局样式
src-tauri/               # Tauri 桌面端
```

## 代码约定

- UI 组件尽量保持展示和事件转发职责。
- 笔记筛选、排序、摘要生成等纯逻辑放在 `src/shared/notes/`。
- 数据读写通过 `NotesRepository` 抽象，不要在组件中直接操作 `localStorage`。
- 新增数据源时实现 `NotesRepository`，再通过 `createNotesStore` 注入。
- 新增共享组件时，优先确认它是否真的跨 feature 复用；否则保留在当前 feature 内。
- 保持 TypeScript 类型清晰，不用 `any` 绕过模型设计。

## UI 约定

- 优先复用 `tailwind.config.ts` 中的语义 token。
- 新增页面或组件时参考 [`docs/design-system.md`](docs/design-system.md)。
- 保持圆角、低对比边框、轻阴影和浅色容器风格一致。
- 需要新增通用 UI 模式时，先考虑是否放入 `src/shared/ui/`。

## 文档维护约定

以下变更必须同步更新文档：

| 变更 | 需要更新 |
| --- | --- |
| 新增或完成一个功能 | `README.md`, `docs/feature-status.md` |
| 改变启动、构建、端口或环境要求 | `README.md`, `docs/development.md` |
| 修改数据类型、存储 key 或迁移策略 | `docs/data-model.md` |
| 修改 Tauri 配置、插件或打包流程 | `docs/tauri.md` |
| 修改视觉 token 或通用 UI 风格 | `docs/design-system.md` |
| 新增测试框架或测试命令 | `docs/testing.md`, `README.md` |

## 提交前检查

建议运行：

```bash
npm run lint
npm run build
```

如果只想快速检查源码范围，也可以运行：

```bash
npx oxlint src vite.config.ts tailwind.config.ts postcss.config.js
```

当前项目尚未配置测试脚本，测试策略见 [`docs/testing.md`](docs/testing.md)。

## 功能状态变更规则

当前项目包含不少前端原型能力。接入真实功能时，请不要只改 UI，还需要明确：

- 数据来源是否从 mock 改为真实数据。
- 是否需要新增类型或 repository 方法。
- 是否需要本地持久化或远程同步。
- 是否需要错误处理和加载状态。
- 是否需要更新功能状态文档。

## 不建议的做法

- 在组件中直接读写 `localStorage`。
- 把复杂业务逻辑写进 JSX 渲染分支。
- 新增功能后不更新 `docs/feature-status.md`。
- 修改 Vite 端口但不更新 Tauri `devUrl`。
- 把生成产物作为源码检查目标。
- 在原型功能里隐含承诺“已经接入真实服务”。
