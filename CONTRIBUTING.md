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

## 分支与工作目录约定

本项目以单人开发、AI 辅助改码为主，**不要求**每次改动都开分支或 Draft PR。按改动风险选择工作方式，目标是：`main` 尽量保持可运行，半成品不要长期留在主线菜单里「看得见但点不动」。

### 直接在 `main` 改

满足以下条件时，可直接在 `main` 修改：

- 改动范围小，通常 1–2 个文件，行为明确。
- 修文案、样式、小 bug，或把已有菜单接到已有 store action。
- 改完可以马上在浏览器验证。

改前建议先有一个干净可回退点（最近一次 commit，或 `git stash`）。改坏可用 `git restore` / `git checkout --` 回退。

### 开 feature 分支再改

出现以下任一情况时，从 `main` 拉 feature 分支：

| 情况 | 示例 |
| --- | --- |
| 多文件、跨层改动 | store + 列表/卡片 + 弹窗 + `NotesHome` 接线 |
| 方案不确定 | AI 可能大范围重构或试多种交互 |
| 可能半路放弃 | 试做后可能整段丢弃 |
| 需要与 `main` 上其他事并行 | 一边修小问题，一边做大功能 |
| 一次做不完 | 跨多次会话才能完成 |

分支命名建议：

```text
feat/<简短英文描述>    # 新功能，如 feat/duplicate-note
fix/<简短英文描述>     # 修复，如 fix/favorite-edge-cases
```

### 何时使用 worktree

worktree 适合同时维护两套工作目录，例如：

- 两个会话并行改不同功能。
- 需要并排对比改前 / 改后代码。

单会话、单任务时，普通 feature 分支通常足够，不必每次都建 worktree。

### 合并回 `main`

功能分支自测通过后，应尽快合并回 `main`，避免出现：

- 菜单项已在 `main` 展示，但真实逻辑只在分支上。
- 后续在 `main` 继续开发时，误以为功能「坏了」或「未实现」。

合并前至少：

1. 运行质量检查（见下方「提交前检查」）。
2. 在浏览器点一遍本次改动的关键路径。
3. 若功能状态变化，同步更新文档。

不通过则留在分支继续改，或丢弃分支；不要把半成品合进 `main`。

### 与 AI 协作时的额外习惯

- 任务写小、写死边界：例如「只做复制笔记，不要顺手重构」。
- 大改动先对齐方案再写代码（口头确认或短计划即可）。
- 改完必跑 lint/build，并手动验证；不要只依赖「代码看起来对」。
- 需要留审查记录时再开 PR（可用 Draft）；单人默认流程不强制 PR。

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
npm test
npm run build
```

如果只想快速检查源码范围，也可以运行：

```bash
npx oxlint src vite.config.ts tailwind.config.ts postcss.config.js
```

测试策略与已覆盖范围见 [`docs/testing.md`](docs/testing.md)。CI 在 PR 与推送 `main` 时自动跑上述三项。

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
- 功能逻辑只合在 feature 分支、却把半成品菜单长期留在 `main`。
- 在不确定方案时直接在 `main` 做大范围跨层改动。
