# 开发与排错指南

本文档说明 `灵感笔记` 的本地开发、构建、预览和常见问题处理方式。

## 环境要求

- Node.js：建议使用当前 LTS 版本或更高版本。
- npm：随 Node.js 安装。
- Rust：运行 `npm run tauri:dev` 或 `npm run tauri:build` 时需要。
- Tauri 2 系统依赖：桌面端开发和打包需要按目标系统安装对应依赖。

如果只启动 Web 前端，通常只需要 Node.js 和 npm。

## 安装依赖

```bash
npm install
```

项目使用 `package-lock.json` 锁定依赖版本，默认使用 npm 即可。

## 启动 Web 开发服务

```bash
npm run dev
```

默认地址：

```text
http://localhost:5173
```

如需显式绑定本机地址，可以运行：

```bash
npm run dev -- --host 127.0.0.1
```

## 端口说明

`vite.config.ts` 中配置了：

```ts
server: {
  port: 5173,
  strictPort: true,
}
```

这表示：

- 开发服务固定使用 `5173` 端口。
- 如果端口被占用，Vite 会启动失败。
- Vite 不会自动切换到 `5174` 或其他端口。

处理方式：

1. 关闭已经运行的开发服务。
2. 找到并结束占用 `5173` 的进程。
3. 如确实需要更换端口，修改 `vite.config.ts` 和 `src-tauri/tauri.conf.json` 中的 `devUrl`，保持两处一致。

## 启动 Tauri 桌面开发环境

```bash
npm run tauri:dev
```

Tauri 配置中的 `beforeDevCommand` 会先执行：

```bash
npm run dev
```

然后 Tauri 使用：

```text
http://localhost:5173
```

作为桌面窗口加载地址。

如果 Web 服务端口启动失败，Tauri 桌面窗口也无法正常加载。

## 构建 Web 产物

```bash
npm run build
```

该命令执行：

```bash
tsc -b && vite build
```

输出目录：

```text
dist/
```

## 预览构建产物

```bash
npm run preview
```

该命令用于本地预览 `vite build` 后的产物，不等同于开发服务。

## 构建桌面应用

```bash
npm run tauri:build
```

构建前会执行 `npm run build`，然后由 Tauri 读取 `dist/` 生成桌面应用包。不同操作系统的系统依赖、签名、公证、安装包格式可能不同，详见 [`tauri.md`](tauri.md)。

## 本地数据重置

Web 端数据存储在浏览器 `localStorage`，主要 key：

- `beiwanglu.notes.v4`（笔记 + 文件夹主存储，兼容 v1/v2/v3 迁移）
- `beiwanglu.notes.v1`（旧版镜像，兼容读取）
- `beiwanglu.snapshots.v1`（版本快照）
- `beiwanglu.searchHistory.v1`（搜索历史）
- `beiwanglu.auth.accessToken`（JWT token）
- `beiwanglu.auth.user`（用户信息缓存）

需要重置示例数据时，在浏览器开发者工具控制台执行：

```js
localStorage.removeItem('beiwanglu.notes.v4')
```

然后刷新页面，应用会重新写入 mock 数据。

如需彻底清空所有本地数据：

```js
localStorage.removeItem('beiwanglu.notes.v4')
localStorage.removeItem('beiwanglu.notes.v1')
localStorage.removeItem('beiwanglu.snapshots.v1')
localStorage.removeItem('beiwanglu.searchHistory.v1')
localStorage.removeItem('beiwanglu.auth.accessToken')
localStorage.removeItem('beiwanglu.auth.user')
```

## 质量检查

提交前建议运行：

```bash
npm run lint
npm run build
```

当前项目尚未配置自动化测试脚本。如果引入测试，建议优先覆盖：

- `src/shared/notes/noteDomain.ts`（摘要生成、排序、废纸篓保留期）
- `src/shared/notes/noteSelectors.ts`（搜索匹配、标签聚合）
- `src/shared/notes/folderDomain.ts`（文件夹移动校验、重名检测）
- `src/shared/data/webNotesRepository.ts`（v1→v4 迁移、CRUD）
- `src/shared/data/snapshotsRepository.ts`（双重保留策略 trim）
- `src/shared/notes/noteExport.ts`（三格式导出）
- 创建、编辑、收藏、搜索、置顶、只读、封面、移入回收站等核心交互。

## 常见问题

### 端口 5173 被占用

现象：`npm run dev` 失败，并提示端口不可用。

处理：关闭旧的 Vite 服务或结束占用 `5173` 的进程。不要只改 Vite 端口而忘记同步修改 `src-tauri/tauri.conf.json` 的 `devUrl`。

### Tauri 启动失败

常见原因：

- Rust 未安装。
- Tauri 系统依赖缺失。
- Web 开发服务没有成功启动。
- `src-tauri/tauri.conf.json` 中的 `devUrl` 与 Vite 实际地址不一致。

### 页面数据看起来不对

可能是本地 `localStorage` 中已有旧数据。可以清理 `beiwanglu.notes.v1` 后刷新页面。

### Google Fonts 加载慢或失败

`index.html` 当前加载 Google Fonts。网络受限时，字体可能回退到系统字体，但通常不影响应用功能。若需要离线或内网可用，可以后续改成本地字体资源。

### 账号、消息、导出、历史功能说明

账号、消息、导出、版本历史等功能均已通过 Mock 或本地实现可用：

- 账号/消息：Mock/Real 双模式，当前默认 Mock 接通，可正常使用 UI 流程
- 导出：已实现 PNG 长图 / PDF / Word(.docx) 三格式真实文件下载
- 版本历史：已实现基于快照系统的真实版本管理（20 条 + 7 天 TTL）

待真实后端就绪后，切换 `VITE_API_MODE=real` 即可对接。具体状态见 [`feature-status.md`](feature-status.md)。
