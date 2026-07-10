# 设计系统说明

本文档记录 `灵感笔记` 当前 Tailwind 设计 token 和界面风格约定，方便后续扩展页面时保持一致。

## 设计定位

当前界面整体偏向：

- 桌面端笔记工具。
- 柔和、低噪声、轻办公风格。
- 大面积浅色背景。
- 圆角卡片和轻阴影。
- 蓝色主色强调。
- 适合中文内容阅读和编辑。

设计 token 主要定义在：

```text
tailwind.config.ts
```

全局基础样式位于：

```text
src/styles/global.css
```

## 色彩 token

当前色彩以语义命名为主，接近 Material 风格的 surface / primary / secondary 分层。

### Surface

常用背景层级：

| Token | 用途建议 |
| --- | --- |
| `surface` | 页面或主要内容背景。 |
| `surface-dim` | 更暗的表面色。 |
| `surface-bright` | 更亮的表面色。 |
| `surface-container-lowest` | 最浅容器，适合页面底层或卡片底色。 |
| `surface-container-low` | 低层级容器。 |
| `surface-container` | 默认容器。 |
| `surface-container-high` | 高层级容器。 |
| `surface-container-highest` | 最高层级容器。 |
| `surface-variant` | 变体背景。 |

### Text

| Token | 用途建议 |
| --- | --- |
| `on-surface` | 主文字。 |
| `on-surface-variant` | 次级文字。 |
| `on-background` | 背景上的文字。 |
| `inverse-on-surface` | 反色背景上的文字。 |

### Primary

| Token | 用途建议 |
| --- | --- |
| `primary` | 主要按钮、链接、强调状态。 |
| `on-primary` | 主色背景上的文字。 |
| `primary-container` | 主色容器。 |
| `on-primary-container` | 主色容器上的文字。 |
| `inverse-primary` | 反色场景下的主色。 |

### Secondary / Tertiary / Error

- `secondary`：次级操作或辅助强调。
- `tertiary`：第三层语义强调。
- `error`：错误和危险操作。
- `error-container`：错误提示容器。

## 字体

当前字体配置优先使用：

```text
Noto Sans SC, Inter, system-ui, sans-serif
```

`index.html` 会加载 Google Fonts，包括：

- Material Symbols Outlined
- Noto Sans SC
- Inter

如果目标环境无法访问 Google Fonts，浏览器会回退到系统字体。需要离线发布时，建议改成本地字体资源。

## 字号 token

| Token | 字号 | 建议用途 |
| --- | --- | --- |
| `headline-lg` | 32px | 页面主标题或大标题。 |
| `headline-md` | 24px | 区块标题。 |
| `headline-sm` | 20px | 卡片标题、面板标题。 |
| `body-lg` | 18px | 大段正文或编辑区域。 |
| `body-md` | 16px | 常规正文。 |
| `label-md` | 14px | 按钮、标签、表单辅助文字。 |
| `label-sm` | 12px | 小标签、计数、辅助信息。 |

## 间距 token

| Token | 值 | 用途建议 |
| --- | --- | --- |
| `sidebar-width` | 280px | 桌面侧边栏宽度。 |
| `container-max-width` | 1200px | 主内容最大宽度。 |
| `gutter` | 24px | 页面内容默认内边距。 |
| `margin-page` | 40px | 大屏页面边距。 |
| `stack-sm` | 8px | 小间距。 |
| `stack-md` | 16px | 中间距。 |
| `stack-lg` | 32px | 大间距。 |

## 圆角

| Token | 值 | 用途建议 |
| --- | --- | --- |
| `sm` | 0.25rem | 小控件、标签。 |
| `DEFAULT` | 0.5rem | 默认控件。 |
| `md` | 0.75rem | 输入框、普通卡片。 |
| `lg` | 1rem | 主要卡片。 |
| `xl` | 1.5rem | 大卡片、弹窗。 |

项目中也大量使用 Tailwind 默认的 `rounded-2xl`、`rounded-3xl` 和 `rounded-full`。新增组件时应优先复用既有风格。

## 阴影

