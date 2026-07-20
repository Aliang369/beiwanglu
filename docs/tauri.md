# Tauri 桌面端说明

本文档说明 `灵感笔记` 的 Tauri 2 桌面端配置、启动流程和打包注意事项。

## 相关文件

```text
src-tauri/
├── Cargo.toml
├── Cargo.lock
├── build.rs
├── tauri.conf.json
├── icons/
└── src/
    └── main.rs
```

## 基础配置

配置文件：

```text
src-tauri/tauri.conf.json
```

当前关键配置：

| 配置 | 当前值 | 说明 |
| --- | --- | --- |
| `productName` | `灵感笔记` | 桌面应用名称。 |
| `version` | `0.0.0` | 应用版本。 |
| `identifier` | `com.beiwanglu.notes` | 应用唯一标识。 |
| `beforeDevCommand` | `npm run dev` | 桌面开发前启动 Vite。 |
| `devUrl` | `http://localhost:5173` | 桌面开发窗口加载地址。 |
| `beforeBuildCommand` | `npm run build` | 打包前构建前端产物。 |
| `frontendDist` | `../dist` | Tauri 打包时读取的前端产物目录。 |
| 窗口尺寸 | `1280 x 800` | 默认窗口大小。 |
| 最小窗口尺寸 | `1024 x 700` | 最小窗口大小。 |
| `csp` | `null` | 当前未启用内容安全策略。 |

## Rust 入口

入口文件：

```text
src-tauri/src/main.rs
```

当前 Rust 端逻辑很薄，只做：

- 创建 Tauri builder。
- 初始化 `tauri-plugin-opener`。
- 运行应用。

当前没有实现自定义 Tauri command，也没有接入 SQLite、文件系统或系统托盘等原生能力。

## 开发模式启动

```bash
npm run tauri:dev
```

流程：

1. Tauri 执行 `beforeDevCommand`。
2. `npm run dev` 启动 Vite。
3. Vite 使用 `http://localhost:5173`。
4. Tauri 打开桌面窗口并加载 `devUrl`。

注意：

- `vite.config.ts` 使用固定端口 `5173` 和 `strictPort: true`。
- 如果端口被占用，Vite 会失败，Tauri 也无法正常加载页面。
- 如果修改 Vite 端口，需要同步修改 `tauri.conf.json` 的 `devUrl`。

## 打包桌面应用

```bash
npm run tauri:build
```

流程：

1. 执行 `beforeBuildCommand`：`npm run build`。
2. 前端产物输出到 `dist/`。
3. Tauri 读取 `frontendDist: ../dist`。
4. 生成目标平台应用包。

不同系统打包可能需要额外依赖和签名配置。

## 图标配置

项目已有 `src-tauri/icons/` 和 `src-tauri/icon-source.svg`，但 `tauri.conf.json` 中：

```json
"icon": []
```

当前 bundle 图标列表为空。正式发布前建议确认：

- macOS `.icns`
- Windows `.ico`
- Linux PNG
- 移动端或商店图标，如后续需要

并在 `tauri.conf.json` 中显式配置。

## 安全策略

当前配置：

```json
"security": {
  "csp": null
}
```

这表示当前没有启用内容安全策略。开发阶段可以简化调试，但正式发布前建议评估并配置 CSP，尤其是：

- 是否允许远程字体。
- 是否允许内联样式或脚本。
- 是否需要限制图片、连接和资源来源。

`index.html` 当前引用 Google Fonts。若发布环境要求离线或更严格 CSP，建议改成本地字体资源。

## 原生能力扩展建议

当前笔记数据仍存储在 Web `localStorage`。如果后续希望使用桌面原生能力，可以按以下顺序扩展：

1. 在 Rust/Tauri 层添加 command 或插件。
2. 在前端实现新的 `NotesRepository`。
3. 在 `src/features/notes/notesStore.ts` 中替换 repository 注入。
4. 保持 UI 组件不直接依赖 Tauri API。

可能的扩展方向：

- SQLite 本地数据库。
- 本地 Markdown 文件导入/导出。
- 系统文件保存对话框。
- 自动更新。
- 系统托盘。
- 原生通知。
- 应用菜单和快捷键。

## 发布前检查清单

- [ ] `npm run lint` 通过。
- [ ] `npm run build` 通过。
- [ ] `npm run tauri:build` 在目标系统通过。
- [ ] 应用名称、版本号、identifier 确认。
- [ ] 图标配置完整。
- [ ] CSP 策略确认。
- [ ] Google Fonts 或其他远程资源是否符合发布要求。
- [ ] macOS 签名和公证策略确认。
- [ ] Windows 签名策略确认。
- [ ] Linux 包格式和依赖确认。

## 与 Web 开发的区别

| 场景 | 命令 | 用途 |
| --- | --- | --- |
| Web 开发 | `npm run dev` | 浏览器中开发和调试前端。 |
| Web 构建 | `npm run build` | 生成 `dist/` 前端产物。 |
| Web 预览 | `npm run preview` | 本地预览构建产物。 |
| 桌面开发 | `npm run tauri:dev` | 打开 Tauri 桌面窗口加载 Vite。 |
| 桌面打包 | `npm run tauri:build` | 生成桌面应用包。 |

## 与 Obsidian 知识库的关系

项目配套一个 Obsidian 知识库，路径：

```text
/Users/aliang/Documents/Obsidian Vault/beiwanglu/
```

知识库是项目长期外部记忆层，存储决策、规范、踩坑、架构演进等结构化内容；本 `docs/` 面向开发者代码层参考。两者内容应保持一致，知识库为真实源。

知识库中的 `[[Tauri桌面端配置]]` 笔记与本文件内容对应，详细程度更高。Tauri 相关变更应同步更新两处。
