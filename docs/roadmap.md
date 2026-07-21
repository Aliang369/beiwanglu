# 路线图

本文档记录 `灵感笔记` 从前端原型走向可用桌面产品的建议路线。路线图不是承诺排期，而是帮助后续开发判断优先级。

未完成与预留的功能级盘点见 [`docs/未完成与预留功能清单.md`](./未完成与预留功能清单.md)。

## 当前阶段

当前项目处于：

```text
前端功能基座完成 + 后端 7 模块本地端到端 + 桌面壳基础可用
```

已经具备：

- React 19 / Vite 8 / Tauri 2 / Zustand 5 / Tailwind 4 / TipTap 3 基础工程。
- 笔记 CRUD：创建 / 编辑 / 收藏 / 置顶 / 只读 / 封面 / 标签。
- 富文本编辑：TipTap 13 扩展（代码块 / 表格 / 任务列表 / 数学公式 / 图片 / YouTube 等）。
- 搜索系统：标题 / 正文 / 摘要 / 标签匹配 + 搜索历史（最近 8 条）+ 关键词高亮。
- 文件夹：一层子文件夹 + 创建 / 重命名 / 移动 / 删除 / 多选批量；无默认 inbox，删除后笔记未分类。
- 回收站：30 天保留 + 自动清理 + 恢复 + 永久删除 + 清空 + 二次确认。
- 版本历史：快照系统（20 条 + 7 天 TTL）+ 预览 / 恢复；登录后可走远端快照。
- 导出能力：PNG 长图 / PDF / Word(.docx) 三格式；设置页 JSON 备份导出（未删除笔记）。
- 账号体系：用户名密码登录 / 注册 / 退出，JWT + Mock/Real 双模式；设置页改密。
- 消息中心：通知下拉 + 消息列表 + 详情弹窗 + 已读 / 未读管理。
- API 基建 + FastAPI/MySQL 本地后端（`beiwanglu`）端到端。
- `NotesRepository` / 快照仓储双实现 + 登录态 `setRepository` / `setSnapshotsRepository`。
- Web 端 `localStorage` 持久化（v4 + 多 key 治理）。
- Tailwind 语义 token 和完整 UI 风格 + 卡片布局硬约束。
- 桌面壳可跑（Tauri 2）。

仍然缺少：

- 本地优先 SQLite + 同步稳健性已落地；sql.js 失败可回退 localStorage 且仍 LWW 同步。
- 组件测试 / E2E（纯逻辑单测与前端 CI 已落地）。
- Tauri 签名/公证/自动更新仍属发布级（P5）；图标/CSP 已在 P3 完成。
- 任意深度文件夹嵌套（当前仅一层）。

## P0：稳定当前基座

状态：**已完成（2026-07-21）**

目标：让当前产品基座更稳定、可维护、可交接。

已完成事项：

- `npm run lint` / `npm test` / `npm run build` 本地可稳定通过。
- oxlint 忽略 `dist/**`、`src-tauri/target/**`、`.trae/**`、`public/sql.js/**`。
- Vitest 覆盖 shared 纯逻辑（`noteDomain` / `noteSelectors` / `folderDomain`）。
- GitHub Actions：PR + 推送 `main` 自动跑 lint → test → build。

对应文档：

- `docs/feature-status.md`
- `docs/testing.md`
- `docs/未完成与预留功能清单.md`
- `CONTRIBUTING.md`

## P1：后端能力补齐

状态：**已完成（2026-07-21）**

已完成事项：

- 用户名密码 auth/user/messages real 可联调。
- Refresh Token：access 15 分钟 + refresh 30 天；`POST /auth/refresh` 轮换；logout 吊销；前端 401 自动续期。
- 验证码/邮箱/第三方登录/删号已从产品范围移除。

涉及模块：

- `src/shared/api/*`
- `src/shared/store/authStore.ts` / `messagesStore.ts`
- `src/features/auth/*`
- `src/features/notes/components/SettingsView.tsx`
- `backend/app/services/auth_service.py`

## P2：笔记云同步增强

状态：**已完成（2026-07-21，稳健性产品化）**

已完成事项：

- 队列失败重试（`attempts` + 上限 8）与强制重试；设置页展示待同步/失败数。
- 本地 id 保留推送（update→create 回退）；笔记/文件夹漏推补传。
- 消息已读/全部已读/通知设置离线入队；快照按最近笔记同步。
- 登录、online、回前台、本地写入防抖自动同步；LWW 冲突策略。
- 不做：字段级冲突 UI、端到端加密、实时推送（P4）、桌面原生 SQLite（P3）。

涉及模块：

- `src/shared/data/apiNotesRepository.ts`
- `src/shared/store/notesStore.ts`
- `src/features/notes/NotesHome.tsx`（注入点）

注意：

云同步增强会显著改变数据模型。接入前建议先明确：

- 是否必须云同步。
- 是否需要端到端加密。
- 是否支持离线优先。
- 是否兼容已有 `localStorage` 数据迁移。

## P3：完善桌面端能力

状态：**已完成（2026-07-21，可用桌面级）**

已完成事项：

- 桌面原生 SQLite（app data 目录文件 + command 桥；失败回退 sql.js）。
- Markdown / JSON 本地导入（设置页 + 菜单）。
- JSON 备份导出（全部未删除笔记，与导入兼容）。
- 应用图标与 CSP。
- 系统托盘、应用菜单、基础快捷键（新建/搜索等）。
- 自动更新与平台签名公证仍属 P5。

涉及文档：

- `docs/tauri.md`
- `docs/data-model.md`
- `docs/architecture.md`

## P4：消息、通知和协作能力

目标：让消息中心从可拉取的 API 能力升级为更完整的通知产品能力。

建议事项：

- 消息实时推送通道。
- 桌面原生通知（Tauri notification plugin）。
- 系统通知权限处理。
- 如果引入协作：评论、分享、提醒等（注意：产品定位当前不做团队协作）。

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
- 离线字体资源（替代 Google Fonts CDN）。
- 可访问性检查。

## 技术债清单

- `src-tauri/tauri.conf.json` 中 `csp` 当前为 `null`。
- `tauri.conf.json` 中 bundle `icon` 当前为空数组。
- 桌面原生 SQLite 已接入；移动端原生仍待后续。
- 同步引擎稳健性已产品化（LWW + 队列重试）；字段级冲突/E2E 加密按定位不做。
- 组件测试 / E2E / 覆盖率尚未接入（纯逻辑 Vitest 与 CI 已有）。
- 文件夹仅支持一层嵌套。
- 帮助页为原型。

完整未完成/预留列表：[`docs/未完成与预留功能清单.md`](./未完成与预留功能清单.md)。

## 建议近期顺序

1. ~~P0：lint 稳定 + Vitest 纯逻辑单测 + CI~~（已完成）。
2. ~~补齐 Refresh Token~~（已完成）。
3. ~~强化同步引擎~~（P2 已完成）。
4. ~~完善 Tauri 图标/CSP/原生 SQLite/导入/托盘菜单~~（P3 已完成）。
5. P5：签名公证与自动更新。
6. 视需要扩展组件测试 / E2E。

## 文档同步规则

每完成一项路线图能力，至少检查：

- `README.md`
- `docs/feature-status.md`
- `docs/未完成与预留功能清单.md`
- `docs/data-model.md`
- `docs/architecture.md`
- `docs/tauri.md`
- `docs/testing.md`
- Obsidian 知识库（`/Users/aliang/Documents/Obsidian Vault/beiwanglu/`）中相关笔记