| Token | 用途建议 |
| --- | --- |
| `shadow-card` | 普通卡片阴影。 |
| `shadow-modal` | 弹窗和高层级浮层。 |

阴影应保持克制，不建议引入强烈投影。

## 布局约定

### 桌面布局

主页面采用：

- 左侧固定侧栏。
- 右侧内容区。
- 内容区顶部工具栏。
- 中央滚动内容。

侧栏宽度使用：

```text
md:ml-sidebar-width
```

### 移动适配

部分组件已有移动端样式，例如：

- 移动端浮动新建按钮。
- 桌面侧栏在较小屏幕下隐藏或调整。

后续新增页面时，需要检查小屏幕下：

- 内容是否溢出。
- 主操作是否可触达。
- 弹窗是否适配窄屏。

## 组件风格约定

### 卡片

建议：

- 使用浅色容器背景。
- 使用 `border-outline-variant/30` 一类低对比边框。
- 使用 `rounded-2xl` 或 `rounded-3xl`。
- 需要强调时使用 `shadow-card`。

### 弹窗

建议：

- 使用 `shadow-modal`。
- 使用较大圆角。
- 背景和遮罩保持低噪声。
- 主要操作使用 `primary` 或 `primary-container`。
- 支持点遮罩 / `Esc` 关闭（危险提交中可禁用）。

### 关闭入口收敛（置顶规则）

同一浮层里**不要同时**提供「右上角 X」和底部「取消 / 关闭 / 知道了」等语义相同的 dismiss 入口。按类型统一：

| 类型 | 关闭入口 | 参考实现 | 说明 |
| --- | --- | --- | --- |
| 表单 / 操作弹窗 | **仅底部**「取消」+ 主操作 | `FolderNameDialog`、`CoverDialog`、`ConfirmDialog`、`DestinationPickerDialog`、`EditorExportOverlay` | 需要用户明确确认或放弃；不设右上角 X |
| 纯阅读 / 信息弹窗 | **二选一**：右上角 X **或** 底部「知道了 / 关闭」 | `MessageDetailModal`、`AgreementModal`、`EditorSharePlaceholder` | 不要两套都上；协议类可读弹窗可保留 X + 底部「关闭」中的一种 |
| 侧栏面板 | **仅右上角 X** | `EditorInfoPanel`、`EditorHistoryPanel` | 无底部操作栏时用 X 退出 |
| 全屏式表单壳 | **仅右上角 X** | `AuthModal` | 内容区已有主流程按钮，不重复底部取消 |

补充约定：

- 危险确认（删除、移除等）默认聚焦「取消」，降低误触；见 `ConfirmDialog`。
- 主操作按钮负责「提交 / 确认 / 应用」；不要把主按钮做成第二个关闭入口，除非文案就是「知道了」且该弹窗没有 X。
- 多选工具条上的 X（如 `SelectionBar`）表示「清除选择」，不是弹窗关闭，不受本规则约束。

### 标签

建议：

- 与 `NoteTag.tone` 保持一致。
- 常规标签低对比展示。
- 选中状态使用主色或主色容器。

### 空状态

项目已有 `EmptyState`、`TrashEmptyState`、`FoldersEmptyState`、`EditorEmptyState`。新增空状态时优先复用这些结构。

## 全局样式注意事项

`src/styles/global.css` 中设置：

- 全局 `box-sizing: border-box`。
- 隐藏滚动条。
- `body` 使用 `overflow: hidden`。
- 字体抗锯齿。
- 图片和媒体元素默认 `max-width: 100%`。

由于 `body` 不滚动，页面内部需要自行设置滚动容器，例如主内容区使用 `overflow-y-auto`。

## 图标

项目使用：

- `lucide-react`
- Material Symbols Outlined 字体

新增图标时优先使用 `lucide-react`，除非已有界面明确依赖 Material Symbols。

## 后续改进建议

- 把核心设计 token 同步为 CSS variables，便于主题切换。
- 明确深色模式策略。
- 将常用按钮、输入框、卡片、弹窗抽象到 `src/shared/ui/`。
- 为 `NoteTag.tone` 建立更完整的颜色映射。
- 如果要发布桌面端，考虑本地化字体资源，减少外部网络依赖。
