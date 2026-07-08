# 路线图

本文档记录 `灵感笔记` 从前端原型走向可用桌面产品的建议路线。路线图不是承诺排期，而是帮助后续开发判断优先级。

## 当前阶段

当前项目处于：

```text
前端功能基座 + 桌面壳原型
```

已经具备：

- React/Vite/Tauri 基础工程。
- 笔记列表、编辑、收藏、搜索、回收站基础能力。
- 文件夹、消息中心、账号、设置、帮助等 UI 原型。
- `NotesRepository` 数据仓储抽象。
- Web 端 `localStorage` 持久化。
- Tailwind 语义 token 和较完整 UI 风格。

仍然缺少：

- 真实账号系统。
- 真实消息系统。
- 独立持久化文件夹模型。
- 回收站恢复和永久删除。
- 导出和版本历史真实能力。
- 自动化测试。
- Tauri 发布级配置。

## P0：稳定当前基座

目标：让当前原型更稳定、可维护、可交接。

建议事项：

- 确保 `npm run lint` 和 `npm run build` 稳定通过。
- 为 `src-tauri/target`、`dist` 等生成目录配置 lint 忽略。
- 补充基础测试框架，优先覆盖 shared 纯逻辑。
- 明确功能状态，避免原型功能被误认为真实能力。
- 修正文档与源码不一致的地方。

对应文档：

- `docs/feature-status.md`
- `docs/testing.md`
- `CONTRIBUTING.md`

## P1：补齐笔记核心能力

目标：让“本地笔记管理”成为真正闭环。

建议事项：

- 回收站恢复。
- 回收站永久删除。
- 清空回收站。
- 独立 Folder 模型。
- 文件夹创建、重命名、删除持久化。
- 创建笔记时可选择文件夹。
- 标签新增、删除、编辑能力。
- 更明确的空状态和错误状态。

涉及模块：

- `src/shared/types/note.ts`
- `src/shared/data/notesRepository.ts`
- `src/shared/store/notesStore.ts`
- `src/features/notes/components/`

## P2：完善桌面端本地能力

目标：把 Tauri 从“桌面壳”升级为更完整的桌面应用。

建议事项：

- 引入 SQLite 或文件系统存储。
- 实现真实导出。
- 支持导入 Markdown 或 JSON。
- 支持文件保存对话框。
- 配置应用图标。
- 配置 CSP。
- 评估自动更新。
- 评估系统托盘、菜单、快捷键。

涉及文档：

- `docs/tauri.md`
- `docs/data-model.md`
- `docs/architecture.md`

## P3：账号和同步

目标：从单机本地笔记扩展到多端或云同步。

建议事项：

- 真实登录、注册、退出登录。
- 用户 session 管理。
- 远程 API repository。
- 离线缓存。
- 同步冲突解决。
- 多用户数据隔离。
- 安全和隐私策略。

注意：

账号和同步会显著改变数据模型。接入前建议先明确：

- 是否必须云同步。
- 是否需要端到端加密。
- 是否支持离线优先。
- 是否兼容已有 `localStorage` 数据迁移。

## P4：消息、通知和协作能力

目标：让消息中心从 mock UI 变成真实产品能力。

建议事项：

- 消息列表 API。
- 已读/未读状态。
- 通知偏好设置。
- 桌面原生通知。
- 系统通知权限处理。
- 如果引入协作：评论、分享、提醒等。

## P5：产品化和发布

目标：达到可分发桌面应用质量。

建议事项：

- 完整应用图标。
- 应用签名和平台发布配置。
- macOS 公证。
- Windows 安装包签名。
- Linux 包格式确认。
- 自动更新策略。
- 错误收集和日志策略。
- 隐私政策和用户协议。
- 离线字体资源。
- 可访问性检查。

## 技术债清单

- `src-tauri/tauri.conf.json` 中 `csp` 当前为 `null`。
- `tauri.conf.json` 中 bundle `icon` 当前为空数组。
- `sqliteNotesRepository.ts` 和 `mobileNotesRepository.ts` 只是类型占位。
- 消息中心使用 mock 数据。
- 账号流程没有真实认证。
- 文件夹没有独立持久化模型。
- 回收站缺恢复和永久删除。
- 没有测试脚本。
- 没有 CI。

## 建议近期顺序

1. 让 `npm run lint` 稳定通过。
2. 接入 Vitest，覆盖 shared 纯逻辑。
3. 补齐回收站恢复 / 永久删除。
4. 设计 Folder 数据模型并持久化。
5. 实现真实导出。
6. 完善 Tauri 图标和 CSP。

## 文档同步规则

每完成一项路线图能力，至少检查：

- `README.md`
- `docs/feature-status.md`
- `docs/data-model.md`
- `docs/architecture.md`
- `docs/tauri.md`
- `docs/testing.md`
