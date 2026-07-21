# 备忘录项目强制规则（Codex）

## 新会话开局必做（最高优先级）

每个新会话开始时，在执行用户任务、搜索代码、改文件之前，必须先加载 Obsidian 知识库 5 个核心文件。

### 加载方式（按优先级）

1. **优先：Obsidian MCP**（server 名：`obsidian`，vault 名：`beiwanglu`）
   - `read-note`：`AI-使用约定.md`
   - `read-note`：`INDEX.md`
   - `read-note`：`产品定位.md`（folder: `project-overview`）
   - `read-note`：`功能状态总览.md`（folder: `project-overview`）
   - `read-note`：`项目演进时间线.md`（folder: `project-overview`）
2. **兜底：直接读本地文件**（MCP 工具不可用时）
   - `/Users/aliang/Documents/Obsidian Vault/beiwanglu/AI-使用约定.md`
   - `/Users/aliang/Documents/Obsidian Vault/beiwanglu/INDEX.md`
   - `/Users/aliang/Documents/Obsidian Vault/beiwanglu/project-overview/产品定位.md`
   - `/Users/aliang/Documents/Obsidian Vault/beiwanglu/project-overview/功能状态总览.md`
   - `/Users/aliang/Documents/Obsidian Vault/beiwanglu/project-overview/项目演进时间线.md`

完成后向用户确认「已加载项目知识库上下文」，再开始任务。

禁止：未读完上述 5 个文件前开始编码、搜索、分析。

说明：开局只读这 5 个启动包；业务硬约束、设计规范、决策与踩坑一律以知识库为准，不在本文件重复。

## 讨论中按需检索

涉及具体主题时，先查知识库再下结论：

- 优先用 MCP：`search-vault` / `read-note`（vault=`beiwanglu`）
- 兜底：在 `/Users/aliang/Documents/Obsidian Vault/beiwanglu/` 内搜索/读取
- 检索映射表见 `AI-使用约定.md` §2.2
- 改代码前对照 `代码改动前检查清单`
- 任务类型先对照 `任务执行决策树`

禁止：只凭会话记忆或旧上下文直接下结论，应先验证知识库是否有更新记录。

## 新增笔记登记规则（强制）

新建或重大更新任何知识库笔记后，必须同步完成：

1. **必做**：更新 `INDEX.md` 对应分类段落，加入 `[[笔记名]] — 一句话说明`
2. **必做**：维护相关笔记的双链
3. **条件必做**：高频必查内容同步更新 `AI-使用约定.md` §2.2 检索表
4. **条件必做**：改变开局认知时同步更新对应开局 5 文件之一

禁止：只写新笔记不挂 INDEX。

## 会话末尾

每个会话结束前，主动输出「本次会话沉淀建议」：是否需要沉淀、沉淀到哪、沉淀什么；经用户确认后再写入知识库。

写笔记优先 MCP（`create-note` / `edit-note`）；MCP 不可用时直接写 vault 文件，并同步更新 INDEX。

## 入口信息

- 代码仓库：`/Users/aliang/Documents/beiwanglu`
- Vault：`/Users/aliang/Documents/Obsidian Vault/beiwanglu/`
- MCP server：`obsidian`（非 `mcp_obsidian`）
- Vault 名：`beiwanglu`
- 详细规则真实源：知识库 `AI-使用约定.md` + 各分类笔记
- Trae 侧对应规则：`.trae/rules/project_rules.md`（保持语义一致；Codex 以本文件为准）
