# AI / 设计辅助技能说明

本文档说明项目中的 `.trae/skills/` 和 `kilo.json` 用途，帮助维护者区分它们与应用运行代码的关系。

## 结论

`.trae/skills/` 和 `kilo.json` 是 AI / 设计辅助工作流配置，不是 `灵感笔记` Web 或 Tauri 应用运行时的必要依赖。

也就是说：

- `npm run dev` 不依赖这些 skills。
- `npm run build` 不依赖这些 skills。
- `npm run tauri:dev` 不依赖这些 skills。
- `npm run tauri:build` 不依赖这些 skills。

它们主要服务于设计、品牌、UI、幻灯片、banner 等辅助创作场景。

## 相关文件

```text
kilo.json
.trae/skills/
├── banner-design/
├── brand/
├── design/
├── design-system/
├── slides/
├── ui-styling/
└── ui-ux-pro-max/
```

## `kilo.json`

当前配置：

```json
{
  "$schema": "https://app.kilo.ai/config.json",
  "skills": {
    "paths": ["./.trae"]
  }
}
```

含义：

- 告诉 Kilo/Trae 类工具从 `./.trae` 目录加载 skills。
- 这些 skills 可以被对应工具用于设计、品牌、UI 等辅助任务。
- 该配置不会被 Vite、React、Tauri 或 Rust 运行时读取。

## skills 目录说明

### `banner-design`

用于 banner、广告图、社交媒体封面、网站 hero 等视觉资产设计。

适用场景：

- 做宣传 banner。
- 做产品官网头图。
- 做社交媒体封面。

不属于应用业务功能。

### `brand`

用于品牌语气、视觉识别、文案框架、品牌一致性检查。

适用场景：

- 制定产品品牌语气。
- 维护品牌指南。
- 检查设计是否符合品牌风格。

如果后续要正式产品化，可以参考它整理品牌文档。

### `design`

综合设计 skill，覆盖品牌、logo、CIP、slides、banner、icon、social images 等。

适用场景：

- 需要生成完整设计方向。
- 需要创建 logo 或视觉资产。
- 需要做演示文稿或营销素材。

不影响应用构建。

### `design-system`

用于设计 token、组件规范、系统化设计和演示文稿。

适用场景：

- 梳理 Tailwind token。
- 设计组件状态。
- 维护视觉规范。

当前项目已经有 `docs/design-system.md`，如后续继续完善 UI 规范，可以结合该 skill 使用。

### `slides`

用于创建 HTML 演示文稿，包含 Chart.js、设计 token 和响应式布局等能力。

适用场景：

- 产品汇报。
- 项目介绍。
- 数据展示型演示。

不属于应用功能。

### `ui-styling`

用于 UI 样式、可访问组件、Tailwind 样式和设计系统实践。

适用场景：

- 新增页面时参考 UI 风格。
- 调整布局、卡片、弹窗、表单。
- 建立更一致的组件模式。

如果继续扩展 `src/shared/ui/`，可以参考该 skill 的思路。

### `ui-ux-pro-max`

用于 UI/UX 设计资料检索和推荐，包含多种风格、色板、字体搭配、UX 指南和图表类型。

适用场景：

- 做产品界面方向探索。
- 选择视觉风格。
- 优化交互体验。

不影响应用运行。

## 什么时候需要维护这些文件

通常只有以下情况需要修改 `.trae/skills/` 或 `kilo.json`：

1. 团队继续使用 Kilo/Trae 工作流。
2. 需要新增自定义 AI skill。
3. 需要调整现有 skill 的说明或触发规则。
4. 需要同步品牌、设计系统或 UI 规范到辅助工具。
5. 需要删除不再使用的辅助工作流。

如果只是开发应用功能，一般不需要改这些文件。

## 什么时候可以忽略它们

以下场景可以暂时忽略：

- 启动 Web 开发服务。
- 启动 Tauri 桌面端。
- 修改笔记功能。
- 修改状态管理。
- 修改数据模型。
- 修改普通 UI 组件。
- 执行 `npm run build`。

## 对 lint 的影响

`.trae/skills/` 中可能包含脚本文件。当前 `npm run lint` 会扫描该目录，因此可能出现与应用源码无关的 warning。

如果后续希望 `npm run lint` 只检查应用源码，可以在 `.oxlintrc.json` 中进一步忽略：

```json
"ignorePatterns": [
  "dist/**",
  "dist-ssr/**",
  "node_modules/**",
  "src-tauri/target/**",
  ".trae/**"
]
```

是否忽略 `.trae/**` 取决于团队是否希望维护这些 skills 内部脚本质量。

当前项目只忽略了构建产物目录，没有忽略 `.trae/**`。

## 与项目文档的关系

当前应用文档主要关注：

- `README.md`：项目总览。
- `docs/architecture.md`：应用架构。
- `docs/development.md`：开发和排错。
- `docs/feature-status.md`：功能状态。
- `docs/data-model.md`：数据模型。
- `docs/design-system.md`：设计系统。
- `docs/tauri.md`：桌面端。
- `docs/testing.md`：测试策略。
- `docs/roadmap.md`：路线图。

`.trae/skills/` 更偏工具侧、设计侧和工作流侧，不应该替代项目维护文档。

## 建议

- 如果团队继续使用 Kilo/Trae：保留 `.trae/skills/` 和 `kilo.json`，并在调整设计工作流时同步维护。
- 如果团队只关注应用源码：可以暂时不处理这些文件，只保留 README 和本文档说明其用途。
- 如果后续迁移到其他 AI/设计工具：先确认这些 skills 是否仍有价值，再决定迁移或删除。
